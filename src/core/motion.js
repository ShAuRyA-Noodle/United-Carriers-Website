export function motionPreferences() {
  return { reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
}

export function lifecycle(...resources) {
  let destroyed = false;

  return () => {
    if (destroyed) return;
    destroyed = true;
    [...resources].reverse().forEach((resource) => resource?.destroy?.());
  };
}
