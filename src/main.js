import * as THREE from 'three'
import './style.css'
import { createWorld } from './world.js'
import { Skater } from './skater.js'

const canvas = document.querySelector('#scene')
const titleScreen = document.querySelector('#title-screen')
const hud = document.querySelector('#hud')
const results = document.querySelector('#results')
const loader = document.querySelector('#loader')
const startButton = document.querySelector('#start-button')
const restartButton = document.querySelector('#restart-button')
const soundButton = document.querySelector('#sound-toggle')
const ui = {
  timer: document.querySelector('#timer'),
  timerFill: document.querySelector('#timer-fill'),
  score: document.querySelector('#score'),
  best: document.querySelector('#best-score'),
  objectiveFill: document.querySelector('#objective-fill'),
  objectivePercent: document.querySelector('#objective-percent'),
  objectiveCopy: document.querySelector('#objective-copy'),
  comboCard: document.querySelector('#combo-card'),
  comboValue: document.querySelector('#combo-value'),
  comboFill: document.querySelector('#combo-fill'),
  speed: document.querySelector('#speed-value'),
  speedMarks: [...document.querySelectorAll('.speed-marks i')],
  trickCallout: document.querySelector('#trick-callout'),
  trickName: document.querySelector('#trick-name'),
  trickPoints: document.querySelector('#trick-points'),
  trickChain: document.querySelector('#trick-chain'),
  grind: document.querySelector('#grind-indicator'),
  balance: document.querySelector('#balance-value'),
  status: document.querySelector('#status-line'),
  grade: document.querySelector('#grade'),
  finalScore: document.querySelector('#final-score'),
  bestTrick: document.querySelector('#stat-best-trick'),
  landings: document.querySelector('#stat-landings'),
  grindTime: document.querySelector('#stat-grind'),
  newBest: document.querySelector('#new-best'),
}

const SESSION_TIME = 120
const SCORE_TARGET = 5000
const GRAVITY = 19.5
const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const lookAt = new THREE.Vector3()
const groundOrigin = new THREE.Vector3()
const DOWN = new THREE.Vector3(0, -1, 0)
const raycaster = new THREE.Raycaster()
raycaster.far = 70

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight, false)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.shadowMap.autoUpdate = false
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.23

const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0xc7dadd, 56, 190)

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 480)
camera.position.set(8, 5, 5)

const skyFill = new THREE.HemisphereLight(0xd9eff7, 0x93856b, 1.16)
scene.add(skyFill)

const sun = new THREE.DirectionalLight(0xffe5ba, 3.55)
sun.position.set(43, 69, 79)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.left = -62
sun.shadow.camera.right = 62
sun.shadow.camera.top = 62
sun.shadow.camera.bottom = -62
sun.shadow.camera.near = 4
sun.shadow.camera.far = 180
sun.shadow.bias = -0.00035
sun.shadow.normalBias = 0.025
sun.shadow.radius = 2.5
scene.add(sun)
scene.add(sun.target)

const fillLight = new THREE.DirectionalLight(0x9ed2ec, 0.8)
fillLight.position.set(-54, 24, -42)
scene.add(fillLight)

const world = createWorld(scene, renderer)
scene.updateMatrixWorld(true)

const skater = new Skater()
scene.add(skater.root)
skater.root.position.copy(world.spawn)

const player = {
  position: world.spawn.clone(),
  heading: world.spawnHeading,
  speed: 0,
  vy: 0,
  grounded: true,
  airborne: false,
  grinding: null,
  groundY: world.spawn.y,
  normal: new THREE.Vector3(0, 1, 0),
  lastRiseRate: 0,
  air: null,
  boardFlip: 0,
  boardFlipTarget: 0,
  steer: 0,
  pushing: false,
  crouching: false,
  jumpCooldown: 0,
}

const game = {
  mode: 'title',
  remaining: SESSION_TIME,
  score: 0,
  comboLevel: 1,
  comboTimer: 0,
  bestTrick: '—',
  bestTrickPoints: 0,
  landings: 0,
  longestGrind: 0,
  best: readBest(),
  calloutTimer: 0,
  statusTimer: 0,
  elapsed: 0,
  shake: 0,
}

function readBest() {
  try {
    return Number(localStorage.getItem('skate3.best') || 0) || 0
  } catch {
    return 0
  }
}

function writeBest(value) {
  try {
    localStorage.setItem('skate3.best', String(value))
  } catch {
    // Storage can be unavailable in private preview frames.
  }
}

ui.best.textContent = `Best ${game.best.toLocaleString('en-US')}`
soundButton.setAttribute('aria-pressed', 'true')

function groundAt(x, z) {
  groundOrigin.set(x, 42, z)
  raycaster.set(groundOrigin, DOWN)
  const hits = raycaster.intersectObjects(world.colliders, false)
  if (!hits.length) return null
  const hit = hits[0]
  const normal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 1, 0)
  return { y: hit.point.y, normal, object: hit.object }
}

function groundAtAhead(distance) {
  const x = player.position.x + Math.sin(player.heading) * distance
  const z = player.position.z - Math.cos(player.heading) * distance
  return groundAt(x, z)
}

function clampToPark() {
  const b = world.bounds
  const cx = THREE.MathUtils.clamp(player.position.x, -b, b)
  const cz = THREE.MathUtils.clamp(player.position.z, -b, b)
  if (cx !== player.position.x || cz !== player.position.z) {
    player.position.x = cx
    player.position.z = cz
    player.speed *= 0.45
  }
}

function setHeadingFromVector(v) {
  player.heading = Math.atan2(v.x, -v.z)
}

function beginAir(verticalVelocity) {
  player.airborne = true
  player.grounded = false
  player.vy = verticalVelocity
  player.air = {
    start: game.elapsed,
    spinStart: player.heading,
    flips: 0,
    maxHeight: 0,
    startY: player.position.y,
  }
  player.boardFlip = 0
  player.boardFlipTarget = 0
  player.crouching = false
}

function jump(velocity = 7.4) {
  if (game.mode !== 'playing') return
  if (player.jumpCooldown > 0) return
  if (player.grinding) {
    endGrind(true)
    player.vy = velocity * 0.82
  } else if (player.grounded) {
    player.position.y += 0.03
    beginAir(velocity)
  } else {
    return
  }
  player.jumpCooldown = 0.15
  audio.jump()
  spawnDust(player.position, 6, 0.55)
}

function triggerFlip(direction) {
  if (!player.airborne || game.mode !== 'playing' || player.grinding) return
  player.air.flips += 1
  player.boardFlipTarget += Math.PI * 2 * (direction > 0 ? 1 : -1)
  audio.flip()
}

function startGrind(rail, closest, distanceAlong, direction) {
  const length = rail.start.distanceTo(rail.end)
  if (length < 0.5) return false
  const towardEnd = direction.dot(new THREE.Vector3().subVectors(rail.end, rail.start)) > 0
  const from = towardEnd ? rail.start : rail.end
  const to = towardEnd ? rail.end : rail.start
  player.grinding = {
    rail,
    direction,
    from,
    to,
    distance: distanceAlong,
    length,
    time: 0,
    start: game.elapsed,
  }
  player.airborne = false
  player.grounded = false
  player.vy = 0
  player.position.copy(closest)
  player.position.y += 0.07
  setHeadingFromVector(direction)
  player.speed = Math.max(player.speed * 0.96, 7.2)
  player.boardFlip = 0
  player.boardFlipTarget = 0
  player.flip = 0
  audio.grind(true)
  ui.grind.classList.add('is-active')
  ui.balance.textContent = rail.label || '50-50'
  setStatus('Grind locked. Ride it out.', 2.5)
  spawnDust(player.position, 5, 0.42)
  return true
}

function endGrind(jumped = false) {
  if (!player.grinding) return
  const grind = player.grinding
  player.grinding = null
  ui.grind.classList.remove('is-active')
  audio.grind(false)
  game.longestGrind = Math.max(game.longestGrind, grind.time)
  if (grind.time > 0.18) {
    const label = grind.time > 1.5
      ? `LONG ${grind.rail.label || '50-50'}`
      : (grind.rail.label || '50-50 GRIND')
    const points = Math.round(120 + grind.time * 190)
    commitTrick(label.replace('HANDRAIL', 'HANDRAIL GRIND'), points)
  }
  player.grounded = false
  player.airborne = true
  player.vy = jumped ? 5.4 : 1.7
  player.position.y += 0.03
  player.air = {
    start: game.elapsed - 0.18,
    spinStart: player.heading,
    flips: 0,
    maxHeight: 0,
    startY: player.position.y,
  }
  player.boardFlip = 0
  player.boardFlipTarget = 0
  if (!jumped) spawnDust(player.position, 5, 0.35)
}

function distanceToSegment(p, a, b) {
  const ab = new THREE.Vector3().subVectors(b, a)
  const t = THREE.MathUtils.clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1)
  const closest = new THREE.Vector3().copy(a).addScaledVector(ab, t)
  return { distance: p.distanceTo(closest), closest, t }
}

function tryGrind() {
  if (!player.airborne || player.vy > 2.8 || player.speed < 3.5) return false
  for (const rail of world.rails) {
    const hit = distanceToSegment(player.position, rail.start, rail.end)
    const vertical = Math.abs(player.position.y - hit.closest.y)
    if (hit.distance < 0.78 && vertical < 0.92) {
      const railDir = new THREE.Vector3().subVectors(rail.end, rail.start).normalize()
      forward.set(Math.sin(player.heading), 0, -Math.cos(player.heading))
      const sign = railDir.dot(forward) >= 0 ? 1 : -1
      const direction = railDir.multiplyScalar(sign)
      const from = sign > 0 ? rail.start : rail.end
      const distanceAlong = hit.closest.distanceTo(from)
      return startGrind(rail, hit.closest, distanceAlong, direction)
    }
  }
  return false
}

function updateGrind(dt) {
  const grind = player.grinding
  if (!grind) return
  grind.time += dt
  grind.distance += player.speed * dt
  const t = grind.distance / grind.length
  if (t >= 1) {
    player.position.copy(grind.to)
    player.position.y += 0.07
    player.speed *= 0.88
    endGrind(false)
    return
  }
  player.position.lerpVectors(grind.from, grind.to, t)
  player.position.y += 0.07
  ui.balance.textContent = grind.rail.label || '50-50'
}

function landOnGround(info) {
  const air = player.air
  const airTime = air ? game.elapsed - air.start : 0
  const spinDeg = air ? Math.abs(player.heading - air.spinStart) * 180 / Math.PI : 0
  const flips = air ? air.flips : 0
  player.grounded = true
  player.airborne = false
  player.grinding = null
  player.vy = 0
  player.position.y = info.y
  player.groundY = info.y
  player.normal.copy(info.normal)
  player.lastRiseRate = 0
  player.boardFlipTarget = 0
  player.boardFlip *= 0.3
  const impact = Math.min(1, airTime * 0.6 + player.speed / 30)
  game.shake = Math.max(game.shake, impact * 0.17)
  spawnDust(player.position, Math.round(10 + impact * 12), 0.6 + impact * 0.7)
  audio.land(impact)

  if (airTime > 0.44 && (spinDeg > 95 || flips > 0)) {
    const spin = Math.round(spinDeg / 180) * 180
    const spinName = spin >= 180 ? `${spin} ` : ''
    let flipName = ''
    if (flips === 1) flipName = 'KICKFLIP'
    else if (flips === 2) flipName = 'DOUBLE KICKFLIP'
    else if (flips > 2) flipName = `${flips}X KICKFLIP`
    else flipName = spin >= 180 ? 'SPIN' : 'OLLIE'
    const name = `${spinName}${flipName}`.trim()
    const points = Math.round(60 + airTime * 130 + (spin / 180) * 105 + flips * 235)
    commitTrick(name, points)
    game.landings += 1
    setStatus(flips > 0 ? 'Bolts. Clean landing.' : 'Smooth. Keep the combo alive.', 2.8)
  } else if (airTime > 0.8) {
    setStatus('Big air. Now find a rail.', 2.4)
  }

  if (air) game.shake = Math.max(game.shake, 0.05)
  player.air = null
}

function updatePlayer(dt) {
  game.elapsed += dt
  game.remaining = Math.max(0, game.remaining - dt)
  game.comboTimer = Math.max(0, game.comboTimer - dt)
  game.calloutTimer = Math.max(0, game.calloutTimer - dt)
  game.statusTimer = Math.max(0, game.statusTimer - dt)
  player.jumpCooldown = Math.max(0, player.jumpCooldown - dt)

  if (game.comboTimer === 0) {
    game.comboLevel = 1
    ui.comboCard.classList.remove('is-active')
  }

  if (game.remaining <= 0) {
    finishSession()
    return
  }

  const throttle = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0)
  const steer = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0)
  player.steer += (steer - player.steer) * Math.min(1, dt * 10)
  player.pushing = throttle > 0 && player.grounded && !player.grinding
  player.crouching = keys.has('Space') && player.grounded

  if (player.grinding) {
    if (steer !== 0) {
      player.heading += steer * 0.1 * dt
    }
    updateGrind(dt)
    applySkaterTransform(dt)
    return
  }

  if (player.airborne) {
    if (steer !== 0) {
      player.heading += steer * 3.55 * dt
    }
    player.speed -= player.speed * 0.035 * dt
  } else {
    if (throttle > 0) player.speed += 8.2 * dt
    if (throttle < 0) player.speed -= 14 * dt
    player.speed -= player.speed * (throttle < 0 ? 0.8 : 0.115) * dt
    player.speed = THREE.MathUtils.clamp(player.speed, 0, 19.8)
    player.heading += steer * (1.0 + Math.min(player.speed / 10, 1) * 1.35) * dt
  }

  forward.set(Math.sin(player.heading), 0, -Math.cos(player.heading))

  if (player.grounded) {
    const ahead = groundAtAhead(1.05)
    if (ahead) {
      const grade = (ahead.y - player.position.y) / 1.05
      player.speed -= grade * 10.6 * dt
      player.speed = Math.max(0, player.speed)
    }
  }

  const oldX = player.position.x
  const oldZ = player.position.z
  const oldY = player.position.y
  player.position.x += forward.x * player.speed * dt
  player.position.z += forward.z * player.speed * dt
  clampToPark()

  const info = groundAt(player.position.x, player.position.z)

  if (player.grounded) {
    if (!info) {
      beginAir(0)
    } else if (info.y - oldY > 0.62) {
      player.position.x = oldX
      player.position.z = oldZ
      player.speed *= 0.18
      game.shake = Math.max(game.shake, 0.12)
      audio.bump()
      setStatus('That wall is not a ramp.', 2.2)
    } else if (oldY - info.y > 0.46) {
      beginAir(Math.max(0, Math.min(9.4, player.lastRiseRate * 0.72)))
      player.air.startY = oldY
    } else {
      const rise = info.y - oldY
      player.lastRiseRate = THREE.MathUtils.clamp(rise / Math.max(dt, 0.001), -12, 12)
      player.position.y = info.y
      player.groundY = info.y
      player.normal.copy(info.normal)
      if (info.normal.y < 0.58 && player.speed > 8.4) {
        beginAir(Math.max(3.2, player.speed * 0.55))
      }
    }
  }

  if (player.airborne) {
    player.vy -= GRAVITY * dt
    player.position.y += player.vy * dt
    if (player.air) player.air.maxHeight = Math.max(player.air.maxHeight, player.position.y)

    if (tryGrind()) {
      applySkaterTransform(dt)
      return
    }

    const currentGround = groundAt(player.position.x, player.position.z)
    if (currentGround && player.position.y <= currentGround.y && player.vy <= 0) {
      landOnGround(currentGround)
    } else if (player.position.y < -8) {
      player.position.copy(world.spawn)
      player.heading = world.spawnHeading
      player.speed = 0
      player.vy = 0
      player.grounded = true
      player.airborne = false
      player.air = null
    }
  }

  const spin = player.air ? Math.abs(player.heading - player.air.spinStart) * 180 / Math.PI : 0
  if (game.statusTimer <= 0) {
    setStatus(player.airborne
      ? (player.air?.flips ? 'Flip it. Spot the landing.' : spin > 150 ? 'Keep spinning.' : 'Airborne. Stick it.')
      : player.speed > 13
        ? 'Fast line. Commit.'
        : 'Find a line. Land clean.', 0)
  }

  player.boardFlip += (player.boardFlipTarget - player.boardFlip) * Math.min(1, dt * 13)
  applySkaterTransform(dt)
}

function applySkaterTransform(dt) {
  skater.root.position.copy(player.position)
  skater.root.rotation.y = -player.heading
  skater.update(dt, {
    speed: player.speed,
    steer: player.steer,
    pushing: player.pushing,
    crouching: player.crouching,
    airborne: player.airborne,
    grinding: Boolean(player.grinding),
    boardFlip: player.boardFlip,
    boardYaw: 0,
  })
}

function setStatus(text, duration = 0) {
  if (ui.status.textContent === text && duration === 0) return
  ui.status.textContent = text
  game.statusTimer = duration
}

function commitTrick(name, basePoints) {
  const points = Math.round(basePoints * game.comboLevel)
  game.score += points
  game.comboTimer = 4.6
  if (points > game.bestTrickPoints) {
    game.bestTrickPoints = points
    game.bestTrick = name
  }
  showCallout(name, points)
  audio.trick(points)
  game.comboLevel = Math.min(8, game.comboLevel + 1)
  ui.comboValue.textContent = String(game.comboLevel)
  ui.comboCard.classList.add('is-active')
  if (game.score >= SCORE_TARGET) {
    ui.objectiveCopy.textContent = 'Target smashed. Keep stacking for a higher grade.'
  }
}

function showCallout(name, points) {
  ui.trickName.textContent = name
  ui.trickPoints.textContent = `+${points.toLocaleString('en-US')}`
  ui.trickChain.textContent = `Combo x${game.comboLevel}`
  ui.trickCallout.classList.remove('is-active')
  void ui.trickCallout.offsetWidth
  ui.trickCallout.classList.add('is-active')
  game.calloutTimer = 1.85
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function updateHud(dt) {
  ui.timer.textContent = formatTime(game.remaining)
  ui.timer.classList.toggle('is-low', game.remaining <= 30)
  ui.timerFill.style.transform = `scaleX(${Math.max(0, game.remaining / SESSION_TIME)})`
  ui.timerFill.style.background = game.remaining <= 30 ? 'var(--orange)' : 'var(--teal)'
  ui.score.textContent = game.score.toLocaleString('en-US')
  ui.speed.textContent = String(Math.round(player.speed * 3.6))
  const speedRatio = Math.min(1, player.speed / 19.8)
  const onMarks = Math.round(speedRatio * ui.speedMarks.length)
  ui.speedMarks.forEach((mark, index) => mark.classList.toggle('is-on', index < onMarks))

  const objective = Math.min(1, game.score / SCORE_TARGET)
  ui.objectiveFill.style.width = `${objective * 100}%`
  ui.objectivePercent.textContent = `${Math.round(objective * 100)}%`

  const comboProgress = game.comboTimer / 4.6
  ui.comboFill.style.transform = `scaleX(${Math.max(0, comboProgress)})`

  if (game.calloutTimer <= 0) {
    ui.trickCallout.classList.remove('is-active')
  }

  if (player.grinding) {
    ui.grind.classList.add('is-active')
  } else {
    ui.grind.classList.remove('is-active')
  }
}

function updateCamera(dt) {
  const t = game.elapsed + game.remaining
  if (game.mode === 'title') {
    const drift = Math.sin(t * 0.08) * 1.2
    camera.position.set(player.position.x - 6.0 + drift, 4.35 + Math.sin(t * 0.2) * 0.14, player.position.z + 10.6)
    lookAt.set(player.position.x - 2.1, 1.8, player.position.z - 10.8)
    camera.lookAt(lookAt)
    camera.fov += (56 - camera.fov) * Math.min(1, dt * 2.5)
    camera.updateProjectionMatrix()
    return
  }

  if (game.mode === 'finished') {
    const orbit = 2.1 + (t - game.elapsed) * 0.035
    lookAt.set(player.position.x, 1.15, player.position.z)
    camera.position.lerp(new THREE.Vector3(
      lookAt.x + Math.sin(orbit) * 10.5,
      3.8,
      lookAt.z + Math.cos(orbit) * 10.5,
    ), 1 - Math.exp(-dt * 1.2))
    camera.lookAt(lookAt)
    return
  }

  forward.set(Math.sin(player.heading), 0, -Math.cos(player.heading))
  right.set(Math.cos(player.heading), 0, Math.sin(player.heading))

  const distance = 6.8 + Math.min(player.speed, 20) * 0.055 + (player.airborne ? 0.4 : 0)
  const height = 3.55 + (player.grinding ? -0.38 : 0) + (player.airborne ? 0.22 : 0)
  const desiredX = player.position.x - forward.x * distance + right.x * 0.2
  const desiredZ = player.position.z - forward.z * distance + right.z * 0.2
  const desiredY = player.position.y + height + (player.speed > 15 ? 0.12 : 0)

  const smooth = 1 - Math.exp(-dt * (player.grinding ? 7.5 : 5.2))
  camera.position.x += (desiredX - camera.position.x) * smooth
  camera.position.y += (desiredY - camera.position.y) * smooth
  camera.position.z += (desiredZ - camera.position.z) * smooth

  const groundBelowCamera = groundAt(camera.position.x, camera.position.z)
  if (groundBelowCamera && camera.position.y < groundBelowCamera.y + 0.9) {
    camera.position.y = groundBelowCamera.y + 0.9
  }

  if (game.shake > 0.001) {
    camera.position.x += (Math.random() - 0.5) * game.shake
    camera.position.y += (Math.random() - 0.5) * game.shake
    game.shake *= Math.exp(-dt * 7)
  }

  lookAt.set(
    player.position.x + forward.x * (3.8 + player.speed * 0.12),
    player.position.y + 1.18,
    player.position.z + forward.z * (3.8 + player.speed * 0.12),
  )
  camera.lookAt(lookAt)

  const targetFov = 58 + Math.min(12, player.speed * 0.55) + (player.airborne ? 2.2 : 0)
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 3)
  camera.updateProjectionMatrix()
}

function startSession() {
  if (game.mode === 'playing') return
  game.mode = 'playing'
  game.remaining = SESSION_TIME
  game.score = 0
  game.comboLevel = 1
  game.comboTimer = 0
  game.bestTrick = '—'
  game.bestTrickPoints = 0
  game.landings = 0
  game.longestGrind = 0
  game.calloutTimer = 0
  game.statusTimer = 0
  game.elapsed = 0
  game.shake = 0
  player.position.copy(world.spawn)
  player.position.y = 0.02
  player.heading = world.spawnHeading
  player.speed = 0
  player.vy = 0
  player.grounded = true
  player.airborne = false
  player.grinding = null
  player.air = null
  player.boardFlip = 0
  player.boardFlipTarget = 0
  player.lastRiseRate = 0
  player.jumpCooldown = 0
  const startGround = groundAt(player.position.x, player.position.z)
  if (startGround) {
    player.position.y = startGround.y
    player.groundY = startGround.y
  }
  keys.clear()
  ui.comboCard.classList.remove('is-active')
  ui.trickCallout.classList.remove('is-active')
  ui.grind.classList.remove('is-active')
  hud.classList.remove('is-hidden')
  ui.objectiveCopy.textContent = 'Stack tricks and keep the combo alive.'
  ui.status.textContent = 'Find a line. Land clean.'
  titleScreen.classList.add('is-hidden')
  titleScreen.setAttribute('aria-hidden', 'true')
  hud.classList.remove('is-hidden')
  hud.setAttribute('aria-hidden', 'false')
  results.classList.remove('is-visible')
  results.setAttribute('aria-hidden', 'true')
  ui.newBest.classList.remove('is-visible')
  skater.root.position.copy(player.position)
  skater.root.rotation.y = -player.heading

  forward.set(Math.sin(player.heading), 0, -Math.cos(player.heading))
  camera.position.set(
    player.position.x - forward.x * 6.8,
    player.position.y + 3.6,
    player.position.z - forward.z * 6.8,
  )
  camera.fov = 58
  camera.lookAt(player.position.x, 1.3, player.position.z)
  camera.updateProjectionMatrix()
  audio.start()
  audio.rolling(player.speed)
  updateHud(0)
}

function restartSession() {
  game.mode = 'title'
  startSession()
}

function finishSession() {
  game.mode = 'finished'
  player.speed = 0
  player.pushing = false
  player.airborne = false
  player.grinding = null
  ui.grind.classList.remove('is-active')
  audio.grind(false)
  audio.finish()
  const score = game.score
  const grade = score >= 9000 ? 'S' : score >= 5500 ? 'A' : score >= 3200 ? 'B' : score >= 1500 ? 'C' : 'D'
  ui.grade.textContent = grade
  ui.finalScore.textContent = score.toLocaleString('en-US')
  ui.bestTrick.textContent = game.bestTrick
  ui.landings.textContent = String(game.landings)
  ui.grindTime.textContent = `${game.longestGrind.toFixed(1)}s`
  const isBest = score > game.best
  if (isBest) {
    game.best = score
    writeBest(score)
    ui.best.textContent = `Best ${score.toLocaleString('en-US')}`
  }
  ui.newBest.classList.toggle('is-visible', isBest && score > 0)
  hud.classList.add('is-hidden')
  hud.setAttribute('aria-hidden', 'true')
  results.classList.add('is-visible')
  results.setAttribute('aria-hidden', 'false')
}

const keys = new Set()

window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault()
  }
  if (event.repeat) return
  keys.add(event.code)

  if (game.mode === 'playing') {
    if (event.code === 'Space') jump()
    if (event.code === 'KeyW') triggerFlip(1)
    if (event.code === 'KeyS') triggerFlip(-1)
    if (event.code === 'KeyR') restartSession()
    if (event.code === 'KeyM') toggleSound()
  } else if (game.mode === 'title' && (event.code === 'Enter' || event.code === 'Space')) {
    startSession()
  } else if (game.mode === 'finished' && event.code === 'Enter') {
    restartSession()
  }
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

window.addEventListener('blur', () => keys.clear())

window.addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
})

startButton.addEventListener('click', startSession)
restartButton.addEventListener('click', restartSession)
soundButton.addEventListener('click', toggleSound)

/* ---------- transient dust ---------- */

function makePuffTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 96
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(48, 48, 1, 48, 48, 46)
  g.addColorStop(0, 'rgba(255,248,228,0.85)')
  g.addColorStop(0.45, 'rgba(231,222,199,0.35)')
  g.addColorStop(1, 'rgba(225,216,192,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 96, 96)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const puffTexture = makePuffTexture()
const dust = []
for (let i = 0; i < 42; i++) {
  const material = new THREE.SpriteMaterial({
    map: puffTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.visible = false
  sprite.userData = { life: 0, maxLife: 1, velocity: new THREE.Vector3(), growth: 1 }
  scene.add(sprite)
  dust.push(sprite)
}

function spawnDust(position, count = 8, strength = 0.6) {
  let spawned = 0
  for (const sprite of dust) {
    if (sprite.visible) continue
    sprite.visible = true
    sprite.position.set(
      position.x + (Math.random() - 0.5) * 0.7,
      position.y + 0.08,
      position.z + (Math.random() - 0.5) * 0.7,
    )
    const angle = Math.random() * Math.PI * 2
    const speed = (0.5 + Math.random() * 1.3) * strength
    sprite.userData.velocity.set(Math.cos(angle) * speed, 0.18 + Math.random() * 0.5 * strength, Math.sin(angle) * speed)
    sprite.userData.life = 0.42 + Math.random() * 0.5
    sprite.userData.maxLife = sprite.userData.life
    sprite.userData.growth = 0.55 + Math.random() * 0.8
    sprite.scale.setScalar(0.32 + Math.random() * 0.32)
    sprite.material.opacity = 0.45 * strength + 0.12
    if (++spawned >= count) break
  }
}

function updateDust(dt) {
  for (const sprite of dust) {
    if (!sprite.visible) continue
    const data = sprite.userData
    data.life -= dt
    if (data.life <= 0) {
      sprite.visible = false
      sprite.material.opacity = 0
      continue
    }
    sprite.position.addScaledVector(data.velocity, dt)
    data.velocity.y -= 0.45 * dt
    data.velocity.multiplyScalar(1 - dt * 1.8)
    const progress = 1 - data.life / data.maxLife
    sprite.scale.setScalar((0.32 + progress * data.growth) * 2.2)
    sprite.material.opacity = (1 - progress) * 0.36
  }
}

/* ---------- audio ---------- */

class Soundscape {
  constructor() {
    this.context = null
    this.master = null
    this.rollingGain = null
    this.grindGain = null
    this.enabled = true
  }

  start() {
    if (!this.enabled) return
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.32
      this.master.connect(this.context.destination)

      const len = this.context.sampleRate * 2
      const buffer = this.context.createBuffer(1, len, this.context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

      const wind = this.context.createBufferSource()
      wind.buffer = buffer
      wind.loop = true
      const windFilter = this.context.createBiquadFilter()
      windFilter.type = 'lowpass'
      windFilter.frequency.value = 480
      const windGain = this.context.createGain()
      windGain.gain.value = 0.04
      wind.connect(windFilter).connect(windGain).connect(this.master)
      wind.start()

      const roll = this.context.createBufferSource()
      roll.buffer = buffer
      roll.loop = true
      const rollFilter = this.context.createBiquadFilter()
      rollFilter.type = 'bandpass'
      rollFilter.frequency.value = 170
      rollFilter.Q.value = 0.7
      this.rollingGain = this.context.createGain()
      this.rollingGain.gain.value = 0
      roll.connect(rollFilter).connect(this.rollingGain).connect(this.master)
      roll.start()

      const grind = this.context.createBufferSource()
      grind.buffer = buffer
      grind.loop = true
      const grindFilter = this.context.createBiquadFilter()
      grindFilter.type = 'highpass'
      grindFilter.frequency.value = 2200
      this.grindGain = this.context.createGain()
      this.grindGain.gain.value = 0
      grind.connect(grindFilter).connect(this.grindGain).connect(this.master)
      grind.start()
    }
    if (this.context.state === 'suspended') this.context.resume()
  }

  tone(freq, duration, type = 'triangle', volume = 0.08, delay = 0) {
    if (!this.enabled || !this.context) return
    const now = this.context.currentTime + delay
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(this.master)
    osc.start(now)
    osc.stop(now + duration + 0.03)
  }

  rolling(speed) {
    if (!this.rollingGain || !this.context) return
    const target = this.enabled ? Math.min(0.11, speed / 19.8 * 0.12) : 0
    this.rollingGain.gain.setTargetAtTime(target, this.context.currentTime, 0.09)
  }

  grind(active) {
    if (!this.grindGain || !this.context) return
    this.grindGain.gain.setTargetAtTime(active && this.enabled ? 0.045 : 0, this.context.currentTime, 0.05)
  }

  jump() {
    this.tone(170, 0.15, 'sine', 0.08)
    this.tone(85, 0.1, 'triangle', 0.04)
  }

  flip() {
    this.tone(540, 0.08, 'square', 0.025)
  }

  land(impact = 1) {
    this.tone(75, 0.15, 'sine', 0.05 + impact * 0.05)
  }

  bump() {
    this.tone(55, 0.16, 'square', 0.035)
  }

  trick(points) {
    const note = points > 700 ? 660 : points > 400 ? 550 : 470
    this.tone(note, 0.14, 'triangle', 0.045)
    this.tone(note * 1.5, 0.2, 'triangle', 0.026, 0.045)
  }

  finish() {
    this.tone(392, 0.22, 'triangle', 0.05)
    this.tone(523, 0.25, 'triangle', 0.045, 0.12)
    this.tone(659, 0.34, 'triangle', 0.042, 0.24)
  }

  toggle() {
    this.enabled = !this.enabled
    if (!this.enabled) {
      this.rolling(0)
      this.grind(false)
      if (this.master) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.04)
    } else {
      this.start()
      if (this.master) this.master.gain.setTargetAtTime(0.32, this.context.currentTime, 0.04)
    }
    return this.enabled
  }
}

const audio = new Soundscape()

function toggleSound() {
  const enabled = audio.toggle()
  soundButton.classList.toggle('is-muted', !enabled)
  soundButton.querySelector('.sound-label').textContent = enabled ? 'Sound on' : 'Sound off'
  soundButton.setAttribute('aria-pressed', String(enabled))
}

/* ---------- boot / render loop ---------- */

function updateWorldState(dt) {
  world.update(dt, game.elapsed + 12)
  updateDust(dt)
  audio.rolling(player.grounded ? player.speed : 0)
}

let lastTime = performance.now()
let firstFrame = true
let shadowFrame = 0

function animate(now) {
  requestAnimationFrame(animate)
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))
  lastTime = now

  if (game.mode === 'playing') {
    updatePlayer(dt)
    updateHud(dt)
  } else if (game.mode === 'title') {
    game.elapsed += dt
    player.steer = 0
    player.pushing = false
    skater.update(dt, {
      speed: 0,
      steer: 0,
      pushing: false,
      crouching: false,
      airborne: false,
      grinding: false,
      boardFlip: 0,
      boardYaw: 0,
    })
  }

  updateWorldState(dt)
  updateCamera(dt)
  skater.root.position.copy(player.position)
  skater.root.rotation.y = -player.heading
  shadowFrame += 1
  if (firstFrame || shadowFrame % 2 === 0) renderer.shadowMap.needsUpdate = true
  renderer.render(scene, camera)

  if (firstFrame) {
    firstFrame = false
    window.setTimeout(() => loader.classList.add('is-hidden'), 80)
  }
}

const initialGround = groundAt(player.position.x, player.position.z)
if (initialGround) player.position.y = initialGround.y
skater.root.position.copy(player.position)
updateCamera(0.016)
requestAnimationFrame(animate)
