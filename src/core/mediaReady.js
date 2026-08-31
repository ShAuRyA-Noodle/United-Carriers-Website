/**
 * Wait for the media that must be available before the opening transition,
 * without allowing a bad network request to strand the page behind a loader.
 */
export async function waitForCriticalMedia(promises = [], timeoutMs = 5000) {
  const media = Array.isArray(promises) ? promises : [promises];
  const boundedTimeout = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : 5000;
  let timer;

  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), boundedTimeout);
  });
  const ready = Promise.allSettled(media).then(() => ({ timedOut: false }));

  try {
    return await Promise.race([ready, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
