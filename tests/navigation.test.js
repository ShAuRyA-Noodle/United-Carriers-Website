import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initNavigation } from '../src/components/navigation.js';

function navigationMarkup() {
  return `
    <button id="menu-toggle" aria-expanded="false">Menu</button>
    <div id="menu" hidden>
      <button data-nav-backdrop type="button" aria-label="Close menu"></button>
      <a href="/about">About</a>
    </div>
  `;
}

describe('navigation overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = navigationMarkup();
  });

  afterEach(() => {
    document.body.classList.remove('menu-open');
  });

  it('opens synchronously with an exposed menu, scroll lock, and first-item focus', () => {
    const nav = initNavigation();
    const trigger = document.querySelector('#menu-toggle');
    const menu = document.querySelector('#menu');
    const firstItem = document.querySelector('#menu a');

    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.hidden).toBe(false);
    expect(document.body.classList.contains('menu-open')).toBe(true);
    expect(document.activeElement).toBe(firstItem);
    nav.destroy();
  });

  it('closes with Escape and restores focus to the trigger', () => {
    const nav = initNavigation();
    const trigger = document.querySelector('#menu-toggle');
    const menu = document.querySelector('#menu');

    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hidden).toBe(true);
    expect(document.body.classList.contains('menu-open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    nav.destroy();
  });

  it('closes from its backdrop without treating content clicks as backdrop clicks', () => {
    const nav = initNavigation();
    const trigger = document.querySelector('#menu-toggle');
    const menu = document.querySelector('#menu');
    const link = document.querySelector('#menu a');
    const backdrop = document.querySelector('[data-nav-backdrop]');

    trigger.click();
    link.addEventListener('click', (event) => event.preventDefault());
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(menu.hidden).toBe(false);

    backdrop.click();
    expect(menu.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    nav.destroy();
  });

  it('removes its listeners and releases the lock on teardown', () => {
    const nav = initNavigation();
    const trigger = document.querySelector('#menu-toggle');

    trigger.click();
    nav.destroy();
    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });
});
