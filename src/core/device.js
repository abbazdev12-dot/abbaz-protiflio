export function getDeviceProfile() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;

  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    weak: memory <= 4 || cores <= 4 || coarsePointer,
    mobile: width < 768,
    pixelRatioCap: width < 768 ? 1.5 : 2,
    webglPreferred: !coarsePointer || width >= 768
  };
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}
