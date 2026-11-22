// Tiny WebAudio sound effects, generated in code: no audio files, no network.
// Every sound is a short oscillator blip; the mute toggle silences them all.

let context = null
let muted = false

export function isMuted() {
  return muted
}

export function toggleMute() {
  muted = !muted
  return muted
}

function ensureContext() {
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
  }
  if (context.state === 'suspended') context.resume()
  return context
}

function blip(freq, startAt, duration, type, volume) {
  const ctx = ensureContext()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + startAt)
  osc.stop(ctx.currentTime + startAt + duration + 0.02)
}

export function playFlip() {
  blip(520, 0, 0.09, 'triangle', 0.12)
  blip(780, 0.05, 0.09, 'triangle', 0.1)
}

export function playDeal() {
  blip(330, 0, 0.07, 'sine', 0.1)
  blip(440, 0.06, 0.07, 'sine', 0.1)
  blip(550, 0.12, 0.07, 'sine', 0.1)
}

export function playWinTrick() {
  blip(660, 0, 0.1, 'triangle', 0.14)
  blip(880, 0.08, 0.14, 'triangle', 0.14)
}

export function playLoseTrick() {
  blip(300, 0, 0.12, 'sawtooth', 0.08)
  blip(210, 0.09, 0.16, 'sawtooth', 0.08)
}

export function playHeal() {
  blip(523, 0, 0.12, 'sine', 0.12)
  blip(659, 0.1, 0.12, 'sine', 0.12)
  blip(784, 0.2, 0.18, 'sine', 0.12)
}

export function playVictory() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => blip(n, i * 0.13, 0.22, 'triangle', 0.15))
}

export function playDefeat() {
  const notes = [392, 330, 262, 196]
  notes.forEach((n, i) => blip(n, i * 0.16, 0.26, 'sawtooth', 0.07))
}
