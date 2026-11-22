// Ember Court game state and rules: deal, choose, reveal, resolve, draw, end.
// One round: both sides commit a card, the higher effective value wins the trick,
// the winner deals damage equal to the gap, +2 for a suit advantage. Mend heals 6,
// Aegis blocks all damage that round, the Trickster copies the foe's value.

import { SUITS, buildDeck, effectiveValue, suitBeats, describeCard, shuffle, mulberry32 } from './deck.js'
import { chooseCard, pickFoeLine } from './ai.js'
import { playFlip, playDeal, playWinTrick, playLoseTrick, playHeal, playVictory, playDefeat, toggleMute, isMuted } from './sound.js'

export const START_LIFE = 30
export const HAND_SIZE = 5

export function newGame(seed) {
  const rand = mulberry32(seed ?? Math.floor(Math.random() * 2147483647))
  const deck = buildDeck(rand)
  const state = {
    seed: seed ?? 0,
    rand,
    deck,
    discard: [],
    youHand: [],
    foeHand: [],
    youLife: START_LIFE,
    foeLife: START_LIFE,
    youTricks: 0,
    foeTricks: 0,
    round: 1,
    phase: 'title',
    selected: -1,
    youPlayed: null,
    foePlayed: null,
    foeFaceDown: false,
    lastYouSuit: null,
    log: 'Welcome to Ember Court.',
    resultText: '',
    winner: null,
    lastMood: pickFoeLine({ foeLife: START_LIFE, youLife: START_LIFE, round: 1 }),
  }
  for (let i = 0; i < HAND_SIZE; i++) {
    state.youHand.push(drawCard(state))
    state.foeHand.push(drawCard(state))
  }
  return state
}

export function drawCard(state) {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return null
    state.deck = shuffle(state.discard, state.rand)
    state.discard = []
    state.log = 'The discard pile is shuffled back into the deck.'
  }
  return state.deck.pop()
}

export function drawUp(state) {
  const youCard = drawCard(state)
  if (youCard) state.youHand.push(youCard)
  const foeCard = drawCard(state)
  if (foeCard) state.foeHand.push(foeCard)
}

export function startDuel(state) {
  state.phase = 'choose'
  state.log = pickFoeLine(state)
  state.resultText = 'Choose a card to play.'
  playDeal()
}

export function selectCard(state, index) {
  if (state.phase !== 'choose') return
  if (index < 0 || index >= state.youHand.length) return
  state.selected = index
}

// Resolve one round after both cards are committed. Returns the round summary.
export function resolveRound(state, youCard, foeCard) {
  const youValue = effectiveValue(youCard, foeCard)
  const foeValue = effectiveValue(foeCard, youCard)
  const lines = []
  let damageToFoe = 0
  let damageToYou = 0

  if (youCard.kind === 'Mend') {
    state.youLife = Math.min(START_LIFE, state.youLife + 6)
    lines.push(`Your Mend restores 6 life (now ${state.youLife}).`)
    playHeal()
  }
  if (foeCard.kind === 'Mend') {
    state.foeLife = Math.min(START_LIFE, state.foeLife + 6)
    lines.push(`Rook's Mend restores 6 life (now ${state.foeLife}).`)
  }

  const youBlocked = foeCard.kind === 'Aegis'
  const foeBlocked = youCard.kind === 'Aegis'
  if (youCard.kind === 'Aegis') lines.push('Your Aegis stands ready — no damage can reach you this round.')
  if (foeCard.kind === 'Aegis') lines.push("Rook's Aegis stands ready — no damage can reach him this round.")

  if (youValue === foeValue) {
    lines.push(`A standoff — both played ${youValue}. No damage.`)
  } else if (youValue > foeValue) {
    const gap = youValue - foeValue
    const bonus = suitBeats(youCard.suit, foeCard.suit) && youCard.kind !== 'Aegis' ? 2 : 0
    damageToFoe = youBlocked ? 0 : gap + bonus
    state.youTricks += 1
    lines.push(`You win the trick ${youValue} to ${foeValue}${bonus ? ' — suit advantage +2' : ''}. Rook takes ${damageToFoe} damage.`)
    playWinTrick()
  } else {
    const gap = foeValue - youValue
    const bonus = suitBeats(foeCard.suit, youCard.suit) && foeCard.kind !== 'Aegis' ? 2 : 0
    damageToYou = foeBlocked ? 0 : gap + bonus
    state.foeTricks += 1
    lines.push(`Rook wins the trick ${foeValue} to ${youValue}${bonus ? ' — suit advantage +2' : ''}. You take ${damageToYou} damage.`)
    playLoseTrick()
  }

  state.foeLife -= damageToFoe
  state.youLife -= damageToYou
  state.lastYouSuit = youCard.suit
  return lines.join(' ')
}

export function endRound(state, summary, youCard, foeCard) {
  state.resultText = summary
  state.log = summary
  if (youCard) state.discard.push(youCard)
  if (foeCard) state.discard.push(foeCard)
  state.youPlayed = null
  state.foePlayed = null
  state.selected = -1
  if (state.youLife <= 0 || state.foeLife <= 0) {
    state.phase = 'over'
    state.winner = state.foeLife <= 0 && state.youLife > 0 ? 'you' : state.youLife <= 0 && state.foeLife > 0 ? 'foe' : 'draw'
    if (state.winner === 'you') playVictory()
    else if (state.winner === 'foe') playDefeat()
    return
  }
  if (state.deck.length === 0 && state.discard.length === 0 && state.youHand.length === 0 && state.foeHand.length === 0) {
    state.phase = 'over'
    state.winner = state.youLife > state.foeLife ? 'you' : state.foeLife > state.youLife ? 'foe' : 'draw'
    return
  }
  state.round += 1
  drawUp(state)
  state.phase = 'choose'
  state.resultText = 'Choose a card to play.'
  state.lastMood = pickFoeLine(state)
}

export function forfeit(state) {
  state.phase = 'over'
  state.winner = 'foe'
  state.youLife = 0
  playDefeat()
}

// ---- Rendering: DOM cards with readable values, suits by colour and shape ----

export function cardElement(card, opts) {
  const el = document.createElement('div')
  if (opts && opts.faceDown) {
    el.className = 'card back'
    el.innerHTML = '<div class="back-mark">🦊</div><div class="back-name">EMBER COURT</div>'
    return el
  }
  const suit = SUITS[card.suit]
  const special = card.kind !== 'normal'
  el.className = `card suit-${card.suit}${special ? ' special' : ''}`
  const shownValue = card.kind === 'normal' ? String(card.value) : card.kind === 'Foxfire' ? '10' : '✦'
  const name = card.kind === 'normal' ? `${suit.name} ${card.value}` : card.kind
  el.innerHTML =
    `<div class="corner">${shownValue}<br>${suit.glyph}</div>` +
    `<div class="suit-glyph">${suit.glyph}</div>` +
    `<div class="value">${shownValue}</div>` +
    `<div class="name">${name}</div>` +
    `<div class="corner bottom">${shownValue}<br>${suit.glyph}</div>`
  el.title = describeCard(card)
  return el
}

export function render(state, ui) {
  ui.youLife.textContent = Math.max(0, state.youLife)
  ui.foeLife.textContent = Math.max(0, state.foeLife)
  ui.youLife.classList.toggle('low', state.youLife <= 8)
  ui.foeLife.classList.toggle('low', state.foeLife <= 8)
  ui.youTricks.textContent = `${state.youTricks} trick${state.youTricks === 1 ? '' : 's'}`
  ui.foeTricks.textContent = `${state.foeTricks} trick${state.foeTricks === 1 ? '' : 's'}`
  ui.roundLabel.textContent = state.phase === 'over' ? 'Duel over' : `Round ${state.round}`
  ui.deckCount.textContent = `Deck ${state.deck.length} · Discard ${state.discard.length}`
  ui.log.textContent = state.log
  ui.result.textContent = state.resultText
  ui.foeHandCount.textContent = `(${state.foeHand.length} cards)`

  ui.youHand.innerHTML = ''
  state.youHand.forEach((card, i) => {
    const el = cardElement(card)
    if (i === state.selected) el.classList.add('selected')
    if (state.phase === 'choose' && i === 0) el.classList.add('playable-hint')
    el.addEventListener('click', () => {
      if (state.phase !== 'choose') return
      selectCard(state, i)
      render(state, ui)
      playFlip()
    })
    ui.youHand.appendChild(el)
  })

  ui.foeHand.innerHTML = ''
  state.foeHand.forEach(() => {
    ui.foeHand.appendChild(cardElement(null, { faceDown: true }))
  })

  ui.youPlayed.innerHTML = ''
  ui.foePlayed.innerHTML = ''
  if (state.youPlayed) {
    const el = cardElement(state.youPlayed)
    if (state.lastRoundWinner === 'you') el.classList.add('winner-card')
    ui.youPlayed.appendChild(el)
  } else {
    ui.youPlayed.innerHTML = '<div class="placeholder">Your card</div>'
  }
  if (state.foePlayed) {
    const el = cardElement(state.foePlayed, { faceDown: state.foeFaceDown })
    if (state.lastRoundWinner === 'foe') el.classList.add('winner-card')
    ui.foePlayed.appendChild(el)
  } else {
    ui.foePlayed.innerHTML = '<div class="placeholder">Rook’s card</div>'
  }

  ui.playButton.disabled = state.phase !== 'choose' || state.selected < 0
  ui.playButton.textContent = isMuted() ? 'Play card (muted)' : 'Play card'
  ui.forfeitButton.disabled = state.phase !== 'choose' && state.phase !== 'reveal'

  ui.titleScreen.classList.toggle('hidden', state.phase !== 'title')
  const over = state.phase === 'over'
  ui.endScreen.classList.toggle('hidden', !over)
  if (over) {
    ui.endScreen.classList.toggle('win', state.winner === 'you')
    ui.endScreen.classList.toggle('lose', state.winner !== 'you')
    ui.endTitle.textContent =
      state.winner === 'you' ? 'Victory!' : state.winner === 'foe' ? 'Defeat' : 'A Draw'
    ui.endText.textContent =
      state.winner === 'you'
        ? 'Rook bows, ears flat. “Well played, traveller. The Ember Court is yours.”'
        : state.winner === 'foe'
          ? 'Rook grins through the smoke. “The court keeps its ember. Come back and try again.”'
          : 'Neither ember went out. The court calls it a draw.'
    ui.endStats.textContent =
      `Rounds played: ${state.round} · Tricks — you ${state.youTricks}, Rook ${state.foeTricks} · ` +
      `Final life — you ${Math.max(0, state.youLife)}, Rook ${Math.max(0, state.foeLife)}.`
  }
}

export function collectUi() {
  const byId = (id) => document.getElementById(id)
  return {
    youLife: byId('you-life'),
    foeLife: byId('foe-life'),
    youTricks: byId('you-tricks'),
    foeTricks: byId('foe-tricks'),
    roundLabel: byId('round-label'),
    deckCount: byId('deck-count'),
    log: byId('gamelog'),
    result: byId('round-result'),
    foeHandCount: byId('foe-hand-count'),
    youHand: byId('you-hand'),
    foeHand: byId('foe-hand'),
    youPlayed: byId('you-played'),
    foePlayed: byId('foe-played'),
    playButton: byId('play-button'),
    forfeitButton: byId('forfeit-button'),
    titleScreen: byId('title-screen'),
    endScreen: byId('end-screen'),
    endTitle: byId('end-title'),
    endText: byId('end-text'),
    endStats: byId('end-stats'),
    helpScreen: byId('help-screen'),
  }
}

// Play the selected card: commit it, let Rook answer, reveal, resolve.
export function playSelected(state, ui) {
  if (state.phase !== 'choose' || state.selected < 0) return
  const youCard = state.youHand.splice(state.selected, 1)[0]
  const choice = chooseCard(state.foeHand, state)
  const foeIndex = state.foeHand.indexOf(choice.card)
  const foeCard = state.foeHand.splice(foeIndex, 1)[0]
  state.youPlayed = youCard
  state.foePlayed = foeCard
  state.foeFaceDown = true
  state.phase = 'reveal'
  state.selected = -1
  state.resultText = state.lastMood || choice.mood
  state.log = choice.mood
  render(state, ui)
  playFlip()
  window.setTimeout(() => {
    state.foeFaceDown = false
    const youValue = effectiveValue(youCard, foeCard)
    const foeValue = effectiveValue(foeCard, youCard)
    state.lastRoundWinner = youValue === foeValue ? null : youValue > foeValue ? 'you' : 'foe'
    render(state, ui)
    playFlip()
    window.setTimeout(() => {
      const summary = resolveRound(state, youCard, foeCard)
      endRound(state, summary, youCard, foeCard)
      render(state, ui)
    }, 900)
  }, 900)
}

export function bindKeys(state, ui, onRestart) {
  document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '5') {
      const index = Number(event.key) - 1
      if (state.phase === 'choose') {
        selectCard(state, index)
        render(state, ui)
        playFlip()
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (state.phase === 'choose') {
        event.preventDefault()
        playSelected(state, ui)
      }
    } else if (event.key === 'n' || event.key === 'N') {
      onRestart()
    } else if (event.key === 'm' || event.key === 'M') {
      toggleMute()
      render(state, ui)
    } else if (event.key === 'h' || event.key === 'H') {
      ui.helpScreen.classList.toggle('hidden')
    } else if (event.key === 'Escape') {
      ui.helpScreen.classList.add('hidden')
    }
  })
}
