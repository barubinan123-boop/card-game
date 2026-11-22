// The deck of Ember Court: four original suits, values 2-9, plus four special cards.
// Suits are told apart by colour AND shape, never by text alone.

export const SUITS = {
  flame: { name: 'Flame', glyph: '◆', beats: 'thorn', color: '#ff6b4a' },
  thorn: { name: 'Thorn', glyph: '▲', beats: 'tide', color: '#7ddc6a' },
  tide: { name: 'Tide', glyph: '●', beats: 'flame', color: '#4aa8ff' },
  star: { name: 'Star', glyph: '★', beats: null, color: '#ffd23f' },
}

export const SUIT_ORDER = ['flame', 'thorn', 'tide', 'star']

export function makeCard(suit, value, kind) {
  const id = `${suit}-${value}-${kind}`
  const label = kind === 'normal' ? `${SUITS[suit].name} ${value}` : kind
  return { id, suit, value, kind, label }
}

// A small seeded RNG so screenshot states are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(deck, rand) {
  const cards = deck.slice()
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = cards[i]
    cards[i] = cards[j]
    cards[j] = tmp
  }
  return cards
}

export function buildDeck(rand) {
  const cards = []
  for (const suit of SUIT_ORDER) {
    for (let value = 2; value <= 9; value++) {
      cards.push(makeCard(suit, value, 'normal'))
    }
  }
  cards.push(makeCard('star', 10, 'Foxfire'))
  cards.push(makeCard('star', 0, 'Mend'))
  cards.push(makeCard('star', 0, 'Aegis'))
  cards.push(makeCard('star', 0, 'Trickster'))
  return shuffle(cards, rand)
}

// The Trickster copies the foe's value when revealed; its own printed value is 0.
export function effectiveValue(card, foeCard) {
  if (card.kind === 'Trickster') return foeCard ? foeCard.value : 0
  return card.value
}

// +2 damage when the winner's suit beats the loser's suit in the cycle.
export function suitBeats(aSuit, bSuit) {
  if (!aSuit || !bSuit) return false
  return SUITS[aSuit].beats === bSuit
}

export function describeCard(card) {
  if (card.kind === 'normal') return `${SUITS[card.suit].name} ${card.value}`
  if (card.kind === 'Foxfire') return 'Foxfire (Star 10)'
  if (card.kind === 'Mend') return 'Mend (heal 6)'
  if (card.kind === 'Aegis') return 'Aegis (block all)'
  return 'Trickster (copies foe)'
}
