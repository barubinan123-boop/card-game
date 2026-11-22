// Bootstrap: wire the buttons, start a fresh duel, hand screenshot mode to shots.js.

import { newGame, startDuel, playSelected, render, collectUi, bindKeys, forfeit } from './game.js'
import { shotFromUrl, applyShot } from './shots.js'

let state = newGame()
const ui = collectUi()

function restart() {
  state = newGame()
  render(state, ui)
}

document.getElementById('start-button').addEventListener('click', () => {
  startDuel(state)
  render(state, ui)
})

document.getElementById('play-button').addEventListener('click', () => {
  playSelected(state, ui)
})

document.getElementById('forfeit-button').addEventListener('click', () => {
  forfeit(state)
  render(state, ui)
})

document.getElementById('again-button').addEventListener('click', () => {
  restart()
})

document.getElementById('help-close').addEventListener('click', () => {
  ui.helpScreen.classList.add('hidden')
})

bindKeys(state, ui, restart)

const shot = shotFromUrl()
if (shot) {
  const seeded = newGame(shot.seed)
  state = seeded
  applyShot(state, ui, shot.shot)
} else {
  render(state, ui)
}
