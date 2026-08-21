/* ============================================================================
   labels — DOM chips pinned to surface coordinates and re-projected each frame.
   DOM rather than sprites so the mono type stays pixel-crisp.
   ========================================================================= */

import * as THREE from 'three';
import { latLonToVec3 } from './arcs.js';

export function createLabels(nodes, container, { radius = 1 } = {}) {
  const items = nodes.map((node, i) => {
    const el = document.createElement('div');
    el.className = 'glabel';
    el.style.setProperty('--delay', `${(i % 7) * 0.4}s`);
    el.innerHTML = `
      <div class="glabel__chip">${node.label}</div>
      <div class="glabel__stem"></div>
      <div class="glabel__dot"></div>
    `;
    el.style.opacity = '0';
    container.appendChild(el);

    return {
      node,
      el,
      chip: el.querySelector('.glabel__chip'),
      stem: el.querySelector('.glabel__stem'),
      pos: latLonToVec3(node.lat, node.lon, radius),
      world: new THREE.Vector3(),
      shown: 0,
      pop: 0,
      order: i,
    };
  });

  const projected = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  let master = 0;   // intro gate, 0..1
  let reveal = 0;   // staggered progress, 0..1

  return {
    items,

    setReveal(p) {
      reveal = p;
      master = p > 0 ? 1 : 0;
    },

    setMaster(m) {
      master = m;
    },

    update(camera, globeMatrix, size) {
      const n = items.length || 1;

      for (const item of items) {
        item.world.copy(item.pos).applyMatrix4(globeMatrix);

        // facing test — hides anything on the far hemisphere
        toCam.copy(camera.position).sub(item.world).normalize();
        const normal = item.world.clone().normalize();
        const facing = normal.dot(toCam);

        // stagger the intro pop
        const start = (item.order / n) * 0.7;
        const local = THREE.MathUtils.clamp((reveal - start) / 0.3, 0, 1);

        const limbFade = THREE.MathUtils.smoothstep(facing, 0.02, 0.26);

        // screen-edge guards: chips must not collide with the rail, the CTA,
        // or bleed off the viewport
        projected.copy(item.world).project(camera);
        const px = (projected.x * 0.5 + 0.5) * size.w;
        const py = (-projected.y * 0.5 + 0.5) * size.h;

        const narrow = size.w < 760;
        const GUARD_TOP = narrow ? 96 : 132;
        const GUARD_SIDE = narrow ? 22 : 34;
        // on phones the copy owns the lower two thirds, so chips stay above it
        const GUARD_BOTTOM = narrow ? size.h * 0.5 : GUARD_SIDE;
        const edgeFade =
          THREE.MathUtils.smoothstep(py, GUARD_TOP, GUARD_TOP + 46) *
          THREE.MathUtils.smoothstep(size.h - py, GUARD_BOTTOM, GUARD_BOTTOM + 44) *
          THREE.MathUtils.smoothstep(px, GUARD_SIDE, GUARD_SIDE + 36) *
          THREE.MathUtils.smoothstep(size.w - px, narrow ? 26 : 70, narrow ? 62 : 132);

        const target = limbFade * local * master * edgeFade;

        item.shown += (target - item.shown) * 0.16;
        item.pop += (local - item.pop) * 0.2;

        if (item.shown < 0.004) {
          if (item.el.style.visibility !== 'hidden') item.el.style.visibility = 'hidden';
          continue;
        }
        if (item.el.style.visibility === 'hidden') item.el.style.visibility = 'visible';

        item.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        item.el.style.opacity = item.shown.toFixed(3);
        item.el.style.setProperty('--pop', (0.72 + 0.28 * item.pop).toFixed(3));
        item.el.style.setProperty('--stem', item.pop.toFixed(3));
      }
    },

    dispose() {
      items.forEach((i) => i.el.remove());
    },
  };
}
