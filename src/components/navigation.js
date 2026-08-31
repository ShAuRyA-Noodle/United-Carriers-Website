const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function findNavigation(root) {
  const toggle = root.querySelector('[data-nav-toggle], #navBurger, #menu-toggle');
  const menu = root.querySelector('[data-nav-menu], .nav__menu, #menu');
  const backdrop = root.querySelector('[data-nav-backdrop]');
  return { backdrop, menu, toggle };
}

/**
 * Owns only the semantic state of the mobile navigation. Visual transitions
 * belong in CSS/GSAP so a screen reader never has to wait for animation.
 */
export function initNavigation({ root = document } = {}) {
  const { backdrop, menu, toggle } = findNavigation(root);
  const body = root.body ?? root.ownerDocument?.body ?? document.body;

  if (!toggle || !menu) {
    return { close() {}, destroy() {}, open() {} };
  }

  let destroyed = false;
  let opened = toggle.getAttribute('aria-expanded') === 'true' && !menu.hidden;

  const sync = (next, { restoreFocus = false } = {}) => {
    if (destroyed) return;
    opened = Boolean(next);
    toggle.setAttribute('aria-expanded', String(opened));
    menu.hidden = !opened;
    menu.toggleAttribute('data-navigation-open', opened);
    body?.classList.toggle('menu-open', opened);

    if (opened) {
      const firstItem = [...menu.querySelectorAll(FOCUSABLE)]
        .find((element) => !element.matches('[data-nav-backdrop]'));
      (firstItem ?? menu.querySelector(FOCUSABLE))?.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  };

  const open = () => sync(true);
  const close = ({ restoreFocus = true } = {}) => sync(false, { restoreFocus });
  const onToggle = () => (opened ? close() : open());
  const onKeydown = (event) => {
    if (event.key === 'Escape' && opened) close();
  };
  const onMenuClick = (event) => {
    if (!backdrop && event.target === menu) close();
  };

  toggle.addEventListener('click', onToggle);
  root.addEventListener('keydown', onKeydown);
  if (backdrop) backdrop.addEventListener('click', close);
  else menu.addEventListener('click', onMenuClick);

  return {
    open,
    close,
    destroy() {
      if (destroyed) return;
      close({ restoreFocus: false });
      destroyed = true;
      toggle.removeEventListener('click', onToggle);
      root.removeEventListener('keydown', onKeydown);
      if (backdrop) backdrop.removeEventListener('click', close);
      else menu.removeEventListener('click', onMenuClick);
      body?.classList.remove('menu-open');
    },
  };
}
