// Duel Kartu Pasar — the pure card-duel simulation (no DOM, no canvas).
// Turn-based: on your turn you play cards from your hand with your coins,
// then end the turn and Juragan Pasar answers with his own cards. The first
// side to 0 life loses. Step the world with fixed 1/60 s steps and a plain
// input frame; it answers with the events that happened, so the shell can
// play the matching sounds and switch screens.
//
// Input frame: { click: {x, y} | null, key: string | null }
// Events: play, hit, heal, draw, coin, combo, denied, turn, win, lose.

import {
  COINS_PER_TURN,
  HAND_LIMIT,
  MAX_LIFE,
  START_HAND,
  COMBO_BONUS,
  buildDeck,
  playerHandRect,
  pointInRect,
  END_BUTTON,
} from './config.js';

export const PHASE_PLAYING = 'playing';
export const PHASE_WON = 'won';
export const PHASE_LOST = 'lost';

function makeSide(random) {
  const deck = buildDeck(random);
  const hand = [];
  for (let i = 0; i < START_HAND; i += 1) hand.push(deck.pop());
  return { life: MAX_LIFE, coins: COINS_PER_TURN, hand, deck, discard: [], comboSuit: null };
}

export function createWorld(random) {
  const world = {
    state: {
      phase: PHASE_PLAYING,
      turn: 'player',
      round: 1,
      time: 0,
      player: makeSide(random),
      ai: makeSide(random),
      played: { player: [], ai: [] },
      log: ['Giliranmu! Mainkan kartu, lalu akhiri giliran.'],
      score: 0,
      damageDealt: 0,
      cardsPlayed: 0,
      floaters: [],
      banner: '',
      bannerTimer: 0,
      aiTimer: 0,
      hitFlash: null,
      random,
    },
    step(dt, input) {
      return stepWorld(world, dt, input);
    },
  };
  return world;
}

function addFloater(state, target, text, color) {
  state.floaters.push({ target, text, color, t: 0, life: 1.15 });
}

function pushLog(state, line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

function updateScore(state) {
  state.score =
    state.damageDealt +
    state.cardsPlayed * 2 +
    (state.phase === PHASE_WON ? 100 + state.player.life * 10 : 0);
}

function shuffleIntoDeck(side, random) {
  const pile = side.discard.splice(0, side.discard.length);
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  side.deck = pile;
}

function drawCards(side, count, state) {
  for (let i = 0; i < count; i += 1) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      shuffleIntoDeck(side, state.random);
      pushLog(state, 'Deck dikocok ulang dari tumpukan buang.');
    }
    const card = side.deck.pop();
    if (side.hand.length >= HAND_LIMIT) {
      side.discard.push(card);
    } else {
      side.hand.push(card);
    }
  }
}

function checkEnd(state, events) {
  if (state.ai.life <= 0 && state.phase === PHASE_PLAYING) {
    state.phase = PHASE_WON;
    updateScore(state);
    events.push('win');
  } else if (state.player.life <= 0 && state.phase === PHASE_PLAYING) {
    state.phase = PHASE_LOST;
    updateScore(state);
    events.push('lose');
  }
}

/** Play one card from a side's hand. Returns the events it caused. */
export function playCard(world, sideName, handIndex) {
  const state = world.state;
  const events = [];
  if (state.phase !== PHASE_PLAYING) return events;
  const side = state[sideName];
  const foeName = sideName === 'player' ? 'ai' : 'player';
  const foe = state[foeName];
  const card = side.hand[handIndex];
  if (!card) return events;
  if (side.coins < card.cost) {
    events.push('denied');
    return events;
  }
  side.coins -= card.cost;
  side.hand.splice(handIndex, 1);
  card.playedAt = state.time;
  state.played[sideName].push(card);
  state.cardsPlayed += 1;
  // Same suit as the last card this side played this turn: KOMBO +3.
  let bonus = 0;
  if (side.comboSuit === card.suit) {
    bonus = COMBO_BONUS;
    events.push('combo');
    addFloater(state, 'mid', `KOMBO +${bonus}!`, '#ffd34d');
  }
  side.comboSuit = card.suit;
  const who = sideName === 'player' ? 'Kamu' : 'Juragan';
  if (card.type === 'serang') {
    const dmg = card.power + bonus;
    foe.life = Math.max(0, foe.life - dmg);
    if (sideName === 'player') state.damageDealt += dmg;
    addFloater(state, sideName === 'player' ? 'foe' : 'you', `-${dmg}`, '#ff6b5e');
    state.hitFlash = { side: foeName, at: state.time };
    pushLog(state, `${who} mainkan ${card.name} — ${dmg} damage!`);
    events.push('hit');
  } else if (card.type === 'jamu') {
    const heal = Math.min(card.power + bonus, MAX_LIFE - side.life);
    side.life += heal;
    addFloater(state, sideName === 'player' ? 'you' : 'foe', `+${heal}`, '#58d68d');
    pushLog(state, `${who} minum ${card.name} — pulih ${heal} nyawa.`);
    events.push('heal');
  } else if (card.type === 'borong') {
    drawCards(side, card.power, state);
    pushLog(state, `${who} mainkan ${card.name} — ambil ${card.power} kartu.`);
    events.push('draw');
  } else if (card.type === 'kupon') {
    side.coins += card.power;
    pushLog(state, `${who} pakai ${card.name} — +${card.power} koin.`);
    events.push('coin');
  }
  events.push('play');
  updateScore(state);
  checkEnd(state, events);
  return events;
}

function startTurn(world, sideName) {
  const state = world.state;
  const side = state[sideName];
  // Sweep last turn's table cards into the discard pile.
  side.discard.push(...state.played[sideName]);
  state.played[sideName] = [];
  side.comboSuit = null;
  side.coins = COINS_PER_TURN;
  drawCards(side, 1, state);
  state.turn = sideName;
  if (sideName === 'player') {
    state.round += 1;
    state.banner = `RONDE ${state.round}`;
    state.bannerTimer = 1.2;
    pushLog(state, `— Ronde ${state.round}: giliranmu —`);
  } else {
    state.aiTimer = 0.7;
    pushLog(state, '— Giliran Juragan —');
  }
}

/** Juragan's heuristic, in priority order: lethal, heal when hurt, draw
 * when the hand is thin, the hardest affordable hit, a coupon that unlocks
 * a card, a top-up heal. Returns a hand index, or null to end the turn. */
function aiChoose(world) {
  const state = world.state;
  const ai = state.ai;
  const player = state.player;
  const affordable = ai.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.cost <= ai.coins);
  if (affordable.length === 0) return null;
  const comboPower = (card) => card.power + (ai.comboSuit === card.suit ? COMBO_BONUS : 0);
  const lethal = affordable.find(
    ({ card }) => card.type === 'serang' && comboPower(card) >= player.life,
  );
  if (lethal) return lethal.index;
  if (ai.life <= 11) {
    const jamu = affordable
      .filter(({ card }) => card.type === 'jamu')
      .sort((a, b) => b.card.power - a.card.power)[0];
    if (jamu) return jamu.index;
  }
  if (ai.hand.length <= 3) {
    const borong = affordable.find(({ card }) => card.type === 'borong');
    if (borong) return borong.index;
  }
  const serang = affordable
    .filter(({ card }) => card.type === 'serang')
    .sort((a, b) => comboPower(b.card) - comboPower(a.card))[0];
  if (serang) return serang.index;
  const kupon = affordable.find(({ card }) => card.type === 'kupon');
  if (kupon && ai.hand.some((card) => card.cost === ai.coins + 1)) return kupon.index;
  if (ai.life < MAX_LIFE) {
    const jamu = affordable.find(({ card }) => card.type === 'jamu');
    if (jamu) return jamu.index;
  }
  return null;
}

function hitTest(state, x, y) {
  const hand = state.player.hand;
  // Topmost card first: the hand overlaps, so test from the right.
  for (let i = hand.length - 1; i >= 0; i -= 1) {
    if (pointInRect(x, y, playerHandRect(i, hand.length))) return { kind: 'card', index: i };
  }
  if (pointInRect(x, y, END_BUTTON)) return { kind: 'end' };
  return null;
}

function stepWorld(world, dt, input) {
  const state = world.state;
  const events = [];
  state.time += dt;
  state.floaters = state.floaters.filter((f) => {
    f.t += dt;
    return f.t < f.life;
  });
  if (state.bannerTimer > 0) state.bannerTimer -= dt;
  if (state.phase !== PHASE_PLAYING) return events;

  if (state.turn === 'player') {
    if (input.click) {
      const hit = hitTest(state, input.click.x, input.click.y);
      if (hit && hit.kind === 'card') {
        events.push(...playCard(world, 'player', hit.index));
      } else if (hit && hit.kind === 'end') {
        events.push('turn');
        startTurn(world, 'ai');
      }
    }
    if (input.key) {
      const n = Number(input.key);
      if (Number.isInteger(n) && n >= 1 && n <= state.player.hand.length) {
        events.push(...playCard(world, 'player', n - 1));
      } else if (input.key === ' ' || input.key === 'enter') {
        events.push('turn');
        startTurn(world, 'ai');
      }
    }
    return events;
  }

  // Juragan's turn: one card per beat, then the turn comes back to you.
  state.aiTimer -= dt;
  if (state.aiTimer <= 0) {
    const choice = aiChoose(world);
    if (choice === null) {
      events.push('turn');
      startTurn(world, 'player');
    } else {
      events.push(...playCard(world, 'ai', choice));
      state.aiTimer = 0.8;
    }
  }
  return events;
}
