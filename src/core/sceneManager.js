export class SceneManager {
  constructor({ app, ticker, renderer, events, states, deviceProfile }) {
    this.app = app;
    this.ticker = ticker;
    this.renderer = renderer;
    this.events = events;
    this.states = states;
    this.deviceProfile = deviceProfile;
    this.activeState = null;
    this.activeName = null;
    this.transitioning = false;
    this.lastError = null;
  }

  resolveRoute(hash = location.hash) {
    if (!hash) {
      return {
        name: this.states.intro ? "intro" : "doors",
        route: "intro"
      };
    }
    if (hash === "#doors") return { name: "doors", route: "doors" };
    if (hash === "#page" || hash === "#contact") return { name: "doors", route: "page" };
    if (hash.startsWith("#world/")) {
      const id = hash.slice("#world/".length);
      return { name: "doors", route: `world:${id}` };
    }
    return { name: "doors", route: "doors" };
  }

  async goto(hash, { replace = false, focus = true } = {}) {
    if (this.transitioning) return;
    const resolved = this.resolveRoute(hash);
    if (!replace) {
      const nextHash = hash || "#doors";
      if (location.hash !== nextHash) history.pushState(null, "", nextHash);
    } else {
      if (hash && location.hash !== hash) history.replaceState(null, "", hash);
    }

    this.transitioning = true;
    const state = this.states[resolved.name];
    if (!state) {
      this.lastError = `Unknown state: ${resolved.name}`;
      this.transitioning = false;
      return;
    }

    const previous = this.activeState;
    try {
      await this.enterWithTimeout(state, {
        route: resolved.route,
        app: this.app,
        ticker: this.ticker,
        renderer: this.renderer,
        events: this.events,
        deviceProfile: this.deviceProfile,
        navigate: (nextHash) => this.goto(nextHash, { replace: true })
      });

      if (previous && previous !== state) previous.exit();
      this.activeState = state;
      this.activeName = resolved.name;
      this.lastError = null;

      if (focus) {
        requestAnimationFrame(() => document.querySelector("#main-content")?.focus());
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "State initialization failed";
      if (!this.activeState) this.renderEmergencyFallback();
      this.events.emit("state:error", { error: this.lastError });
    } finally {
      this.transitioning = false;
      this.events.emit("state:changed", { state: this.activeName, route: resolved.route });
    }
  }

  enterWithTimeout(state, context) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) reject(new Error("State initialization timed out"));
      }, 8000);

      Promise.resolve(state.enter(context))
        .then((result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  renderEmergencyFallback() {
    this.app.innerHTML = `
      <main id="main-content" data-state-root="fallback" tabindex="-1" class="emergency-fallback">
        <p class="emergency-kicker">PORTFOLIO AVAILABLE</p>
        <h1>ABBAS.P.A</h1>
        <p>The 3D experience could not initialize, but the portfolio remains accessible.</p>
        <a class="fallback-action" href="#page">Open portfolio view</a>
      </main>
    `;
  }

  get stats() {
    const playingVideos = Array.from(document.querySelectorAll("video")).filter(
      (video) => !video.paused && !video.ended && video.readyState >= 2
    ).length;

    return {
      state: this.activeName || "none",
      canvasCount: this.renderer.canvasCount,
      tickerCallbacks: this.ticker.callbackCount,
      tickerLoops: this.ticker.loopCount,
      playingVideos,
      stateRoots: document.querySelectorAll("[data-state-root]").length,
      webgl: this.renderer.renderer ? "active" : "not-created",
      lastError: this.lastError
    };
  }
}
