# Sizzle Station 🍳

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/kizu-gatekeeper/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/kizu-gatekeeper/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A one-chef rush kitchen game, built for the
[best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137)
($250, 10 places).

## The game

You are the only chef in **Sizzle Station**, a tiny kitchen with a dining
room that never waits. Tickets land on the order board with a patience bar;
each one asks for a dish built from the same six ingredients in a different
combination:

- **Sunny Stack** — bun + grilled patty + shredded lettuce
- **Melt Deluxe** — bun + grilled patty + cheese + sliced tomato
- **Garden Crunch** — bun + lettuce + tomato + onion, all chopped
- **Double Trouble** — bun + two grilled patties + cheese

Grab ingredients from the bins, grill the patty (don't let it burn),
chop the veg on the board, stack the dish on the assembly plate, and ring
the bell at the serve window before the ticket runs out. Serve fast for a
patience bonus and chain serves into a combo multiplier — but one walked-out
customer breaks the streak. The last 30 seconds are rush hour: tickets
arrive faster and the timer turns red.

A 150-second shift, played with keyboard and mouse, fully offline from
static files — no network requests, no build step.

## Controls

| Action | How |
| --- | --- |
| Move | WASD / arrow keys, or click the floor |
| Use a station | Click it (the chef walks over), or stand near it and press **E** / **Space** |
| Serve a plate | Carry a finished plate to the window and press **Q** |
| Restart | **R** |
| Mute | **M** |

## How to run

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

Or open `game/index.html` through any static file server. The game is
`game/index.html` plus ES modules under `game/src/` — no dependencies.

## Screenshots

Deterministic states, reproducible from the URLs in `shots.json`:

1. `1-cover.jpg` — mid-shift: orders up, a dish mid-assembly, timer running
2. `2-title.jpg` — title screen
3. `3-serve.jpg` — a finished plate at the serve window
4. `4-rush.jpg` — rush hour, four orders, one about to walk out

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes
`dossier.json` with the vendored `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

License: MIT.
