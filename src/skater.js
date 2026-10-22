import * as THREE from 'three'

const TAU = Math.PI * 2
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt))

function makeBoardGraphic() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 512, 512)
  g.addColorStop(0, '#ff7a2f')
  g.addColorStop(1, '#ff4a12')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  ctx.save()
  ctx.translate(256, 256)
  ctx.rotate(-0.18)
  ctx.font = 'italic 900 330px "Arial Black", Impact, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#101116'
  ctx.fillText('3', 0, 12)
  ctx.strokeStyle = '#f4e7cf'
  ctx.lineWidth = 10
  ctx.strokeText('3', 0, 12)
  ctx.restore()
  ctx.fillStyle = 'rgba(16,17,22,0.85)'
  ctx.fillRect(40, 40, 432, 26)
  ctx.fillRect(40, 446, 432, 26)
  ctx.font = '700 34px monospace'
  ctx.fillStyle = '#101116'
  ctx.textAlign = 'center'
  ctx.fillText('PORT CARVERTON', 256, 448)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function limb(radius, length, mat) {
  const geo = new THREE.CapsuleGeometry(radius, length, 4, 8)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  return mesh
}

export class Skater {
  constructor(scene, world, audio, callbacks) {
    this.scene = scene
    this.world = world
    this.audio = audio
    this.callbacks = callbacks
    this.group = new THREE.Group()
    scene.add(this.group)

    this.position = new THREE.Vector3(0, 0, 0)
    this.airVelocity = new THREE.Vector3()
    this.heading = Math.PI
    this.speed = 0
    this.vy = 0
    this.mode = 'ground'
    this.airTime = 0
    this.groundTime = 0
    this.charging = false
    this.charge = 0
    this.spin = 0
    this.kickflips = 0
    this.heelflips = 0
    this.shuvits = 0
    this.grabTime = 0
    this.grabbing = false
    this.rail = null
    this.railT = 0
    this.railDir = 1
    this.balance = 0
    this.balancePhase = 0
    this.grindTime = 0
    this.grindPoints = 0
    this.grindName = '50-50'
    this.grindCooldown = 0
    this.bailTimer = 0
    this.lastSafe = new THREE.Vector3(0, 0, 22)
    this.sparkTimer = 0
    this.wheelSpin = 0
    this.pushTimer = 0
    this.pushPulse = 0
    this.visual = {
      crouch: 0, lean: 0, flip: 0, flipTarget: 0, shuv: 0, shuvTarget: 0,
      grab: 0, bail: 0, pitch: 0, yawOffset: 0,
    }
    this._buildModel()
    this.reset(world.spawn.x, world.spawn.z, world.spawn.heading)
  }

  /* ------------------------------------------------------------------ */
  /*  model                                                             */
  /* ------------------------------------------------------------------ */

  _buildModel() {
    const orange = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.78 })
    const orangeDark = new THREE.MeshStandardMaterial({ color: 0xc73d10, roughness: 0.82 })
    const pants = new THREE.MeshStandardMaterial({ color: 0x252838, roughness: 0.9 })
    const skin = new THREE.MeshStandardMaterial({ color: 0xd8a273, roughness: 0.75 })
    const shoe = new THREE.MeshStandardMaterial({ color: 0xefe9df, roughness: 0.65 })
    const sole = new THREE.MeshStandardMaterial({ color: 0x1b1c22, roughness: 0.8 })
    const beanieMat = new THREE.MeshStandardMaterial({ color: 0x22c8b4, roughness: 0.85 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x16171d, roughness: 0.7 })
    const metal = new THREE.MeshStandardMaterial({ color: 0xc9d0d8, metalness: 0.85, roughness: 0.3 })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf0e6c9, roughness: 0.62 })
    this.materials = { orange, orangeDark, pants, skin, shoe, sole, beanieMat, dark }

    const lean = new THREE.Group()
    this.group.add(lean)
    this.leanGroup = lean

    const board = new THREE.Group()
    board.position.y = 0.21
    lean.add(board)
    this.boardGroup = board

    const deckMat = new THREE.MeshStandardMaterial({ color: 0xe8551d, roughness: 0.78 })
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.07, 1.72), deckMat)
    deck.castShadow = true
    board.add(deck)

    for (const side of [-1, 1]) {
      const kick = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 0.27), deckMat)
      kick.position.set(0, 0.02, side * 0.92)
      kick.rotation.x = side * 0.24
      kick.castShadow = true
      board.add(kick)
    }

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.012, 1.98),
      new THREE.MeshStandardMaterial({ color: 0x111216, roughness: 0.98 })
    )
    grip.position.y = 0.043
    board.add(grip)

    const graphic = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 1.86),
      new THREE.MeshStandardMaterial({ map: makeBoardGraphic(), roughness: 0.55 })
    )
    graphic.rotation.x = Math.PI / 2
    graphic.position.y = -0.041
    board.add(graphic)

    const truckGeo = new THREE.BoxGeometry(0.62, 0.07, 0.11)
    for (const z of [-0.66, 0.66]) {
      const truck = new THREE.Mesh(truckGeo, metal)
      truck.position.set(0, -0.085, z)
      truck.castShadow = true
      board.add(truck)
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.26), metal)
      base.position.set(0, -0.055, z)
      board.add(base)
    }

    this.wheels = []
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.09, 14)
    for (const z of [-0.66, 0.66]) {
      for (const x of [-0.29, 0.29]) {
        const pivot = new THREE.Group()
        pivot.position.set(x, -0.11, z)
        const wheel = new THREE.Mesh(wheelGeo, wheelMat)
        wheel.rotation.z = Math.PI / 2
        wheel.castShadow = true
        pivot.add(wheel)
        board.add(pivot)
        this.wheels.push(pivot)
      }
    }

    const body = new THREE.Group()
    body.position.y = 0.215
    body.rotation.y = Math.PI / 2
    lean.add(body)
    this.bodyGroup = body

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.26), pants)
    pelvis.position.y = 0.88
    pelvis.castShadow = true
    body.add(pelvis)

    const torso = new THREE.Group()
    torso.position.y = 0.96
    body.add(torso)
    this.torso = torso

    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.34, 4, 10), orange)
    chest.scale.set(1, 1, 0.78)
    chest.position.y = 0.31
    chest.castShadow = true
    torso.add(chest)

    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.075, 6, 12, Math.PI), orangeDark)
    hood.position.set(0, 0.56, -0.1)
    hood.rotation.x = Math.PI / 2
    torso.add(hood)

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.2), new THREE.MeshStandardMaterial({ color: 0x1f6f68, roughness: 0.85 }))
    backpack.position.set(0, 0.3, -0.26)
    backpack.castShadow = true
    torso.add(backpack)
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.24), dark)
    strap.position.set(0, 0.43, -0.2)
    torso.add(strap)

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8), skin)
    neck.position.y = 0.58
    torso.add(neck)

    const head = new THREE.Group()
    head.position.y = 0.73
    torso.add(head)
    this.head = head
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), skin)
    skull.castShadow = true
    head.add(skull)

    const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.192, 14, 8, 0, TAU, 0, Math.PI * 0.54), beanieMat)
    beanie.position.y = 0.035
    beanie.castShadow = true
    head.add(beanie)
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.2, 0.075, 16), beanieMat)
    brim.position.y = 0.05
    head.add(brim)
    const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), beanieMat)
    bobble.position.y = 0.2
    head.add(bobble)

    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.055), dark)
    shades.position.set(0, 0.015, 0.168)
    head.add(shades)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 6), skin)
    nose.position.set(0, -0.06, 0.18)
    nose.rotation.x = Math.PI / 2
    head.add(nose)

    // arms
    this.arms = []
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group()
      shoulder.position.set(side * 0.31, 0.47, 0)
      torso.add(shoulder)
      const upper = limb(0.072, 0.24, orange)
      upper.position.y = -0.17
      shoulder.add(upper)
      const elbow = new THREE.Group()
      elbow.position.y = -0.33
      shoulder.add(elbow)
      const fore = limb(0.062, 0.2, orangeDark)
      fore.position.y = -0.15
      elbow.add(fore)
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 7), skin)
      hand.position.y = -0.3
      hand.castShadow = true
      elbow.add(hand)
      this.arms.push({ side, shoulder, elbow, hand })
    }

    // legs
    this.legs = []
    for (const side of [-1, 1]) {
      const hip = new THREE.Group()
      hip.position.set(side * 0.17, 0.84, 0)
      body.add(hip)
      const thigh = limb(0.105, 0.28, pants)
      thigh.position.y = -0.2
      hip.add(thigh)
      const knee = new THREE.Group()
      knee.position.y = -0.4
      hip.add(knee)
      const shin = limb(0.088, 0.22, pants)
      shin.position.y = -0.16
      knee.add(shin)
      const shoeGroup = new THREE.Group()
      shoeGroup.position.y = -0.33
      knee.add(shoeGroup)
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.31), shoe)
      boot.position.set(0, 0.02, 0.05)
      boot.castShadow = true
      shoeGroup.add(boot)
      const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.035, 0.32), sole)
      shoeSole.position.set(0, -0.045, 0.05)
      shoeGroup.add(shoeSole)
      this.legs.push({ side, hip, knee, shoe: shoeGroup })
    }

    this.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = false
      }
    })

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 24),
      new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.34, depthWrite: false })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.renderOrder = 2
    this.scene.add(shadow)
    this.shadow = shadow
  }

  /* ------------------------------------------------------------------ */
  /*  state                                                             */
  /* ------------------------------------------------------------------ */

  reset(x = this.world.spawn.x, z = this.world.spawn.z, heading = this.world.spawn.heading) {
    this.position.set(x, this.world.heightAt(x, z), z)
    this.heading = heading
    this.speed = 0
    this.vy = 0
    this.mode = 'ground'
    this.airTime = 0
    this.groundTime = 0
    this.charging = false
    this.charge = 0
    this.spin = 0
    this.kickflips = 0
    this.heelflips = 0
    this.shuvits = 0
    this.grabTime = 0
    this.grabbing = false
    this.rail = null
    this.bailTimer = 0
    this.grindCooldown = 0
    this.lastSafe.copy(this.position)
    this.visual.flip = 0
    this.visual.flipTarget = 0
    this.visual.shuv = 0
    this.visual.shuvTarget = 0
    this.visual.crouch = 0
    this.visual.bail = 0
    this.visual.lean = 0
    this.visual.yawOffset = 0
    this.group.rotation.set(0, heading, 0)
    this.group.position.copy(this.position)
  }

  get forward() {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading))
  }

  get grounded() {
    return this.mode === 'ground'
  }

  _startAir(vx, vz, vy, preserveTricks = false) {
    this.mode = 'air'
    this.airVelocity.set(vx, vy, vz)
    this.vy = vy
    this.airTime = preserveTricks ? this.airTime : 0
    this.airStartHeading = this.heading
    this.airStartHeadingSet = true
    if (!preserveTricks) {
      this.spin = 0
      this.kickflips = 0
      this.heelflips = 0
      this.shuvits = 0
      this.grabTime = 0
      this.grabbing = false
      this.callbacks.onAirStart?.()
    }
  }

  ollie() {
    if (this.mode === 'grind') {
      const dir = new THREE.Vector3().subVectors(this.rail.b, this.rail.a).normalize().multiplyScalar(this.railDir)
      this._endGrind(true)
      this._startAir(dir.x * this.speed, dir.z * this.speed, 5.2, true)
      this.audio.ollie()
      this.charge = 0
      return
    }
    if (this.mode !== 'ground') return
    const power = 4.6 + this.charge * 7.4
    const f = this.forward
    const boost = 0.35 + this.charge * 0.8
    this._startAir(f.x * (this.speed + boost), f.z * (this.speed + boost), power, false)
    this.position.y += 0.02
    this.audio.ollie()
    this.charge = 0
    this.charging = false
  }

  bail(reason = 'balance') {
    if (this.mode === 'bail') return
    this.mode = 'bail'
    this.bailTimer = 1.75
    this.rail = null
    this.grinding = false
    this.audio.bail()
    this.callbacks.onBail?.(reason)
    this.world.spawnDust(this.position.clone().setY(this.position.y + 0.4), 22, 1.3)
  }

  _endGrind(pop = false) {
    if (this.mode !== 'grind') return
    const points = Math.round(this.grindPoints)
    const duration = this.grindTime
    this.callbacks.onGrindEnd?.({ points, name: this.grindName, duration, rail: this.rail })
    this.audio.setGrinding(false)
    this.rail = null
    this.mode = 'air'
    this.grindCooldown = 0.35
    this.spin = 0
    this.kickflips = 0
    this.heelflips = 0
    this.shuvits = 0
    this.grabTime = 0
    if (!pop) {
      this.airVelocity.set(0, 0, 0)
      this.vy = 0
    }
  }

  /* ------------------------------------------------------------------ */
  /*  update                                                            */
  /* ------------------------------------------------------------------ */

  update(dt, input, cameraShake) {
    this.groundTime += dt
    if (this.grindCooldown > 0) this.grindCooldown -= dt

    if (this.mode === 'bail') {
      this._updateBail(dt)
      this._updateVisual(dt, input)
      this._syncTransform()
      return
    }

    if (this.mode === 'ground') this._updateGround(dt, input)
    else if (this.mode === 'air') this._updateAir(dt, input)
    else if (this.mode === 'grind') this._updateGrind(dt, input)

    this._updateVisual(dt, input)
    this._syncTransform(dt, cameraShake)
  }

  _updateGround(dt, input) {
    const f = this.forward
    const world = this.world

    const slope = world.slopeAlong(this.position.x, this.position.z, f.x, f.z)

    let accel = 0
    if (input.throttle) {
      this.pushTimer += dt
      if (this.pushTimer > 0.52) {
        this.pushTimer = 0
        this.pushPulse = 1
        this.speed = Math.min(this.speed + 0.55, 15.5)
        this.audio.setRolling(Math.max(this.speed, 3), true, 0)
        this.audio.pop(0.32)
      }
      accel += 5.6
    } else {
      this.pushTimer = 0.5
    }
    if (input.brake) accel -= 13
    accel -= slope * 10.5
    accel -= this.speed * 0.11

    this.speed += accel * dt
    const maxSpeed = 15.5
    this.speed = clamp(this.speed, -6.5, maxSpeed)

    if (Math.abs(this.speed) < 0.03 && !input.throttle && Math.abs(slope) < 0.02) this.speed = 0

    const steer = input.steer
    const grip = clamp(Math.abs(this.speed) / 3.4, 0, 1)
    const turnRate = 2.25 * grip * (this.speed < 0 ? -1 : 1)
    this.heading += steer * turnRate * dt

    const fx = Math.sin(this.heading)
    const fz = Math.cos(this.heading)
    this.position.x += fx * this.speed * dt
    this.position.z += fz * this.speed * dt

    this._clampToPark()

    const h = world.heightAt(this.position.x, this.position.z)
    this.position.y = h
    this.lastSafe.set(this.position.x, this.position.y, this.position.z)

    if (this.charging) {
      this.charge = Math.min(0.65, this.charge + dt)
    }

    if (input.hit('Space')) {
      this.charging = true
      this.charge = 0
    }
    if (this.charging && input.up('Space')) {
      this.charging = false
      this.ollie()
      return
    }

    if (this.mode === 'ground') {
      this.vy = 0
      this.airTime = 0

      const q = this.world.quarter
      const inQuarter = this.position.x > q.xMin + 1 && this.position.x < q.xMax - 1 &&
        this.position.z < q.launchZ && this.position.z > q.topZ && this.speed > 4.5
      if (inQuarter && fz < -0.2) {
        const power = 8.2 + this.speed * 0.65
        this._startAir(-fx * this.speed * 0.18, -fz * this.speed * 0.18, power, false)
        this.audio.ollie()
        this.callbacks.onRampLaunch?.()
        return
      }
    }
  }

  _updateAir(dt, input) {
    this.airTime += dt
    const spinRate = 6.2
    if (input.down('KeyA', 'ArrowLeft')) this.heading += spinRate * dt
    if (input.down('KeyD', 'ArrowRight')) this.heading -= spinRate * dt
    this.spin = Math.abs(this.heading - this.airStartHeading) * (180 / Math.PI)

    if (input.hit('KeyJ', 'KeyZ')) {
      this.kickflips++
      this.visual.flipTarget -= TAU
      this.audio.flip()
      this.world.spawnDust(this.position.clone().setY(this.position.y + 0.2), 4, 0.35)
    }
    if (input.hit('KeyK', 'KeyX')) {
      this.heelflips++
      this.visual.flipTarget += TAU
      this.audio.flip()
      this.world.spawnDust(this.position.clone().setY(this.position.y + 0.2), 4, 0.35)
    }
    if (input.hit('KeyL')) {
      this.shuvits++
      this.visual.shuvTarget += Math.PI
      this.audio.flip()
    }
    if (input.down('KeyQ')) {
      if (!this.grabbing) {
        this.grabbing = true
        this.audio.flip()
      }
      this.grabTime += dt
    } else if (this.grabbing) {
      this.grabbing = false
    }

    this.airVelocity.y -= 19.5 * dt
    this.vy = this.airVelocity.y
    this.position.x += this.airVelocity.x * dt
    this.position.z += this.airVelocity.z * dt
    this.position.y += this.airVelocity.y * dt

    this._clampToPark(true)

    if (this.grindCooldown <= 0) this._tryGrind(input)

    if (this.mode !== 'air') return

    const h = this.world.heightAt(this.position.x, this.position.z)
    if (this.position.y <= h + 0.02 && this.airVelocity.y <= 0) {
      this.position.y = h
      this._land(h)
    }
  }

  _tryGrind() {
    if (this.airVelocity.y > 2.2) return
    let best = null
    let bestDist = Infinity
    for (const rail of this.world.rails) {
      const ab = new THREE.Vector3().subVectors(rail.b, rail.a)
      const len2 = ab.lengthSq()
      const ap = new THREE.Vector3().subVectors(this.position, rail.a)
      let t = ap.dot(ab) / len2
      if (t < -0.06 || t > 1.06) continue
      t = clamp(t, 0, 1)
      const point = rail.a.clone().addScaledVector(ab, t)
      const dx = this.position.x - point.x
      const dz = this.position.z - point.z
      const dist = Math.hypot(dx, dz)
      const dy = Math.abs(this.position.y - point.y)
      if (dist < rail.radius && dy < 0.7 && dist < bestDist) {
        best = { rail, t, dir: Math.sign(this.airVelocity.dot(ab)) || 1 }
        bestDist = dist
      }
    }
    if (!best) return
    this._startGrind(best.rail, best.t, best.dir)
  }

  _startGrind(rail, t, dir) {
    const ab = new THREE.Vector3().subVectors(rail.b, rail.a)
    this.rail = rail
    this.railT = t
    this.railDir = dir
    this.mode = 'grind'
    this.grindTime = 0
    this.grindPoints = 160
    this.balance = (Math.random() - 0.5) * 0.2
    this.balancePhase = Math.random() * TAU
    this.grinding = true
    this.airStartHeadingSet = false
    const dirVec = ab.clone().normalize().multiplyScalar(dir)
    const travel = this.airVelocity.clone()
    travel.y = 0
    const travelLen = travel.length()
    const align = travelLen > 0.001 ? Math.abs(travel.normalize().dot(dirVec)) : 1
    this.heading = Math.atan2(dirVec.x, dirVec.z)
    this.speed = Math.max(4, travelLen)
    this.airVelocity.set(0, 0, 0)
    this.vy = 0
    this.grindName = align > 0.55 ? '50-50' : 'BOARDSLIDE'
    this.audio.setGrinding(true, this.speed)
    this.audio.setRolling(0, false, 1)
    this.world.spawnSparks(this.position.clone(), 14)
    this.callbacks.onGrindStart?.({ rail, name: this.grindName })
  }

  _updateGrind(dt, input) {
    this.grindTime += dt
    this.grindPoints += (110 + this.speed * 16) * dt

    const ab = new THREE.Vector3().subVectors(this.rail.b, this.rail.a)
    const len = ab.length()
    const dirVec = ab.clone().normalize().multiplyScalar(this.railDir)

    const slope = this.world.slopeAlong(this.position.x, this.position.z, dirVec.x, dirVec.z)
    this.speed += (-slope * 6 + 0.7) * dt
    this.speed = clamp(this.speed, 1.8, 15)

    this.railT += (this.speed * dt / len) * this.railDir
    if (this.railT > 1.02 || this.railT < -0.02) {
      this.railT = clamp(this.railT, 0, 1)
      const point = this.rail.a.clone().addScaledVector(ab, this.railT)
      this.position.copy(point)
      this.position.y += 0.06
      this._endGrind(false)
      this._startAir(dirVec.x * this.speed, dirVec.z * this.speed, 1.2, true)
      this.airStartHeading = this.heading
      this.airStartHeadingSet = true
      return
    }

    const point = this.rail.a.clone().addScaledVector(ab, this.railT)
    this.position.copy(point)
    this.position.y += 0.06

    const drift = Math.sin(this.grindTime * 2.4 + this.balancePhase) * 0.7 + (Math.random() - 0.5) * 0.85
    this.balance += (drift - input.steer * 2.1) * dt
    this.balance = clamp(this.balance, -1.15, 1.15)
    if (Math.abs(this.balance) >= 1) {
      this.bail('balance')
      return
    }

    this.sparkTimer -= dt
    if (this.sparkTimer <= 0) {
      this.sparkTimer = 0.045
      const p = this.position.clone()
      p.x += (Math.random() - 0.5) * 0.5
      p.z += (Math.random() - 0.5) * 0.5
      p.y += 0.02
      this.world.spawnSparks(p, 3, dirVec)
    }

    if (input.hit('Space')) {
      this._endGrind(true)
      this._startAir(dirVec.x * this.speed, dirVec.z * this.speed, 5.4, true)
      this.airStartHeading = this.heading
      this.airStartHeadingSet = true
      this.audio.ollie()
    }
  }

  _land(h) {
    const speed = Math.hypot(this.airVelocity.x, this.airVelocity.z)
    const travel = new THREE.Vector3(this.airVelocity.x, 0, this.airVelocity.z)
    if (travel.lengthSq() > 0.001) this.heading = Math.atan2(travel.x, travel.z)
    this.speed = speed
    this.mode = 'ground'
    this.groundTime = 0
    this.vy = 0

    const spinRounded = Math.round(this.spin / 180) * 180
    const names = []
    const flips = this.kickflips + this.heelflips + this.shuvits
    let points = 0

    if (this.kickflips > 0) {
      names.push(this.kickflips > 1 ? `DOUBLE KICKFLIP` : 'KICKFLIP')
      points += 420 * this.kickflips
    }
    if (this.heelflips > 0) {
      names.push(this.heelflips > 1 ? 'DOUBLE HEELFLIP' : 'HEELFLIP')
      points += 420 * this.heelflips
    }
    if (this.shuvits > 0) {
      names.push(this.shuvits > 1 ? 'DOUBLE SHUVIT' : 'SHUVIT')
      points += 250 * this.shuvits
    }
    if (this.grabTime > 0.18) {
      names.push('INDY GRAB')
      points += Math.round(600 + this.grabTime * 320)
    }
    if (spinRounded >= 180) {
      names.unshift(`${spinRounded}`)
      points += (spinRounded / 180) * 330
    }
    const airBonus = Math.round(this.airTime * 130)
    points += airBonus
    if (names.length === 0 && this.airTime > 1.15) names.push('BIG AIR')
    if (points < 85 && names.length === 0) {
      this.spin = 0
      this.kickflips = 0
      this.heelflips = 0
      this.shuvits = 0
      this.grabTime = 0
      this.grabbing = false
      this.airTime = 0
      this.airStartHeadingSet = false
      this.visual.flipTarget = this.visual.flip
      this.visual.shuvTarget = this.visual.shuv
      return
    }

    this.callbacks.onLand?.({
      points: Math.round(points / 10) * 10,
      names,
      spin: spinRounded,
      airTime: this.airTime,
      flips,
      grab: this.grabTime,
      height: this.position.y - h,
    })

    const intensity = clamp(this.airTime * 1.2, 0.35, 1.5)
    this.audio.land(intensity)
    this.world.spawnDust(this.position.clone().setY(this.position.y + 0.12), Math.round(8 + intensity * 12), intensity)
    this.callbacks.onCameraShake?.(0.08 + intensity * 0.12)

    this.spin = 0
    this.kickflips = 0
    this.heelflips = 0
    this.shuvits = 0
    this.grabTime = 0
    this.grabbing = false
    this.airTime = 0
    this.airStartHeadingSet = false
    this.visual.flipTarget = this.visual.flip
    this.visual.shuvTarget = this.visual.shuv
    this.lastSafe.copy(this.position)
  }

  _updateBail(dt) {
    this.bailTimer -= dt
    this.visual.bail += dt * 7
    this.position.x += this.airVelocity.x * dt * 0.6
    this.position.z += this.airVelocity.z * dt * 0.6
    this.airVelocity.multiplyScalar(0.94)
    const ground = this.world.heightAt(this.position.x, this.position.z)
    this.position.y = Math.max(ground, this.position.y - 4 * dt)
    this.group.position.y = this.position.y

    if (this.bailTimer <= 0) {
      const safe = this.lastSafe
      this.reset(safe.x, safe.z, this.heading)
      this.callbacks.onRespawn?.()
    }
  }

  _clampToPark(air = false) {
    const b = this.world.boundary
    let hit = 0
    if (this.position.x < b.minX) { this.position.x = b.minX; hit = Math.abs(this.airVelocity.x || this.speed) }
    if (this.position.x > b.maxX) { this.position.x = b.maxX; hit = Math.abs(this.airVelocity.x || this.speed) }
    if (this.position.z < b.minZ) { this.position.z = b.minZ; hit = Math.abs(this.airVelocity.z || this.speed) }
    if (this.position.z > b.maxZ) { this.position.z = b.maxZ; hit = Math.abs(this.airVelocity.z || this.speed) }
    if (hit) {
      if (air) {
        this.airVelocity.x *= -0.15
        this.airVelocity.z *= -0.15
      } else {
        this.speed *= -0.18
      }
      this.world.spawnDust(this.position.clone().setY(this.position.y + 0.6), 5, 0.5)
      this.audio.land(0.2)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  visuals                                                           */
  /* ------------------------------------------------------------------ */

  _syncTransform(dt = 0.016, cameraShake = null) {
    this.group.position.copy(this.position)
    if (this.mode !== 'bail') this.group.rotation.y = this.heading
    if (this.mode !== 'bail') {
      const speedAbs = Math.abs(this.speed)
      this.wheelSpin += (speedAbs * dt) / 0.1
      for (const w of this.wheels) w.rotation.x = this.wheelSpin
    }

    if (this.shadow) {
      const ground = this.world.heightAt(this.position.x, this.position.z)
      const height = Math.max(0, this.position.y - ground)
      this.shadow.position.set(this.position.x, ground + 0.035, this.position.z)
      const scale = 1 - clamp(height * 0.055, 0, 0.55)
      this.shadow.scale.setScalar(scale)
      this.shadow.material.opacity = 0.34 * (1 - clamp(height / 9, 0, 0.85))
    }
  }

  _updateVisual(dt, input) {
    const grounded = this.mode === 'ground'
    const airborne = this.mode === 'air'
    const grinding = this.mode === 'grind'
    const bailing = this.mode === 'bail'

    let crouchTarget = 0
    if (grounded) crouchTarget = input.crouch ? 0.5 : (Math.abs(this.speed) < 2.5 ? 0.13 : 0.04)
    if (this.charging) crouchTarget = 0.55 + this.charge * 0.8
    if (airborne) crouchTarget = 0.6
    if (grinding) crouchTarget = 0.5
    if (this.grabbing) crouchTarget = 0.95

    this.visual.crouch = damp(this.visual.crouch, crouchTarget, 12, dt)

    const speedFactor = clamp(Math.abs(this.speed) / 12, 0, 1)
    const steer = input.steer
    let leanTarget = -steer * (0.16 + speedFactor * 0.22)
    if (grinding) leanTarget = -steer * 0.18
    this.visual.lean = damp(this.visual.lean, leanTarget, 8, dt)

    if (airborne) {
      const vy = this.airVelocity.y
      this.visual.pitch = damp(this.visual.pitch, clamp(-vy * 0.018, -0.18, 0.18), 6, dt)
    } else if (grounded) {
      const f = this.forward
      const slope = this.world.slopeAlong(this.position.x, this.position.z, f.x, f.z)
      this.visual.pitch = damp(this.visual.pitch, -Math.atan(slope) * 0.7, 10, dt)
    } else {
      this.visual.pitch = damp(this.visual.pitch, 0, 8, dt)
    }

    this.visual.flip = damp(this.visual.flip, this.visual.flipTarget, 18, dt)
    this.visual.shuv = damp(this.visual.shuv, this.visual.shuvTarget, 16, dt)
    if (grounded && !bailing) {
      const settle = Math.exp(-12 * dt)
      this.visual.flipTarget = this.visual.flip * settle
      this.visual.shuvTarget = this.visual.shuv * settle
    }

    let grabTarget = this.grabbing ? 1 : 0
    this.visual.grab = damp(this.visual.grab, grabTarget, 12, dt)

    // wheels / board
    this.boardGroup.rotation.set(0, this.visual.shuv, this.visual.flip)
    this.boardGroup.position.y = 0.21 + this.visual.grab * 0.12

    // lean group
    this.leanGroup.rotation.set(this.visual.pitch, 0, this.visual.lean)
    if (bailing) {
      const t = this.visual.bail
      this.leanGroup.rotation.set(Math.sin(t * 1.5) * 0.9, Math.sin(t * 0.8) * 0.4, Math.cos(t * 1.2) * 0.9)
      this.bodyGroup.rotation.x = Math.sin(t * 1.7) * 0.6
      this.bodyGroup.rotation.z = Math.cos(t * 1.1) * 0.5
      this.bodyGroup.rotation.y = Math.PI / 2 + Math.sin(t) * 0.6
    } else {
      this.bodyGroup.rotation.x = damp(this.bodyGroup.rotation.x, 0, 10, dt)
      this.bodyGroup.rotation.z = damp(this.bodyGroup.rotation.z, 0, 10, dt)
      const yawTarget = Math.PI / 2 + (airborne ? steer * -0.18 : 0)
      this.bodyGroup.rotation.y = damp(this.bodyGroup.rotation.y, yawTarget, 6, dt)
    }

    const crouch = this.visual.crouch
    const stanceDrop = crouch * 0.2
    this.bodyGroup.position.y = 0.215 - stanceDrop
    this.torso.rotation.x = crouch * 0.24 + (this.grabbing ? 0.35 : 0)
    this.torso.rotation.y = 0
    this.head.rotation.x = -crouch * 0.1
    this.head.rotation.y = airborne || grinding ? -0.35 : 0.25

    // legs
    for (const leg of this.legs) {
      const side = leg.side
      let hipZ = side * (0.24 + crouch * 0.1)
      let hipX = crouch * 0.55
      let kneeX = -crouch * 1.15
      if (airborne) {
        hipX = 0.5 + crouch * 0.35
        kneeX = -1.0 - crouch * 0.4
        hipZ = side * 0.3
      }
      if (grinding) {
        hipX = 0.3
        kneeX = -0.85
        hipZ = side * 0.34
      }
      if (this.grabbing) {
        hipX = 0.85
        kneeX = -1.55
      }
      if (this.pushPulse > 0) {
        const p = this.pushPulse
        if (side === 1) {
          hipX += p * 0.7
          kneeX -= p * 0.5
          hipZ += p * 0.15
        }
      }
      leg.hip.rotation.z = damp(leg.hip.rotation.z, hipZ, 12, dt)
      leg.hip.rotation.x = damp(leg.hip.rotation.x, hipX, 12, dt)
      leg.knee.rotation.x = damp(leg.knee.rotation.x, kneeX, 14, dt)
    }
    this.pushPulse = Math.max(0, this.pushPulse - dt * 4.2)

    // arms
    for (const arm of this.arms) {
      const side = arm.side
      let sZ = side * (0.55 + speedFactor * 0.2)
      let sX = -0.15 + Math.sin(this.groundTime * 2.4 + side) * 0.06
      let eX = -0.35
      if (airborne || grinding) {
        sZ = side * 0.95
        sX = -0.25
        eX = -0.5
      }
      if (this.grabbing) {
        if (side === -1) {
          sZ = -1.15
          sX = 1.25
          eX = -0.55
        } else {
          sZ = side * 1.2
          sX = -0.4
        }
      }
      if (bailing) {
        sZ = Math.sin(this.visual.bail * 1.4 + side) * 1.4
        sX = Math.cos(this.visual.bail + side) * 0.9
        eX = -0.8
      }
      arm.shoulder.rotation.z = damp(arm.shoulder.rotation.z, sZ, 10, dt)
      arm.shoulder.rotation.x = damp(arm.shoulder.rotation.x, sX, 10, dt)
      arm.elbow.rotation.x = damp(arm.elbow.rotation.x, eX, 10, dt)
    }

    this.leanGroup.position.y = 0
  }
}
