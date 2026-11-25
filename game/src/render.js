// All canvas drawing for Sizzle Station: the kitchen, the order board,
// the stations, the chef, and the title / game-over overlays.

import { STATIONS, FLOOR, GRILL_COOK_TIME, GRILL_BURN_TIME, CHOP_TIME, plateStatus } from './kitchen.js';
import { INGREDIENTS, RECIPES, ingredientIcon, recipeById } from './recipes.js';

const W = 1280;
const H = 800;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawWallAndFloor(ctx, state) {
  // Warm tiled wall up top, wooden floor where the chef walks.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(0, 0, W, 590);
  ctx.fillStyle = '#7d5a3a';
  for (let y = 0; y < 590; y += 46) {
    for (let x = (y / 46) % 2 ? 0 : 46; x < W; x += 92) {
      ctx.fillRect(x, y, 88, 42);
    }
  }
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 586, W, 4);
  ctx.fillStyle = '#a9805a';
  ctx.fillRect(0, 590, W, 210);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = 590; y < H; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  if (state.rush && state.screen === 'play') {
    ctx.fillStyle = 'rgba(255,60,30,0.07)';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#2c1e12';
  ctx.fillRect(0, 0, W, 60);
  text(ctx, '🍳 SIZZLE STATION', 24, 31, 30, '#ffd27d', 'left');
  // Shift timer, big in the middle; it turns red and pulses in the rush.
  const t = Math.max(0, Math.ceil(state.timeLeft));
  const mm = String(Math.floor(t / 60)).padStart(1, '0');
  const ss = String(t % 60).padStart(2, '0');
  const timerColor = state.timeLeft <= 30 ? '#ff6b5e' : '#ffffff';
  const pulse = state.timeLeft <= 30 ? 1 + Math.sin(state.elapsed * 5) * 0.06 : 1;
  ctx.save();
  ctx.translate(640, 31);
  ctx.scale(pulse, pulse);
  text(ctx, `⏱ ${mm}:${ss}`, 0, 0, 34, timerColor);
  ctx.restore();
  text(ctx, `⭐ ${state.score}`, 1010, 31, 24, '#ffe9a8', 'right');
  text(ctx, `🪙 ${state.coins}`, 1180, 31, 24, '#ffd94a', 'right');
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#3d2b1a';
  rr(ctx, 24, 68, W - 48, 108, 12);
  ctx.fill();
  ctx.fillStyle = '#5a4026';
  rr(ctx, 24, 68, W - 48, 108, 12);
  ctx.fill();
  text(ctx, '📋 ORDERS', 44, 122, 20, '#ffd27d', 'left');
  const startX = 170;
  state.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = startX + i * 252;
    const y = 78;
    const urgent = order.patience < order.maxPatience * 0.3;
    ctx.fillStyle = urgent ? '#7a2e22' : '#fff6e0';
    rr(ctx, x, y, 236, 88, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : '#c9a86a';
    ctx.lineWidth = urgent ? 4 : 2;
    ctx.stroke();
    ctx.font = '34px serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(recipe.icon, x + 10, y + 30);
    text(ctx, recipe.name, x + 56, y + 24, 19, '#3a2412', 'left');
    recipe.needs.forEach((need, j) => {
      ctx.font = '22px serif';
      ctx.fillText(ingredientIcon(need), x + 56 + j * 30, y + 58);
    });
    // Patience bar: green while calm, red when the customer is about to leave.
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#d8c9ae';
    rr(ctx, x + 12, y + 74, 212, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5ec24a' : frac > 0.25 ? '#f5a623' : '#e14b32';
    rr(ctx, x + 12, y + 74, 212 * frac, 8, 4);
    ctx.fill();
    if (urgent) text(ctx, '!', x + 222, y + 22, 26, '#ff6b5e');
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders — take a breath, chef!', 640, 122, 20, '#e8d9b8');
  }
}

function drawBin(ctx, station) {
  const def = INGREDIENTS[station.item];
  ctx.fillStyle = '#8a6a45';
  rr(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#a5835c';
  rr(ctx, station.x + 6, station.y + 6, station.w - 12, station.h - 12, 6);
  ctx.fill();
  ctx.font = '44px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.icon, station.x + station.w / 2, station.y + 38);
  text(ctx, station.label, station.x + station.w / 2, station.y + 78, 17, '#fff3d6');
}

function drawGrill(ctx, state) {
  const s = STATIONS.grill;
  ctx.fillStyle = '#3c3c42';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#55555e';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8);
  ctx.fill();
  // Grill bars.
  ctx.strokeStyle = '#2a2a2e';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const y = s.y + 24 + i * 18;
    ctx.beginPath();
    ctx.moveTo(s.x + 16, y);
    ctx.lineTo(s.x + s.w - 16, y);
    ctx.stroke();
  }
  text(ctx, '🔥 GRILL', s.x + s.w / 2, s.y + s.h - 12, 15, '#ffd27d');
  const g = state.grill;
  if (g.status === 'cooking' || g.status === 'done' || g.status === 'burnt') {
    const cx = s.x + s.w / 2;
    const cy = s.y + 52;
    ctx.font = '46px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.status === 'burnt' ? '⬛' : '🥩', cx, cy);
    if (g.status === 'cooking') {
      const frac = Math.min(1, g.progress / GRILL_COOK_TIME);
      ctx.fillStyle = '#d8c9ae';
      rr(ctx, cx - 60, cy + 32, 120, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#f5a623';
      rr(ctx, cx - 60, cy + 32, 120 * frac, 8, 4);
      ctx.fill();
    } else if (g.status === 'done') {
      text(ctx, 'READY!', cx, cy + 36, 16, '#8dff9e');
    } else {
      text(ctx, 'BURNT!', cx, cy + 36, 16, '#ff7a6b');
      // Smoke puffs over a burnt patty.
      ctx.fillStyle = 'rgba(120,120,120,0.7)';
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 26, 9, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 34, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBoard(ctx, state) {
  const s = STATIONS.board;
  ctx.fillStyle = '#c9a86a';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#e8cf9e';
  rr(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 34, 8);
  ctx.fill();
  text(ctx, '🔪 CHOPPING BOARD', s.x + s.w / 2, s.y + s.h - 12, 15, '#5a4026');
  const b = state.board;
  if (b.item) {
    const cx = s.x + s.w / 2;
    const cy = s.y + 52;
    ctx.font = '44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredientIcon(b.item), cx, cy);
    if (b.status === 'chopping') {
      const frac = Math.min(1, b.progress / CHOP_TIME);
      ctx.fillStyle = '#d8c9ae';
      rr(ctx, cx - 60, cy + 32, 120, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#7dc24a';
      rr(ctx, cx - 60, cy + 32, 120 * frac, 8, 4);
      ctx.fill();
    } else if (b.status === 'done') {
      text(ctx, 'CHOPPED!', cx, cy + 36, 16, '#3a7a2e');
    }
  }
}

function drawAssembly(ctx, state) {
  const s = STATIONS.assembly;
  ctx.fillStyle = '#8a6a45';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.beginPath();
  ctx.ellipse(s.x + s.w / 2, s.y + 58, 104, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  ctx.stroke();
  // The dish mid-assembly: every ingredient already on the plate shows.
  const cx = s.x + s.w / 2;
  state.plate.forEach((item, i) => {
    ctx.font = '34px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredientIcon(item), cx - (state.plate.length - 1) * 22 + i * 44, s.y + 56 - i * 4);
  });
  const status = plateStatus(state);
  if (status === 'empty') {
    text(ctx, 'ASSEMBLY — build a dish here', cx, s.y + s.h - 12, 15, '#fff3d6');
  } else if (status.startsWith('complete:')) {
    const recipe = recipeById(status.split(':')[1]);
    text(ctx, `✅ ${recipe.name} ready — pick it up!`, cx, s.y + s.h - 12, 16, '#8dff9e');
  } else {
    text(ctx, 'Building… add what the ticket asks', cx, s.y + s.h - 12, 15, '#ffd27d');
  }
}

function drawTrash(ctx) {
  const s = STATIONS.trash;
  ctx.fillStyle = '#4a4a52';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.font = '44px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🗑️', s.x + s.w / 2, s.y + 46);
  text(ctx, 'TRASH', s.x + s.w / 2, s.y + s.h - 12, 15, '#d8d8d8');
}

function drawServeWindow(ctx, state) {
  const s = STATIONS.serve;
  const ready = state.carry && state.carry.kind === 'plate' &&
    state.orders.some((o) => {
      const r = recipeById(o.recipeId);
      return state.carry.items.length === r.needs.length &&
        state.carry.items.every((it) => r.needs.includes(it));
    });
  ctx.fillStyle = ready ? '#2e6b34' : '#5a4026';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#2c1e12';
  rr(ctx, s.x + 10, s.y + 10, s.w - 20, 44, 6);
  ctx.fill();
  text(ctx, ready ? '🔔 SERVE IT!  (Q)' : '🍽️ SERVE WINDOW', s.x + s.w / 2, s.y + 32, 20, ready ? '#8dff9e' : '#ffd27d');
  ctx.font = '34px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛎️', s.x + 34, s.y + 70);
  text(ctx, 'Hand the finished plate to the window', s.x + 66, s.y + 70, 15, '#fff3d6', 'left');
}

function drawChef(ctx, state) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(c.bob) * 3 : 0;
  const x = c.x;
  const y = c.y + bob * 0.4;

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, c.y + 34, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2e8b8b';
  rr(ctx, x - 24, y - 6, 48, 42, 12);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  rr(ctx, x - 18, y + 2, 36, 34, 8);
  ctx.fill();

  // Head + chef hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x, y - 22, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 11, y - 34, 10, 0, Math.PI * 2);
  ctx.arc(x, y - 40, 12, 0, Math.PI * 2);
  ctx.arc(x + 11, y - 34, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 16, y - 36, 32, 8);
  // Eyes look the way the chef walks.
  ctx.fillStyle = '#2c1e12';
  ctx.beginPath();
  ctx.arc(x - 6 + c.dir * 3, y - 22, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 6 + c.dir * 3, y - 22, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Whatever the chef carries rides above the hat.
  if (state.carry) {
    const cy = y - 62;
    if (state.carry.kind === 'plate') {
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(x, cy + 8, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = 2;
      ctx.stroke();
      state.carry.items.forEach((item, i) => {
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ingredientIcon(item), x - (state.carry.items.length - 1) * 13 + i * 26, cy + 2);
      });
    } else {
      ctx.font = '38px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ingredientIcon(state.carry.id), x, cy);
    }
  }

  // Dotted route line while walking to a clicked station.
  if (state.pendingStation && c.moving) {
    ctx.strokeStyle = 'rgba(255,210,125,0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(c.tx, c.ty);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    text(ctx, f.text, f.x, f.y, 22, f.color);
  }
  ctx.globalAlpha = 1;
}

function drawBottomBar(ctx, state) {
  ctx.fillStyle = '#2c1e12';
  ctx.fillRect(0, 776, W, 24);
  const served = `Served ${state.served} · Lost ${state.lost} · Best combo x${Math.max(1, state.bestCombo)}`;
  text(ctx, served, 640, 788, 14, '#cbb9a0');
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  ctx.globalAlpha = Math.min(1, state.banner.life);
  ctx.fillStyle = '#7a2e22';
  rr(ctx, 340, 596, 600, 44, 10);
  ctx.fill();
  text(ctx, state.banner.text, 640, 619, 22, '#ffe9a8');
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🍳', 640, 190, 110, '#ffffff');
  text(ctx, 'SIZZLE STATION', 640, 300, 72, '#ffd27d');
  text(ctx, 'One chef. Six ingredients. A dining room that never waits.', 640, 356, 24, '#fff3d6');
  text(ctx, 'Grab ingredients → grill or chop → build the dish on the plate → serve it before the ticket runs out!', 640, 392, 20, '#e8d9b8');
  text(ctx, 'Orders get faster. The rush is real. 150 seconds on the clock.', 640, 422, 20, '#e8d9b8');
  ctx.fillStyle = '#e14b32';
  rr(ctx, 490, 470, 300, 64, 12);
  ctx.fill();
  text(ctx, '▶  START SHIFT', 640, 503, 28, '#ffffff');
  text(ctx, 'Click, or press Enter — WASD / arrows to move, E to use a station, Q to serve', 640, 566, 17, '#cbb9a0');
  text(ctx, 'Recipes: Sunny Stack · Melt Deluxe · Garden Crunch · Double Trouble', 640, 596, 17, '#cbb9a0');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, "⏰  SHIFT OVER!", 640, 260, 56, '#ffd27d');
  text(ctx, `You served ${state.served} dishes and earned ${state.coins} coins.`, 640, 330, 26, '#fff3d6');
  text(ctx, `Score ${state.score} · Best combo x${Math.max(1, state.bestCombo)} · ${state.lost} customers walked out`, 640, 372, 20, '#e8d9b8');
  const verdict = state.served >= 10
    ? '🏆 Head-chef material — the dining room loves you!'
    : state.served >= 5
      ? '👍 A solid shift. The rush hour is yours next time.'
      : '🌱 Every great chef burns a patty or two. Go again!';
  text(ctx, verdict, 640, 420, 22, '#8dff9e');
  ctx.fillStyle = '#e14b32';
  rr(ctx, 490, 470, 300, 64, 12);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', 640, 503, 26, '#ffffff');
}

export function render(ctx, state) {
  drawWallAndFloor(ctx, state);
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawBin(ctx, STATIONS.binBun);
  drawBin(ctx, STATIONS.binPatty);
  drawBin(ctx, STATIONS.binLettuce);
  drawBin(ctx, STATIONS.binTomato);
  drawBin(ctx, STATIONS.binCheese);
  drawBin(ctx, STATIONS.binOnion);
  drawGrill(ctx, state);
  drawBoard(ctx, state);
  drawAssembly(ctx, state);
  drawTrash(ctx);
  drawServeWindow(ctx, state);
  drawChef(ctx, state);
  drawFloats(ctx, state);
  drawBottomBar(ctx, state);
  drawBanner(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawGameOver(ctx, state);
}
