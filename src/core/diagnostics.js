export function createDiagnostics({ manager }) {
  const debugEnabled = new URLSearchParams(location.search).get("debug") === "1";
  if (!debugEnabled) return { debugEnabled: false };

  const panel = document.createElement("aside");
  panel.className = "debug-panel";
  panel.setAttribute("aria-label", "Portfolio diagnostics");
  panel.innerHTML = "<strong>Diagnostics</strong><div data-debug-output></div>";
  document.body.append(panel);

  const output = panel.querySelector("[data-debug-output]");

  const update = () => {
    const stats = manager.stats;
    output.textContent = [
      `state: ${stats.state}`,
      `canvas: ${stats.canvasCount}`,
      `ticker callbacks: ${stats.tickerCallbacks}`,
      `raf loops: ${stats.tickerLoops}`,
      `videos: ${stats.playingVideos}`,
      `state roots: ${stats.stateRoots}`,
      `webgl: ${stats.webgl}`,
      `last error: ${stats.lastError || "none"}`
    ].join("\n");
  };

  const interval = window.setInterval(update, 500);
  update();

  window.__portfolio = {
    state: () => manager.activeName,
    goto: (hash) => manager.goto(hash),
    stats: () => manager.stats
  };

  return {
    debugEnabled: true,
    destroy() {
      clearInterval(interval);
      panel.remove();
      delete window.__portfolio;
    }
  };
}
