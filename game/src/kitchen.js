// Sizzle Station game state: orders, stations, the chef, scoring.
// Pure logic — no drawing here, render.js draws whatever this file holds.

import { INGREDIENTS, RECIPES, plateMatchesRecipe, recipeById } from './recipes.js';
import { rngPick } from './rng.js';
import * as sfx from './audio.js';

export const SHIFT_LENGTH = 150;
export const MAX_ORDERS = 4;
export const GRILL_COOK_TIME = 6;
export const GRILL_BURN_TIME = 14;
export const CHOP_TIME = 2.5;

// Station rectangles on the 1280x800 canvas, and the floor point the chef
// walks to when the player clicks one.
export const STATIONS = {
  binBun:     { id: 'binBun',     label: 'Buns',     kind: 'bin', item: 'bun',     x: 60,  y: 196, w: 176, h: 96 },
  binPatty:   { id: 'binPatty',   label: 'Patties',  kind: 'bin', item: 'patty',   x: 248, y: 196, w: 176, h: 96 },
  binLettuce: { id: 'binLettuce', label: 'Lettuce',  kind: 'bin', item: 'lettuce', x: 436, y: 196, w: 176, h: 96 },
  binTomato:  { id: 'binTomato',  label: 'Tomatoes', kind: 'bin', item: 'tomato',  x: 624, y: 196, w: 176, h: 96 },
  binCheese:  { id: 'binCheese',  label: 'Cheese',   kind: 'bin', item: 'cheese',  x: 812, y: 196, w: 176, h: 96 },
  binOnion:   { id: 'binOnion',   label: 'Onions',   kind: 'bin', item: 'onion',   x: 1000, y: 196, w: 176, h: 96 },
  grill:      { id: 'grill',      label: 'Grill',    kind: 'grill', x: 60,  y: 330, w: 280, h: 120 },
  board:      { id: 'board',      label: 'Chopping Board', kind: 'board', x: 380, y: 330, w: 280, h: 120 },
  assembly:   { id: 'assembly',   label: 'Assembly Plate', kind: 'assembly', x: 700, y: 330, w: 280, h: 120 },
  trash:      { id: 'trash',      label: 'Trash',    kind: 'trash', x: 1020, y: 330, w: 156, h: 120 },
  serve:      { id: 'serve',      label: 'Serve Window', kind: 'serve', x: 860, y: 486, w: 316, h: 92 },
};

export const FLOOR = { top: 600, bottom: 768, left: 40, right: 1240 };

let orderSeq = 0;

export function newGame(rng) {
  const state = {
    screen: 'title',
    rng,
    timeLeft: SHIFT_LENGTH,
    elapsed: 0,
    orders: [],
    nextOrderIn: 1.2,
    grill: { item: null, progress: 0, status: 'empty' },
    board: { item: null, progress: 0, status: 'empty' },
    plate: [],
    chef: { x: 640, y: 700, tx: 640, ty: 700, dir: 1, moving: false, bob: 0 },
    carry: null,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    rush: false,
    rushAnnounced: false,
    floats: [],
    banner: null,
    flash: null,
    shakeUntil: 0,
  };
  spawnOrder(state);
  spawnOrder(state);
  return state;
}

export function startShift(state) {
  state.screen = 'play';
  state.timeLeft = SHIFT_LENGTH;
  state.elapsed = 0;
  state.orders = [];
  state.nextOrderIn = 1.2;
  state.grill = { item: null, progress: 0, status: 'empty' };
  state.board = { item: null, progress: 0, status: 'empty' };
  state.plate = [];
  state.carry = null;
  state.score = 0;
  state.coins = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.rush = false;
  state.rushAnnounced = false;
  state.floats = [];
  state.banner = null;
  spawnOrder(state);
  spawnOrder(state);
}

function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  // Early orders stay simple; Double Trouble only joins after 45 seconds.
  const pool = state.elapsed < 45
    ? RECIPES.filter((r) => r.id !== 'double-trouble')
    : RECIPES;
  const recipe = rngPick(state.rng, pool);
  // Prefer a dish no ticket already asks for, so the board stays varied.
  const onBoard = new Set(state.orders.map((o) => o.recipeId));
  const fresh = pool.filter((r) => !onBoard.has(r.id));
  const picked = fresh.length > 0 ? rngPick(state.rng, fresh) : recipe;
  state.orders.push({
    id: ++orderSeq,
    recipeId: picked.id,
    patience: picked.patience,
    maxPatience: picked.patience,
  });
}

export function spawnInterval(state) {
  if (state.timeLeft <= 30) return 7;
  return Math.max(9, 18 - state.elapsed * 0.07);
}

function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1.4 });
}

export function tick(state, dt) {
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  state.timeLeft -= dt;

  if (state.timeLeft <= 30 && !state.rush) {
    state.rush = true;
  }
  if (state.rush && !state.rushAnnounced) {
    state.rushAnnounced = true;
    state.banner = { text: '🔥 RUSH HOUR — orders are coming fast!', life: 2.5 };
    sfx.sfxBell();
  }
  if (state.banner) {
    state.banner.life -= dt;
    if (state.banner.life <= 0) state.banner = null;
  }

  // Orders lose patience; a walked-out customer breaks the combo.
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      state.orders.splice(i, 1);
      state.lost += 1;
      state.combo = 0;
      addFloat(state, 640, 150, 'Customer walked out!', '#ff7a6b');
      sfx.sfxLost();
    }
  }

  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = spawnInterval(state);
  }

  // Grill: raw patty cooks, then burns if forgotten.
  const g = state.grill;
  if (g.status === 'cooking') {
    g.progress += dt;
    if (g.progress >= GRILL_BURN_TIME) {
      g.status = 'burnt';
      addFloat(state, 200, 320, 'Burnt!', '#ff7a6b');
    } else if (g.progress >= GRILL_COOK_TIME && g.status !== 'done') {
      g.status = 'done';
      sfx.sfxSizzle();
    }
  }

  // Chopping board finishes on its own once started.
  const b = state.board;
  if (b.status === 'chopping') {
    b.progress += dt;
    if (b.progress >= CHOP_TIME) {
      b.status = 'done';
      sfx.sfxChop();
    }
  }

  // Chef walks toward the clicked point.
  const c = state.chef;
  const dx = c.tx - c.x;
  const dy = c.ty - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 4) {
    const speed = 300 * dt;
    const step = Math.min(speed, dist);
    c.x += (dx / dist) * step;
    c.y += (dy / dist) * step;
    c.dir = dx >= 0 ? 1 : -1;
    c.moving = true;
    c.bob += dt * 12;
  } else {
    c.moving = false;
  }
  c.x = Math.max(FLOOR.left, Math.min(FLOOR.right, c.x));
  c.y = Math.max(FLOOR.top, Math.min(FLOOR.bottom, c.y));

  for (let i = state.floats.length - 1; i >= 0; i--) {
    const f = state.floats[i];
    f.life -= dt;
    f.y -= 28 * dt;
    if (f.life <= 0) state.floats.splice(i, 1);
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'over';
    sfx.sfxBell();
  }
}

// The station whose front point is nearest the chef, within reach.
export function nearestStation(state) {
  let best = null;
  let bestD = 130;
  for (const s of Object.values(STATIONS)) {
    const px = s.x + s.w / 2;
    const py = s.y + s.h + 14;
    const d = Math.hypot(state.chef.x - px, state.chef.y - py);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function stationAtPoint(x, y) {
  for (const s of Object.values(STATIONS)) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
  }
  return null;
}

export function chefWalkToStation(state, station) {
  state.chef.tx = Math.max(FLOOR.left, Math.min(FLOOR.right, station.x + station.w / 2));
  state.chef.ty = Math.min(FLOOR.bottom, station.y + station.h + 26);
  state.pendingStation = station.id;
}

export function interact(state, stationId) {
  const s = STATIONS[stationId];
  if (!s || state.screen !== 'play') return;
  const chef = state.chef;

  if (s.kind === 'bin') {
    if (state.carry) {
      addFloat(state, chef.x, chef.y - 60, 'Hands full!', '#ffd27d');
      return;
    }
    state.carry = { kind: 'item', id: s.item };
    sfx.sfxPickup();
    return;
  }

  if (s.kind === 'grill') {
    const g = state.grill;
    if (g.status === 'empty' && state.carry && state.carry.kind === 'item' && state.carry.id === 'patty') {
      g.item = 'patty';
      g.progress = 0;
      g.status = 'cooking';
      state.carry = null;
      sfx.sfxSizzle();
      return;
    }
    if ((g.status === 'done' || g.status === 'burnt') && !state.carry) {
      state.carry = { kind: 'item', id: g.status === 'done' ? 'pattyCooked' : 'pattyBurnt' };
      g.item = null;
      g.progress = 0;
      g.status = 'empty';
      sfx.sfxPickup();
      return;
    }
    if (g.status === 'cooking') {
      addFloat(state, chef.x, chef.y - 60, 'Still grilling…', '#ffd27d');
    }
    return;
  }

  if (s.kind === 'board') {
    const b = state.board;
    const def = state.carry && state.carry.kind === 'item' ? INGREDIENTS[state.carry.id] : null;
    if (b.status === 'empty' && def && def.prep === 'chop') {
      b.item = state.carry.id;
      b.progress = 0;
      b.status = 'chopping';
      state.carry = null;
      sfx.sfxChop();
      return;
    }
    if (b.status === 'done' && !state.carry) {
      state.carry = { kind: 'item', id: INGREDIENTS[b.item].cookedId };
      b.item = null;
      b.progress = 0;
      b.status = 'empty';
      sfx.sfxPickup();
      return;
    }
    if (b.status === 'chopping') {
      addFloat(state, chef.x, chef.y - 60, 'Chopping…', '#ffd27d');
    }
    return;
  }

  if (s.kind === 'assembly') {
    if (state.carry && state.carry.kind === 'item') {
      if (state.carry.id === 'pattyBurnt') {
        addFloat(state, chef.x, chef.y - 60, 'Burnt! Trash it.', '#ff7a6b');
        return;
      }
      state.plate.push(state.carry.id);
      state.carry = null;
      sfx.sfxPlated();
      return;
    }
    if (!state.carry && state.plate.length > 0) {
      state.carry = { kind: 'plate', items: state.plate.slice() };
      state.plate = [];
      sfx.sfxPickup();
      return;
    }
    return;
  }

  if (s.kind === 'trash') {
    if (state.carry) {
      state.carry = null;
      sfx.sfxWrong();
      addFloat(state, chef.x, chef.y - 60, 'Tossed.', '#cbb9a0');
    }
    return;
  }

  if (s.kind === 'serve') {
    if (!state.carry || state.carry.kind !== 'plate') {
      addFloat(state, chef.x, chef.y - 60, 'Bring a finished plate!', '#ffd27d');
      return;
    }
    const plate = state.carry.items;
    const match = state.orders.find((o) => plateMatchesRecipe(plate, recipeById(o.recipeId)));
    if (!match) {
      state.combo = 0;
      sfx.sfxWrong();
      addFloat(state, chef.x, chef.y - 60, "No order wants this!", '#ff7a6b');
      return;
    }
    const recipe = recipeById(match.recipeId);
    const patienceBonus = Math.round((match.patience / match.maxPatience) * 8);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const mult = Math.min(3, state.combo);
    const earned = (recipe.price + patienceBonus) * mult;
    state.coins += earned;
    state.score += earned;
    state.served += 1;
    state.orders = state.orders.filter((o) => o.id !== match.id);
    state.carry = null;
    addFloat(state, 1018, 470, `+${earned} coins${mult > 1 ? '  x' + mult + ' combo!' : ''}`, '#8dff9e');
    sfx.sfxServe();
  }
}

export function plateStatus(state) {
  if (state.plate.length === 0) return 'empty';
  for (const r of RECIPES) {
    if (plateMatchesRecipe(state.plate, r)) return 'complete:' + r.id;
  }
  return 'building';
}
