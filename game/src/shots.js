// Screenshot mode for the maker: ?shot=start|play|win|loss&seed=N renders a fixed,
// deterministic state of the real game so the screenshots are true renders of its code.
// start  -> the title screen over a fresh table
// play   -> mid-duel, both hands dealt, cards on the table, scores visible
// win    -> the victory screen after a finished duel
// loss   -> the defeat screen after a finished duel

import { newGame, startDuel, resolveRound, endRound, render, collectUi } from './game.js'
import { chooseCard } from './ai.js'

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const shot = params.get('shot')
  if (!shot) return null
  const seed = Number(params.get('seed') || '7')
  return { shot, seed }
}

export function applyShot(state, ui, shot) {
  if (shot === 'start') {
    state.phase = 'title'
    state.log = 'Welcome to Ember Court.'
    state.resultText = ''
    render(state, ui)
    return
  }
  if (shot === 'play') {
    startDuel(state)
    // Commit a mid-strength card and let Rook answer, leaving both cards face up.
    const youCard = state.youHand[2]
    state.youHand.splice(2, 1)
    const choice = chooseCard(state.foeHand, state)
    const foeCard = state.foeHand.splice(state.foeHand.indexOf(choice.card), 1)[0]
    state.youPlayed = youCard
    state.foePlayed = foeCard
    state.foeFaceDown = false
    state.phase = 'choose'
    state.selected = 1
    state.resultText = 'Rook plays a measured card. Your move.'
    state.log = 'Rook plays a measured card. Your move.'
    render(state, ui)
    return
  }
  if (shot === 'win' || shot === 'loss') {
    startDuel(state)
    if (shot === 'win') {
      state.foeLife = 2
      state.youLife = 18
      const foxfire = { id: 'star-10-Foxfire', suit: 'star', value: 10, kind: 'Foxfire', label: 'Foxfire' }
      const weak = { id: 'flame-3-normal', suit: 'flame', value: 3, kind: 'normal', label: 'Flame 3' }
      const summary = resolveRound(state, foxfire, weak)
      state.youPlayed = foxfire
      state.foePlayed = weak
      endRound(state, summary, foxfire, weak)
      state.youPlayed = foxfire
      state.foePlayed = weak
    } else {
      state.youLife = 3
      state.foeLife = 21
      const weak = { id: 'tide-2-normal', suit: 'tide', value: 2, kind: 'normal', label: 'Tide 2' }
      const strong = { id: 'flame-9-normal', suit: 'flame', value: 9, kind: 'normal', label: 'Flame 9' }
      const summary = resolveRound(state, weak, strong)
      state.youPlayed = weak
      state.foePlayed = strong
      endRound(state, summary, weak, strong)
      state.youPlayed = weak
      state.foePlayed = strong
    }
    render(state, ui)
    return
  }
  render(state, ui)
}
