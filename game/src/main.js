// Sizzle Station entry point: builds the game state, runs the loop, and
// serves deterministic screenshot states through ?shot=…&seed=… so every
// screenshot in the entry can be reproduced exactly.
//
//   ?shot=title  — title screen over a busy kitchen
//   ?shot=play   — mid-shift: orders up, a dish mid-assembly, timer running
//   ?shot=serve  — a finished plate carried to the serve window
//   ?shot=rush   — final 30 seconds, four orders, one about to walk out

import { makeRng } from './rng.js';
import { newGame, startShift, tick, interact } from './kitchen.js';
import { render } from './render.js';
import { bindInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '7');
const shot = params.get('shot') || 'title';

const rng = makeRng(seed);
const state = newGame(rng);

function freezeForShot() {
  // Screenshot states never advance: the timer, the patience bars and the
  // grill all hold still, so the same URL always renders the same frame.
  state.frozen = true;
}

function buildTitleShot() {
  state.screen = 'title';
  state.timeLeft = 150;
  freezeForShot();
}

function buildPlayShot() {
  startShift(state);
  state.screen = 'play';
  state.timeLeft = 92;
  state.elapsed = 58;
  state.score = 54;
  state.coins = 54;
  state.served = 3;
  state.combo = 2;
  state.bestCombo = 2;
  state.orders = [
    { id: 1, recipeId: 'sunny-stack', patience: 60, maxPatience: 75 },
    { id: 2, recipeId: 'melt-deluxe', patience: 45, maxPatience: 90 },
    { id: 3, recipeId: 'garden-crunch', patience: 70, maxPatience: 80 },
  ];
  // One dish mid-assembly: bun + grilled patty on the plate, shredded
  // lettuce in the chef's hands, a patty on the grill, tomato chopping.
  state.plate = ['bun', 'pattyCooked'];
  state.carry = { kind: 'item', id: 'lettuceChopped' };
  state.grill = { item: 'patty', progress: 4, status: 'cooking' };
  state.board = { item: 'tomato', progress: 1.5, status: 'chopping' };
  state.chef.x = 760;
  state.chef.y = 690;
  state.chef.tx = 760;
  state.chef.ty = 690;
  state.floats = [{ x: 760, y: 620, text: '+24 coins  x2 combo!', color: '#8dff9e', life: 1.2 }];
  freezeForShot();
}

function buildServeShot() {
  startShift(state);
  state.screen = 'play';
  state.timeLeft = 61;
  state.elapsed = 89;
  state.score = 72;
  state.coins = 72;
  state.served = 4;
  state.combo = 1;
  state.bestCombo = 3;
  state.orders = [
    { id: 1, recipeId: 'sunny-stack', patience: 30, maxPatience: 75 },
    { id: 2, recipeId: 'garden-crunch', patience: 55, maxPatience: 80 },
  ];
  // A finished Sunny Stack on a plate, carried to the serve window, with
  // its ticket waiting — the plate is ready to serve.
  state.plate = [];
  state.carry = { kind: 'plate', items: ['bun', 'pattyCooked', 'lettuceChopped'] };
  state.chef.x = 1010;
  state.chef.y = 640;
  state.chef.tx = 1010;
  state.chef.ty = 640;
  freezeForShot();
}

function buildRushShot() {
  startShift(state);
  state.screen = 'play';
  state.timeLeft = 24;
  state.elapsed = 126;
  state.score = 130;
  state.coins = 130;
  state.served = 7;
  state.lost = 2;
  state.combo = 3;
  state.bestCombo = 4;
  state.rush = true;
  state.banner = { text: '🔥 RUSH HOUR — orders are coming fast!', life: 2.5 };
  state.orders = [
    { id: 1, recipeId: 'melt-deluxe', patience: 62, maxPatience: 90 },
    { id: 2, recipeId: 'double-trouble', patience: 40, maxPatience: 100 },
    { id: 3, recipeId: 'garden-crunch', patience: 8, maxPatience: 80 },
    { id: 4, recipeId: 'sunny-stack', patience: 55, maxPatience: 75 },
  ];
  state.plate = ['bun', 'lettuceChopped'];
  state.carry = { kind: 'item', id: 'pattyCooked' };
  state.grill = { item: 'patty', progress: 14, status: 'burnt' };
  state.board = { item: 'tomato', progress: 2.5, status: 'done' };
  state.chef.x = 1080;
  state.chef.y = 700;
  state.chef.tx = 1080;
  state.chef.ty = 700;
  freezeForShot();
}

const shots = {
  title: buildTitleShot,
  play: buildPlayShot,
  serve: buildServeShot,
  rush: buildRushShot,
};
(shots[shot] || buildTitleShot)();

const input = bindInput(canvas, state, {
  onStart: () => startShift(state),
  onRestart: () => startShift(state),
});

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.frozen) {
    input.pollKeys(dt);
    // Click-to-move: use the station once the chef arrives at its front.
    if (state.pendingStation && !state.chef.moving) {
      const target = state.pendingStation;
      state.pendingStation = null;
      interact(state, target);
    }
    tick(state, dt);
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
