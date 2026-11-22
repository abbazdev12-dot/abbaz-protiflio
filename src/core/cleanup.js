export function safeRemove(element) {
  element?.remove();
}

export function removeListeners(listeners) {
  listeners.forEach((remove) => remove?.());
  listeners.clear();
}

export function disposeObject3D(object) {
  if (!object) return;

  object.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => disposeMaterial(material));
    } else {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;
  Object.values(material).forEach((value) => {
    if (value?.isTexture) value.dispose();
  });
  material.dispose?.();
}
