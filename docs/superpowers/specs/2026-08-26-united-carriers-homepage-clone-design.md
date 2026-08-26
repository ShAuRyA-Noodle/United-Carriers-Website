# United Carriers Homepage Clone — Design Specification

## Objective

Rebuild the current public homepage at `https://unitedcarriers.com/` as a private-study, single-page frontend with very high visual and behavioral fidelity. The clone covers the homepage only. Links that would leave the homepage remain visually interactive but do not navigate.

The live homepage as observed on 26 August 2026 is the visual and behavioral source of truth.

## Existing Project Context

The workspace already contains a Vite, Three.js, GSAP, ScrollTrigger, and Lenis-based logistics homepage study. It includes a loader, interactive globe, scroll choreography, procedural visuals, and responsive styling. Its content and lower-page structure do not match the current United Carriers homepage.

The implementation will therefore rebuild the homepage structure and selectively retain only foundations that materially help reproduce the current source, such as suitable globe rendering and animation utilities. Invented Meridian branding and content will be removed from the delivered experience.

## Scope

The clone includes the complete homepage sequence:

1. Animated loading sequence
2. News and utility strip
3. Header and full-screen navigation menu
4. Interactive globe hero
5. “We move freight. We own the outcome.” introduction
6. Animated freight-equipment composition
7. Integrated services showcase
8. “Reliability at every milestone” section
9. Cargo ship and cloud transition
10. “Why us” benefits
11. Customer testimonials
12. Airline and shipping-line partner marquees
13. Insights and article cards
14. Closing call-to-action and footer

The clone does not include About, Services, Industries, Insights, Careers, Community, Contact, tracking, calculator, or article destination pages.

## Navigation Behavior

All links that would leave the homepage are inert study controls. They retain the source site’s visual states, hover effects, focus behavior, labels, and cursor treatment, but do not change the current URL or open another page.

The menu opens, closes, animates, and responds to keyboard and touch input. Its outbound items remain inert.

## Visual Fidelity

The source homepage determines:

- Section order and overall page rhythm
- Typography scale, weight, casing, and line wrapping
- Monochrome palette, blue accents, borders, and contrast hierarchy
- Container widths, gutters, section heights, and whitespace
- Image crops, object placement, and compositing
- Button, menu, card, marquee, and carousel styling
- Desktop, tablet, and mobile layout behavior

Browser-rendered measurements and viewport comparisons will guide implementation. Fidelity is prioritized over preserving the current local project’s invented design choices.

## Assets

Publicly accessible homepage images, logos, SVGs, videos, and other media may be downloaded and stored locally for this private study. Assets will be optimized without materially changing their appearance.

If an asset cannot be downloaded, embedded, or redistributed by the available tooling, the implementation will use a visually close local substitute. Licensed or inaccessible fonts may be replaced with metric and stylistic equivalents while preserving line breaks and hierarchy as closely as possible.

Every stored asset will have a clear role and stable local path. Below-the-fold media will be lazy-loaded where that does not interfere with source-equivalent animation timing.

## Architecture

The project remains a Vite-based single-page application using the existing lightweight JavaScript stack. The implementation will be divided into focused systems:

- Global design tokens and responsive layout primitives
- Loader and asset-readiness coordinator
- Header, utility strip, and navigation menu
- Hero copy, globe scene, labels, and route animation
- Scroll and section-transition coordinator
- Freight-equipment composition
- Services presentation
- Reliability and ship/cloud scenes
- Benefits, testimonials, partner marquees, and insights
- Footer and inert-link controller
- Accessibility and reduced-motion behavior

Each animation module owns only its section and exposes a small initialization and cleanup interface. A failure in one enhancement must not prevent the rest of the page from rendering.

## Interaction and Motion

The implementation reproduces the observable homepage behaviors, including:

- Loader progress and reveal choreography
- Globe idle motion, route arcs, labels, pointer drag, and scroll transition
- Header and utility-strip state changes
- Full-screen menu transitions
- Text-mask and scroll-entry reveals
- Freight-equipment parallax and composition changes
- Pinned or horizontal service sequences where present
- Cargo ship and cloud motion
- Testimonial navigation
- Continuous partner marquees
- Insight-card hover states
- Touch-equivalent behavior for hover-dependent controls

Motion uses transform and opacity wherever possible. Scroll-bound animation avoids layout reads inside frame loops. `prefers-reduced-motion` produces complete, readable final states without decorative motion.

## Responsive Behavior

The page will be tuned and verified at representative widths for:

- Phones: 360–430px
- Tablets: 768–1024px
- Laptops: 1280–1440px
- Large desktops: 1600px and above
- Portrait and landscape orientations

Fluid type and spacing handle intermediate sizes, while explicit breakpoints address structural changes such as navigation, hero composition, service presentation, media stacking, and footer layout. No viewport may introduce unintended horizontal overflow, clipped controls, unreadable copy, or inaccessible content.

## Performance

The implementation will:

- Optimize and size local assets appropriately
- Lazy-load below-the-fold media when safe
- Use responsive image sources where useful
- Bound WebGL device-pixel ratio
- Pause expensive animation when offscreen or when the document is hidden
- Avoid unnecessary reflow during scrolling
- Prefer GPU-friendly transforms
- Preserve a fast, readable first render while assets initialize

Smoothness will be judged on real browser rendering; headless software rendering will not be treated as a reliable GPU frame-rate benchmark.

## Resilience and Fallbacks

If WebGL is unavailable or initialization fails, the hero retains its layout and displays a static fallback visual. Missing media preserves aspect ratio and section geometry. Optional animation failures degrade to stable final states.

Asset readiness has a bounded wait so the loader cannot trap the user indefinitely. Runtime failures are isolated to the smallest relevant feature.

## Accessibility

The clone preserves semantic headings, useful image alternatives, visible keyboard focus, keyboard-operable menus and carousels, adequate control sizes, and appropriate ARIA state for interactive controls. Decorative media is hidden from assistive technology. Inert study links do not misrepresent navigation behavior.

## Verification

Completion requires:

- A successful production build
- No unexpected browser console errors
- Visual comparison with the live homepage at every target viewport
- Checks for overflow, clipping, text wrapping, stacking, and section boundaries
- Menu, testimonial, drag, hover, touch, and scroll-interaction tests
- Keyboard and reduced-motion checks
- Slow-loading and missing-asset checks
- Confirmation that outbound links do not navigate
- A final review of desktop, tablet, and mobile screenshots

## Acceptance Criteria

The result is accepted when the full local homepage clearly reads as the current United Carriers homepage at first glance and under section-by-section comparison; its primary animation and interaction behaviors are reproduced; it remains smooth and coherent across the target device sizes; it degrades gracefully; and no homepage control navigates to an unimplemented external page.
