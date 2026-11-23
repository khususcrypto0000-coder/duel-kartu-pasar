// The screenshot scenes behind ?shot=table|title|win|lose. Each one stages
// a real, reachable game state — the same world, the same rules — so the
// frame is what a real game looks like and the same seed always gives the
// same frame.
//
// The cover (1-table) is a mid-duel table: your hand fanned at the bottom,
// Juragan's face-down hand at the top, played cards on the felt, both life
// bars, coins and the log all visible in one frame.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const IDLE = { click: null, hover: null, key: null };

function simulate(world, seconds, input = IDLE) {
  const steps = Math.round(seconds / (1 / 60));
  for (let i = 0; i < steps; i += 1) world.step(1 / 60, input);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name is the title scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'table') {
    // Mid-duel, round 4: you hold five cards with 2 coins, Juragan holds
    // five face-down; two of your cards and one of his lie on the felt,
    // his life down to 18, yours at 24, a combo just fired.
    state.round = 4;
    state.player.life = 24;
    state.ai.life = 18;
    state.player.coins = 2;
    state.ai.coins = 1;
    state.damageDealt = 80;
    state.cardsPlayed = 6;
    state.score = 92;
    state.banner = '';
    state.bannerTimer = 0;
    // Top the hand back up to five cards before two go to the table.
    state.player.hand.push(state.player.deck.pop(), state.player.deck.pop());
    const yourFirst = state.player.hand[0];
    const yourSecond = state.player.hand[1];
    if (yourFirst) {
      state.player.hand.splice(0, 1);
      yourFirst.playedAt = -1;
      state.played.player.push(yourFirst);
    }
    if (yourSecond) {
      state.player.hand.splice(0, 1);
      yourSecond.playedAt = -1;
      state.played.player.push(yourSecond);
    }
    const hisFirst = state.ai.hand[0];
    if (hisFirst) {
      state.ai.hand.splice(0, 1);
      hisFirst.playedAt = -1;
      state.played.ai.push(hisFirst);
    }
    state.log = [
      'Kamu mainkan Kopi Tubruk — 6 damage!',
      'Juragan mainkan Cabe Rawit — 4 damage!',
      'KOMBO! Kartu sejenis berurutan +3.',
      '— Ronde 4: giliranmu —',
    ];
    simulate(world, 0.4, IDLE);
    state.banner = '';
    state.bannerTimer = 0;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    // The win screen: Juragan at 0 life, your score tallied.
    state.ai.life = 0;
    state.player.life = 12;
    state.damageDealt = 210;
    state.cardsPlayed = 14;
    state.round = 7;
    state.score = 342;
    state.phase = 'won';
    return { screen: SCREEN_WIN, best: 342 };
  }
  if (name === 'lose') {
    // The loss screen: you at 0 life, Juragan still standing.
    state.player.life = 0;
    state.ai.life = 21;
    state.damageDealt = 158;
    state.cardsPlayed = 11;
    state.round = 6;
    state.score = 180;
    state.phase = 'lost';
    return { screen: SCREEN_OVER, best: 342 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
