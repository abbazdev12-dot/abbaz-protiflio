export function createEventBus() {
  const listeners = new Map();

  return {
    on(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type)?.delete(listener);
    },
    emit(type, detail) {
      const payload = detail ?? {};
      listeners.get(type)?.forEach((listener) => listener(payload));
    },
    clear() {
      listeners.clear();
    }
  };
}
