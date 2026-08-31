import { describe, expect, it } from 'vitest';
import { installStudyLinkInterception } from '../src/core/inertLinks.js';

describe('installStudyLinkInterception', () => {
  it('prevents navigation for a marked study link while leaving the anchor focusable', () => {
    document.body.innerHTML = '<a data-study-link href="/contact">Talk with us</a>';
    const link = document.querySelector('a');
    const removeInterception = installStudyLinkInterception(document);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(link.tabIndex).toBe(0);
    removeInterception();
  });

  it('does not interfere with unmarked anchors', () => {
    document.body.innerHTML = '<a href="#contact">Contact</a>';
    const link = document.querySelector('a');
    const removeInterception = installStudyLinkInterception(document);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    removeInterception();
  });
});
