// Duel Kartu Pasar — canvas drawing. Everything is drawn with plain
// canvas shapes: the felt table, the market-stall portraits, the cards with
// their suit icons, life bars, coins, log and the title / win / loss
// screens. No images, no fonts from the network, no text-only suits.

import {
  VIEW,
  SUITS,
  TYPE_LABEL,
  MAX_LIFE,
  CARD_W,
  CARD_H,
  PLAYED_W,
  PLAYED_H,
  BACK_W,
  BACK_H,
  TOP_BAR_H,
  AI_PORTRAIT,
  AI_LIFE,
  PLAYER_PORTRAIT,
  PLAYER_LIFE,
  TABLE,
  LOG_PANEL,
  AI_PLAYED_Y,
  PLAYER_PLAYED_Y,
  END_BUTTON,
  TURN_PILL,
  playerHandRect,
  aiHandRect,
  playedRect,
  pointInRect,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const GOLD = '#ffd34d';
const CREAM = '#fff8e7';
const INK = '#2b2118';
const FELT = '#1e6b3a';
const FELT_DARK = '#14522c';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

/** One suit's icon, drawn from shapes: rice stalk, chilli, coffee bean,
 * sugar cube. Colour + shape together tell the suits apart. */
export function drawSuitIcon(ctx, suit, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size / 10);
  ctx.lineCap = 'round';
  if (suit === 'beras') {
    // A stalk with four grains.
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.lineTo(0, -size * 0.45);
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      const gy = -size * 0.32 + i * size * 0.22;
      const side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(side * size * 0.16, gy, size * 0.16, size * 0.09, side * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (suit === 'cabe') {
    // A curved chilli with a green stem.
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.42);
    ctx.quadraticCurveTo(size * 0.42, -size * 0.1, size * 0.05, size * 0.38);
    ctx.quadraticCurveTo(-size * 0.28, size * 0.42, -size * 0.38, size * 0.05);
    ctx.quadraticCurveTo(-size * 0.42, -size * 0.3, -size * 0.1, -size * 0.42);
    ctx.fill();
    ctx.strokeStyle = '#3f7d2c';
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.42);
    ctx.quadraticCurveTo(-size * 0.05, -size * 0.58, size * 0.14, -size * 0.55);
    ctx.stroke();
  } else if (suit === 'kopi') {
    // A coffee bean with its centre crease.
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.34, size * 0.46, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = Math.max(1.5, size / 14);
    ctx.beginPath();
    ctx.moveTo(-size * 0.16, -size * 0.34);
    ctx.quadraticCurveTo(size * 0.22, 0, -size * 0.16, size * 0.34);
    ctx.stroke();
  } else {
    // A sugar cube: two-tone square.
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.28);
    ctx.restore();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const playable = opts.playable === true;
  const hovered = opts.hovered === true;
  ctx.save();
  if (opts.scale !== undefined && opts.scale !== 1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(opts.scale, opts.scale);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  if (playable) {
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = hovered ? 22 : 10;
  }
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = hovered ? GOLD : suit.dark;
  ctx.stroke();
  // Suit colour band on top.
  ctx.save();
  roundRect(ctx, x, y, w, h * 0.24, 10);
  ctx.clip();
  ctx.fillStyle = suit.color;
  ctx.fillRect(x, y, w, h * 0.24);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y + h * 0.24 - 3, w, 3);
  // Cost coin, top left.
  ctx.beginPath();
  ctx.arc(x + 18, y + 18, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#f5b301';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8a6d10';
  ctx.stroke();
  text(ctx, String(card.cost), x + 18, y + 23, 'bold 17px sans-serif', '#5c4a08', 'center');
  // Suit icon + name in the band (name only when the card is wide enough
  // to hold it clear of the cost coin).
  drawSuitIcon(ctx, card.suit, x + w - 26, y + h * 0.12, 22, '#ffffff');
  if (w >= 100) {
    text(ctx, suit.name.toUpperCase(), x + 36, y + h * 0.12 + 5, 'bold 11px sans-serif', '#ffffff');
  }
  // Big power number in the middle.
  const powerText = card.type === 'kupon' ? `+${card.power}` : String(card.power);
  text(ctx, powerText, x + w / 2, y + h * 0.56, 'bold 44px sans-serif', suit.dark, 'center');
  text(ctx, TYPE_LABEL[card.type], x + w / 2, y + h * 0.56 + 26, 'bold 13px sans-serif', INK, 'center');
  // Suit icon, large, behind the lower half.
  ctx.globalAlpha = 0.22;
  drawSuitIcon(ctx, card.suit, x + w / 2, y + h * 0.70, 30, suit.color);
  ctx.globalAlpha = 1;
  text(ctx, card.name, x + w / 2, y + h - 12, 'bold 12px sans-serif', INK, 'center');
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#7a2d20';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.save();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 5);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,211,77,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = -h; i < w + h; i += 14) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();
  drawSuitIcon(ctx, 'gula', x + w / 2, y + h / 2, 30, GOLD);
}

function drawLifeBar(ctx, rect, life, label) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = '#10151d';
  ctx.fill();
  const frac = Math.max(0, life / MAX_LIFE);
  if (frac > 0) {
    ctx.save();
    roundRect(ctx, rect.x + 2, rect.y + 2, (rect.w - 4) * frac, rect.h - 4, 6);
    ctx.clip();
    ctx.fillStyle = frac > 0.5 ? '#e5484d' : frac > 0.25 ? '#e8862b' : '#e5484d';
    ctx.fillStyle = life > 10 ? '#d93a2b' : '#ff5a5a';
    ctx.fillRect(rect.x + 2, rect.y + 2, (rect.w - 4) * frac, rect.h - 4);
    ctx.restore();
  }
  text(ctx, `${label}  ${life}/${MAX_LIFE}`, rect.x + rect.w / 2, rect.y + rect.h - 8, 'bold 15px sans-serif', '#ffffff', 'center');
}

function drawCoins(ctx, x, y, coins) {
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x + i * 26, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = i < coins ? '#f5b301' : '#3a332a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i < coins ? '#8a6d10' : '#221d18';
    ctx.stroke();
    if (i < coins) text(ctx, '¢', x + i * 26, y + 4, 'bold 12px sans-serif', '#5c4a08', 'center');
  }
  text(ctx, `${coins} koin`, x + 84, y + 5, 'bold 14px sans-serif', '#e8e0d0');
}

function drawPortrait(ctx, px, name, life, isAi, flash) {
  const shake = flash && flash.at !== undefined && flash.t < 0.18 ? (flash.t * 60) % 2 < 1 ? -3 : 3 : 0;
  const cx = px.x + shake;
  const cy = px.y;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, px.r, 0, Math.PI * 2);
  ctx.fillStyle = isAi ? '#f2c89b' : '#e8b98a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isAi ? '#7a2d20' : '#2f7d4f';
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx - 13, cy - 6, 3.5, 0, Math.PI * 2);
  ctx.arc(cx + 13, cy - 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (isAi) {
    // Juragan's hat and moustache.
    ctx.fillStyle = '#7a2d20';
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy - 18);
    ctx.lineTo(cx + 34, cy - 18);
    ctx.lineTo(cx + 24, cy - 34);
    ctx.lineTo(cx - 24, cy - 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a2208';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 20, cx + 16, cy + 12);
    ctx.stroke();
  } else {
    // Your headband.
    ctx.fillStyle = '#2f7d4f';
    ctx.fillRect(cx - 34, cy - 26, 68, 10);
    ctx.beginPath();
    ctx.arc(cx, cy + 14, 8, 0, Math.PI);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, name, cx, cy + px.r + 18, 'bold 13px sans-serif', '#e8e0d0', 'center');
}

function drawTable(ctx, state, hover) {
  // Felt table.
  const grad = ctx.createLinearGradient(0, TABLE.y, 0, TABLE.y + TABLE.h);
  grad.addColorStop(0, FELT);
  grad.addColorStop(1, FELT_DARK);
  roundRect(ctx, TABLE.x, TABLE.y, TABLE.w, TABLE.h, 14);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a6d10';
  ctx.stroke();
  ctx.save();
  roundRect(ctx, TABLE.x + 10, TABLE.y + 10, TABLE.w - 20, TABLE.h - 20, 10);
  ctx.strokeStyle = 'rgba(255,211,77,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  // Turn pill, top-right corner of the felt.
  const yourTurn = state.turn === 'player' && state.phase === 'playing';
  roundRect(ctx, TURN_PILL.x, TURN_PILL.y, TURN_PILL.w, TURN_PILL.h, 13);
  ctx.fillStyle = yourTurn ? '#2f7d4f' : '#7a2d20';
  ctx.fill();
  text(ctx, yourTurn ? 'GILIRANMU' : 'GILIRAN JURAGAN', TURN_PILL.x + TURN_PILL.w / 2, TURN_PILL.y + 18, 'bold 13px sans-serif', '#ffffff', 'center');
  state.played.ai.forEach((card, i) => {
    const r = playedRect('ai', i);
    const scale = Math.min(1, (state.time - card.playedAt) / 0.25 + 0.2);
    drawCardFace(ctx, card, r.x, r.y, r.w, r.h, { scale: Math.max(0.2, scale) });
  });
  state.played.player.forEach((card, i) => {
    const r = playedRect('player', i);
    const scale = Math.min(1, (state.time - card.playedAt) / 0.25 + 0.2);
    drawCardFace(ctx, card, r.x, r.y, r.w, r.h, { scale: Math.max(0.2, scale) });
  });
  if (state.played.ai.length === 0) {
    text(ctx, 'Kartu Juragan muncul di sini', TABLE.x + 24, AI_PLAYED_Y + 70, 'italic 14px sans-serif', 'rgba(255,255,255,0.45)');
  }
  if (state.played.player.length === 0) {
    text(ctx, 'Kartumu yang sudah dimainkan muncul di sini', TABLE.x + 24, PLAYER_PLAYED_Y + 70, 'italic 14px sans-serif', 'rgba(255,255,255,0.45)');
  }
  // Banner (round start).
  if (state.bannerTimer > 0) {
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    text(ctx, state.banner, VIEW.width / 2, 330, 'bold 46px sans-serif', GOLD, 'center');
    ctx.globalAlpha = 1;
  }
  // Log panel.
  roundRect(ctx, LOG_PANEL.x, LOG_PANEL.y, LOG_PANEL.w, LOG_PANEL.h, 12);
  ctx.fillStyle = 'rgba(10,14,20,0.85)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#3a332a';
  ctx.stroke();
  text(ctx, 'CATATAN', LOG_PANEL.x + 14, LOG_PANEL.y + 24, 'bold 13px sans-serif', GOLD);
  ctx.font = '13px sans-serif';
  let logY = LOG_PANEL.y + 50;
  for (const entry of state.log.slice(-4)) {
    const lines = wrapLine(ctx, entry, LOG_PANEL.w - 28).slice(0, 2);
    for (const line of lines) {
      text(ctx, line, LOG_PANEL.x + 14, logY, '13px sans-serif', '#d8d0c0');
      logY += 17;
    }
    logY += 10;
  }
  void hover;
}

function wrapLine(ctx, line, maxWidth) {
  const words = line.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    const rise = f.t * 55;
    const alpha = Math.max(0, 1 - f.t / f.life);
    let x = VIEW.width / 2;
    let y = 300;
    if (f.target === 'you') {
      x = PLAYER_PORTRAIT.x;
      y = PLAYER_PORTRAIT.y - 56;
    } else if (f.target === 'foe') {
      x = AI_PORTRAIT.x;
      y = AI_PORTRAIT.y - 56;
    }
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 30px sans-serif';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(f.text, x, y - rise);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, x, y - rise);
    ctx.globalAlpha = 1;
  }
}

function drawPlay(ctx, state, best, hover) {
  // Wood background.
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  bg.addColorStop(0, '#3a2415');
  bg.addColorStop(1, '#241608');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Top bar.
  ctx.fillStyle = 'rgba(10,12,16,0.9)';
  ctx.fillRect(0, 0, VIEW.width, TOP_BAR_H);
  text(ctx, 'DUEL KARTU PASAR', 20, 33, 'bold 20px sans-serif', GOLD);
  text(ctx, `RONDE ${state.round}`, VIEW.width / 2, 33, 'bold 18px sans-serif', '#e8e0d0', 'center');
  text(ctx, `SKOR ${state.score}   TERBAIK ${best}`, VIEW.width - 20, 33, 'bold 16px sans-serif', '#e8e0d0', 'right');
  // Opponent.
  const flash = state.hitFlash
    ? { ...state.hitFlash, t: state.time - state.hitFlash.at }
    : null;
  drawPortrait(ctx, AI_PORTRAIT, 'JURAGAN PASAR', state.ai.life, true, flash && flash.side === 'ai' ? flash : null);
  drawLifeBar(ctx, AI_LIFE, state.ai.life, 'NYAWA');
  drawCoins(ctx, AI_LIFE.x, AI_LIFE.y + 44, state.ai.coins);
  state.ai.hand.forEach((_, i) => {
    const r = aiHandRect(i, state.ai.hand.length);
    drawCardBack(ctx, r.x, r.y, r.w, r.h);
  });
  text(ctx, `${state.ai.hand.length} kartu`, VIEW.width / 2, 182, '13px sans-serif', '#d8d0c0', 'center');
  // Table + log.
  drawTable(ctx, state, hover);
  // Player.
  drawPortrait(ctx, PLAYER_PORTRAIT, 'KAMU', state.player.life, false, flash && flash.side === 'player' ? flash : null);
  drawLifeBar(ctx, PLAYER_LIFE, state.player.life, 'NYAWA');
  drawCoins(ctx, PLAYER_LIFE.x, PLAYER_LIFE.y + 44, state.player.coins);
  // Hand.
  const hand = state.player.hand;
  const yourTurn = state.turn === 'player' && state.phase === 'playing';
  let hoveredIndex = -1;
  if (hover) {
    for (let i = hand.length - 1; i >= 0; i -= 1) {
      if (pointInRect(hover.x, hover.y, playerHandRect(i, hand.length))) {
        hoveredIndex = i;
        break;
      }
    }
  }
  hand.forEach((card, i) => {
    const r = playerHandRect(i, hand.length, i === hoveredIndex);
    const tilt = (i - (hand.length - 1) / 2) * 0.035;
    ctx.save();
    ctx.translate(r.x + CARD_W / 2, r.y + CARD_H);
    ctx.rotate(tilt);
    ctx.translate(-(r.x + CARD_W / 2), -(r.y + CARD_H));
    drawCardFace(ctx, card, r.x, r.y, CARD_W, CARD_H, {
      playable: yourTurn && card.cost <= state.player.coins,
      hovered: i === hoveredIndex,
    });
    ctx.restore();
  });
  text(ctx, 'Klik kartu untuk main — tombol 1–7 juga bisa', VIEW.width / 2, VIEW.height - 8, '13px sans-serif', 'rgba(232,224,208,0.6)', 'center');
  // End turn button.
  roundRect(ctx, END_BUTTON.x, END_BUTTON.y, END_BUTTON.w, END_BUTTON.h, 12);
  ctx.fillStyle = yourTurn ? GOLD : '#5a5348';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8a6d10';
  ctx.stroke();
  text(ctx, yourTurn ? 'AKHIRI GILIRAN' : 'JURAGAN MAIN…', END_BUTTON.x + END_BUTTON.w / 2, END_BUTTON.y + 35, 'bold 15px sans-serif', yourTurn ? INK : '#d8d0c0', 'center');
  drawFloaters(ctx, state);
}

function drawTitle(ctx, state, best) {
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  bg.addColorStop(0, '#1e4d2c');
  bg.addColorStop(1, '#0e2a18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Decorative fanned cards behind the title.
  const demoSuits = ['beras', 'cabe', 'kopi', 'gula', 'beras'];
  const demoTypes = ['serang', 'serang', 'jamu', 'serang', 'borong'];
  const demoPowers = [9, 7, 7, 6, 2];
  const demoNames = ['Beras Pandan', 'Cabe Rawit', 'Kopi Jahe', 'Gula Aren', 'Borong Beras'];
  demoSuits.forEach((suit, i) => {
    const card = { suit, type: demoTypes[i], cost: i % 3 + 1, power: demoPowers[i], name: demoNames[i], playedAt: -1 };
    const x = 300 + i * 130;
    const y = 430 + Math.abs(i - 2) * 14;
    ctx.save();
    ctx.translate(x + CARD_W / 2, y + CARD_H / 2);
    ctx.rotate((i - 2) * 0.09);
    ctx.translate(-(x + CARD_W / 2), -(y + CARD_H / 2));
    ctx.globalAlpha = 0.92;
    drawCardFace(ctx, card, x, y, CARD_W, CARD_H);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  text(ctx, 'DUEL KARTU PASAR', VIEW.width / 2, 130, 'bold 68px sans-serif', GOLD, 'center');
  text(ctx, 'Duel dagangan melawan Juragan Pasar — habiskan 30 nyawanya', VIEW.width / 2, 178, 'bold 22px sans-serif', '#e8e0d0', 'center');
  text(ctx, 'sebelum nyawamu sendiri yang habis.', VIEW.width / 2, 208, 'bold 22px sans-serif', '#e8e0d0', 'center');
  // Rules box.
  roundRect(ctx, 330, 250, 620, 132, 12);
  ctx.fillStyle = 'rgba(10,14,20,0.8)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  text(ctx, '•  Klik kartu untuk memainkannya — tiap kartu butuh koin (3 koin tiap giliran).', 352, 288, '16px sans-serif', '#e8e0d0');
  text(ctx, '•  Dua kartu sejenis berurutan = KOMBO +3.', 352, 320, '16px sans-serif', '#e8e0d0');
  text(ctx, '•  Serang, Jamu, Borong, Kupon — susun tanganmu, lalu akhiri giliran.', 352, 352, '16px sans-serif', '#e8e0d0');
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) text(ctx, 'TEKAN SPASI / KLIK UNTUK MULAI', VIEW.width / 2, 640, 'bold 24px sans-serif', '#ffffff', 'center');
  text(ctx, 'Klik kartu  •  Tombol 1–7 mainkan kartu  •  Spasi akhiri giliran  •  P jeda  •  M suara', VIEW.width / 2, 686, '14px sans-serif', 'rgba(232,224,208,0.7)', 'center');
  if (best > 0) text(ctx, `SKOR TERBAIK: ${best}`, VIEW.width / 2, 60, 'bold 18px sans-serif', GOLD, 'center');
}

function drawEnd(ctx, state, best, won) {
  drawPlay(ctx, state, best, null);
  ctx.fillStyle = won ? 'rgba(10,30,14,0.82)' : 'rgba(30,10,10,0.85)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const panel = { x: 340, y: 130, w: 600, h: 440 };
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 16);
  ctx.fillStyle = won ? '#12351d' : '#351212';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = won ? GOLD : '#e5484d';
  ctx.stroke();
  text(ctx, won ? 'MENANG!' : 'KALAH…', VIEW.width / 2, panel.y + 78, 'bold 58px sans-serif', won ? GOLD : '#ff6b5e', 'center');
  text(
    ctx,
    won ? 'Juragan Pasar kalah telak — daganganmu laris manis!' : 'Juragan Pasar menang kali ini — coba lagi, juragan!',
    VIEW.width / 2,
    panel.y + 122,
    '18px sans-serif',
    '#e8e0d0',
    'center',
  );
  const rows = [
    ['Damage diberikan', state.damageDealt],
    ['Kartu dimainkan', state.cardsPlayed],
    ['Ronde dimainkan', state.round],
    ['Bonus menang', won ? 100 + state.player.life * 10 : 0],
  ];
  rows.forEach(([label, value], i) => {
    const y = panel.y + 180 + i * 34;
    text(ctx, label, panel.x + 60, y, '17px sans-serif', '#d8d0c0');
    text(ctx, String(value), panel.x + panel.w - 60, y, 'bold 17px sans-serif', '#ffffff', 'right');
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(panel.x + 60, panel.y + 330);
  ctx.lineTo(panel.x + panel.w - 60, panel.y + 330);
  ctx.stroke();
  text(ctx, 'SKOR TOTAL', panel.x + 60, panel.y + 368, 'bold 18px sans-serif', GOLD);
  text(ctx, String(state.score), panel.x + panel.w - 60, panel.y + 368, 'bold 26px sans-serif', GOLD, 'right');
  text(ctx, `SKOR TERBAIK: ${Math.max(best, state.score)}`, VIEW.width / 2, panel.y + 404, '15px sans-serif', '#d8d0c0', 'center');
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) text(ctx, 'TEKAN R UNTUK MAIN LAGI', VIEW.width / 2, panel.y + 440 - 8, 'bold 20px sans-serif', '#ffffff', 'center');
}

export function draw(ctx, world, screen, best, hover = null) {
  const state = world.state;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
  else if (screen === SCREEN_WIN) drawEnd(ctx, state, best, true);
  else if (screen === SCREEN_OVER) drawEnd(ctx, state, best, false);
  else drawPlay(ctx, state, best, hover);
}
