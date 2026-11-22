const SCENE_STATES = new Set(["INTRO", "DOORS", "WALL", "PORTFOLIO"]);

export class ActiveSceneManager {
  constructor({ debug = new URLSearchParams(location.search).get("debug") === "1" } = {}) {
    this.controllers = new Map();
    this.activeState = null;
    this.overrideController = null;
    this.visible = !document.hidden;
    this.debug = debug;
    this.panel = null;
    this.interval = null;
    this.onVisibilityChange = () => {
      this.visible = !document.hidden;
      this.syncActiveScene();
      this.updateDebugPanel();
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    if (debug) this.createDebugPanel();
  }

  register(state, controller) {
    if (!SCENE_STATES.has(state)) {
      throw new Error(`Unknown scene state: ${state}`);
    }
    if (!controller || typeof controller.setActive !== "function") {
      throw new Error(`Scene state "${state}" requires a setActive controller.`);
    }
    const previous = this.controllers.get(state);
    if (previous && previous !== controller) previous.setActive(false);
    this.controllers.set(state, controller);
    controller.setActive(state === this.activeState && this.visible);
    this.updateDebugPanel();
  }

  setState(state) {
    if (!SCENE_STATES.has(state)) {
      throw new Error(`Unknown scene state: ${state}`);
    }
    if (this.activeState === state) {
      this.syncActiveScene();
      this.updateDebugPanel();
      return;
    }

    this.controllers.get(this.activeState)?.setActive(false);
    this.activeState = state;
    this.syncActiveScene();
    this.updateDebugPanel();
  }

  setOverride(controller = null) {
    this.overrideController?.setActive(false);
    this.overrideController = controller;
    this.syncActiveScene();
    this.updateDebugPanel();
  }

  syncActiveScene() {
    const activeController = this.overrideController || this.controllers.get(this.activeState);
    new Set([...this.controllers.values(), this.overrideController].filter(Boolean))
      .forEach((controller) => controller.setActive(controller === activeController && this.visible));
  }

  get stats() {
    const controller = this.overrideController || this.controllers.get(this.activeState);
    const stats = controller?.getStats?.() || {};
    return {
      state: this.activeState || "none",
      renderLoops: stats.renderLoops || 0,
      canvases: stats.canvases || 0,
    };
  }

  createDebugPanel() {
    this.panel = document.createElement("aside");
    this.panel.className = "scene-debug-panel";
    this.panel.setAttribute("aria-label", "Scene diagnostics");
    this.panel.style.cssText = [
      "position:fixed",
      "z-index:10000",
      "right:12px",
      "bottom:12px",
      "padding:10px 12px",
      "border:1px solid rgba(255,255,255,.2)",
      "border-radius:6px",
      "background:rgba(5,8,20,.92)",
      "color:#f7f5ef",
      "font:12px/1.5 monospace",
      "white-space:pre",
      "pointer-events:none",
    ].join(";");
    document.body.append(this.panel);
    this.updateDebugPanel();
    this.interval = window.setInterval(() => this.updateDebugPanel(), 250);
  }

  updateDebugPanel() {
    if (!this.panel) return;
    const stats = this.stats;
    this.panel.textContent = [
      `state: ${stats.state}`,
      `scene render loops: ${stats.renderLoops}`,
      `WebGL canvases: ${stats.canvases}`,
    ].join("\n");
  }

  destroy() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.clearInterval(this.interval);
    new Set([...this.controllers.values(), this.overrideController].filter(Boolean))
      .forEach((controller) => controller.setActive(false));
    this.controllers.clear();
    this.overrideController = null;
    this.panel?.remove();
    this.panel = null;
  }
}
