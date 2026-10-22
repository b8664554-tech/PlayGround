export class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.muted = false
    this.ready = false
    this.noiseBuffer = null
    this.nodes = {}
  }

  init() {
    if (this.ready) {
      this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.52
    this.master.connect(ctx.destination)

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 18
    comp.ratio.value = 5
    comp.attack.value = 0.003
    comp.release.value = 0.3
    comp.connect(this.master)

    this.bus = comp
    this.noiseBuffer = this._makeNoise(ctx, 2)

    this._buildRoll(ctx)
    this._buildWind(ctx)
    this._buildGrind(ctx)
    this.ready = true
  }

  _makeNoise(ctx, seconds) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2 + white * 0.35
    }
    return buffer
  }

  _loopSource(gainNode, rate = 1) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    src.playbackRate.value = rate
    src.connect(gainNode)
    src.start()
    return src
  }

  _buildRoll(ctx) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 380
    lp.Q.value = 0.8
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 70
    const src = this._loopSource(gain, 0.85)
    src.disconnect()
    src.connect(hp)
    hp.connect(lp)
    lp.connect(gain)
    gain.connect(this.bus)
    this.nodes.roll = { gain, lp, hp }
  }

  _buildWind(ctx) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    bp.Q.value = 0.45
    const src = this._loopSource(gain, 1.6)
    src.disconnect()
    src.connect(bp)
    bp.connect(gain)
    gain.connect(this.bus)
    this.nodes.wind = { gain, bp }
  }

  _buildGrind(ctx) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2400
    bp.Q.value = 4.5
    const wobble = ctx.createOscillator()
    wobble.type = 'square'
    wobble.frequency.value = 92
    const wobbleGain = ctx.createGain()
    wobbleGain.gain.value = 140
    wobble.connect(wobbleGain)
    wobbleGain.connect(bp.frequency)
    wobble.start()
    const src = this._loopSource(gain, 1.1)
    src.disconnect()
    src.connect(bp)
    bp.connect(gain)
    gain.connect(this.bus)
    this.nodes.grind = { gain, bp, wobble }
  }

  setRolling(speed, grounded, surface = 0) {
    if (!this.ready) return
    const t = this.ctx.currentTime
    const amount = Math.min(1, Math.abs(speed) / 13)
    const g = this.nodes.roll.gain.gain
    g.setTargetAtTime(grounded ? 0.045 + amount * 0.14 : 0.02, t, 0.06)
    this.nodes.roll.lp.frequency.setTargetAtTime(240 + amount * 900 + surface * 600, t, 0.08)
    this.nodes.wind.gain.gain.setTargetAtTime(grounded ? amount * 0.035 : 0.03 + amount * 0.16, t, 0.1)
    this.nodes.wind.bp.frequency.setTargetAtTime(500 + amount * 2100, t, 0.12)
  }

  setGrinding(active, speed = 8) {
    if (!this.ready) return
    const t = this.ctx.currentTime
    this.nodes.grind.gain.gain.setTargetAtTime(active ? 0.11 : 0, t, active ? 0.02 : 0.08)
    this.nodes.grind.bp.frequency.setTargetAtTime(1700 + speed * 120, t, 0.1)
  }

  _burst({ duration = 0.2, frequency = 400, type = 'lowpass', gain = 0.2, sweep = 0, playback = 1 }) {
    if (!this.ready) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = playback
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(frequency, t)
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, frequency + sweep), t + duration)
    filter.Q.value = 1.2
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain, t + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter)
    filter.connect(env)
    env.connect(this.bus)
    src.start(t)
    src.stop(t + duration + 0.05)
  }

  _tone(frequency, duration, { type = 'sine', gain = 0.12, end = null, delay = 0 } = {}) {
    if (!this.ready) return
    const ctx = this.ctx
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, t)
    if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), t + duration)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(env)
    env.connect(this.bus)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  pop(power = 1) {
    this._burst({ duration: 0.12, frequency: 900, gain: 0.25 * power, sweep: -500, playback: 1.4 })
    this._tone(180, 0.12, { type: 'triangle', gain: 0.18, end: 70 })
  }

  land(intensity = 1) {
    const power = Math.min(1.6, 0.35 + intensity)
    this._burst({ duration: 0.24, frequency: 320, gain: 0.34 * power, sweep: -230, playback: 0.7 })
    this._tone(95, 0.28, { type: 'sine', gain: 0.28 * power, end: 42 })
    this._tone(240, 0.08, { type: 'square', gain: 0.05 * power, end: 120 })
  }

  flip() {
    this._burst({ duration: 0.16, frequency: 1500, gain: 0.09, sweep: 900, playback: 1.8 })
  }

  ollie() {
    this.pop(1)
    this._burst({ duration: 0.2, frequency: 1200, gain: 0.1, sweep: 1600, playback: 1.6 })
  }

  bail() {
    this._burst({ duration: 0.5, frequency: 500, gain: 0.38, sweep: -420, playback: 0.55 })
    this._tone(140, 0.5, { type: 'sawtooth', gain: 0.12, end: 50 })
    this._tone(90, 0.7, { type: 'sine', gain: 0.2, end: 35, delay: 0.08 })
  }

  challenge() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => this._tone(f, 0.28, { type: 'triangle', gain: 0.14, delay: i * 0.09 }))
    notes.forEach((f, i) => this._tone(f * 2, 0.2, { type: 'sine', gain: 0.05, delay: i * 0.09 }))
  }

  ui() {
    this._tone(620, 0.06, { type: 'square', gain: 0.05, end: 900 })
  }

  toggleMute() {
    if (!this.ready) return this.muted
    this.muted = !this.muted
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.52, this.ctx.currentTime, 0.05)
    return this.muted
  }

  suspend() {
    if (this.ready) this.ctx.suspend()
  }

  resume() {
    if (this.ready) this.ctx.resume()
  }
}
