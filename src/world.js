import * as THREE from 'three'

const UP = new THREE.Vector3(0, 1, 0)
const TAU = Math.PI * 2

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  paint(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function makeConcreteTexture(repeat = 18) {
  const texture = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#b0afa8'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 17000; i++) {
      const shade = 120 + Math.random() * 70
      ctx.fillStyle = `rgba(${shade},${shade},${shade - 3},${Math.random() * 0.12})`
      const size = Math.random() * 2.2 + 0.4
      ctx.fillRect(Math.random() * w, Math.random() * h, size, size)
    }
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, 'rgba(255,255,255,0.055)')
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.03)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.075)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(54,55,52,0.33)'
    ctx.lineWidth = 3
    for (let x = 0; x <= w; x += 256) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 4, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 256) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y + 2)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(54,55,52,0.2)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 30; i++) {
      let x = Math.random() * w
      let y = Math.random() * h
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let s = 0; s < 5; s++) {
        x += (Math.random() - 0.5) * 85
        y += (Math.random() - 0.5) * 85
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  })
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  return texture
}

function makeWindowTexture(base = '#78868c', lit = '#d4c59b') {
  const texture = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    for (let y = 18; y < h - 10; y += 28) {
      for (let x = 14; x < w - 10; x += 30) {
        const on = Math.random() > 0.67
        ctx.fillStyle = on ? lit : 'rgba(25,38,44,0.72)'
        ctx.fillRect(x, y, 18, 14)
        if (on) {
          ctx.fillStyle = 'rgba(255,240,196,0.28)'
          ctx.fillRect(x - 1, y - 1, 20, 16)
        }
      }
    }
    ctx.fillStyle = 'rgba(15,25,30,0.18)'
    ctx.fillRect(0, 0, w, h)
  })
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

function makeGraffitiTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d5c9b2'
    ctx.fillRect(0, 0, w, h)
    const bricks = ctx.createLinearGradient(0, 0, 0, h)
    bricks.addColorStop(0, 'rgba(255,255,255,0.1)')
    bricks.addColorStop(1, 'rgba(80,58,40,0.2)')
    ctx.fillStyle = bricks
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(125,92,67,0.22)'
    ctx.lineWidth = 2
    for (let y = 0; y < h; y += 34) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      for (let x = (y / 34) % 2 ? -40 : 0; x < w; x += 80) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + 34)
        ctx.stroke()
      }
    }

    ctx.save()
    ctx.translate(w / 2, h / 2 + 5)
    ctx.rotate(-0.045)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '700 142px Anton, Impact, sans-serif'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#12181a'
    ctx.lineWidth = 20
    ctx.strokeText('CARVERTON', 0, 0)
    ctx.strokeStyle = '#fc5a1c'
    ctx.lineWidth = 9
    ctx.strokeText('CARVERTON', 0, 0)
    ctx.fillStyle = '#f7efe0'
    ctx.fillText('CARVERTON', 0, 0)
    ctx.font = '700 38px Anton, Impact, sans-serif'
    ctx.fillStyle = '#f8c83d'
    ctx.fillText('SKATE  •  CREATE  •  REPEAT', 0, 102)
    ctx.restore()

    const colors = ['#f25522', '#1ce0ca', '#f9d447', '#2c55d9', '#efefdd']
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = colors[i % colors.length]
      ctx.globalAlpha = 0.65
      ctx.lineWidth = 5 + Math.random() * 13
      ctx.beginPath()
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.moveTo(x, y)
      ctx.bezierCurveTo(x + 50, y - 80, x + 130, y + 70, x + 180, y - 10)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.4
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = colors[i % colors.length]
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 4 + 1, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })
}

function makePlazaDecal() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.translate(w / 2, h / 2)
    ctx.strokeStyle = 'rgba(238,230,205,0.5)'
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.arc(0, 0, 410, 0, TAU)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 378, 0, TAU)
    ctx.stroke()
    ctx.fillStyle = 'rgba(238,230,205,0.75)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '700 30px Rajdhani, sans-serif'
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * TAU
      ctx.save()
      ctx.rotate(a)
      ctx.translate(0, -432)
      ctx.fillText('PORT CARVERTON', 0, 0)
      ctx.restore()
    }
    ctx.font = '700 104px Anton, Impact, sans-serif'
    ctx.strokeStyle = 'rgba(236,90,28,0.7)'
    ctx.lineWidth = 12
    ctx.strokeText('SKATE', 0, -30)
    ctx.fillStyle = 'rgba(238,230,205,0.68)'
    ctx.fillText('SKATE', 0, -30)
    ctx.font = '700 30px Rajdhani, sans-serif'
    ctx.fillStyle = 'rgba(238,230,205,0.65)'
    ctx.fillText('DOWNTOWN PLAZA  /  CA', 0, 76)
  })
}

function makeBannerTexture() {
  return canvasTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#f05a22'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#171b1c'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(145, 0)
    ctx.lineTo(115, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f6eedc'
    ctx.font = '700 88px Anton, Impact, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SKATE', 355, 74)
    ctx.fillStyle = '#f9cf43'
    ctx.fillRect(0, h - 11, w, 11)
  })
}

function makeCloudTexture() {
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const blobs = [
      [68, 79, 42],
      [103, 58, 48],
      [144, 70, 38],
      [176, 80, 31],
      [128, 90, 40],
    ]
    blobs.forEach(([x, y, r]) => {
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, r)
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
      gradient.addColorStop(0.55, 'rgba(255,255,255,0.7)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
    })
  })
}

function makeRampGeo(width, length, height, segments = 18) {
  const positions = []
  const indices = []
  const w = width / 2
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const z = -length * t
    const y = height * t
    positions.push(-w, y, z, w, y, z)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeQuarterPipe(width, radius, segments = 24) {
  const w = width / 2
  const positions = []
  const indices = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const z = radius * t
    const y = radius - Math.sqrt(Math.max(0, radius * radius - z * z))
    positions.push(-w, y, z, w, y, z)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    indices.push(a, a + 3, a + 1, a, a + 2, a + 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  const sidePositions = []
  const sideIndices = []
  for (const x of [-w, w]) {
    const offset = sidePositions.length / 3
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const z = radius * t
      const y = radius - Math.sqrt(Math.max(0, radius * radius - z * z))
      sidePositions.push(x, y, z)
    }
    sidePositions.push(x, 0, radius)
    for (let i = 0; i < segments; i++) {
      sideIndices.push(offset + i, offset + i + 1, offset + segments + 1)
    }
  }
  const sideGeo = new THREE.BufferGeometry()
  sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidePositions, 3))
  sideGeo.setIndex(sideIndices)
  sideGeo.computeVertexNormals()

  const group = new THREE.Group()
  const surface = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0xaaa79d,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }))
  surface.castShadow = true
  surface.receiveShadow = true
  const sides = new THREE.Mesh(sideGeo, new THREE.MeshStandardMaterial({
    color: 0x8f8d84,
    roughness: 0.92,
    side: THREE.DoubleSide,
  }))
  sides.castShadow = true
  sides.receiveShadow = true
  group.add(surface, sides)

  const coping = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, width + 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0x586166, roughness: 0.34, metalness: 0.8 }),
  )
  coping.rotation.z = Math.PI / 2
  coping.position.set(0, radius + 0.02, radius)
  coping.castShadow = true
  group.add(coping)
  return { group, surface, sides }
}

function createPalm(scale = 1) {
  const group = new THREE.Group()
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x755540, roughness: 0.95 })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.27, 4.8, 7), trunkMat)
  trunk.position.y = 2.4
  trunk.rotation.z = 0.035
  trunk.castShadow = true
  group.add(trunk)

  const ringMat = new THREE.MeshStandardMaterial({ color: 0x5b412f, roughness: 1 })
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.009, 0.016, 4, 8), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.7 + i * 0.56
    group.add(ring)
  }

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x397a4e,
    roughness: 0.82,
    side: THREE.DoubleSide,
  })
  const leafMatLight = new THREE.MeshStandardMaterial({
    color: 0x4f915d,
    roughness: 0.82,
    side: THREE.DoubleSide,
  })
  const crown = new THREE.Group()
  crown.position.y = 4.8
  group.add(crown)

  for (let i = 0; i < 9; i++) {
    const length = 3.1 + (i % 3) * 0.35
    const geo = new THREE.BufferGeometry()
    const positions = []
    const indices = []
    const segs = 7
    for (let s = 0; s <= segs; s++) {
      const t = s / segs
      const x = t * length
      const y = Math.sin(t * Math.PI) * 0.33 - t * t * 1.28
      const halfWidth = Math.sin(t * Math.PI) * 0.44 + 0.03
      positions.push(x, y, -halfWidth, x, y + 0.035, halfWidth)
    }
    for (let s = 0; s < segs; s++) {
      const a = s * 2
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    const leaf = new THREE.Mesh(geo, i % 2 ? leafMatLight : leafMat)
    leaf.rotation.y = (i / 9) * TAU + Math.random() * 0.14
    leaf.rotation.z = -0.04 + Math.random() * 0.1
    leaf.castShadow = false
    crown.add(leaf)
  }

  const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5f432b, roughness: 0.9 })
  for (let i = 0; i < 3; i++) {
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), coconutMat)
    coconut.position.set(Math.cos(i * 2.1) * 0.22, 4.55 - 0.37, Math.sin(i * 2.1) * 0.22)
    group.add(coconut)
  }
  group.scale.setScalar(scale)
  return group
}

function createBird(color = 0x303a3c) {
  const group = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
  const wingGeo = new THREE.BufferGeometry()
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0.34, 0, 0, -0.12, 1.16, 0.05, -0.24,
  ], 3))
  wingGeo.computeVertexNormals()
  const left = new THREE.Mesh(wingGeo, mat)
  const right = new THREE.Mesh(wingGeo, mat)
  right.scale.x = -1
  const leftPivot = new THREE.Group()
  const rightPivot = new THREE.Group()
  leftPivot.add(left)
  rightPivot.add(right)
  group.add(leftPivot, rightPivot)
  group.userData.wings = [leftPivot, rightPivot]
  return group
}

function buildFerrisWheel(scene) {
  const root = new THREE.Group()
  root.position.set(55, 0, -72)
  const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3df, roughness: 0.55, metalness: 0.5 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x3e4446, roughness: 0.7, metalness: 0.35 })
  const centerY = 18
  const radius = 13
  const wheel = new THREE.Group()
  wheel.position.y = centerY
  root.add(wheel)

  for (const offset of [-0.55, 0.55]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.16, 6, 72), steel)
    hoop.position.z = offset
    wheel.add(hoop)
  }
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * TAU
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, radius, 4), dark)
    spoke.position.set(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5, 0)
    spoke.rotation.z = angle - Math.PI / 2
    wheel.add(spoke)

    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 4), dark)
    cross.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
    cross.rotation.z = Math.PI / 2
    cross.rotation.y = Math.PI / 2
    cross.position.z = 0
    wheel.add(cross)
  }

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 1.65, 12), dark)
  hub.rotation.x = Math.PI / 2
  wheel.add(hub)

  const cabinColors = [0xf35c28, 0x2a5ed8, 0xf2d74a, 0x46b99b, 0xe9e3d6, 0xdb3d4a]
  const cabins = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * TAU
    const cabin = new THREE.Group()
    cabin.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
    cabin.userData.baseAngle = angle
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 1.35, 1.1),
      new THREE.MeshStandardMaterial({ color: cabinColors[i % cabinColors.length], roughness: 0.62 }),
    )
    body.castShadow = false
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.84, 0.15, 4),
      new THREE.MeshStandardMaterial({ color: 0xf0e9db, roughness: 0.7 }),
    )
    top.rotation.y = Math.PI / 4
    top.position.y = 0.72
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), steel)
    bar.position.y = 1.2
    cabin.add(body, top, bar)
    wheel.add(cabin)
    cabins.push(cabin)
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.32, centerY + 1, 6), steel)
      leg.position.set(sx * 5.2, centerY / 2, sz * 1.8)
      leg.rotation.z = sx * 0.22
      leg.rotation.x = sz * 0.08
      root.add(leg)
    }
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.95 }))
  deck.position.y = 0.25
  root.add(deck)
  scene.add(root)
  return { root, wheel, cabins }
}

function buildCity(scene, windowMaterials) {
  const buildings = [
    [-84, 0, -62, 20, 35, 19, 0], [-62, 0, -86, 17, 52, 20, 1], [-38, 0, -92, 22, 28, 18, 2],
    [-12, 0, -102, 20, 44, 19, 0], [16, 0, -98, 23, 31, 20, 1], [45, 0, -102, 19, 49, 18, 2],
    [72, 0, -86, 18, 36, 22, 0], [92, 0, -58, 21, 27, 18, 1],
    [96, 0, -18, 20, 42, 20, 2], [102, 0, 22, 18, 33, 21, 0], [88, 0, 60, 23, 48, 18, 1],
    [58, 0, 89, 20, 29, 20, 2], [27, 0, 100, 19, 40, 19, 0], [-4, 0, 105, 22, 34, 21, 1],
    [-36, 0, 99, 20, 46, 18, 2], [-68, 0, 88, 18, 30, 21, 0], [-92, 0, 58, 21, 42, 18, 1],
    [-104, 0, 24, 20, 27, 20, 2], [-98, 0, -18, 19, 37, 19, 0], [-78, 0, -22, 16, 25, 17, 1],
  ]
  const buildingsGroup = new THREE.Group()
  for (const [x, , z, w, h, d, materialIndex] of buildings) {
    const height = h * 0.76
    const material = windowMaterials[materialIndex].clone()
    material.map = material.map.clone()
    material.map.repeat.set(Math.max(1, Math.round(w / 13)), Math.max(2, Math.round(height / 22)))
    material.map.needsUpdate = true
    material.color = new THREE.Color().setHSL(0.53 + Math.random() * 0.03, 0.08, 0.78 + Math.random() * 0.07)
    const geo = new THREE.BoxGeometry(w, height, d)
    const building = new THREE.Mesh(geo, material)
    building.position.set(x, height / 2, z)
    building.castShadow = false
    building.receiveShadow = false
    buildingsGroup.add(building)

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.66, 1.1, d * 0.58),
      new THREE.MeshStandardMaterial({ color: 0x747a78, roughness: 0.95 }),
    )
    cap.position.set(x, height + 0.55, z)
    buildingsGroup.add(cap)
  }
  scene.add(buildingsGroup)
}

function buildSky(scene) {
  const uniforms = {
    topColor: { value: new THREE.Color('#327ec1') },
    horizonColor: { value: new THREE.Color('#beddea') },
    sunColor: { value: new THREE.Color('#ffe8a7') },
    sunDirection: { value: new THREE.Vector3(0.35, 0.2, 0.92).normalize() },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      varying vec3 vWorldPosition;
      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = clamp(dir.y * 1.18, 0.0, 1.0);
        vec3 color = mix(horizonColor, topColor, pow(h, 0.62));
        float glow = pow(max(dot(dir, sunDirection), 0.0), 24.0);
        float disc = smoothstep(0.99955, 0.99982, dot(dir, sunDirection));
        color += sunColor * glow * 0.32;
        color += sunColor * disc * 2.2;
        float haze = smoothstep(0.09, -0.03, dir.y);
        color = mix(color, vec3(0.78, 0.85, 0.87), haze * 0.13);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), material)
  sky.frustumCulled = false
  scene.add(sky)
  return sky
}

function addBanner(scene, x, z, rotation = 0) {
  const texture = makeBannerTexture()
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 1.22),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
  )
  banner.position.set(x, 4.25, z)
  banner.rotation.y = rotation
  scene.add(banner)
  return banner
}

function addLamp(scene, x, z) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4e5657, roughness: 0.54, metalness: 0.55 })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.8, 8), poleMat)
  pole.position.y = 2.9
  pole.castShadow = true
  group.add(pole)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.09), poleMat)
  arm.position.set(0.55, 5.72, 0)
  group.add(arm)
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.18, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x2c3233, emissive: 0xffdf9d, emissiveIntensity: 0.7 }),
  )
  lamp.position.set(1.12, 5.64, 0)
  group.add(lamp)
  scene.add(group)
  return group
}

export function createWorld(scene, renderer) {
  const colliders = []
  const rails = []
  const animated = []
  const concreteTexture = makeConcreteTexture(22)
  const concreteMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0xd4d2c7,
    roughness: 0.94,
    metalness: 0.01,
  })
  const lightConcrete = new THREE.MeshStandardMaterial({ color: 0xbab7ab, roughness: 0.9 })
  const darkConcrete = new THREE.MeshStandardMaterial({ color: 0x8e8b80, roughness: 0.93 })
  const metal = new THREE.MeshStandardMaterial({ color: 0x5f676a, roughness: 0.38, metalness: 0.72 })
  const orange = new THREE.MeshStandardMaterial({ color: 0xe65722, roughness: 0.6 })
  const black = new THREE.MeshStandardMaterial({ color: 0x202629, roughness: 0.64 })

  const groundGeo = new THREE.PlaneGeometry(240, 240)
  const ground = new THREE.Mesh(groundGeo, concreteMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  colliders.push(ground)

  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(12.5, 12.5),
    new THREE.MeshBasicMaterial({
      map: makePlazaDecal(),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  decal.rotation.x = -Math.PI / 2
  decal.position.set(0, 0.012, 11)
  scene.add(decal)

  const addBox = ({ x, y = 0, z, w, h, d, material = lightConcrete, rotY = 0, cast = true, collide = true }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y + h / 2, z)
    mesh.rotation.y = rotY
    mesh.castShadow = cast
    mesh.receiveShadow = true
    scene.add(mesh)
    if (collide) colliders.push(mesh)
    return mesh
  }

  // Central pyramid
  const pyramidTexture = concreteTexture.clone()
  pyramidTexture.repeat.set(3, 2)
  pyramidTexture.needsUpdate = true
  const pyramidMaterial = new THREE.MeshStandardMaterial({
    map: pyramidTexture,
    color: 0xbebcb1,
    roughness: 0.91,
  })
  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(9.2, 2.7, 4), pyramidMaterial)
  pyramid.position.set(0, 1.35, -7)
  pyramid.rotation.y = Math.PI / 4
  pyramid.castShadow = true
  pyramid.receiveShadow = true
  scene.add(pyramid)
  colliders.push(pyramid)
  const pyramidCap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), metal)
  pyramidCap.position.set(0, 2.74, -7)
  pyramidCap.rotation.y = Math.PI / 4
  scene.add(pyramidCap)
  const pyramidPlinth = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.2, 15.6), darkConcrete)
  pyramidPlinth.position.set(0, 0.1, -7)
  pyramidPlinth.rotation.y = Math.PI / 4
  pyramidPlinth.receiveShadow = true
  scene.add(pyramidPlinth)


  // Ledges and low walls
  addBox({ x: -15, z: -15, w: 11, h: 0.95, d: 1.35 })
  addBox({ x: 15, z: -18, w: 8.5, h: 0.72, d: 1.3, material: darkConcrete })
  addBox({ x: 11, z: 15, w: 8, h: 0.55, d: 1.25, material: lightConcrete })
  addBox({ x: -25, z: 9, w: 1.4, h: 0.72, d: 7, material: darkConcrete })
  addBox({ x: 24, z: 25, w: 7.5, h: 0.6, d: 1.2, material: lightConcrete })

  // Kicker ramp on the left
  const rampWidth = 9.5
  const rampLength = 6.3
  const rampHeight = 1.85
  const kicker = new THREE.Mesh(makeRampGeo(rampWidth, rampLength, rampHeight), lightConcrete)
  kicker.position.set(-17, 0, 4)
  kicker.castShadow = true
  kicker.receiveShadow = true
  scene.add(kicker)
  colliders.push(kicker)
  const kickerLip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, rampWidth + 0.2, 8), metal)
  kickerLip.rotation.z = Math.PI / 2
  kickerLip.position.set(-17, rampHeight, -2.3)
  scene.add(kickerLip)
  const kickerDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 2.4),
    new THREE.MeshBasicMaterial({ map: makeBannerTexture(), transparent: true, toneMapped: false }),
  )
  kickerDecal.position.set(-17, 1.05, 3.22)
  kickerDecal.rotation.x = -0.28
  scene.add(kickerDecal)

  // Opposite bank
  const bank = new THREE.Mesh(makeRampGeo(10, 5.4, 1.5), darkConcrete)
  bank.position.set(20, 0, -3)
  bank.castShadow = true
  bank.receiveShadow = true
  scene.add(bank)
  colliders.push(bank)

  // Quarter pipes at either end of the plaza
  for (const [z, flipped] of [[-36.5, true], [38, false]]) {
    const qp = makeQuarterPipe(30, 8)
    qp.group.position.set(0, 0, z)
    if (flipped) qp.group.rotation.y = Math.PI
    scene.add(qp.group)
    colliders.push(qp.surface)
    const deckZ = flipped ? z - 8.25 : z + 8.25
    addBox({ x: 0, y: 7.82, z: deckZ, w: 31, h: 0.55, d: 3.2, material: darkConcrete, collide: true })
    for (const railX of [-15.35, 15.35]) {
      rails.push({
        start: new THREE.Vector3(railX, 8.52, deckZ + 0.3),
        end: new THREE.Vector3(railX, 8.52, deckZ - 0.3),
        type: 'coping',
      })
    }
  }

  // Stairs and handrail on the east side
  const stairX = 23
  const stairTop = 2.1
  const steps = 6
  for (let i = 0; i < steps; i++) {
    const h = stairTop - i * 0.34
    const z = 9 + i * 0.78
    addBox({
      x: stairX,
      z,
      w: 7.6,
      h,
      d: 0.8,
      material: i % 2 ? lightConcrete : darkConcrete,
      collide: true,
    })
  }
  addBox({ x: stairX, z: 6.3, w: 7.6, h: 2.1, d: 2.6, material: lightConcrete, collide: true })
  const handrailStart = new THREE.Vector3(stairX - 2.35, 2.95, 7.1)
  const handrailEnd = new THREE.Vector3(stairX - 2.35, 1.32, 13.3)
  const handrail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, handrailStart.distanceTo(handrailEnd), 8),
    metal,
  )
  handrail.position.copy(handrailStart).lerp(handrailEnd, 0.5)
  handrail.quaternion.setFromUnitVectors(UP, handrailEnd.clone().sub(handrailStart).normalize())
  handrail.castShadow = true
  scene.add(handrail)
  for (const p of [handrailStart, handrailEnd]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6), metal)
    post.position.set(p.x, p.y - 0.45, p.z)
    scene.add(post)
  }
  rails.push({ start: handrailStart, end: handrailEnd, type: 'handrail', label: 'HANDRAIL' })

  // Flat rails
  const makeFlatRail = (x, y, z, length, axis = 'z', label = 'FLAT RAIL') => {
    const horizontal = axis === 'z' ? new THREE.Vector3(0, 0, length / 2) : new THREE.Vector3(length / 2, 0, 0)
    const start = new THREE.Vector3(x, y, z).sub(horizontal)
    const end = new THREE.Vector3(x, y, z).add(horizontal)
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, length, 8),
      metal,
    )
    rail.position.copy(start).lerp(end, 0.5)
    rail.quaternion.setFromUnitVectors(UP, end.clone().sub(start).normalize())
    rail.castShadow = true
    scene.add(rail)
    const postSpacing = length / 3
    for (const t of [0.06, 0.5, 0.94]) {
      const p = start.clone().lerp(end, t)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, y, 6), metal)
      post.position.set(p.x, y / 2, p.z)
      post.castShadow = true
      scene.add(post)
    }
    rails.push({ start, end, type: 'rail', label })
  }
  makeFlatRail(7.5, 0.7, 5, 9.5, 'z', 'FLAT BAR')
  makeFlatRail(-7.2, 0.82, -23, 8.4, 'x', 'LOW RAIL')
  makeFlatRail(-15, 1.02, -15, 10.2, 'x', 'LEDGE RAIL')

  // Concrete planters with palms
  const planterPositions = [
    [-29, 29, 5.8], [29, 33, 5.4], [-33, -25, 6.2], [31, -27, 5.9], [-31, 2, 4.6], [33, 5, 4.8],
  ]
  for (const [x, z, size] of planterPositions) {
    addBox({ x, z, w: size, h: 0.62, d: size, material: darkConcrete, collide: true })
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(size - 0.4, 0.12, size - 0.4),
      new THREE.MeshStandardMaterial({ color: 0x44372b, roughness: 1 }),
    )
    soil.position.set(x, 0.65, z)
    scene.add(soil)
    const palm = createPalm(0.9 + Math.random() * 0.22)
    palm.position.set(x + (Math.random() - 0.5) * 1.2, 0.64, z + (Math.random() - 0.5) * 1.2)
    palm.rotation.y = Math.random() * TAU
    scene.add(palm)
  }

  // Graffiti wall and surrounding urban details
  const wall = addBox({
    x: -36, z: 8, w: 1.2, h: 7.5, d: 25, material: new THREE.MeshStandardMaterial({
      color: 0xc7b9a3,
      roughness: 0.95,
    }), collide: true,
  })
  const graffiti = new THREE.Mesh(
    new THREE.PlaneGeometry(23.4, 6.4),
    new THREE.MeshBasicMaterial({ map: makeGraffitiTexture(), toneMapped: false }),
  )
  graffiti.position.set(-35.36, 3.7, 8)
  graffiti.rotation.y = Math.PI / 2
  scene.add(graffiti)
  wall.castShadow = true

  const backWall = addBox({
    x: -25, z: -29, w: 17, h: 4.2, d: 0.9, material: new THREE.MeshStandardMaterial({
      color: 0xb5aa98,
      roughness: 0.96,
    }), collide: true,
  })
  backWall.castShadow = true
  const wallStripe = new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.36, 1.02), orange)
  wallStripe.position.set(-25, 3.86, -29)
  scene.add(wallStripe)

  // Banners, lamps and small props
  addBanner(scene, -28.8, -6, Math.PI / 2)
  addBanner(scene, 28, 9, -Math.PI / 2)
  addBanner(scene, 8, -48.5, 0)
  addLamp(scene, -22, 25)
  addLamp(scene, 20, 29)
  addLamp(scene, -23, -21)
  addLamp(scene, 34, -19)

  const coneMat = new THREE.MeshStandardMaterial({ color: 0xe6611f, roughness: 0.75 })
  const conePositions = [[-34, -5], [33, -1], [21, 17], [-6, -25], [40, 19]]
  for (const [x, z] of conePositions) {
    const cone = new THREE.Group()
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 10), coneMat)
    body.position.y = 0.36
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.07, 0.54), black)
    base.position.y = 0.035
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.21, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.7 }))
    stripe.position.y = 0.4
    cone.add(base, body, stripe)
    cone.position.set(x, 0, z)
    scene.add(cone)
  }

  // Boundary markings and posts
  const boundary = new THREE.Group()
  for (let x = -48; x <= 48; x += 8) {
    for (const z of [-50, 52]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.25, 6), metal)
      post.position.set(x, 0.625, z)
      boundary.add(post)
    }
  }
  for (let z = -48; z <= 50; z += 8) {
    for (const x of [-50, 50]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.25, 6), metal)
      post.position.set(x, 0.625, z)
      boundary.add(post)
    }
  }
  scene.add(boundary)

  // Background palms
  const backgroundPalms = [
    [-46, -38, 1.4], [-54, -8, 1.2], [-45, 38, 1.25], [45, -38, 1.35], [52, 12, 1.1],
    [43, 46, 1.2], [-42, 47, 1.35], [54, 42, 1.1], [6, -51, 1.25], [-9, 52, 1.12],
  ]
  for (const [x, z, scale] of backgroundPalms) {
    const palm = createPalm(scale)
    palm.position.set(x, 0, z)
    palm.rotation.y = Math.random() * TAU
    scene.add(palm)
  }

  const windowMaterials = [
    new THREE.MeshStandardMaterial({ map: makeWindowTexture('#73838a', '#d6c49f'), roughness: 0.86 }),
    new THREE.MeshStandardMaterial({ map: makeWindowTexture('#7e8b8d', '#c9b992'), roughness: 0.86 }),
    new THREE.MeshStandardMaterial({ map: makeWindowTexture('#68787f', '#efe1b7'), roughness: 0.86 }),
  ]
  buildCity(scene, windowMaterials)

  const ferris = buildFerrisWheel(scene)

  // Sky and clouds
  buildSky(scene)
  const cloudTexture = makeCloudTexture()
  const clouds = []
  for (let i = 0; i < 12; i++) {
    const material = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.52 + Math.random() * 0.22,
      depthWrite: false,
      toneMapped: false,
    })
    const cloud = new THREE.Sprite(material)
    const angle = (i / 12) * TAU + Math.random() * 0.3
    const radius = 115 + Math.random() * 95
    cloud.position.set(Math.cos(angle) * radius, 48 + Math.random() * 34, Math.sin(angle) * radius)
    const scale = 28 + Math.random() * 34
    cloud.scale.set(scale, scale * 0.45, 1)
    cloud.userData.speed = 0.45 + Math.random() * 0.4
    scene.add(cloud)
    clouds.push(cloud)
  }

  // Seagulls
  const birds = []
  for (let i = 0; i < 8; i++) {
    const bird = createBird(i % 3 === 0 ? 0x566264 : 0x333c3e)
    bird.userData.phase = Math.random() * TAU
    bird.userData.radius = 22 + Math.random() * 38
    bird.userData.height = 14 + Math.random() * 15
    bird.userData.speed = 0.07 + Math.random() * 0.06
    bird.userData.center = new THREE.Vector3(-20 + Math.random() * 60, 0, -30 + Math.random() * 80)
    bird.scale.setScalar(1.2 + Math.random() * 1.8)
    scene.add(bird)
    birds.push(bird)
  }

  // Ambient skaters
  const ambient = []
  const createAmbient = (shirtColor, boardColor, radius, speed, offset, cx, cz) => {
    const root = new THREE.Group()
    const body = new THREE.Group()
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 1.5), new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.6 }))
    board.position.y = 0.09
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 })
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 4, 8), shirtMat)
    torso.position.y = 1.12
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb77c56, roughness: 0.8 }))
    head.position.y = 1.65
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.19, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x1f2a2d, roughness: 0.7 }))
    cap.position.y = 1.8
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3a48, roughness: 0.9 })
    const armMat = new THREE.MeshStandardMaterial({ color: 0xb77c56, roughness: 0.85 })
    for (const x of [-0.13, 0.13]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.66, 6), legMat)
      leg.position.set(x, 0.55, 0)
      body.add(leg)
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.56, 5), armMat)
      arm.position.set(x * 2.4, 1.2, 0)
      arm.rotation.z = x > 0 ? -0.22 : 0.22
      body.add(arm)
    }
    body.add(torso, head, cap)
    root.add(board, body)
    scene.add(root)
    ambient.push({ root, body, board, radius, speed, offset, cx, cz })
  }
  createAmbient(0x2f7d88, 0xef5420, 2.6, 0.23, 0, 31, 20)
  createAmbient(0xe1c13f, 0x25324a, 2.1, -0.17, 2.2, 34, -6)
  createAmbient(0xe9562b, 0xe9dfcc, 2.4, 0.12, 4.3, 28, 31)

  const tmpVec = new THREE.Vector3()

  function update(dt, time) {
    ferris.wheel.rotation.z += dt * 0.035
    for (const cabin of ferris.cabins) {
      cabin.rotation.z = -ferris.wheel.rotation.z - cabin.userData.baseAngle
    }

    for (const cloud of clouds) {
      cloud.position.x += cloud.userData.speed * dt
      if (cloud.position.x > 190) cloud.position.x = -190
    }

    for (const bird of birds) {
      const u = bird.userData
      bird.position.set(
        u.center.x + Math.cos(time * u.speed + u.phase) * u.radius,
        u.height + Math.sin(time * 0.6 + u.phase) * 1.4,
        u.center.z + Math.sin(time * u.speed + u.phase) * u.radius,
      )
      bird.rotation.y = -time * u.speed - u.phase + Math.PI / 2
      const flap = Math.sin(time * 6 + u.phase) * 0.38
      bird.userData.wings[0].rotation.z = flap
      bird.userData.wings[1].rotation.z = -flap
    }

    for (const npc of ambient) {
      const angle = time * npc.speed + npc.offset
      npc.root.position.set(
        npc.cx + Math.cos(angle) * npc.radius,
        0.03,
        npc.cz + Math.sin(angle) * npc.radius,
      )
      npc.root.rotation.y = -angle + (npc.speed > 0 ? Math.PI / 2 : -Math.PI / 2)
      npc.body.rotation.z = Math.sin(time * 1.3 + npc.offset) * 0.05
      npc.board.rotation.z = Math.sin(time * 1.3 + npc.offset) * 0.03
      npc.body.position.y = Math.abs(Math.sin(time * 1.3 + npc.offset)) * 0.035
    }
  }

  return {
    colliders,
    rails,
    update,
    spawn: new THREE.Vector3(0, 0.02, 18),
    spawnHeading: 0,
    bounds: 49,
    tmpVec,
  }
}
