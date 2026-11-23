// Duel Kartu Pasar — tuning, card catalogue, deck builder and table layout.
// The duel: you and Juragan Pasar trade market-goods cards. Both start at
// 30 life; each turn refills 3 coins. A card costs coins and either hits
// the rival, heals you, draws cards or hands you a coin. Playing two cards
// of the same suit in one turn is a KOMBO: the second one gains +3 power.

export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const MAX_LIFE = 30;
export const HAND_LIMIT = 7;
export const COINS_PER_TURN = 3;
export const START_HAND = 5;
export const COMBO_BONUS = 3;

// Suits are market goods, told apart by colour AND shape (never text alone).
export const SUITS = {
  beras: { name: 'Beras', color: '#d9a521', dark: '#8a6d10', ink: '#5c4a08' },
  cabe: { name: 'Cabe', color: '#d93a2b', dark: '#8f1d12', ink: '#6e130b' },
  kopi: { name: 'Kopi', color: '#7a4a21', dark: '#4a2c10', ink: '#3a2208' },
  gula: { name: 'Gula', color: '#2f7fc9', dark: '#174e80', ink: '#0f3a61' },
};
export const SUIT_ORDER = ['beras', 'cabe', 'kopi', 'gula'];

// Card types. `power` means damage for serang, healing for jamu, cards
// drawn for borong and coins gained for kupon.
export const TYPE_LABEL = {
  serang: 'SERANG',
  jamu: 'JAMU',
  borong: 'BORONG',
  kupon: 'KUPON',
};

const NAMES = {
  serang: { beras: 'Beras Pandan', cabe: 'Cabe Rawit', kopi: 'Kopi Tubruk', gula: 'Gula Aren' },
  jamu: { beras: 'Beras Kencur', cabe: 'Cabe Puyang', kopi: 'Kopi Jahe', gula: 'Wedang Gula' },
  borong: { beras: 'Borong Beras', cabe: 'Borong Cabe', kopi: 'Borong Kopi', gula: 'Borong Gula' },
  kupon: { beras: 'Kupon Beras', cabe: 'Kupon Cabe', kopi: 'Kupon Kopi', gula: 'Kupon Gula' },
};

// Eight cards per suit: four attacks, two heals, one draw, one coupon.
const TEMPLATES = [
  { type: 'serang', cost: 1, power: 4 },
  { type: 'serang', cost: 2, power: 6 },
  { type: 'serang', cost: 2, power: 7 },
  { type: 'serang', cost: 3, power: 9 },
  { type: 'jamu', cost: 1, power: 4 },
  { type: 'jamu', cost: 2, power: 7 },
  { type: 'borong', cost: 1, power: 2 },
  { type: 'kupon', cost: 0, power: 1 },
];

let nextId = 1;

export function makeCard(suit, template) {
  return {
    id: nextId,
    suit,
    type: template.type,
    cost: template.cost,
    power: template.power,
    name: NAMES[template.type][suit],
    playedAt: -1,
  };
}

/** One shuffled 32-card deck (8 per suit). */
export function buildDeck(random) {
  const deck = [];
  for (const suit of SUIT_ORDER) {
    for (const template of TEMPLATES) {
      nextId += 1;
      deck.push(makeCard(suit, template));
    }
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// --- Table layout (shared by the simulation's hit test and the renderer) ---
export const CARD_W = 112;
export const CARD_H = 152;
export const PLAYED_W = 96;
export const PLAYED_H = 132;
export const BACK_W = 72;
export const BACK_H = 100;

export const TOP_BAR_H = 52;
export const AI_PORTRAIT = { x: 78, y: 116, r: 38 };
export const AI_LIFE = { x: 132, y: 92, w: 280, h: 26 };
export const PLAYER_PORTRAIT = { x: 78, y: 618, r: 38 };
export const PLAYER_LIFE = { x: 132, y: 594, w: 280, h: 26 };
export const TABLE = { x: 40, y: 190, w: 960, h: 280 };
export const LOG_PANEL = { x: 1020, y: 190, w: 220, h: 280 };
export const AI_PLAYED_Y = 208;
export const PLAYER_PLAYED_Y = 330;
export const HAND_Y = 548;
export const END_BUTTON = { x: 1072, y: 600, w: 168, h: 56 };
export const TURN_PILL = { x: 806, y: 198, w: 170, h: 26 };

/** Rectangle of one card in the player's fanned hand. */
export function playerHandRect(index, count, hovered = false) {
  const gap = count <= 5 ? 16 : 8;
  const total = count * CARD_W + (count - 1) * gap;
  const x = (VIEW.width - total) / 2 + index * (CARD_W + gap);
  return { x, y: hovered ? HAND_Y - 26 : HAND_Y, w: CARD_W, h: CARD_H };
}

/** Rectangle of one face-down card in the opponent's hand. */
export function aiHandRect(index, count) {
  const gap = 10;
  const total = count * BACK_W + (count - 1) * gap;
  const x = (VIEW.width - total) / 2 + index * (BACK_W + gap);
  return { x, y: 62, w: BACK_W, h: BACK_H };
}

/** Rectangle of one card lying on the table. */
export function playedRect(side, index) {
  const y = side === 'ai' ? AI_PLAYED_Y : PLAYER_PLAYED_Y;
  return { x: TABLE.x + 24 + index * (PLAYED_W + 12), y, w: PLAYED_W, h: PLAYED_H };
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
