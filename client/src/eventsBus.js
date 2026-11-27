const listeners = new Set();

export function emitEventChange(msg) {
  listeners.forEach((fn) => fn(msg));
}

export function onEventChange(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}