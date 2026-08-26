# United Carriers Homepage Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current United Carriers homepage as a high-fidelity, responsive, locally served private study with inert outbound navigation.

**Architecture:** Keep the existing Vite, Three.js, GSAP, ScrollTrigger, and Lenis foundation, but replace the invented Meridian page shell and lower-page presentation with focused modules that mirror the current source homepage. Store approved public source media locally, centralize source copy and asset paths, isolate every animated section behind an `init()`/`destroy()` interface, and coordinate them from one application bootstrap.

**Tech Stack:** Vite 8, JavaScript ES modules, Three.js, GSAP + ScrollTrigger, Lenis, Vitest, jsdom, the Codex in-app browser with Playwright-style inspection, local WebP/AVIF/PNG/JPG/SVG/MP4 assets.

---

## Locked File Structure

Create or reshape the project around these responsibilities:

```text
index.html                         Semantic homepage markup only
public/assets/source/              Downloaded United Carriers homepage media
public/assets/fallbacks/           Locally created fallbacks for unavailable media
src/main.js                        Application bootstrap and lifecycle
src/data/content.js                Exact homepage copy and structured card data
src/data/assets.js                 Stable local asset-path registry
src/styles/tokens.css              Fonts, colors, type scale, spacing, breakpoints
src/styles/base.css                Reset, accessibility, shared primitives
src/styles/chrome.css              Loader, utility rail, header, menu, buttons
src/styles/hero.css                Hero and globe framing
src/styles/home.css                All below-hero section layout
src/styles/responsive.css          Structural mobile/tablet/large-screen overrides
src/core/motion.js                 Reduced-motion and GSAP lifecycle helpers
src/core/inertLinks.js             Non-navigating study-link behavior
src/core/mediaReady.js             Bounded media/font readiness coordination
src/components/loader.js           Source-equivalent loading choreography
src/components/navigation.js       Header and overlay menu controller
src/components/hero.js             Hero intro, pointer affordance, globe adapter
src/components/freightScene.js     Reach-stacker/container/truck composition
src/components/services.js         Desktop and mobile services behavior
src/components/reliability.js      Milestone and ship/cloud scenes
src/components/testimonials.js     Testimonial carousel controller
src/components/partners.js         Partner marquees and hover-state swaps
src/components/insights.js         Insights rail/card interaction
src/components/faq.js              FAQ accordion
src/components/footer.js           Footer entrance and decorative map treatment
src/globe/                         Existing globe renderer, adapted rather than replaced
tools/source-assets.json           Audited remote-to-local asset manifest
tools/sync-source-assets.mjs       Repeatable, allowlisted asset downloader
tests/                             Unit and DOM behavior tests
```

Do not overwrite the user's existing uncommitted changes in `tools/bundle-single-file.mjs`. Update that file only in the final packaging task and preserve its viewport-meta fix.

---

### Task 1: Add the Test Harness and Source Contract

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `tests/setup.js`
- Create: `src/data/content.js`
- Create: `tests/content.test.js`

- [ ] **Step 1: Install the DOM test dependencies**

Run:

```bash
npm install --save-dev vitest jsdom
```

Expected: `package.json` and `package-lock.json` include `vitest` and `jsdom` under development dependencies.

- [ ] **Step 2: Add exact test scripts**

Update `package.json` scripts to:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5180",
    "test": "vitest run",
    "test:watch": "vitest",
    "assets:sync": "node tools/sync-source-assets.mjs"
  }
}
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    restoreMocks: true,
  },
});
```

Create `tests/setup.js`:

```js
import { afterEach } from 'vitest';

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.className = '';
});
```

- [ ] **Step 4: Write the failing source-contract test**

Create `tests/content.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/data/content.js';

describe('homepage content contract', () => {
  it('contains the exact primary homepage sequence', () => {
    expect(CONTENT.hero.heading).toEqual(['Every', 'leg of the', 'journey']);
    expect(CONTENT.services).toHaveLength(6);
    expect(CONTENT.benefits).toHaveLength(5);
    expect(CONTENT.testimonials).toHaveLength(3);
    expect(CONTENT.insights.length).toBeGreaterThanOrEqual(3);
    expect(CONTENT.faq.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run the test and verify failure**

Run: `npm test -- tests/content.test.js`

Expected: FAIL because `src/data/content.js` does not exist.

- [ ] **Step 6: Implement the content registry**

Create `src/data/content.js` with these stable keys and the exact text transcribed from the live homepage audit:

```js
export const CONTENT = Object.freeze({
  hero: {
    eyebrow: 'One operator',
    heading: ['Every', 'leg of the', 'journey'],
    body: 'Freight forwarding, land transport, and customs brokerage, unified across APAC under one accountable team.',
    actions: ['Talk with us', 'Our services'],
  },
  introduction: {
    heading: ['We move freight.', 'We own the outcome.'],
    kicker: 'From countless journeys, clarity emerges',
  },
  services: [
    { id: 'air', title: 'Air freight', body: 'Express, priority, and deferred options across global trade lanes — managed end to end for speed and schedule integrity.' },
    { id: 'ocean', title: 'Ocean Freight', body: 'FCL, LCL, and specialised cargo movements, with structured carrier selection and routing for cost and reliability.' },
    { id: 'customs', title: 'Customs Brokerage', body: 'In-house licensed brokerage covering classification, compliance, and quarantine — full control, no outsourcing.' },
    { id: 'warehouse', title: 'Warehousing and 3PL', body: 'Scalable storage, pick and pack, and distribution — fully integrated with freight and transport operations.' },
    { id: 'project', title: 'Project Cargo', body: 'Specialist handling for oversized and complex shipments — from permits to engineered load configurations.' },
    { id: 'transport', title: 'Domestic & Interstate Transport', body: 'Local, metro, and interstate transport managed for consistent service levels and full delivery visibility.' },
  ],
  reliability: [
    { title: 'Real-Time Freight Tracking', body: 'Know exactly where your cargo is at every milestone. Live visibility means faster decisions and zero guesswork.' },
    { title: 'Global Network overage', body: 'Know exactly where your cargo is at every milestone. Live visibility means faster decisions and zero guesswork.' },
    { title: '24/7 Customer Support', body: 'Real people, always available. Whether it is a routine update or an urgent issue, we pick up the phone and we own the outcome.' },
  ],
  benefits: [
    'One Point of Contact',
    'Full Supply Chain Visibility',
    'Compliance You Can Trust',
    'Competitive, Transparent Pricing',
    'Fast Issue Resolution',
  ],
  testimonials: [
    { name: 'Thomas Munro', company: 'Picha Group' },
    { name: 'Francis Fung', company: 'Commscope' },
    { name: 'Alex Hughes', company: 'Factory X' },
  ],
  insights: [
    { category: 'Case Studies', date: 'July 8, 2026', title: 'Reduced Import Delays & Storage Costs Across 700+ Containers' },
    { category: 'Asia Pacific', date: 'July 8, 2026', title: 'Major Fleet-Wide Fuel Efficiency Agreement Signals Ongoing Focus on Shipping Performance and Decarbonisation' },
    { category: 'Case Studies', date: 'July 10, 2026', title: 'Cost-Optimised and Speed to market Import Program for New Truck Launch in Australia' },
  ],
  faq: [
    'What does United Carriers do?',
    'What industries do you specialise in?',
    'What shipping methods do you offer?',
    'Do you provide customs clearance services?',
    'How is freight pricing calculated?',
    'Do you offer warehousing and 3PL services?',
    'Can you handle oversized or heavy cargo?',
    'How do I request a quote?',
  ],
});
```

Before committing this task, populate the introduction paragraphs, five benefit descriptions, three complete testimonial quotes and roles, the remaining three visible insight cards, and eight FAQ answers by reading their visible text from the live homepage. Preserve source spelling and punctuation, including the displayed “Global Network overage” label. The `content.test.js` contract must assert the final counts: six services, five benefits, three testimonials, six insights, and eight FAQs.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- tests/content.test.js`

Expected: PASS.

Commit:

```bash
git add package.json package-lock.json vitest.config.js tests/setup.js tests/content.test.js src/data/content.js
git commit -m "test: establish homepage content contract"
```

---

### Task 2: Download and Validate the Source Media

**Files:**
- Create: `tools/source-assets.json`
- Create: `tools/sync-source-assets.mjs`
- Create: `src/data/assets.js`
- Create: `tests/assets.test.js`
- Create: `public/assets/source/**`

- [ ] **Step 1: Build the allowlisted manifest**

Create `tools/source-assets.json` as an array of objects with `id`, `remote`, `local`, and `required`. Include the audited loader map, hero blur/star fields, mobile hero, introduction thumbnail, freight-equipment layers, six service images, milestone icons, desktop/mobile truck and crane layers, ship/cloud layers, five why-us images, aircraft, three testimonial portraits, partner logo default/hover pairs, three visible insight thumbnails, footer thumbnail, footer map, dot mark, mobile logo, and SVG logo.

Use stable local names such as:

```json
[
  {
    "id": "loader-map",
    "remote": "https://cdn.prod.website-files.com/6a44eec1ed1af2c4c403df6b/6a4cbda52be1c66e5c7763d0_b73f2865aae1538f233749f5a8900a99_map-pre-loader.png",
    "local": "public/assets/source/loader-map.png",
    "required": true
  },
  {
    "id": "intro-thumb",
    "remote": "https://cdn.prod.website-files.com/6a44eec1ed1af2c4c403df6b/6a44eec1ed1af2c4c403dfca_intro-thumb.jpg",
    "local": "public/assets/source/intro-thumb.jpg",
    "required": true
  },
  {
    "id": "ship-main",
    "remote": "https://cdn.prod.website-files.com/6a44eec1ed1af2c4c403df6b/6a44eec1ed1af2c4c403e800_home-ship.avif",
    "local": "public/assets/source/ship-main.avif",
    "required": true
  }
]
```

- [ ] **Step 2: Write the failing manifest test**

Create `tests/assets.test.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../tools/source-assets.json';

describe('source assets', () => {
  it('uses unique ids and safe local paths', () => {
    expect(new Set(manifest.map((item) => item.id)).size).toBe(manifest.length);
    for (const item of manifest) {
      expect(item.remote.startsWith('https://cdn.prod.website-files.com/')).toBe(true);
      expect(item.local.startsWith('public/assets/source/')).toBe(true);
      expect(item.local.includes('..')).toBe(false);
    }
  });

  it('has every required file after synchronization', () => {
    for (const item of manifest.filter((entry) => entry.required)) {
      expect(fs.existsSync(path.resolve(item.local)), item.id).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the test and verify failure**

Run: `npm test -- tests/assets.test.js`

Expected: FAIL because required local files have not been downloaded.

- [ ] **Step 4: Implement the repeatable downloader**

Create `tools/sync-source-assets.mjs`:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import manifest from './source-assets.json' with { type: 'json' };

for (const asset of manifest) {
  const target = path.resolve(asset.local);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const response = await fetch(asset.remote);
  if (!response.ok) throw new Error(`${asset.id}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) throw new Error(`${asset.id}: empty response`);
  await fs.writeFile(target, bytes);
  process.stdout.write(`${asset.id} ${bytes.length}\n`);
}
```

- [ ] **Step 5: Synchronize the media and run validation**

Run: `npm run assets:sync`

Expected: every manifest id prints with a non-zero byte count.

Run: `npm test -- tests/assets.test.js`

Expected: PASS.

- [ ] **Step 6: Add the runtime asset registry**

Create `src/data/assets.js`:

```js
export const ASSETS = Object.freeze({
  loaderMap: '/assets/source/loader-map.png',
  introThumb: '/assets/source/intro-thumb.jpg',
  ship: {
    main: '/assets/source/ship-main.avif',
    mobile: '/assets/source/ship-mobile.avif',
    deck: '/assets/source/ship-deck.avif',
  },
});
```

Expand this object with grouped `hero`, `freight`, `services`, `reliability`, `clouds`, `benefits`, `testimonials`, `airlines`, `shippingLines`, `insights`, and `footer` keys matching manifest ids.

- [ ] **Step 7: Commit**

```bash
git add tools/source-assets.json tools/sync-source-assets.mjs src/data/assets.js tests/assets.test.js public/assets/source
git commit -m "feat: add audited homepage media"
```

---

### Task 3: Rebuild the Semantic Shell, Tokens, and Inert Links

**Files:**
- Replace: `index.html`
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/chrome.css`
- Create: `src/styles/hero.css`
- Create: `src/styles/home.css`
- Create: `src/styles/responsive.css`
- Create: `src/core/inertLinks.js`
- Create: `tests/inertLinks.test.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing inert-link tests**

Create `tests/inertLinks.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { initInertLinks } from '../src/core/inertLinks.js';

describe('study links', () => {
  it('prevents outbound navigation without removing focusability', () => {
    document.body.innerHTML = '<a href="/about" data-study-link>About</a>';
    const cleanup = initInertLinks(document);
    const link = document.querySelector('a');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    link.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
    expect(link.tabIndex).toBe(0);
    cleanup();
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- tests/inertLinks.test.js`

Expected: FAIL because `initInertLinks` is undefined.

- [ ] **Step 3: Implement inert links**

Create `src/core/inertLinks.js`:

```js
export function initInertLinks(root = document) {
  const links = [...root.querySelectorAll('[data-study-link]')];
  const block = (event) => event.preventDefault();
  links.forEach((link) => link.addEventListener('click', block));
  return () => links.forEach((link) => link.removeEventListener('click', block));
}
```

- [ ] **Step 4: Replace the document shell**

Rebuild `index.html` with semantic elements for every approved section in this order:

```html
<div id="loader" class="loader" aria-hidden="true"></div>
<div class="site-shell">
  <aside class="utility" aria-label="Company updates"></aside>
  <header class="site-header"></header>
  <main>
    <section id="hero" class="hero"></section>
    <section id="outcome" class="section outcome"></section>
    <section id="freight-scene" class="section freight-scene"></section>
    <section id="services" class="section services"></section>
    <section id="reliability" class="section reliability"></section>
    <section id="ship" class="section ship-scene"></section>
    <section id="why-us" class="section why-us"></section>
    <section id="testimonials" class="section testimonials"></section>
    <section id="partners" class="section partners"></section>
    <section id="insights" class="section insights"></section>
    <section id="faq" class="section faq"></section>
    <section id="closing-cta" class="section closing-cta"></section>
  </main>
  <footer class="footer"></footer>
</div>
```

Populate all headings, copy, controls, image alternatives, and `data-study-link` anchors from `CONTENT` and the live DOM audit. Keep decorative images `alt=""`; use the source alternatives for meaningful freight, ship, aircraft, and article images.

- [ ] **Step 5: Establish the visual system**

Create `src/styles/tokens.css` with measured source tokens:

```css
:root {
  --uc-blue: #0018cc;
  --uc-black: #050505;
  --uc-white: #fff;
  --uc-paper: #f4f4f2;
  --uc-line: color-mix(in srgb, currentColor 18%, transparent);
  --font-display: "Helvetica Neue", Arial, sans-serif;
  --font-body: "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", monospace;
  --gutter: clamp(20px, 3.2vw, 64px);
  --section-space: clamp(96px, 12vw, 220px);
  --ease-out: cubic-bezier(.16, 1, .3, 1);
}
```

Create the remaining style files with one responsibility each. Import them from `index.html` in the order `tokens`, `base`, `chrome`, `hero`, `home`, `responsive`.

- [ ] **Step 6: Wire the new shell and run tests**

Update `src/main.js` to import `initInertLinks`, initialize it after the DOM exists, and retain its cleanup function.

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: Vite completes without errors.

- [ ] **Step 7: Commit**

```bash
git add index.html src/main.js src/styles src/core/inertLinks.js tests/inertLinks.test.js
git commit -m "feat: rebuild semantic homepage shell"
```

---

### Task 4: Implement Media Readiness, Loader, and Navigation

**Files:**
- Create: `src/core/mediaReady.js`
- Replace: `src/components/loader.js`
- Create: `src/components/navigation.js`
- Create: `tests/mediaReady.test.js`
- Create: `tests/navigation.test.js`
- Modify: `src/styles/chrome.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write bounded-readiness tests**

Create `tests/mediaReady.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { waitForCriticalMedia } from '../src/core/mediaReady.js';

describe('critical media readiness', () => {
  it('resolves at the timeout when media never loads', async () => {
    vi.useFakeTimers();
    const pending = new Promise(() => {});
    const result = waitForCriticalMedia([pending], 1200);
    await vi.advanceTimersByTimeAsync(1200);
    await expect(result).resolves.toEqual({ timedOut: true });
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Implement bounded readiness**

Create `src/core/mediaReady.js`:

```js
export async function waitForCriticalMedia(promises, timeoutMs = 5000) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });
  const ready = Promise.allSettled(promises).then(() => ({ timedOut: false }));
  const result = await Promise.race([ready, timeout]);
  clearTimeout(timer);
  return result;
}
```

- [ ] **Step 3: Write menu-controller tests**

Create `tests/navigation.test.js` covering button state, Escape close, body scroll lock, and focus restoration:

```js
import { describe, expect, it } from 'vitest';
import { initNavigation } from '../src/components/navigation.js';

describe('navigation overlay', () => {
  it('opens, closes with Escape, and restores trigger focus', () => {
    document.body.innerHTML = '<button id="menu-toggle" aria-expanded="false">Menu</button><div id="menu" hidden><a href="/about" data-study-link>About</a></div>';
    const nav = initNavigation();
    const button = document.querySelector('#menu-toggle');
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('menu-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
    nav.destroy();
  });
});
```

- [ ] **Step 4: Implement navigation and loader choreography**

`initNavigation()` returns `{ open, close, destroy }`. It manages `aria-expanded`, `[hidden]`, focus, Escape, backdrop clicks, and `body.menu-open`. GSAP owns visual timelines; semantic state changes happen synchronously.

`runLoader({ criticalReady, reducedMotion })` uses the local loader map, country and service roulettes, a real readiness-gated percentage, and a bounded timeout. It always removes the scroll lock in `finally` and resolves only after the hero is visible.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/mediaReady.test.js tests/navigation.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add src/core/mediaReady.js src/components/loader.js src/components/navigation.js src/styles/chrome.css src/main.js tests/mediaReady.test.js tests/navigation.test.js
git commit -m "feat: recreate loader and navigation"
```

---

### Task 5: Adapt the Globe and Recreate the Hero

**Files:**
- Modify: `src/globe/Globe.js`
- Modify: `src/globe/arcs.js`
- Modify: `src/globe/labels.js`
- Create: `src/components/hero.js`
- Create: `src/core/motion.js`
- Create: `tests/motion.test.js`
- Modify: `src/styles/hero.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write the motion preference test**

Create `tests/motion.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { motionPreferences } from '../src/core/motion.js';

describe('motion preferences', () => {
  it('reports reduced motion from matchMedia', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }));
    expect(motionPreferences().reduced).toBe(true);
  });
});
```

- [ ] **Step 2: Implement shared motion lifecycle**

Create `src/core/motion.js`:

```js
export function motionPreferences() {
  return { reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
}

export function lifecycle(...resources) {
  return () => resources.reverse().forEach((resource) => resource?.destroy?.());
}
```

- [ ] **Step 3: Implement the hero adapter**

Create `src/components/hero.js` exporting:

```js
export async function initHero({ canvas, labels, reducedMotion }) {
  const globe = new Globe(canvas, labels);
  globe.setIntro(reducedMotion ? 1 : 0);
  let frame = 0;
  let visible = true;
  const render = () => {
    if (visible) globe.update();
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return {
    ready: globe.dotsReady,
    setVisible(next) {
      visible = Boolean(next);
      globe.setVisible(visible);
    },
    destroy() {
      cancelAnimationFrame(frame);
      globe.dispose();
    },
  };
}
```

Import `Globe` from `../globe/Globe.js`. Extend this implementation with the measured GSAP intro and scroll-exit timelines. Retain analytic far-side culling, DPR clamping, route arcs, projected labels, direct pointer drag, bounded inertia, visibility pausing, and a static hero fallback class when WebGL construction throws.

- [ ] **Step 4: Match the current hero**

Use the exact heading “EVERY / LEG OF THE / JOURNEY,” the live supporting copy, two CTAs, current utility rail, blue/black globe atmosphere, responsive mobile hero asset, and source-equivalent scroll exit. Remove invented telemetry and “DRAG TO ORBIT” UI if absent in the live render.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/motion.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add src/globe src/components/hero.js src/core/motion.js src/styles/hero.css src/main.js tests/motion.test.js
git commit -m "feat: match the United Carriers hero"
```

---

### Task 6: Build the Outcome and Freight-Equipment Story

**Files:**
- Create: `src/components/freightScene.js`
- Create: `tests/freightScene.test.js`
- Modify: `index.html`
- Modify: `src/styles/home.css`
- Modify: `src/styles/responsive.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write the reduced-motion state test**

Create `tests/freightScene.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { setFreightSceneFinalState } from '../src/components/freightScene.js';

describe('freight scene', () => {
  it('reveals every layer in reduced motion', () => {
    document.body.innerHTML = '<section id="freight-scene"><img data-freight-layer><img data-freight-layer></section>';
    setFreightSceneFinalState(document.querySelector('#freight-scene'));
    expect([...document.querySelectorAll('[data-freight-layer]')].every((el) => el.style.opacity === '1')).toBe(true);
  });
});
```

- [ ] **Step 2: Implement the freight composition**

Create `src/components/freightScene.js` with `initFreightScene(root, { reducedMotion })`, `setFreightSceneFinalState(root)`, and `destroy()`. Use separate image layers for reach stacker, containers, crane, truck, trailer, and wheels. Reproduce the source’s desktop pinned sequence and mobile stacked composition with GSAP timelines scoped to `root`.

- [ ] **Step 3: Match the outcome section**

Use the introduction thumbnail, exact outcome heading and copy, source grid proportions, and “Learn more about us” study link. Recreate “From countless journeys, clarity emerges” and the observed speed readout without inventing business metrics not present in the live page.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/freightScene.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add index.html src/components/freightScene.js src/styles/home.css src/styles/responsive.css src/main.js tests/freightScene.test.js
git commit -m "feat: recreate freight equipment story"
```

---

### Task 7: Build Services and Reliability Scenes

**Files:**
- Create: `src/components/services.js`
- Create: `src/components/reliability.js`
- Create: `tests/services.test.js`
- Modify: `index.html`
- Modify: `src/styles/home.css`
- Modify: `src/styles/responsive.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write the service state test**

Create `tests/services.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { activateService } from '../src/components/services.js';

describe('services', () => {
  it('activates exactly one service and matching image', () => {
    document.body.innerHTML = '<button data-service="air"></button><button data-service="ocean"></button><img data-service-image="air"><img data-service-image="ocean">';
    activateService(document, 'ocean');
    expect(document.querySelector('[data-service="ocean"]').getAttribute('aria-current')).toBe('true');
    expect(document.querySelector('[data-service-image="ocean"]').hidden).toBe(false);
    expect(document.querySelector('[data-service-image="air"]').hidden).toBe(true);
  });
});
```

- [ ] **Step 2: Implement services**

Create `src/components/services.js` exporting `activateService(root, id)` and `initServices(root, { reducedMotion })`. Desktop uses the source’s scroll-driven service progression; mobile uses accessible buttons/accordion behavior. Copy and six image assets match the audited live page.

- [ ] **Step 3: Implement reliability and ship/cloud animation**

Create `src/components/reliability.js` exporting `initReliability(root, { reducedMotion })`. Use three milestone items, truck/container top views, desktop and mobile ship layers, and cloud layers. The reduced-motion path applies the final readable composition without pinning.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/services.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add index.html src/components/services.js src/components/reliability.js src/styles/home.css src/styles/responsive.css src/main.js tests/services.test.js
git commit -m "feat: add services and reliability scenes"
```

---

### Task 8: Build Benefits and Testimonials

**Files:**
- Create: `src/components/testimonials.js`
- Create: `tests/testimonials.test.js`
- Modify: `index.html`
- Modify: `src/styles/home.css`
- Modify: `src/styles/responsive.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write carousel state tests**

Create `tests/testimonials.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { createCarouselState } from '../src/components/testimonials.js';

describe('testimonial carousel state', () => {
  it('wraps in both directions', () => {
    const state = createCarouselState(3);
    expect(state.previous()).toBe(2);
    expect(state.next()).toBe(0);
    expect(state.next()).toBe(1);
  });
});
```

- [ ] **Step 2: Implement benefits**

Add the five exact “Why us” items and corresponding local image layers. Match the aircraft/cloud transition and the source’s alternating text/image rhythm. Mobile must preserve all five items without horizontal scrolling.

- [ ] **Step 3: Implement testimonials**

Create `src/components/testimonials.js` with `createCarouselState(length)` and `initTestimonials(root, { reducedMotion })`. Support previous/next buttons, keyboard arrows when focused, swipe gestures, live index state, portraits, exact names/roles/companies, and source quotes.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/testimonials.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add index.html src/components/testimonials.js src/styles/home.css src/styles/responsive.css src/main.js tests/testimonials.test.js
git commit -m "feat: add benefits and testimonials"
```

---

### Task 9: Build Partner Marquees, Insights, FAQ, and Footer

**Files:**
- Create: `src/components/partners.js`
- Create: `src/components/insights.js`
- Create: `src/components/faq.js`
- Create: `src/components/footer.js`
- Create: `tests/faq.test.js`
- Modify: `index.html`
- Modify: `src/styles/home.css`
- Modify: `src/styles/responsive.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write the FAQ behavior test**

Create `tests/faq.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { initFaq } from '../src/components/faq.js';

describe('FAQ accordion', () => {
  it('opens one answer and updates aria-expanded', () => {
    document.body.innerHTML = '<div id="faq"><button aria-expanded="false" aria-controls="a1">Question</button><div id="a1" hidden>Answer</div></div>';
    const faq = initFaq(document.querySelector('#faq'));
    document.querySelector('button').click();
    expect(document.querySelector('button').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('#a1').hidden).toBe(false);
    faq.destroy();
  });
});
```

- [ ] **Step 2: Implement partner marquees**

Create `src/components/partners.js`. Render separate airline and shipping-line rows, duplicate each list once for a seamless loop, expose default and hover image layers, pause on pointer hover and keyboard focus, and stop animation under reduced motion.

- [ ] **Step 3: Implement insights**

Create `src/components/insights.js`. Reproduce the visible article-card layout, dates, categories, titles, images, drag/scroll behavior, and hover treatment. Every article anchor uses `data-study-link`.

- [ ] **Step 4: Implement FAQ and footer**

Create `src/components/faq.js` with one-open-at-a-time disclosure behavior and `destroy()`. Create `src/components/footer.js` for the closing “READY TO MOVE SMARTER?” block, footer thumbnail, dotted map, United Carriers mark, contact/navigation labels, and study-link treatment.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/faq.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

```bash
git add index.html src/components/partners.js src/components/insights.js src/components/faq.js src/components/footer.js src/styles/home.css src/styles/responsive.css src/main.js tests/faq.test.js
git commit -m "feat: complete lower homepage sections"
```

---

### Task 10: Integrate Scroll, Visibility, and Failure Isolation

**Files:**
- Replace: `src/scroll.js`
- Modify: `src/main.js`
- Create: `tests/bootstrap.test.js`

- [ ] **Step 1: Write bootstrap isolation tests**

Create `tests/bootstrap.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { startModules } from '../src/main.js';

describe('application bootstrap', () => {
  it('continues when one optional module fails', async () => {
    const good = vi.fn(() => ({ destroy() {} }));
    const bad = vi.fn(() => { throw new Error('webgl unavailable'); });
    const result = await startModules([bad, good]);
    expect(good).toHaveBeenCalled();
    expect(result.errors).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement isolated startup**

Export this contract from `src/main.js`:

```js
export async function startModules(factories) {
  const modules = [];
  const errors = [];
  for (const factory of factories) {
    try {
      modules.push(await factory());
    } catch (error) {
      errors.push(error);
    }
  }
  return { modules, errors };
}
```

Production bootstrap passes loader, navigation, hero, freight, services, reliability, testimonials, partners, insights, FAQ, footer, inert links, and scroll factories. It removes loader/body locks in `finally`, logs one concise error per failed optional module, and keeps semantic content visible.

- [ ] **Step 3: Replace the global scroll coordinator**

`src/scroll.js` initializes one Lenis instance when motion is allowed, connects it to ScrollTrigger, refreshes after fonts and critical media settle, pauses on document visibility change, and destroys every subscription. Individual section timelines stay in their component modules.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/bootstrap.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

```bash
git add src/main.js src/scroll.js tests/bootstrap.test.js
git commit -m "feat: harden homepage lifecycle"
```

---

### Task 11: Responsive and Accessibility Validation

**Files:**
- Modify: `src/styles/responsive.css`
- Modify: `src/styles/base.css`
- Modify: `index.html`
- Create: `tests/a11y-contract.test.js`

- [ ] **Step 1: Add structural accessibility tests**

Create `tests/a11y-contract.test.js`:

```js
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = fs.readFileSync('index.html', 'utf8');

describe('document accessibility contract', () => {
  it('has one h1 and named interactive controls', () => {
    document.documentElement.innerHTML = html;
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    for (const button of document.querySelectorAll('button')) {
      expect(button.textContent.trim() || button.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('marks every outbound study link as inert', () => {
    document.documentElement.innerHTML = html;
    for (const link of document.querySelectorAll('a[href]')) {
      expect(link.hasAttribute('data-study-link')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Tune phone layouts**

At 360, 390, and 430px, verify and correct hero line breaks, menu control size, freight layer containment, service stacking, milestone copy, aircraft/ship crops, testimonial controls, partner logo sizing, insight cards, FAQ hit targets, and footer wrapping.

- [ ] **Step 3: Tune tablet and desktop layouts**

At 768, 1024, 1280, 1440, and 1600px, verify and correct gutters, sticky section heights, text measures, composited asset alignment, navigation spacing, marquee seams, and footer columns.

- [ ] **Step 4: Add reduced-motion CSS**

Use:

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  [data-reveal], [data-freight-layer], [data-ship-layer] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/a11y-contract.test.js`

Expected: PASS.

Run: `npm test && npm run build`

Expected: all tests and build PASS.

```bash
git add index.html src/styles/base.css src/styles/responsive.css tests/a11y-contract.test.js
git commit -m "fix: polish responsive and accessible behavior"
```

---

### Task 12: Browser QA, Performance Pass, and Packaging

**Files:**
- Modify: `tools/bundle-single-file.mjs`
- Modify: `README.md`
- Create: `docs/qa/2026-08-26-homepage-verification.md`

- [ ] **Step 1: Start the production-like preview**

Run: `npm run build && npm run preview`

Expected: Vite serves the production build at `http://localhost:5180`.

- [ ] **Step 2: Compare live and local at target viewports**

Using the in-app browser viewport capability and Playwright-style inspection, compare `https://unitedcarriers.com/` with `http://localhost:5180` at 390×844, 768×1024, 1440×900, and 1600×1000. Record section-by-section discrepancies in `docs/qa/2026-08-26-homepage-verification.md`, fix them, and repeat until no material layout, copy, media, or interaction discrepancy remains.

- [ ] **Step 3: Run interaction checks**

Verify menu open/close/Escape/focus restoration, inert links, globe pointer drag, scroll choreography, service transitions, testimonial buttons/swipe, partner marquee pause, insight interaction, FAQ disclosure, and reduced-motion rendering.

Expected: no control navigates away; every feature remains usable with pointer, touch-equivalent interaction, and keyboard where applicable.

- [ ] **Step 4: Run resilience checks**

Block the globe data request and one below-fold image request during separate local reloads. Verify static hero and media fallbacks preserve readable layout. Inspect browser console logs.

Expected: no uncaught error breaks the page and the loader always releases.

- [ ] **Step 5: Preserve and update the single-file packager**

Keep the existing viewport-meta guard in `tools/bundle-single-file.mjs`. Change the output title and filename from Meridian to United Carriers Study, and inline or data-encode all local source assets referenced by the built CSS/HTML/JavaScript. Add a package script:

```json
"bundle:single": "npm run build && node tools/bundle-single-file.mjs"
```

- [ ] **Step 6: Update documentation**

Rewrite `README.md` to describe the private-study scope, commands, architecture, local assets, inert links, responsive targets, reduced-motion behavior, browser QA matrix, and the fact that no destination pages are implemented.

- [ ] **Step 7: Run the final verification suite**

Run:

```bash
npm test
npm run build
npm run bundle:single
git diff --check
```

Expected: tests PASS, Vite build succeeds, the single-file artifact is produced, and `git diff --check` prints no errors.

- [ ] **Step 8: Commit the verified result**

```bash
git add README.md package.json package-lock.json tools/bundle-single-file.mjs docs/qa/2026-08-26-homepage-verification.md dist
git commit -m "chore: verify and package homepage study"
```

---

## Completion Gate

Do not claim completion until all automated tests pass, the production build succeeds, the packaged artifact is generated, browser console errors are reviewed, all four comparison viewports are recorded in the QA document, reduced-motion behavior is verified, and every outbound control is confirmed non-navigating.
