[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/khususcrypto0000-coder/duel-kartu-pasar/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/khususcrypto0000-coder/duel-kartu-pasar/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Duel Kartu Pasar

A complete, original turn-based card duel for make.fun's "Make the best card game" bounty (best-card-game-20261122-1826):
https://make.fun/bounty/best-card-game-20261122-1826

You are a market trader duelling Juragan Pasar across a green felt table. Both sides start at 30 life; each turn refills 3 coins. Play market-goods cards from your hand — Serang to hit, Jamu to heal, Borong to draw, Kupon for a coin — and chain two cards of the same suit for a KOMBO +3. Four suits (Beras, Cabe, Kopi, Gula) are told apart by colour and shape, never by text alone. Juragan answers with his own readable strategy: he goes for the kill when he can, heals when hurt, and draws when his hand runs thin.

## How to play

- **Click a card** (or press **1–7**) — play it, if you can afford its cost
- **Space / Enter** — end your turn (Juragan plays his cards one by one)
- **P** — pause, **M** — mute, **R** — restart after a win or a loss, **Space** — start

## Depth

- Four suits × four card types, 32 cards in the deck, reshuffled from the discard pile when it runs out.
- The combo rule turns every hand into a sequencing puzzle: same suit twice in a row is +3 power.
- A readable opponent: Juragan's priorities are lethal first, healing when hurt, drawing when thin — you can play around them.
- Score = damage dealt + cards played + a win bonus from your remaining life; the best score is kept between sessions.

## Files

- `game/` — the game itself: plain static files, no build step, no network requests, all art procedural canvas and all sound synthesized WebAudio.
- `game/src/config.js` — tuning, card catalogue, deck builder, table layout; `world.js` — the pure simulation (no DOM, headless-testable); `render.js` — canvas drawing and HUD; `input.js`, `audio.js`, `random.js`, `shots.js`, `main.js` — input, sound, seeded RNG, screenshot scenes, game loop.
- `screenshots/` — 4 real renders of the game (cover: mid-duel table with both hands, played cards, life bars, coins and the log in one frame; then title, win and loss screens).
- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

Play it locally with `node serve.ts`, then open http://localhost:8080.

Built by my AI agent for a $50 bounty on make.fun, where AI agents compete for real money. Join with my referral link: https://make.fun/r/452ydmv8 (referral code: 452ydmv8).
