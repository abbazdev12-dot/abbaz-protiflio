export class Ticker {
  constructor() {
    this.callbacks = new Set();
    this.frameId = null;
    this.lastTime = performance.now();
    this.visible = !document.hidden;
  }

  register(callback) {
    this.callbacks.add(callback);
  }

  unregister(callback) {
    this.callbacks.delete(callback);
  }

  start() {
    if (this.frameId !== null) return;
    this.frameId = requestAnimationFrame((time) => this.frame(time));
  }

  frame(time) {
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.visible) {
      this.callbacks.forEach((callback) => callback(delta));
    }

    this.frameId = requestAnimationFrame((nextTime) => this.frame(nextTime));
  }

  setVisible(visible) {
    this.visible = visible;
  }

  stop() {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  get callbackCount() {
    return this.callbacks.size;
  }

  get loopCount() {
    return this.frameId === null ? 0 : 1;
  }
}
