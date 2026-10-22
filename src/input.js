const BLOCK_DEFAULT = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab',
])

export class Input {
  constructor(target = window) {
    this.pressed = new Set()
    this.justPressed = new Set()
    this.released = new Set()
    this.enabled = true
    this._onKeyDown = (event) => {
      if (BLOCK_DEFAULT.has(event.code)) event.preventDefault()
      if (event.repeat) return
      this.pressed.add(event.code)
      this.justPressed.add(event.code)
    }
    this._onKeyUp = (event) => {
      if (BLOCK_DEFAULT.has(event.code)) event.preventDefault()
      this.pressed.delete(event.code)
      this.released.add(event.code)
    }
    this._onBlur = () => {
      this.pressed.clear()
    }
    target.addEventListener('keydown', this._onKeyDown)
    target.addEventListener('keyup', this._onKeyUp)
    window.addEventListener('blur', this._onBlur)
  }

  down(...codes) {
    if (!this.enabled) return false
    return codes.some((code) => this.pressed.has(code))
  }

  hit(...codes) {
    if (!this.enabled) return false
    return codes.some((code) => this.justPressed.has(code))
  }

  up(...codes) {
    return codes.some((code) => this.released.has(code))
  }

  axis(negative, positive) {
    return (this.down(positive) ? 1 : 0) - (this.down(negative) ? 1 : 0)
  }

  get throttle() {
    return this.down('KeyW', 'ArrowUp') ? 1 : 0
  }

  get brake() {
    return this.down('KeyS', 'ArrowDown') ? 1 : 0
  }

  get steer() {
    return this.axis('KeyA', 'KeyD')
  }

  get crouch() {
    return this.down('ShiftLeft', 'ShiftRight')
  }

  endFrame() {
    this.justPressed.clear()
    this.released.clear()
  }
}
