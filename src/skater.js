import * as THREE from 'three'

function roundedBoardGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(-0.33, -0.79)
  shape.quadraticCurveTo(-0.39, -0.96, -0.2, -1.03)
  shape.quadraticCurveTo(0, -1.075, 0.2, -1.03)
  shape.quadraticCurveTo(0.39, -0.96, 0.33, -0.79)
  shape.lineTo(0.34, 0.72)
  shape.quadraticCurveTo(0.4, 0.93, 0.18, 1.015)
  shape.quadraticCurveTo(0, 1.055, -0.18, 1.015)
  shape.quadraticCurveTo(-0.4, 0.93, -0.34, 0.72)
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 2,
    curveSegments: 10,
  })
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

function makeShoe(material, soleMaterial) {
  const group = new THREE.Group()
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.31), material)
  upper.position.y = 0.09
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.045, 0.34), soleMaterial)
  sole.position.y = 0.022
  const toe = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 3, 6), material)
  toe.rotation.z = Math.PI / 2
  toe.position.set(0, 0.09, -0.2)
  group.add(upper, sole, toe)
  return group
}

export class Skater {
  constructor() {
    this.root = new THREE.Group()
    this.root.name = 'skater'

    const grip = new THREE.MeshStandardMaterial({ color: 0x171a1c, roughness: 0.93 })
    const deckEdge = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.58 })
    const deck = new THREE.Mesh(roundedBoardGeometry(), [grip, deckEdge])
    deck.castShadow = true
    deck.receiveShadow = true
    this.deck = deck

    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.29, 1.58),
      new THREE.MeshStandardMaterial({ color: 0xf36426, roughness: 0.6 }),
    )
    stripe.rotation.x = -Math.PI / 2
    stripe.position.y = 0.129
    this.deck.add(stripe)

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xe9ddba, roughness: 0.55 })
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xe76a21, roughness: 0.42, metalness: 0.2 })
    const truckMat = new THREE.MeshStandardMaterial({ color: 0x7d8587, roughness: 0.3, metalness: 0.82 })
    this.wheels = []
    for (const z of [-0.64, 0.64]) {
      const truck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.075, 0.13), truckMat)
      truck.position.set(0, 0.03, z)
      this.deck.add(truck)
      for (const x of [-0.31, 0.31]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.087, 0.087, 0.075, 12), wheelMat)
        wheel.rotation.z = Math.PI / 2
        wheel.position.set(x, 0.018, z)
        wheel.castShadow = true
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.078, 8), hubMat)
        hub.rotation.z = Math.PI / 2
        hub.position.copy(wheel.position)
        this.deck.add(wheel, hub)
        this.wheels.push(wheel)
      }
    }
    this.boardGroup = new THREE.Group()
    this.boardGroup.position.y = 0.11
    this.boardGroup.add(this.deck)
    this.root.add(this.boardGroup)

    this.body = new THREE.Group()
    this.body.position.y = 0.2
    this.root.add(this.body)

    const denim = new THREE.MeshStandardMaterial({ color: 0x23374b, roughness: 0.95 })
    const hoodie = new THREE.MeshStandardMaterial({ color: 0xe95723, roughness: 0.86 })
    const hoodieDark = new THREE.MeshStandardMaterial({ color: 0xb63810, roughness: 0.9 })
    const skin = new THREE.MeshStandardMaterial({ color: 0xb97851, roughness: 0.88 })
    const capMat = new THREE.MeshStandardMaterial({ color: 0x138d86, roughness: 0.72 })
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x161c1e, roughness: 0.72 })
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xe9dfc9, roughness: 0.9 })
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.8 })

    this.leftLeg = new THREE.Group()
    this.rightLeg = new THREE.Group()
    this.leftLeg.position.set(-0.16, 0.92, 0.5)
    this.rightLeg.position.set(0.16, 0.92, -0.5)
    for (const [leg, z] of [[this.leftLeg, 0.5], [this.rightLeg, -0.5]]) {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.115, 0.9, 7), denim)
      thigh.position.y = -0.45
      thigh.castShadow = true
      leg.add(thigh)
      const shoe = makeShoe(whiteMat, soleMat)
      shoe.position.set(-0.02 * Math.sign(z), -0.9, z * 0.08)
      shoe.rotation.y = z > 0 ? -0.16 : 0.16
      leg.add(shoe)
      this.body.add(leg)
    }

    const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.12, 3, 8), denim)
    hips.position.y = 0.94
    hips.scale.z = 0.66
    this.body.add(hips)

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.39, 5, 10), hoodie)
    torso.position.y = 1.29
    torso.scale.z = 0.72
    torso.castShadow = true
    this.body.add(torso)

    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.07, 5, 12), hoodieDark)
    hood.position.set(0, 1.49, 0.18)
    hood.rotation.x = Math.PI / 2 - 0.25
    this.body.add(hood)

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.05), hoodieDark)
    pocket.position.set(0, 1.09, -0.215)
    this.body.add(pocket)

    const chest = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), whiteMat)
    chest.position.set(-0.11, 1.34, -0.27)
    chest.rotation.y = Math.PI
    this.body.add(chest)
    const chestMark = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.018, 0.01), hoodieDark)
    chestMark.position.set(-0.11, 1.34, -0.276)
    this.body.add(chestMark)

    this.leftArm = new THREE.Group()
    this.rightArm = new THREE.Group()
    this.leftArm.position.set(-0.34, 1.5, 0)
    this.rightArm.position.set(0.34, 1.5, 0)
    for (const arm of [this.leftArm, this.rightArm]) {
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.4, 4, 7), hoodie)
      sleeve.position.y = -0.23
      sleeve.castShadow = true
      arm.add(sleeve)
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 6), skin)
      hand.position.y = -0.49
      arm.add(hand)
      this.body.add(arm)
    }
    this.leftArm.rotation.z = -0.13
    this.rightArm.rotation.z = 0.13

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.13, 7), skin)
    neck.position.y = 1.59
    this.body.add(neck)

    this.head = new THREE.Group()
    this.head.position.y = 1.76
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.195, 12, 10), skin)
    face.position.y = 0.05
    face.scale.set(0.92, 1.02, 0.95)
    face.castShadow = true
    this.head.add(face)

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.7 })
    for (const x of [-0.075, 0.075]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), eyeWhiteMat)
      eye.position.set(x, 0.075, -0.174)
      this.head.add(eye)
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), blackMat)
      pupil.position.set(x, 0.075, -0.195)
      this.head.add(pupil)
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), skin)
    nose.position.set(0, 0.025, -0.198)
    nose.scale.set(0.8, 1.1, 0.9)
    this.head.add(nose)

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.11, 12), capMat)
    cap.position.y = 0.225
    this.head.add(cap)
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.205, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2), capMat)
    capTop.position.y = 0.28
    capTop.scale.y = 0.35
    this.head.add(capTop)
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.035, 0.24), capMat)
    brim.position.set(0, 0.19, -0.22)
    brim.rotation.x = -0.08
    this.head.add(brim)
    const capMark = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.02), whiteMat)
    capMark.position.set(0, 0.225, -0.205)
    this.head.add(capMark)
    this.body.add(this.head)

    this.time = Math.random() * 10
    this.wheelSpin = 0
    this.pushTime = 0
    this.lean = 0
    this.airTuck = 0
  }

  update(dt, state) {
    this.time += dt
    const speed = Math.max(0, state.speed)
    this.wheelSpin += speed * dt / 0.087

    for (const wheel of this.wheels) {
      wheel.rotation.x = this.wheelSpin
    }

    const pushTarget = state.grounded && state.pushing && speed < 15 ? 1 : 0
    this.pushTime += dt * (pushTarget ? 1 : 0)
    const pushWave = Math.sin(this.pushTime * Math.PI * 2.8)
    const rightPush = pushWave * pushTarget

    const carveTarget = THREE.MathUtils.clamp(-state.steer * 0.23, -0.23, 0.23)
    this.lean += (carveTarget - this.lean) * Math.min(1, dt * 8)
    this.airTuck += ((state.airborne ? 1 : 0) - this.airTuck) * Math.min(1, dt * 8)

    const crouch = state.grounded ? (state.crouching ? 0.18 : 0.015) : 0.13
    const idleBob = Math.sin(this.time * 2.2) * 0.008
    this.body.position.y = 0.2 - crouch + idleBob
    this.body.rotation.z = this.lean
    this.body.rotation.x = this.airTuck * -0.09 + (state.grinding ? -0.08 : 0)

    this.boardGroup.rotation.x = state.boardFlip || 0
    this.boardGroup.rotation.y = state.boardYaw || 0
    this.boardGroup.rotation.z = this.lean * 0.33

    if (state.grinding) {
      this.leftLeg.rotation.x = 0.52
      this.rightLeg.rotation.x = -0.52
      this.leftArm.rotation.x = -0.58
      this.rightArm.rotation.x = -0.58
      this.leftArm.rotation.z = -0.62
      this.rightArm.rotation.z = 0.62
      this.body.position.y = 0.16
    } else if (state.airborne) {
      this.leftLeg.rotation.x += (0.63 - this.leftLeg.rotation.x) * Math.min(1, dt * 10)
      this.rightLeg.rotation.x += (-0.38 - this.rightLeg.rotation.x) * Math.min(1, dt * 10)
      this.leftArm.rotation.x += (-0.28 - this.leftArm.rotation.x) * Math.min(1, dt * 8)
      this.rightArm.rotation.x += (-0.28 - this.rightArm.rotation.x) * Math.min(1, dt * 8)
      this.leftArm.rotation.z += (-0.7 - this.leftArm.rotation.z) * Math.min(1, dt * 8)
      this.rightArm.rotation.z += (0.7 - this.rightArm.rotation.z) * Math.min(1, dt * 8)
    } else {
      const legSwing = rightPush * 0.55
      const settle = Math.min(1, dt * 10)
      this.leftLeg.rotation.x += ((legSwing * 0.55) - this.leftLeg.rotation.x) * settle
      this.rightLeg.rotation.x += ((legSwing * -0.55) - this.rightLeg.rotation.x) * settle
      const armSwing = -rightPush * 0.28 + Math.sin(this.time * 2.2) * 0.015
      this.leftArm.rotation.x += (armSwing - this.leftArm.rotation.x) * settle
      this.rightArm.rotation.x += (-armSwing - this.rightArm.rotation.x) * settle
      this.leftArm.rotation.z += (-0.16 - this.leftArm.rotation.z) * settle
      this.rightArm.rotation.z += (0.16 - this.rightArm.rotation.z) * settle
    }

    if (state.grinding) {
      this.head.rotation.z = Math.sin(this.time * 9) * 0.045
    } else {
      this.head.rotation.z += (this.lean * -0.2 - this.head.rotation.z) * Math.min(1, dt * 7)
      this.head.rotation.y = state.steer * 0.14
    }

    this.boardGroup.position.y = 0.11 + (state.airborne ? 0.035 : 0)
  }
}
