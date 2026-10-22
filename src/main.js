import * as THREE from 'three'
import { World } from './world.js'
import { Skater } from './skater.js'
import { Input } from './input.js'
import { AudioEngine } from './audio.js'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t

const IDLE_INPUT = {
  throttle: 0, brake: 0, steer: 0, crouch: false,
  down: () => false, hit: () => false, up: () => false,
}

const el = (id) => document.getElementById(id)
const ui = {
  title: el('title-screen'),
  hud: el('hud'),
  start: el('start-button'),
  pause: el('pause-screen'),
  resume: el('resume-button'),
  loading: el('loading-screen'),
  score: el('score'),
  combo: el('combo'),
  best: el('best-trick'),
  challenges: el('challenge-list'),
  trick: el('trick-callout'),
  trickName: el('trick-name'),
  trickPoints: el('trick-points'),
  trickMult: el('trick-mult'),
  bail: el('bail-callout'),
  balance: el('balance'),
  balanceMarker: el('balance-marker'),
  charge: el('charge'),
  chargeFill: el('charge').querySelector('i'),
  speed: el('speed'),
  speedFill: el('speed-fill'),
  toast: el('toast'),
  toastTitle: el('toast-title'),
  toastSub: el('toast-sub'),
  speedlines: el('speedlines'),
}

/* ------------------------------------------------------------------ */
/*  renderer / scene                                                  */
/* ------------------------------------------------------------------ */

const app = el('app')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.3
renderer.outputColorSpace = THREE.SRGBColorSpace
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600)
camera.position.set(0, 12, 44)

const world = new World(scene)
const input = new Input()
const audio = new AudioEngine()

/* ------------------------------------------------------------------ */
/*  game state                                                        */
/* ------------------------------------------------------------------ */

const game = {
  state: 'title',
  score: 0,
  combo: 1,
  comboTimer: 2.4,
  maxSpin: 0,
  rails: 0,
  bestTrick: '',
  elapsed: 0,
  cameraMode: 'follow',
  shake: 0,
  challengeBonus: 0,
}

const challenges = [
  { id: 'score', name: 'Score 5,000 points', goal: 5000, value: 0, done: false, type: 'score' },
  { id: 'spin', name: 'Land a 540 spin', goal: 540, value: 0, done: false, type: 'spin' },
  { id: 'rails', name: 'Grind 4 rails', goal: 4, value: 0, done: false, type: 'rails' },
]

const challengeRows = new Map()
for (const challenge of challenges) {
  const li = document.createElement('li')
  li.innerHTML = `
    <span class="chal-dot"></span>
    <span class="chal-name">${challenge.name}</span>
    <span class="chal-pct">0%</span>
    <div class="chal-bar"><i></i></div>
  `
  ui.challenges.appendChild(li)
  challengeRows.set(challenge.id, {
    li,
    pct: li.querySelector('.chal-pct'),
    bar: li.querySelector('.chal-bar i'),
  })
}

const skater = new Skater(scene, world, audio, {
  onAirStart: () => {},
  onLand: (info) => {
    if (info.spin > game.maxSpin) game.maxSpin = info.spin
    const label = info.names.length ? info.names.join(' ') : 'AIR'
    addTrick(label, info.points)
    ui.balance.classList.add('hidden')
    radioGrind(false)
  },
  onGrindStart: ({ name }) => {
    ui.balance.classList.remove('hidden')
    game.grindDanger = false
    showTrick(`${name} GRIND`, 0, game.combo, true)
  },
  onGrindEnd: ({ name, points }) => {
    game.rails++
    ui.balance.classList.add('hidden')
    addTrick(`${name} GRIND`, points)
    checkChallenges()
  },
  onBail: () => {
    game.combo = 1
    game.comboTimer = 0
    game.shake = Math.max(game.shake, 0.4)
    ui.balance.classList.add('hidden')
    ui.trick.classList.add('hidden')
    ui.bail.classList.remove('hidden')
    window.clearTimeout(bailTimer)
    bailTimer = window.setTimeout(() => ui.bail.classList.add('hidden'), 1500)
    updateHUD()
  },
  onRespawn: () => {},
  onRampLaunch: () => {},
  onCameraShake: (amount) => {
    game.shake = Math.min(0.8, Math.max(game.shake, amount))
  },
})
let bailTimer = null

/* ------------------------------------------------------------------ */
/*  UI helpers                                                        */
/* ------------------------------------------------------------------ */

function formatNumber(n) {
  return Math.round(n).toLocaleString('en-US')
}

function updateHUD() {
  ui.score.textContent = formatNumber(game.score + game.challengeBonus)
  if (game.combo > 1.01) {
    ui.combo.classList.remove('hidden')
    ui.combo.textContent = `x${game.combo.toFixed(2).replace(/0$/, '')}`
  } else {
    ui.combo.classList.add('hidden')
  }
  ui.best.textContent = game.bestTrick || 'NO CLIPS YET'

  const speed = Math.abs(skater.speed)
  ui.speed.textContent = speed.toFixed(1)
  ui.speedFill.style.width = `${clamp(speed / 15.5, 0, 1) * 100}%`
  ui.speedlines.style.opacity = clamp((speed - 7) / 8, 0, 0.42)

  if (skater.charging && skater.mode === 'ground') {
    ui.charge.classList.remove('hidden')
    ui.chargeFill.style.width = `${clamp(skater.charge / 0.65, 0, 1) * 100}%`
  } else {
    ui.charge.classList.add('hidden')
  }

  if (skater.mode === 'grind') {
    const pct = clamp((skater.balance + 1) / 2, 0, 1) * 100
    ui.balanceMarker.style.left = `${pct}%`
    const danger = Math.abs(skater.balance) > 0.62
    ui.balanceMarker.style.background = danger ? '#ff5a1f' : '#54e8ff'
    ui.balanceMarker.style.boxShadow = `0 0 14px ${danger ? '#ff5a1f' : '#54e8ff'}`
  }
}

function updateChallenges() {
  for (const c of challenges) {
    if (c.done) continue
    let value = c.value
    if (c.type === 'score') value = game.score + game.challengeBonus
    if (c.type === 'spin') value = game.maxSpin
    if (c.type === 'rails') value = game.rails
    c.value = value
    const pct = clamp(value / c.goal, 0, 1)
    const row = challengeRows.get(c.id)
    row.bar.style.width = `${pct * 100}%`
    row.pct.textContent = `${Math.round(pct * 100)}%`
    if (pct >= 1) completeChallenge(c)
  }
}

function completeChallenge(c) {
  c.done = true
  const row = challengeRows.get(c.id)
  row.li.classList.add('done')
  row.bar.style.width = '100%'
  row.pct.textContent = 'DONE'
  game.challengeBonus += 2500
  audio.challenge()
  world.celebrate(skater.position.clone().setY(skater.position.y + 1.2), 120)
  showToast('CHALLENGE COMPLETE', `${c.name.toUpperCase()}  ·  +2,500`)
  updateHUD()
}

function checkChallenges() {
  updateChallenges()
}

function addTrick(label, points) {
  if (points <= 0) {
    updateHUD()
    return
  }
  const mult = game.combo
  const gained = Math.round(points * mult)
  game.score += gained
  if (gained > game.bestTrickScore || !game.bestTrick) {
    game.bestTrickScore = gained
    game.bestTrick = `${label} +${formatNumber(gained)}`
  }
  game.combo = Math.min(9.9, game.combo + 0.25)
  game.comboTimer = 3.4
  showTrick(label, gained, mult, false)
  updateHUD()
  updateChallenges()
}

function showTrick(label, points, mult = game.combo, pending = false) {
  ui.trickName.textContent = label
  ui.trickPoints.textContent = pending ? 'IN PROGRESS' : `+${formatNumber(points)}`
  ui.trickMult.textContent = `x${mult.toFixed(2).replace(/0$/, '')}`
  ui.trick.classList.remove('hidden')
  ui.trick.classList.toggle('small', label.length > 18)
  ui.trick.classList.toggle('tiny', label.length > 28)
  ui.trick.style.animation = 'none'
  void ui.trick.offsetWidth
  ui.trick.style.animation = ''
  window.clearTimeout(showTrick.timer)
  showTrick.timer = window.setTimeout(() => ui.trick.classList.add('hidden'), pending ? 1800 : 2100)
}
showTrick.timer = null

function showToast(title, sub) {
  ui.toastTitle.textContent = title
  ui.toastSub.textContent = sub
  ui.toast.classList.add('show')
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => ui.toast.classList.remove('show'), 3000)
}
showToast.timer = null

let grindSoundActive = false
function radioGrind(active) {
  if (grindSoundActive === active) return
  grindSoundActive = active
  audio.setGrinding(active, Math.abs(skater.speed))
}

/* ------------------------------------------------------------------ */
/*  flow                                                              */
/* ------------------------------------------------------------------ */

function startGame() {
  if (game.state !== 'title') return
  game.state = 'playing'
  audio.init()
  audio.ui()
  input.enabled = true
  ui.title.classList.add('leaving')
  window.setTimeout(() => ui.title.classList.add('hidden'), 600)
  ui.hud.classList.remove('hidden')
  const f = skater.forward
  camera.position.set(skater.position.x - f.x * 7.2, skater.position.y + 3.2, skater.position.z - f.z * 7.2)
  cameraTarget.set(skater.position.x + f.x * 2.2, skater.position.y + 1.1, skater.position.z + f.z * 2.2)
  camera.lookAt(cameraTarget)
  game.combo = 1
  game.comboTimer = 0
  updateHUD()
  updateChallenges()
  showToast('DROP IN', 'PORT CARVERTON PLAZA')
}

function pauseGame() {
  if (game.state !== 'playing') return
  game.state = 'paused'
  input.enabled = false
  audio.suspend()
  ui.pause.classList.remove('hidden')
}

function resumeGame() {
  if (game.state !== 'paused') return
  game.state = 'playing'
  input.enabled = true
  audio.resume()
  ui.pause.classList.add('hidden')
}

function resetSession() {
  if (game.state === 'title') return
  skater.reset(skater.lastSafe.x, skater.lastSafe.z, skater.heading)
  game.shake = 0.1
  audio.ui()
  showToast('RESET', 'BACK ON THE BOARD')
}

ui.start.addEventListener('click', startGame)
ui.resume.addEventListener('click', resumeGame)

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && game.state === 'title') {
    startGame()
    return
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (game.state === 'playing') pauseGame()
    else if (game.state === 'paused') resumeGame()
    return
  }
  if (game.state !== 'playing') return
  if (event.code === 'KeyR') {
    resetSession()
  } else if (event.code === 'KeyC') {
    game.cameraMode = game.cameraMode === 'follow' ? 'wide' : 'follow'
    showToast('CAMERA', game.cameraMode === 'follow' ? 'CLOSE FOLLOW' : 'WIDE FOLLOW')
  } else if (event.code === 'KeyM') {
    const muted = audio.toggleMute()
    showToast('AUDIO', muted ? 'MUTED' : 'ON')
  }
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') pauseGame()
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
})

/* ------------------------------------------------------------------ */
/*  camera                                                            */
/* ------------------------------------------------------------------ */

const cameraTarget = new THREE.Vector3(0, 2, 0)
const desiredTarget = new THREE.Vector3()
const desiredPosition = new THREE.Vector3()

function updateTitleCamera(dt, elapsed) {
  const angle = elapsed * 0.075 + 0.4
  const radius = 41
  const height = 13.5 + Math.sin(elapsed * 0.17) * 2.2
  desiredPosition.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius + 7)
  desiredTarget.set(0, 2.4, -7)
  camera.position.lerp(desiredPosition, 1 - Math.exp(-2 * dt))
  cameraTarget.lerp(desiredTarget, 1 - Math.exp(-2 * dt))
  camera.lookAt(cameraTarget)
  if (Math.abs(camera.fov - 55) > 0.01) {
    camera.fov = lerp(camera.fov, 55, 1 - Math.exp(-3 * dt))
    camera.updateProjectionMatrix()
  }
}

function updateFollowCamera(dt, elapsed) {
  const f = skater.forward
  const speed = Math.abs(skater.speed)
  const wide = game.cameraMode === 'wide'
  const airborne = skater.mode === 'air'
  const grinding = skater.mode === 'grind'

  const dist = (wide ? 10.8 : 7.4) + speed * (wide ? 0.1 : 0.15) + (airborne ? 0.9 : 0)
  const height = (wide ? 4.8 : 3.4) + speed * 0.05 + (airborne ? 0.9 : 0) + (grinding ? 0.3 : 0)

  const rx = f.z
  const rz = -f.x
  const side = (wide ? 2.2 : 1.95) + clamp(input.steer, -1, 1) * (wide ? 0.5 : 0.8)

  desiredPosition.set(
    skater.position.x - f.x * dist + rx * side,
    skater.position.y + height,
    skater.position.z - f.z * dist + rz * side
  )

  const lookAhead = 2.2 + speed * 0.14
  desiredTarget.set(
    skater.position.x + f.x * lookAhead + rx * 0.55,
    skater.position.y + 1.0 + (airborne ? 0.4 : 0),
    skater.position.z + f.z * lookAhead + rz * 0.55
  )

  const posLambda = 5.2 + speed * 0.12
  camera.position.lerp(desiredPosition, 1 - Math.exp(-posLambda * dt))
  cameraTarget.lerp(desiredTarget, 1 - Math.exp(-7 * dt))

  if (game.shake > 0.001) {
    const s = game.shake
    camera.position.x += (Math.random() - 0.5) * s
    camera.position.y += (Math.random() - 0.5) * s * 0.7
    camera.position.z += (Math.random() - 0.5) * s
    game.shake *= Math.exp(-6 * dt)
  }

  camera.lookAt(cameraTarget)

  let targetFov = (wide ? 52 : 60) + (speed / 15.5) * 12 + (airborne ? 3 : 0)
  if (skater.mode === 'bail') targetFov = 58
  camera.fov = lerp(camera.fov, targetFov, 1 - Math.exp(-4 * dt))
  camera.updateProjectionMatrix()

  if (elapsed === 0) camera.lookAt(cameraTarget)
}

/* ------------------------------------------------------------------ */
/*  loop                                                              */
/* ------------------------------------------------------------------ */

const clock = new THREE.Clock()
let firstFrame = true

function animate() {
  requestAnimationFrame(animate)
  const dtRaw = clock.getDelta()
  const dt = clamp(dtRaw, 0.0001, 0.2)
  game.elapsed += dt

  if (game.state === 'playing') {
    input.enabled = true
    const STEP = 1 / 60
    let accumulated = (game.accum || 0) + dt
    let steps = 0
    while (accumulated >= STEP && steps < 14) {
      skater.update(STEP, input)
      world.update(STEP, game.elapsed)
      accumulated -= STEP
      steps++
      input.endFrame()
    }
    game.accum = Math.min(accumulated, STEP)
    if (steps === 0) input.endFrame()

    if (skater.mode === 'grind') {
      radioGrind(true)
      audio.setGrinding(true, Math.abs(skater.speed))
      game.grindDanger = Math.abs(skater.balance) > 0.62
    } else {
      radioGrind(false)
    }
    audio.setRolling(Math.abs(skater.speed), skater.mode === 'ground' || skater.mode === 'grind', skater.mode === 'ground' ? skater.world.heightAt(skater.position.x, skater.position.z) * 0.08 : 0)

    if (game.combo > 1) {
      game.comboTimer -= dt
      if (game.comboTimer <= 0) {
        game.combo = 1
      }
    }

    updateHUD()
    updateFollowCamera(clamp(dtRaw, 0.0001, 0.1), game.elapsed)
  } else if (game.state === 'title') {
    input.enabled = false
    skater.update(dt, IDLE_INPUT)
    world.update(dt, game.elapsed)
    updateTitleCamera(dt, game.elapsed)
    input.endFrame()
  } else {
    audio.setRolling(0, false, 0)
    audio.setGrinding(false)
    input.endFrame()
  }

  renderer.render(scene, camera)

  if (firstFrame) {
    firstFrame = false
    ui.loading.classList.add('done')
    window.setTimeout(() => ui.loading.remove(), 700)
  }
}

animate()

/* expose a tiny debug handle for capture / QA */
window.__skate = { game, skater, world, camera, challenges, renderer, scene }
