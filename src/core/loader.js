export class CriticalAssetLoader {
  constructor() {
    this.loaded = 0;
    this.total = 0;
  }

  setTotal(total) {
    this.total = total;
  }

  complete() {
    this.loaded = Math.min(this.loaded + 1, this.total);
  }

  get progress() {
    return this.total ? this.loaded / this.total : null;
  }
}
