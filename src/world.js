import * as THREE from 'three'
import { mergeGeometries } from '../vendor/addons/BufferGeometryUtils.js'

const TAU = Math.PI * 2
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t

function canvasTexture(width, height, draw, { repeat = null, srgb = true } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  draw(ctx, width, height)
  const tex = new THREE.CanvasTexture(canvas)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  tex.anisotropy = 8
  return tex
}

function concreteTexture(base = '#858179', dark = '#5f5c56') {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 5200; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = Math.random() * 2.2
      ctx.globalAlpha = 0.04 + Math.random() * 0.16
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : dark
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 18 + Math.random() * 90
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, 'rgba(40,38,35,0.16)')
      grad.addColorStop(1, 'rgba(40,38,35,0)')
      ctx.fillStyle = grad
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    ctx.strokeStyle = 'rgba(42,40,37,0.45)'
    ctx.lineWidth = 3
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * w
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(w, p)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(30,28,26,0.4)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 9; i++) {
      let x = Math.random() * w
      let y = Math.random() * h
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let s = 0; s < 7; s++) {
        x += (Math.random() - 0.5) * 46
        y += Math.random() * 26
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }, { repeat: [12, 12] })
}

function graffitiTexture() {
  return canvasTexture(2048, 512, (ctx, w, h) => {
    ctx.fillStyle = '#6f6b64'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      ctx.globalAlpha = 0.03 + Math.random() * 0.12
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#3d3a36'
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3)
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = 'rgba(40,38,35,0.5)'
    ctx.lineWidth = 4
    for (let x = 0; x < w; x += 256) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(30,28,26,0.35)'
    ctx.fillRect(0, h - 42, w, 42)

    const pieces = [
      { x: 110, y: 250, text: 'SKATE', color: '#ff5a1f', outline: '#f2ede4', size: 190, tilt: -0.04 },
      { x: 830, y: 290, text: 'CARVERTON', color: '#54e8ff', outline: '#122029', size: 108, tilt: 0.02 },
      { x: 1620, y: 255, text: '3', color: '#f2ede4', outline: '#ff5a1f', size: 260, tilt: 0.08 },
    ]

    for (const p of pieces) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.tilt)
      ctx.font = `italic 900 ${p.size}px "Arial Black", Impact, sans-serif`
      ctx.lineJoin = 'round'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 22
      ctx.shadowOffsetY = 10
      ctx.strokeStyle = p.outline
      ctx.lineWidth = 26
      ctx.strokeText(p.text, 0, 0)
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = p.color
      ctx.fillText(p.text, 0, 0)
      ctx.strokeStyle = 'rgba(10,10,14,0.6)'
      ctx.lineWidth = 4
      ctx.strokeText(p.text, 0, 0)
      ctx.restore()
    }

    const tags = ['PC', 'NO REFS', 'DROP IN', 'FLIP IT', 'S3']
    tags.forEach((tag, i) => {
      ctx.save()
      ctx.translate(120 + i * 390, 80 + (i % 2) * 46)
      ctx.rotate((i % 2 ? 1 : -1) * 0.05)
      ctx.font = 'italic 900 54px "Arial Black", sans-serif'
      ctx.fillStyle = ['#9dff5a', '#ff8a3d', '#e07bff', '#f2ede4', '#54e8ff'][i]
      ctx.globalAlpha = 0.88
      ctx.fillText(tag, 0, 0)
      ctx.restore()
    })

    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w
      const y = 200 + Math.random() * 260
      ctx.fillStyle = ['#ff5a1f', '#54e8ff', '#9dff5a', '#e07bff'][i % 4]
      ctx.globalAlpha = 0.5
      ctx.fillRect(x, y, 2, 6 + Math.random() * 36)
    }
    ctx.globalAlpha = 1
  })
}

function windowTexture(seed = 1) {
  const rand = mulberry(seed)
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#232235'
    ctx.fillRect(0, 0, w, h)
    for (let y = 10; y < h; y += 26) {
      for (let x = 10; x < w; x += 24) {
        const lit = rand() > 0.34
        ctx.fillStyle = lit
          ? ['#ffcf8c', '#ffb066', '#ffe6b8', '#9edbff'][Math.floor(rand() * 4)]
          : '#151624'
        ctx.globalAlpha = lit ? 0.65 + rand() * 0.35 : 0.9
        ctx.fillRect(x, y, 12, 14)
      }
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(10,10,16,0.55)'
    for (let y = 0; y < h; y += 52) ctx.fillRect(0, y, w, 3)
  }, { repeat: [1, 1] })
}

function mulberry(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function decalTexture(draw, size = 1024) {
  return canvasTexture(size, size, draw, { repeat: null })
}

function leafTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = '#2f5a2a'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(w / 2, h)
    ctx.quadraticCurveTo(w / 2 + 10, h / 2, w / 2, 12)
    ctx.stroke()
    for (let i = 0; i < 16; i++) {
      const t = i / 16
      const y = h - 16 - t * (h - 42)
      const len = (1 - t) * 52 + 8
      const sway = Math.sin(t * 5) * 8
      ctx.strokeStyle = i % 2 ? '#3c7a34' : '#4f9440'
      ctx.lineWidth = 5 - t * 2
      ctx.beginPath()
      ctx.moveTo(w / 2 + sway, y)
      ctx.quadraticCurveTo(w / 2 + sway - len * 0.6, y - 12, w / 2 + sway - len, y - 26)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(w / 2 + sway, y)
      ctx.quadraticCurveTo(w / 2 + sway + len * 0.6, y - 12, w / 2 + sway + len, y - 26)
      ctx.stroke()
    }
  })
}

function radialGlowTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,240,205,1)')
    g.addColorStop(0.25, 'rgba(255,196,130,0.8)')
    g.addColorStop(0.55, 'rgba(255,140,80,0.24)')
    g.addColorStop(1, 'rgba(255,120,60,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

function circleTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.65)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/* ------------------------------------------------------------------ */
/*  particle systems                                                   */
/* ------------------------------------------------------------------ */

const PARTICLE_VERT = `
attribute float size;
attribute float alpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = color;
  vAlpha = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(size * (520.0 / max(1.0, -mv.z)), 1.0, 110.0);
  gl_Position = projectionMatrix * mv;
}`

const PARTICLE_FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vColor, a * vAlpha);
}`

class PointsPool {
  constructor(scene, count, blending) {
    this.count = count
    this.positions = new Float32Array(count * 3)
    this.colors = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.alphas = new Float32Array(count)
    this.vel = new Float32Array(count * 3)
    this.life = new Float32Array(count)
    this.maxLife = new Float32Array(count)
    this.gravity = new Float32Array(count)
    this.drag = new Float32Array(count)
    this.cursor = 0

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      vertexColors: true,
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    scene.add(this.points)
  }

  emit({ position, count = 1, color = new THREE.Color('#ffffff'), speed = 4, spread = 0.3, up = 0.4, size = 4, life = 0.6, gravity = -9, drag = 0.4, dir = null }) {
    for (let n = 0; n < count; n++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.count
      this.positions[i * 3] = position.x + (Math.random() - 0.5) * spread
      this.positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread
      this.positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread
      const theta = Math.random() * TAU
      const radial = Math.random() * speed
      const dx = Math.cos(theta) * radial + (dir ? dir.x * speed * 0.8 : 0)
      const dz = Math.sin(theta) * radial + (dir ? dir.z * speed * 0.8 : 0)
      const dy = up * speed * (0.35 + Math.random())
      this.vel[i * 3] = dx * 0.5
      this.vel[i * 3 + 1] = dy
      this.vel[i * 3 + 2] = dz * 0.5
      this.colors[i * 3] = color.r
      this.colors[i * 3 + 1] = color.g
      this.colors[i * 3 + 2] = color.b
      this.sizes[i] = size * (0.6 + Math.random() * 0.8)
      this.alphas[i] = 1
      this.life[i] = life * (0.7 + Math.random() * 0.6)
      this.maxLife[i] = this.life[i]
      this.gravity[i] = gravity
      this.drag[i] = drag
    }
  }

  update(dt) {
    const pos = this.positions
    const vel = this.vel
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] -= dt
      if (this.life[i] <= 0) {
        this.alphas[i] = 0
        continue
      }
      const drag = Math.max(0, 1 - this.drag[i] * dt)
      vel[i * 3] *= drag
      vel[i * 3 + 1] = vel[i * 3 + 1] * drag + this.gravity[i] * dt
      vel[i * 3 + 2] *= drag
      pos[i * 3] += vel[i * 3] * dt
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      const k = this.life[i] / this.maxLife[i]
      this.alphas[i] = Math.min(1, k * 1.6)
    }
    const geo = this.points.geometry
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    geo.attributes.size.needsUpdate = true
    geo.attributes.alpha.needsUpdate = true
  }
}

/* ------------------------------------------------------------------ */
/*  world                                                              */
/* ------------------------------------------------------------------ */

export class World {
  constructor(scene) {
    this.scene = scene
    this.group = new THREE.Group()
    scene.add(this.group)

    this.rails = []
    this.palms = []
    this.flags = []
    this.birds = []
    this.crowd = null
    this.time = 0
    this.boundary = { minX: -46, maxX: 46, minZ: -47.45, maxZ: 46 }
    this.spawn = { x: 0, z: 15, heading: Math.PI }
    this.quarter = { z: -34, topZ: -46, xMin: -30, xMax: 30, height: 5.8, launchZ: -45.0 }

    this._buildSky()
    this._buildLights()
    this._buildGround()
    this._buildPark()
    this._buildRails()
    this._buildProps()
    this._buildCrowd()
    this._buildCity()
    this._buildParticles()

    this.tmpNormal = new THREE.Vector3()
  }

  /* ---------------- environment ---------------- */

  _buildSky() {
    const sunDir = new THREE.Vector3(-0.62, 0.14, -0.77).normalize()
    this.sunDir = sunDir

    const uniforms = {
      topColor: { value: new THREE.Color('#0a112c') },
      midColor: { value: new THREE.Color('#4a3b6e') },
      horizonColor: { value: new THREE.Color('#ff9460') },
      lowColor: { value: new THREE.Color('#2a1f2b') },
      sunDir: { value: sunDir },
      sunColor: { value: new THREE.Color('#ff6a32') },
    }

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(380, 48, 32),
      new THREE.ShaderMaterial({
        uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vWorldDir;
          void main() {
            vWorldDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 horizonColor;
          uniform vec3 lowColor;
          uniform vec3 sunDir;
          uniform vec3 sunColor;
          varying vec3 vWorldDir;
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          void main() {
            vec3 d = normalize(vWorldDir);
            float h = d.y;
            vec3 col;
            if (h > 0.0) {
              float t = pow(clamp(h, 0.0, 1.0), 0.62);
              col = mix(horizonColor, midColor, smoothstep(0.0, 0.34, t));
              col = mix(col, topColor, smoothstep(0.28, 0.95, t));
            } else {
              col = mix(horizonColor, lowColor, smoothstep(0.0, 0.4, -h));
            }
            float sunAmount = max(dot(d, sunDir), 0.0);
            col += sunColor * pow(sunAmount, 420.0) * 2.2;
            col += sunColor * pow(sunAmount, 18.0) * 0.16;
            col += vec3(1.0, 0.62, 0.34) * pow(sunAmount, 3.0) * 0.06;
            float angle = atan(d.z, d.x);
            float band = sin(angle * 9.0 + h * 22.0) * 0.5 + 0.5;
            col += vec3(0.1, 0.045, 0.06) * band * smoothstep(0.05, 0.4, h) * 0.35;
            float star = step(0.9985, hash(floor(d * 420.0)));
            col += vec3(0.8, 0.85, 1.0) * star * smoothstep(0.32, 0.85, h) * 0.6;
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    )
    sky.frustumCulled = false
    this.group.add(sky)
    this.sky = sky

    const glowTex = radialGlowTexture()
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa15a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85, fog: false }))
    sun.position.copy(sunDir).multiplyScalar(330)
    sun.scale.set(23, 23, 1)
    this.group.add(sun)

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff8a4e, transparent: true, blending: THREE.NormalBlending, depthWrite: false, opacity: 0.12, fog: false }))
    glow.position.copy(sunDir).multiplyScalar(300)
    glow.scale.set(100, 58, 1)
    this.group.add(glow)

    const clouds = new THREE.Group()
    const cloudMat = new THREE.SpriteMaterial({
      map: glowTex, color: 0x8a5c74, transparent: true, opacity: 0.16,
      blending: THREE.NormalBlending, depthWrite: false, fog: false,
    })
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Sprite(cloudMat)
      const angle = (i / 12) * TAU + Math.random() * 0.4
      const dist = 235 + Math.random() * 65
      m.position.set(Math.cos(angle) * dist, 68 + Math.random() * 55, Math.sin(angle) * dist)
      m.scale.set(72 + Math.random() * 85, 9 + Math.random() * 13, 1)
      clouds.add(m)
    }
    this.group.add(clouds)
    this.clouds = clouds
  }

  _buildLights() {
    const hemi = new THREE.HemisphereLight(0x9aa4ff, 0xc0845e, 1.3)
    this.scene.add(hemi)
    const ambient = new THREE.AmbientLight(0x7d6d88, 0.52)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffc79a, 3.35)
    sun.position.copy(this.sunDir).multiplyScalar(90)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -46
    sun.shadow.camera.right = 46
    sun.shadow.camera.top = 46
    sun.shadow.camera.bottom = -46
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 230
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.025
    sun.target.position.set(0, 0, 0)
    this.scene.add(sun)
    this.scene.add(sun.target)
    this.sunLight = sun

    const rim = new THREE.DirectionalLight(0x6f7dff, 0.8)
    rim.position.set(36, 24, 44)
    this.scene.add(rim)

    this.scene.fog = new THREE.Fog(0xc88163, 62, 245)
  }

  _buildGround() {
    const grassTex = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#59613c'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = ['#4d552f', '#687044', '#707a48', '#454c2c'][Math.floor(Math.random() * 4)]
        ctx.globalAlpha = 0.25 + Math.random() * 0.5
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 5)
      }
    }, { repeat: [26, 26] })
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(320, 320),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, color: 0xb9b294 })
    )
    field.rotation.x = -Math.PI / 2
    field.position.y = -0.28
    field.receiveShadow = true
    this.group.add(field)

    const asphalt = new THREE.Mesh(
      new THREE.CircleGeometry(155, 48),
      new THREE.MeshStandardMaterial({ color: 0x2c2a2c, roughness: 0.96 })
    )
    asphalt.rotation.x = -Math.PI / 2
    asphalt.position.y = -0.22
    asphalt.receiveShadow = true
    this.group.add(asphalt)

    const tex = concreteTexture('#9b968b', '#6b6760')
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(96, 0.36, 96),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, metalness: 0.02, color: 0xe9e1d2 })
    )
    plaza.position.set(0, -0.18, -1)
    plaza.receiveShadow = true
    this.group.add(plaza)

    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb7ae9e, roughness: 0.9 })
    const curbN = new THREE.Mesh(new THREE.BoxGeometry(96, 0.22, 0.6), curbMat)
    curbN.position.set(0, -0.02, 46.7)
    curbN.receiveShadow = true
    this.group.add(curbN)
    const curbS = curbN.clone()
    curbS.position.z = -48.7
    this.group.add(curbS)
    const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 96), curbMat)
    curbE.position.set(47.7, -0.02, -1)
    this.group.add(curbE)
    const curbW = curbE.clone()
    curbW.position.x = -47.7
    this.group.add(curbW)

    const paintMat = new THREE.MeshStandardMaterial({ color: 0xe8ddc4, roughness: 0.85 })
    for (let i = -1; i <= 1; i += 2) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.01, 76), paintMat)
      line.position.set(i * 24, 0.012, -2)
      line.receiveShadow = true
      this.group.add(line)
    }
    for (let i = -1; i <= 1; i += 2) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(84, 0.01, 0.16), paintMat)
      line.position.set(0, 0.012, i * 24)
      this.group.add(line)
    }

    const logo = decalTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(-0.08)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'italic 900 230px "Arial Black", Impact, sans-serif'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(255,90,31,0.92)'
      ctx.lineWidth = 30
      ctx.strokeText('SKATE', 0, -100)
      ctx.fillStyle = 'rgba(242,237,228,0.9)'
      ctx.fillText('SKATE', 0, -100)
      ctx.font = 'italic 900 300px "Arial Black", Impact, sans-serif'
      ctx.strokeStyle = 'rgba(84,232,255,0.8)'
      ctx.lineWidth = 22
      ctx.strokeText('3', 0, 165)
      ctx.strokeStyle = 'rgba(242,237,228,0.92)'
      ctx.lineWidth = 8
      ctx.strokeText('3', 0, 165)
      ctx.restore()
      ctx.globalAlpha = 0.9
      ctx.fillStyle = 'rgba(255,90,31,0.9)'
      ctx.fillRect(w * 0.16, h * 0.78, w * 0.68, 8)
    })
    const logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 26),
      new THREE.MeshBasicMaterial({ map: logo, transparent: true, depthWrite: false, opacity: 0.9 })
    )
    logoMesh.rotation.x = -Math.PI / 2
    logoMesh.position.set(-27, 0.018, 15)
    logoMesh.scale.setScalar(0.72)
    this.group.add(logoMesh)

  }

  _buildPark() {
    const rampTex = concreteTexture('#b7b0a3', '#7d776d')
    const rampMat = new THREE.MeshStandardMaterial({ map: rampTex, roughness: 0.88, color: 0xf2e9d8 })
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2f3138, roughness: 0.55, metalness: 0.6 })
    this.rampMat = rampMat
    this.edgeMat = edgeMat

    const heightField = ({ x0, x1, z0, z1, segX, segZ, fn, lift = 0.015 }) => {
      const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, segX, segZ)
      geo.rotateX(-Math.PI / 2)
      geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, fn(pos.getX(i), pos.getZ(i)) + lift)
      }
      geo.computeVertexNormals()
      const mesh = new THREE.Mesh(geo, rampMat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.group.add(mesh)
      return mesh
    }

    // central funbox
    this.funbox = { x0: -6, x1: 6, z0: -4.5, z1: 4.5, height: 1.15, edge: 2.6 }
    this.funboxHeight = (x, z) => {
      const ax = Math.abs(x)
      const az = Math.abs(z)
      if (ax > 6 || az > 4.5) return 0
      const t = Math.min((6 - ax) / 2.6, (4.5 - az) / 2.6)
      return 1.15 * clamp(t, 0, 1)
    }
    heightField({ x0: -6, x1: 6, z0: -4.5, z1: 4.5, segX: 48, segZ: 40, fn: this.funboxHeight })

    const core = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.14, 3.8), rampMat)
    core.position.set(0, 0.55, 0)
    core.castShadow = true
    core.receiveShadow = true
    this.group.add(core)

    // funbox trims
    for (const z of [-1.9, 1.9]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.05, 0.1), edgeMat)
      trim.position.set(0, 1.16, z)
      this.group.add(trim)
    }
    for (const x of [-3.45, 3.45]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 3.9), edgeMat)
      trim.position.set(x, 1.16, 0)
      this.group.add(trim)
    }

    // east bank / kicker
    this.bank = { x0: 29, x1: 38, z0: 4, z1: 17, height: 2.1 }
    this.bankHeight = (x, z) => {
      if (x < 29 || x > 38 || z < 4 || z > 17) return 0
      return 2.1 * clamp((x - 29) / 9, 0, 1)
    }
    heightField({ x0: 29, x1: 38, z0: 4, z1: 17, segX: 32, segZ: 26, fn: this.bankHeight })
    const bankFace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.1, 13), rampMat)
    bankFace.position.set(38.1, 1.05, 10.5)
    bankFace.castShadow = true
    bankFace.receiveShadow = true
    this.group.add(bankFace)
    const bankCap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 13.2), edgeMat)
    bankCap.position.set(38.15, 2.12, 10.5)
    this.group.add(bankCap)

    // quarter pipe (north)
    this.quarterHeight = (x, z) => {
      if (x < this.quarter.xMin || x > this.quarter.xMax) return 0
      if (z > this.quarter.z) return 0
      if (z < this.quarter.topZ) {
        return z > this.quarter.topZ - 1.8 ? this.quarter.height : 0
      }
      const t = clamp((this.quarter.z - z) / (this.quarter.z - this.quarter.topZ), 0, 1)
      return this.quarter.height * Math.pow(t, 2.35)
    }
    heightField({
      x0: this.quarter.xMin, x1: this.quarter.xMax,
      z0: this.quarter.topZ, z1: this.quarter.z,
      segX: 64, segZ: 44, fn: this.quarterHeight,
    })

    // quarter pipe side cheeks
    const cheekShape = new THREE.Shape()
    cheekShape.moveTo(0, 0)
    cheekShape.lineTo(12, 0)
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      cheekShape.lineTo(12 - t * 12, this.quarter.height * Math.pow(t, 2.35))
    }
    cheekShape.lineTo(0, 0)
    const cheekGeo = new THREE.ExtrudeGeometry(cheekShape, { depth: 0.5, bevelEnabled: false })
    for (const x of [this.quarter.xMin - 0.5, this.quarter.xMax]) {
      const cheek = new THREE.Mesh(cheekGeo, rampMat)
      cheek.rotation.y = Math.PI / 2
      cheek.position.set(x, 0, this.quarter.topZ)
      cheek.castShadow = true
      cheek.receiveShadow = true
      this.group.add(cheek)
    }

    const backMat = new THREE.MeshStandardMaterial({ color: 0x6c665d, roughness: 0.95 })
    const back = new THREE.Mesh(new THREE.BoxGeometry(62, 9, 1.2), backMat)
    back.position.set(0, 4.5, -48.2)
    back.castShadow = true
    back.receiveShadow = true
    this.group.add(back)

    const coping = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 60.4, 10), edgeMat)
    coping.rotation.z = Math.PI / 2
    coping.position.set(0, this.quarter.height + 0.02, this.quarter.topZ + 0.1)
    this.group.add(coping)

    const quarterDeck = new THREE.Mesh(new THREE.BoxGeometry(60.4, 0.3, 1.9), rampMat)
    quarterDeck.position.set(0, this.quarter.height - 0.15, this.quarter.topZ - 0.92)
    quarterDeck.castShadow = true
    quarterDeck.receiveShadow = true
    this.group.add(quarterDeck)
    const deckLip = new THREE.Mesh(new THREE.BoxGeometry(60.4, 0.12, 0.12), edgeMat)
    deckLip.position.set(0, this.quarter.height + 0.02, this.quarter.topZ - 1.84)
    this.group.add(deckLip)

    const wallSignTex = canvasTexture(1024, 256, (ctx, w, h) => {
      ctx.fillStyle = '#14151c'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ff5a1f'
      ctx.lineWidth = 12
      ctx.strokeRect(8, 8, w - 16, h - 16)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'italic 900 116px "Arial Black", Impact, sans-serif'
      ctx.fillStyle = '#f2ede4'
      ctx.fillText('PORT CARVERTON', w / 2, h / 2 - 8)
      ctx.font = '700 32px monospace'
      ctx.fillStyle = '#54e8ff'
      ctx.fillText('SKATE PLAZA  ·  NO REFS', w / 2, h - 56)
    })
    const wallSign = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 6),
      new THREE.MeshStandardMaterial({ map: wallSignTex, roughness: 0.85 })
    )
    wallSign.position.set(0, 7.55, -47.57)
    this.group.add(wallSign)

    const qGraffiti = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 3.4),
      new THREE.MeshStandardMaterial({ map: graffitiTexture(), roughness: 0.9 })
    )
    qGraffiti.position.set(0, 6.2, this.quarter.topZ + 0.9)
    qGraffiti.visible = false
    this.group.add(qGraffiti)
  }

  _addRail(a, b, opts = {}) {
    const radius = opts.radius ?? 0.055
    const mat = this.edgeMat
    const start = new THREE.Vector3(a[0], a[1], a[2])
    const end = new THREE.Vector3(b[0], b[1], b[2])
    const dir = end.clone().sub(start)
    const len = dir.length()

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), mat)
    bar.position.copy(start).add(end).multiplyScalar(0.5)
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    bar.castShadow = true
    this.group.add(bar)

    const supportMat = new THREE.MeshStandardMaterial({ color: 0x3a3c44, roughness: 0.6, metalness: 0.5 })
    const addSupport = (p) => {
      const groundY = this.heightAt(p.x, p.z)
      const h = p.y - groundY
      if (h <= 0.15) return
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, h, 8), supportMat)
      post.position.set(p.x, groundY + h / 2, p.z)
      post.castShadow = true
      this.group.add(post)
    }
    addSupport(start)
    addSupport(end)

    if (opts.mid) {
      for (const t of opts.mid) {
        const p = start.clone().lerp(end, t)
        addSupport(p)
      }
    }

    this.rails.push({
      a: start,
      b: end,
      length: len,
      radius: opts.grindRadius ?? 0.85,
      id: this.rails.length,
    })
    return this.rails[this.rails.length - 1]
  }

  _buildRails() {
    this._addRail([-9, 0.82, 9.5], [9, 0.82, 9.5], { mid: [0.33, 0.66] })
    this._addRail([-30, 0.78, 22], [-16, 0.78, 22], { mid: [0.5] })
    this._addRail([18, 0.68, -8], [30, 0.68, -8], { mid: [0.5] })
    this._addRail([-22, 2.15, -12], [-22, 0.95, 8], { mid: [0.5], radius: 0.065 })
    this._addRail([-3.35, 1.78, 0], [3.35, 1.78, 0], { radius: 0.05 })
    this._addRail([12, 0.72, 26], [20, 0.72, 18], { mid: [0.5], radius: 0.055 })
  }

  _buildProps() {
    const metal = new THREE.MeshStandardMaterial({ color: 0x33353d, roughness: 0.55, metalness: 0.6 })
    const wood = new THREE.MeshStandardMaterial({ color: 0x6d4a2f, roughness: 0.85 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.7 })

    const bench = (x, z, rot = 0) => {
      const g = new THREE.Group()
      for (let i = 0; i < 3; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.12), wood)
        slat.position.set(0, 0.46, -0.16 + i * 0.16)
        slat.castShadow = true
        g.add(slat)
      }
      for (const sx of [-0.95, 0.95]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.5), metal)
        leg.position.set(sx, 0.23, 0)
        leg.castShadow = true
        g.add(leg)
      }
      g.position.set(x, 0, z)
      g.rotation.y = rot
      this.group.add(g)
    }
    bench(-16, 38, 0.1)
    bench(14, 38, -0.08)
    bench(-38, 6, Math.PI / 2)
    bench(38, -18, -Math.PI / 2)

    const can = (x, z) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.95, 12), metal)
      body.position.y = 0.47
      body.castShadow = true
      g.add(body)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 14), metal)
      rim.rotation.x = Math.PI / 2
      rim.position.y = 0.95
      g.add(rim)
      g.position.set(x, 0, z)
      this.group.add(g)
    }
    can(-38, 39); can(39, 34); can(-10, -37)

    const cone = (x, z) => {
      const g = new THREE.Group()
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 10), orange)
      c.position.y = 0.27
      c.castShadow = true
      g.add(c)
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), metal)
      base.position.y = 0.02
      g.add(base)
      g.position.set(x, 0, z)
      this.group.add(g)
    }
    cone(24, 24); cone(25.2, 25); cone(-35, -26)

    // tall light poles
    const glowTex = radialGlowTexture()
    for (const [x, z] of [[-40, -30], [40, -30], [-40, 40], [40, 40], [0, 42]]) {
      const pole = new THREE.Group()
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 8.5, 8), metal)
      mast.position.y = 4.25
      mast.castShadow = true
      pole.add(mast)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.1), metal)
      arm.position.set(0.9, 8.3, 0)
      pole.add(arm)
      for (const ax of [0.2, 1.6]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb060, emissiveIntensity: 2.2 }))
        lamp.position.set(ax, 8.22, 0)
        pole.add(lamp)
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 }))
        glow.position.set(ax, 8.2, 0)
        glow.scale.set(3.4, 3.4, 1)
        pole.add(glow)
      }
      pole.position.set(x, 0, z)
      pole.rotation.y = x > 0 ? Math.PI : 0
      this.group.add(pole)
    }

    // entrance banner
    const bannerTex = canvasTexture(1024, 192, (ctx, w, h) => {
      ctx.fillStyle = '#111219'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ff5a1f'
      ctx.lineWidth = 10
      ctx.strokeRect(10, 10, w - 20, h - 20)
      ctx.font = 'italic 900 92px "Arial Black", Impact, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#f2ede4'
      ctx.fillText('PORT CARVERTON', w / 2, h / 2 + 4)
      ctx.font = '700 30px monospace'
      ctx.fillStyle = '#54e8ff'
      ctx.fillText('SKATE PLAZA  ·  EST. 2010', w / 2, h - 34)
    })
    for (const x of [-12, 12]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.4, 8), metal)
      pole.position.set(x, 3.2, 43)
      pole.castShadow = true
      this.group.add(pole)
    }
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(23.4, 4.1),
      new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.8 })
    )
    banner.position.set(0, 5.2, 43)
    banner.rotation.y = Math.PI
    this.group.add(banner)
    this.flags.push({ mesh: banner, base: 0, phase: 0 })

    // south graffiti wall
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(94, 5.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x6b665e, roughness: 0.96 })
    )
    wall.position.set(0, 2.8, 47.6)
    wall.receiveShadow = true
    this.group.add(wall)
    const graf = new THREE.Mesh(
      new THREE.PlaneGeometry(92, 5.2),
      new THREE.MeshStandardMaterial({ map: graffitiTexture(), roughness: 0.94 })
    )
    graf.position.set(0, 2.9, 47.16)
    graf.rotation.y = Math.PI
    this.group.add(graf)

    // low side walls
    for (const side of [-1, 1]) {
      const sideWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.15, 92),
        new THREE.MeshStandardMaterial({ color: 0x7c766b, roughness: 0.95 })
      )
      sideWall.position.set(side * 47.4, 0.57, -1)
      sideWall.receiveShadow = true
      this.group.add(sideWall)
    }

    // scattered planters
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x6d6a62, roughness: 0.92 })
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x3f6a37, roughness: 0.95 })
    for (const [x, z, s] of [[-38, -14, 1], [38, 28, 1.2], [-40, 30, 0.9], [30, 42, 1.1]]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.4 * s, 0.8 * s, 2.4 * s), planterMat)
      box.position.set(x, 0.4 * s, z)
      box.castShadow = true
      box.receiveShadow = true
      this.group.add(box)
      for (let i = 0; i < 4; i++) {
        const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 1), bushMat)
        bush.position.set(x + (Math.random() - 0.5) * 1.3, 1.05 * s + Math.random() * 0.25, z + (Math.random() - 0.5) * 1.3)
        bush.scale.y = 0.8
        bush.castShadow = true
        this.group.add(bush)
      }
    }

    this._buildPalms()
  }

  _buildPalms() {
    const leafTex = leafTexture()
    const leafMat = new THREE.MeshStandardMaterial({
      map: leafTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide,
      roughness: 0.9, color: 0xd8ffc7,
    })
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 0.95 })
    const positions = [
      [-42, -38], [-42, -17], [-42, 5], [-42, 27],
      [42, -38], [42, -16], [42, 6], [42, 28],
      [-26, 44], [26, 44], [-39, -42], [39, -42],
    ]
    for (const [x, z] of positions) {
      const palm = new THREE.Group()
      const scale = 0.82 + Math.random() * 0.35
      const lean = (Math.random() - 0.5) * 0.9
      const trunkGeos = []
      const leafGeos = []
      let crownPos = new THREE.Vector3()
      for (let i = 0; i < 6; i++) {
        const seg = new THREE.CylinderGeometry(0.16 - i * 0.008, 0.22 - i * 0.01, 1.06, 7)
        const y = 0.5 + i * 0.98
        const ox = lean * (i / 6) ** 1.4
        seg.translate(ox, y, 0)
        trunkGeos.push(seg)
        crownPos.set(lean * (i / 6) ** 1.4, y + 0.5, 0)
      }
      for (let i = 0; i < 3; i++) {
        const nut = new THREE.SphereGeometry(0.15, 7, 6)
        nut.translate(Math.cos(i * 2.1) * 0.3, crownPos.y - 0.1, Math.sin(i * 2.1) * 0.3)
        trunkGeos.push(nut)
      }
      for (let i = 0; i < 9; i++) {
        const leaf = new THREE.PlaneGeometry(1.15, 3.1, 1, 4)
        const angle = (i / 9) * TAU + Math.random() * 0.2
        const m = new THREE.Matrix4()
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.55 + (i % 3) * 0.16, angle, 0.15, 'YXZ'))
        m.compose(
          new THREE.Vector3(
            Math.cos(angle) * 0.5 + Math.sin(angle) * 0,
            0.15,
            Math.sin(angle) * 0.5
          ),
          q,
          new THREE.Vector3(1, 1, 1)
        )
        leaf.applyMatrix4(m)
        leaf.translate(0, 1.35, 0)
        leaf.translate(0, crownPos.y, 0)
        leafGeos.push(leaf)
      }

      const trunk = new THREE.Mesh(mergeGeometries(trunkGeos, false), trunkMat)
      trunk.castShadow = true
      palm.add(trunk)
      const crown = new THREE.Group()
      crown.position.copy(crownPos)
      const leaves = new THREE.Mesh(mergeGeometries(leafGeos, false), leafMat)
      leaves.position.y = -crownPos.y
      leaves.castShadow = true
      crown.add(leaves)
      palm.add(crown)
      palm.position.set(x, 0, z)
      palm.scale.setScalar(scale)
      palm.rotation.y = Math.random() * TAU
      this.group.add(palm)
      this.palms.push({ group: palm, crown, phase: Math.random() * TAU, lean })
    }
  }

  _buildCrowd() {
    const bodyGeo = new THREE.CylinderGeometry(0.19, 0.26, 0.86, 7)
    bodyGeo.translate(0, 0.95, 0)
    const headGeo = new THREE.SphereGeometry(0.16, 10, 8)
    headGeo.translate(0, 1.52, 0)
    const legGeo = new THREE.BoxGeometry(0.3, 0.52, 0.22)
    legGeo.translate(0, 0.26, 0)
    const count = 34
    const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), count)
    const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), count)
    const legs = new THREE.InstancedMesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x2c2c3c, roughness: 0.95 }), count)
    bodies.castShadow = true
    heads.castShadow = true
    legs.castShadow = true
    const dummy = new THREE.Object3D()
    const colors = ['#ff5a1f', '#54e8ff', '#e07bff', '#9dff5a', '#f2ede4', '#ffb15a', '#4d6bff']
    const data = []
    const spots = []
    for (let i = 0; i < count; i++) {
      let x, z
      if (i < 16) { x = -22 + (i / 16) * 44; z = 40.5 + (Math.random() - 0.5) * 1.5 }
      else if (i < 26) { x = 40 + Math.random() * 1.6; z = -12 + (i - 16) * 3.6 }
      else {
        const side = i % 2 === 0 ? -1 : 1
        const row = Math.floor((i - 26) / 2)
        x = side * (33.5 + Math.random() * 1.2)
        z = -29 - row * 3.1 + (Math.random() - 0.5) * 1.2
      }
      x += (Math.random() - 0.5) * 1.1
      spots.push([x, z])
      const s = 0.85 + Math.random() * 0.25
      dummy.position.set(x, 0, z)
      dummy.rotation.y = Math.random() * TAU
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      bodies.setMatrixAt(i, dummy.matrix)
      heads.setMatrixAt(i, dummy.matrix)
      legs.setMatrixAt(i, dummy.matrix)
      bodies.setColorAt(i, new THREE.Color(colors[i % colors.length]))
      const skin = ['#e8b48d', '#c98a62', '#8c5a3c', '#f0c9a6', '#a86a45'][i % 5]
      heads.setColorAt(i, new THREE.Color(skin))
      data.push({ x, z, s, phase: Math.random() * TAU })
    }
    bodies.instanceMatrix.needsUpdate = true
    heads.instanceMatrix.needsUpdate = true
    legs.instanceMatrix.needsUpdate = true
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true
    if (heads.instanceColor) heads.instanceColor.needsUpdate = true
    this.group.add(bodies)
    this.group.add(heads)
    this.group.add(legs)
    this.crowd = { bodies, heads, legs, data, dummy }
  }

  _buildCity() {
    const buildingGroup = new THREE.Group()
    const palette = [0x2a2938, 0x34303f, 0x24263a, 0x3a3242, 0x2d3344]
    const rand = mulberry(77)
    const placements = []
    const roofs = []
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * TAU + rand() * 0.15
      const dist = 78 + rand() * 48
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist - 6
      if (z > 20 && Math.abs(x) < 55 && dist < 95) continue
      placements.push([x, z])
    }
    placements.forEach(([x, z], i) => {
      const w = 9 + rand() * 12
      const d = 9 + rand() * 12
      const h = 14 + rand() * 34
      const tex = windowTexture(i + 3)
      const mat = new THREE.MeshStandardMaterial({
        map: tex, color: palette[i % palette.length],
        roughness: 0.86, metalness: 0.12,
        emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.16,
      })
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      b.position.set(x, h / 2 - 0.3, z)
      b.rotation.y = Math.atan2(x, z) + (rand() - 0.5) * 0.3
      b.castShadow = false
      b.receiveShadow = false
      buildingGroup.add(b)
      roofs.push([x, h, z, w, d])
    })
    const roofMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x1d1d28, roughness: 0.9 }),
      roofs.length
    )
    const rd = new THREE.Object3D()
    roofs.forEach(([x, h, z, w, d], i) => {
      rd.position.set(x, h + 0.5, z)
      rd.scale.set(w * 0.4, 1.2 + rand() * 3, d * 0.4)
      rd.rotation.y = Math.atan2(x, z)
      rd.updateMatrix()
      roofMesh.setMatrixAt(i, rd.matrix)
    })
    buildingGroup.add(roofMesh)
    this.group.add(buildingGroup)

    // distant hills
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3e3046, roughness: 1, fog: true })
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * TAU
      const hill = new THREE.Mesh(new THREE.ConeGeometry(40 + Math.random() * 30, 22 + Math.random() * 20, 6), hillMat)
      hill.position.set(Math.cos(angle) * 230, -2, Math.sin(angle) * 230)
      hill.rotation.y = Math.random() * TAU
      this.group.add(hill)
    }

    // birds
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a1922, side: THREE.DoubleSide })
    const birdGeo = new THREE.BufferGeometry()
    birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.6, 0.12, 0.35, 0, -0.02, 0.1, 0, 0, 0, 0.6, 0.12, 0.35, 0, -0.02, 0.1], 3))
    for (let i = 0; i < 9; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat)
      bird.position.set(-30 + Math.random() * 60, 25 + Math.random() * 20, -40 + Math.random() * 40)
      bird.scale.setScalar(1.2 + Math.random() * 1.4)
      this.group.add(bird)
      this.birds.push({ mesh: bird, radius: 20 + Math.random() * 30, y: bird.position.y, speed: 0.08 + Math.random() * 0.12, phase: Math.random() * TAU })
    }
  }

  _buildParticles() {
    this.sparks = new PointsPool(this.scene, 240, THREE.AdditiveBlending)
    this.dust = new PointsPool(this.scene, 200, THREE.NormalBlending)
    this.confetti = this._buildConfetti()
  }

  _buildConfetti() {
    const count = 160
    const geo = new THREE.PlaneGeometry(0.1, 0.2)
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, vertexColors: false })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    mesh.frustumCulled = false
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const colors = ['#ff5a1f', '#54e8ff', '#9dff5a', '#e07bff', '#f2ede4', '#ffd166']
    const dummy = new THREE.Object3D()
    const data = []
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, new THREE.Color(colors[i % colors.length]))
      data.push({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0, scale: 1 })
      dummy.position.set(0, -50, 0)
      dummy.scale.setScalar(0.001)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    this.scene.add(mesh)
    return { mesh, data, dummy, cursor: 0 }
  }

  celebrate(position, count = 90) {
    const c = this.confetti
    for (let n = 0; n < count; n++) {
      const i = c.cursor
      c.cursor = (c.cursor + 1) % c.data.length
      const d = c.data[i]
      d.active = true
      d.pos.set(position.x + (Math.random() - 0.5) * 3, position.y + 2 + Math.random() * 2, position.z + (Math.random() - 0.5) * 3)
      d.vel.set((Math.random() - 0.5) * 5, 3 + Math.random() * 7, (Math.random() - 0.5) * 5)
      d.rot.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU)
      d.spin.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14)
      d.life = 2.4 + Math.random() * 1.6
      d.scale = 0.8 + Math.random() * 0.8
    }
  }

  spawnSparks(position, count = 8, direction = null) {
    this.sparks.emit({
      position, count, color: new THREE.Color(Math.random() > 0.4 ? '#ffb03a' : '#fff1c9'),
      speed: 4.2, spread: 0.16, up: 0.35, size: 0.085, life: 0.35, gravity: -14, drag: 1.5, dir: direction,
    })
  }

  spawnDust(position, count = 14, intensity = 1) {
    this.dust.emit({
      position, count, color: new THREE.Color('#cbb89a'),
      speed: 2.6 * intensity, spread: 0.35, up: 0.25, size: 0.5 * intensity, life: 0.65, gravity: -1.2, drag: 2.2,
    })
  }

  heightAt(x, z) {
    let h = 0
    const fun = this.funboxHeight(x, z)
    if (fun > h) h = fun
    const bank = this.bankHeight(x, z)
    if (bank > h) h = bank
    const quarter = this.quarterHeight(x, z)
    if (quarter > h) h = quarter
    return h
  }

  normalAt(x, z) {
    const e = 0.24
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z)
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e)
    this.tmpNormal.set(-hx, 2 * e, -hz).normalize()
    return this.tmpNormal
  }

  slopeAlong(x, z, dirX, dirZ) {
    const e = 0.5
    return (this.heightAt(x + dirX * e, z + dirZ * e) - this.heightAt(x - dirX * e, z - dirZ * e)) / (2 * e)
  }

  update(dt, elapsed) {
    this.time = elapsed
    for (const palm of this.palms) {
      palm.crown.rotation.z = Math.sin(elapsed * 0.7 + palm.phase) * 0.05
      palm.crown.rotation.x = Math.cos(elapsed * 0.52 + palm.phase) * 0.04
    }

    for (const flag of this.flags) {
      flag.mesh.rotation.y = Math.PI + Math.sin(elapsed * 0.8) * 0.04
      flag.mesh.rotation.z = Math.sin(elapsed * 1.6) * 0.012
    }

    if (this.crowd) {
      const { bodies, heads, legs, data, dummy } = this.crowd
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const bob = Math.sin(elapsed * 1.6 + d.phase) * 0.035
        dummy.position.set(d.x, bob, d.z)
        dummy.rotation.y = Math.atan2(-d.x, -d.z) + Math.sin(elapsed * 0.4 + d.phase) * 0.25
        dummy.scale.setScalar(d.s)
        dummy.updateMatrix()
        bodies.setMatrixAt(i, dummy.matrix)
        heads.setMatrixAt(i, dummy.matrix)
        legs.setMatrixAt(i, dummy.matrix)
      }
      bodies.instanceMatrix.needsUpdate = true
      heads.instanceMatrix.needsUpdate = true
      legs.instanceMatrix.needsUpdate = true
    }

    for (const bird of this.birds) {
      bird.phase += dt * bird.speed
      bird.mesh.position.set(
        Math.cos(bird.phase) * bird.radius,
        bird.y + Math.sin(elapsed * 0.5 + bird.phase) * 1.4,
        Math.sin(bird.phase) * bird.radius - 20
      )
      bird.mesh.rotation.y = -bird.phase + Math.PI / 2
    }

    this.clouds.rotation.y = elapsed * 0.0018

    this.sparks.update(dt)
    this.dust.update(dt)
    this._updateConfetti(dt)
  }

  _updateConfetti(dt) {
    const c = this.confetti
    let any = false
    for (let i = 0; i < c.data.length; i++) {
      const d = c.data[i]
      if (!d.active) continue
      any = true
      d.life -= dt
      if (d.life <= 0) {
        d.active = false
        c.dummy.position.set(0, -50, 0)
        c.dummy.scale.setScalar(0.001)
        c.dummy.updateMatrix()
        c.mesh.setMatrixAt(i, c.dummy.matrix)
        continue
      }
      d.vel.y -= 9.5 * dt
      d.vel.x *= 0.99
      d.vel.z *= 0.99
      d.pos.addScaledVector(d.vel, dt)
      d.rot.addScaledVector(d.spin, dt)
      const fade = clamp(d.life / 0.8, 0, 1)
      c.dummy.position.copy(d.pos)
      c.dummy.rotation.set(d.rot.x, d.rot.y, d.rot.z)
      c.dummy.scale.setScalar(d.scale * fade)
      c.dummy.updateMatrix()
      c.mesh.setMatrixAt(i, c.dummy.matrix)
    }
    if (any) c.mesh.instanceMatrix.needsUpdate = true
  }
}
