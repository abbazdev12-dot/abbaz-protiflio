import * as THREE from "three";

export class SharedRenderer {
  constructor(container, deviceProfile, events = null) {
    this.container = container;
    this.deviceProfile = deviceProfile;
    this.events = events;
    this.renderer = null;
    this.canvas = null;
  }

  ensure() {
    if (this.renderer) return this.renderer;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !this.deviceProfile.weak,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.deviceProfile.pixelRatioCap));
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.className = "shared-renderer";
    this.canvas.setAttribute("aria-hidden", "true");
    this.container.prepend(this.canvas);

    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    return this.renderer;
  }

  handleContextLost = (event) => {
    event.preventDefault();
    this.events?.emit("webgl:contextlost");
  };

  resize() {
    if (!this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.deviceProfile.pixelRatioCap));
    this.renderer.setSize(width, height, false);
  }

  get canvasCount() {
    return this.canvas?.isConnected ? 1 : 0;
  }

  dispose() {
    this.canvas?.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas?.remove();
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = null;
  }
}
