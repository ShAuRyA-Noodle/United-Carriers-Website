/**
 * Keeps the study self-contained while preserving ordinary anchor semantics
 * (including keyboard focus) for the page's navigation affordances.
 */
export function installStudyLinkInterception(root = document) {
  const onClick = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('a[data-study-link]')
      : null;

    if (target && root.contains(target)) event.preventDefault();
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
