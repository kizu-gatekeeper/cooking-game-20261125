// Mouse + keyboard input for Sizzle Station.
// Click a station to walk over and use it; click the floor to walk there.
// WASD / arrows move the chef, E or Space uses the nearest station, Q serves.

import { FLOOR, stationAtPoint, chefWalkToStation, nearestStation, interact } from './kitchen.js';
import { toggleMute } from './audio.js';

export function bindInput(canvas, state, hooks) {
  const keys = new Set();

  function canvasPos(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (canvas.width / r.width),
      y: (ev.clientY - r.top) * (canvas.height / r.height),
    };
  }

  canvas.addEventListener('click', (ev) => {
    const p = canvasPos(ev);
    if (state.screen === 'title') {
      hooks.onStart();
      return;
    }
    if (state.screen === 'over') {
      hooks.onRestart();
      return;
    }
    const station = stationAtPoint(p.x, p.y);
    if (station) {
      chefWalkToStation(state, station);
    } else {
      state.chef.tx = Math.max(FLOOR.left, Math.min(FLOOR.right, p.x));
      state.chef.ty = Math.max(FLOOR.top, Math.min(FLOOR.bottom, p.y));
      state.pendingStation = null;
    }
  });

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      ev.preventDefault();
    }
    if (k === 'm') {
      toggleMute();
      return;
    }
    if (state.screen === 'title' && (k === 'enter' || k === ' ')) {
      hooks.onStart();
      return;
    }
    if (state.screen === 'over' && (k === 'r' || k === 'enter' || k === ' ')) {
      hooks.onRestart();
      return;
    }
    if (state.screen !== 'play') return;
    if (k === 'r') {
      hooks.onRestart();
      return;
    }
    if (k === 'e' || k === ' ') {
      const s = nearestStation(state);
      if (s) interact(state, s.id);
      return;
    }
    if (k === 'q') {
      interact(state, 'serve');
      return;
    }
    keys.add(k);
  });

  window.addEventListener('keyup', (ev) => {
    keys.delete(ev.key.toLowerCase());
  });

  // Keyboard walking: steer the chef directly, cancelling click-to-move.
  function pollKeys(dt) {
    if (state.screen !== 'play') return;
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (dx === 0 && dy === 0) return;
    const len = Math.hypot(dx, dy);
    const c = state.chef;
    c.x = Math.max(FLOOR.left, Math.min(FLOOR.right, c.x + (dx / len) * 300 * dt));
    c.y = Math.max(FLOOR.top, Math.min(FLOOR.bottom, c.y + (dy / len) * 300 * dt));
    c.tx = c.x;
    c.ty = c.y;
    c.dir = dx !== 0 ? Math.sign(dx) : c.dir;
    c.moving = true;
    c.bob += dt * 12;
    state.pendingStation = null;
  }

  return { pollKeys };
}
