// Rook, the fox opponent: a readable AI whose choices the player can learn and counter.
// Heuristics, in order: save yourself when hurt, finish the player when they are weak,
// answer the player's favourite suit, otherwise play the middle of his hand.

import { effectiveValue, suitBeats } from './deck.js'

export function chooseCard(hand, state) {
  const playable = hand.slice()
  if (playable.length === 0) return null
  const byValue = playable.slice().sort((a, b) => a.value - b.value)
  const mend = playable.find((c) => c.kind === 'Mend')
  const aegis = playable.find((c) => c.kind === 'Aegis')
  const foxfire = playable.find((c) => c.kind === 'Foxfire')
  const trickster = playable.find((c) => c.kind === 'Trickster')
  const highest = byValue[byValue.length - 1]
  const lowest = byValue[0]

  // Hurt badly: heal if he can, block if the player is about to hit hard.
  if (state.foeLife <= 9 && mend) return { card: mend, mood: 'Rook mends his wounds.' }
  if (state.foeLife <= 6 && aegis) return { card: aegis, mood: 'Rook raises the Aegis.' }

  // The player is one good hit from defeat: throw the biggest card.
  if (state.youLife <= 7 && foxfire) return { card: foxfire, mood: 'Rook goes for the throat!' }
  if (state.youLife <= 5 && highest.value >= 7) {
    return { card: highest, mood: 'Rook smells victory and plays high.' }
  }

  // Counter the suit the player just played: answer Flame with Tide, and so on.
  const lastSuit = state.lastYouSuit
  if (lastSuit) {
    const counter = playable.find((c) => suitBeats(c.suit, lastSuit) && c.value >= 5)
    if (counter) return { card: counter, mood: `Rook answers your ${lastSuit} with a counter-suit.` }
  }

  // Mid-game: play around the middle of the hand, saving the best cards for later.
  const mid = byValue[Math.floor(byValue.length / 2)]
  if (state.round <= 3 && trickster && state.youLife > 12) {
    return { card: lowest, mood: 'Rook plays coy, holding his tricks back.' }
  }
  if (mid) return { card: mid, mood: 'Rook plays a measured card.' }
  return { card: lowest, mood: 'Rook plays low.' }
}

export function pickFoeLine(state) {
  if (state.foeLife <= 8) return 'Rook bares his teeth — he is cornered.'
  if (state.youLife <= 8) return 'Rook circles, waiting for the killing blow.'
  if (state.round === 1) return 'Rook flicks his tail. “Your move, traveller.”'
  return 'Rook studies your hand.'
}

export function effectiveFoeValue(card, youCard) {
  return effectiveValue(card, youCard)
}
