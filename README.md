# card-game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/barubinan123-boop/card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/barubinan123-boop/card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Court is an original duel card game: you face Rook the fox across a green
felt table, playing one card each round from a deck of four suits — Flame ◆,
Thorn ▲, Tide ● and Star ★. Higher value wins the trick and deals damage equal
to the gap, plus 2 for a suit advantage in the cycle Flame beats Thorn, Thorn
beats Tide, Tide beats Flame. Special cards change the duel: Foxfire (Star 10),
Mend (heal 6), Aegis (block all damage) and the Trickster (copies the foe's
value). First to 0 life loses. It plays with mouse and keyboard, with a title
screen, animated reveals, WebAudio sound effects, and win and loss screens.

## Run it

```sh
python3 -m http.server --directory game 8080
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network
requests — every file the game loads lives under `game/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=s0awek38&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
