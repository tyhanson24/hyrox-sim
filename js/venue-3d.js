/**
 * Venue3DScene -- TRON-aesthetic 3D course visualization for HYROX venues.
 *
 * Renders a stylized abstract scene: dark reflective ground, neon glowing
 * race-course tube, hexagonal station pillars with floating labels, bloom
 * post-processing, atmospheric fog, and a camera flythrough + orbit.
 *
 * Dependencies (loaded via import map):
 *   three, three/addons OrbitControls, EffectComposer, RenderPass, UnrealBloomPass
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

import { buildStationPoints } from './spline-utils.js'

// ── Design tokens ───────────────────────────────────────────────────────────
const NEON    = 0xc8ff00
const ACCENT  = 0xff3c00
const WHITE   = 0xffffff
const BG      = 0x0a0a0a

const NEON_HEX    = '#c8ff00'
const ACCENT_HEX  = '#ff3c00'
const WHITE_HEX   = '#ffffff'

// ── Performance tier ────────────────────────────────────────────────────────
const cores = navigator.hardwareConcurrency || 2
const IS_LOW_END = cores < 4

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a canvas-based text sprite that floats above a station pillar.
 */
function makeTextSprite(text, color = NEON_HEX, fontSize = 48) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, 256, 128)
  ctx.font = `bold ${fontSize}px "Bebas Neue", "Inter", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Glow
  ctx.shadowColor = color
  ctx.shadowBlur = 16
  ctx.fillStyle = color
  ctx.fillText(text, 128, 64)
  // Second pass for crispness
  ctx.shadowBlur = 0
  ctx.fillText(text, 128, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(4, 2, 1)
  return { sprite, texture }
}

/**
 * Convert percentage-based station coordinates (0-100) into world-space
 * positions on the x/z plane, centered around origin.
 */
function coordToWorld(px, py) {
  // Map 0-100 -> -50..50 so the course is centered at origin
  return new THREE.Vector3(px - 50, 0, py - 50)
}

// ═════════════════════════════════════════════════════════════════════════════
// Main class
// ═════════════════════════════════════════════════════════════════════════════

export class Venue3DScene {
  /**
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {Object} opts
   * @param {Object|string} opts.coordinates - station_coordinates JSONB
   * @param {string}        [opts.mapImageUrl] - unused in 3D (kept for API compat)
   */
  constructor(canvas, { coordinates, mapImageUrl } = {}) {
    this.canvas = canvas
    this._destroyed = false

    // ── Parse station data ──────────────────────────────────────────────
    this.stationPoints = buildStationPoints(coordinates, true) // include roxzone + start/finish
    if (this.stationPoints.length === 0) {
      // Fallback: place 8 stations in an oval
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        this.stationPoints.push({
          x: 50 + 35 * Math.cos(angle),
          y: 50 + 25 * Math.sin(angle),
          key: `station_${i + 1}`,
          name: `Station ${i + 1}`,
          num: i + 1
        })
      }
    }

    // Convert to 3D positions
    this.worldPoints = this.stationPoints.map(s => coordToWorld(s.x, s.y))

    // ── Renderer ────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !IS_LOW_END,
      alpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_LOW_END ? 1 : 2))
    this.renderer.setClearColor(BG, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // ── Scene ───────────────────────────────────────────────────────────
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(BG)
    this.scene.fog = new THREE.FogExp2(BG, 0.012)

    // ── Camera ──────────────────────────────────────────────────────────
    const aspect = canvas.clientWidth / canvas.clientHeight || 1
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500)
    this.camera.position.set(0, 55, 65)
    this.camera.lookAt(0, 0, 0)

    // ── Controls ────────────────────────────────────────────────────────
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.maxPolarAngle = Math.PI / 2.15
    this.controls.minDistance = 15
    this.controls.maxDistance = 120
    this.controls.target.set(0, 0, 0)
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.6

    // ── Build the world ─────────────────────────────────────────────────
    this._disposables = [] // track things we need to dispose
    this._sprites = []     // text sprite data (sprite + texture)

    this._buildGround()
    this._buildGrid()
    this._buildCourseTube()
    this._buildStationPillars()
    this._buildLighting()

    // ── Post-processing (bloom) ─────────────────────────────────────────
    this._initComposer()

    // ── Animation state ─────────────────────────────────────────────────
    this._clock = new THREE.Clock()
    this._flythrough = true
    this._flythroughElapsed = 0
    this._flythroughDuration = 5 // seconds
    this._paused = false
    this._rafId = null

    // ── Initial size ────────────────────────────────────────────────────
    this.resize(canvas.clientWidth, canvas.clientHeight)

    // ── Start render loop ───────────────────────────────────────────────
    this._animate = this._animate.bind(this)
    this._rafId = requestAnimationFrame(this._animate)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════════

  /** Resume or start the flythrough / animation loop. */
  play() {
    this._paused = false
    if (!this._rafId && !this._destroyed) {
      this._clock.start()
      this._rafId = requestAnimationFrame(this._animate)
    }
  }

  /** Pause the animation loop (render freezes). */
  pause() {
    this._paused = true
  }

  /** Resize renderer + camera to new dimensions. */
  resize(w, h) {
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (this.composer) {
      this.composer.setSize(w, h)
    }
  }

  /** Dispose all GPU resources. */
  destroy() {
    this._destroyed = true
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }

    // Dispose geometries, materials, textures
    for (const item of this._disposables) {
      if (item.dispose) item.dispose()
    }

    // Dispose text sprites
    for (const { sprite, texture } of this._sprites) {
      texture.dispose()
      sprite.material.dispose()
    }

    // Composer
    if (this.composer) {
      this.composer.dispose()
    }

    // Controls
    if (this.controls) {
      this.controls.dispose()
    }

    // Renderer
    this.renderer.dispose()

    // Clear scene
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })

    this.scene.clear()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Scene construction
  // ═══════════════════════════════════════════════════════════════════════════

  /** Dark reflective ground plane. */
  _buildGround() {
    const geo = new THREE.PlaneGeometry(200, 200)
    const mat = new THREE.MeshStandardMaterial({
      color: BG,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 0.3
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = -0.05
    mesh.receiveShadow = true
    this.scene.add(mesh)
    this._disposables.push(geo, mat)
  }

  /** Subtle grid overlay on the ground. */
  _buildGrid() {
    const grid = new THREE.GridHelper(200, 80, 0x1a1a2e, 0x111122)
    grid.position.y = 0
    grid.material.transparent = true
    grid.material.opacity = 0.35
    this.scene.add(grid)
    this._disposables.push(grid.material)
    if (grid.geometry) this._disposables.push(grid.geometry)
  }

  /** Neon extruded tube along a Catmull-Rom spline through station points. */
  _buildCourseTube() {
    if (this.worldPoints.length < 2) return

    // Build Three.js CatmullRomCurve3 through station positions (lifted slightly)
    const curvePoints = this.worldPoints.map(p =>
      new THREE.Vector3(p.x, 0.3, p.z)
    )
    this.courseCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5)

    const tubularSegments = IS_LOW_END ? 120 : 240
    const tubeRadius = 0.35
    const radialSegments = IS_LOW_END ? 6 : 10

    const tubeGeo = new THREE.TubeGeometry(
      this.courseCurve, tubularSegments, tubeRadius, radialSegments, false
    )

    // Emissive neon material -- MeshStandardMaterial with high emissive for bloom
    const tubeMat = new THREE.MeshStandardMaterial({
      color: NEON,
      emissive: NEON,
      emissiveIntensity: 2.0,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.92
    })

    this.tubeMesh = new THREE.Mesh(tubeGeo, tubeMat)
    this.scene.add(this.tubeMesh)
    this._disposables.push(tubeGeo, tubeMat)

    // Secondary wider glow tube (additive blended, lower opacity)
    const glowGeo = new THREE.TubeGeometry(
      this.courseCurve, tubularSegments, tubeRadius * 2.5, radialSegments, false
    )
    const glowMat = new THREE.MeshBasicMaterial({
      color: NEON,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const glowMesh = new THREE.Mesh(glowGeo, glowMat)
    this.scene.add(glowMesh)
    this._disposables.push(glowGeo, glowMat)
  }

  /** Hexagonal pillars at each station with floating number labels. */
  _buildStationPillars() {
    for (let i = 0; i < this.stationPoints.length; i++) {
      const station = this.stationPoints[i]
      const wp = this.worldPoints[i]

      // Determine color based on station type
      let pillarColor, pillarEmissive, labelText, labelColor

      if (station.key === 'start_finish') {
        pillarColor = WHITE
        pillarEmissive = WHITE
        labelText = 'START'
        labelColor = WHITE_HEX
      } else if (station.key === 'roxzone') {
        pillarColor = ACCENT
        pillarEmissive = ACCENT
        labelText = 'ROX'
        labelColor = ACCENT_HEX
      } else {
        pillarColor = NEON
        pillarEmissive = NEON
        labelText = String(station.num)
        labelColor = NEON_HEX
      }

      // Pillar height varies by type
      const pillarHeight = station.key === 'roxzone' ? 5.5
        : station.key === 'start_finish' ? 6.5
        : 4 + (station.num % 3) * 0.5

      // Hexagonal pillar (CylinderGeometry with 6 radial segments)
      const pillarGeo = new THREE.CylinderGeometry(1.0, 1.2, pillarHeight, 6, 1, false)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x0d0d0d,
        emissive: pillarEmissive,
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
      })
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat)
      pillarMesh.position.set(wp.x, pillarHeight / 2, wp.z)
      this.scene.add(pillarMesh)
      this._disposables.push(pillarGeo, pillarMat)

      // Neon ring at top of pillar
      const ringGeo = new THREE.TorusGeometry(1.1, 0.08, 8, 6)
      const ringMat = new THREE.MeshStandardMaterial({
        color: pillarColor,
        emissive: pillarColor,
        emissiveIntensity: 3.0,
        metalness: 0.2,
        roughness: 0.5
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.position.set(wp.x, pillarHeight + 0.1, wp.z)
      this.scene.add(ringMesh)
      this._disposables.push(ringGeo, ringMat)

      // Base glow disc on ground
      const discGeo = new THREE.CircleGeometry(2.0, 6)
      const discMat = new THREE.MeshBasicMaterial({
        color: pillarColor,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
      const discMesh = new THREE.Mesh(discGeo, discMat)
      discMesh.rotation.x = -Math.PI / 2
      discMesh.position.set(wp.x, 0.02, wp.z)
      this.scene.add(discMesh)
      this._disposables.push(discGeo, discMat)

      // Floating text label above pillar
      const spriteData = makeTextSprite(labelText, labelColor, 52)
      spriteData.sprite.position.set(wp.x, pillarHeight + 2.8, wp.z)
      this.scene.add(spriteData.sprite)
      this._sprites.push(spriteData)

      // Station name (smaller, below number)
      if (station.name && station.key !== 'start_finish' && station.key !== 'roxzone') {
        const nameData = makeTextSprite(station.name.toUpperCase(), 'rgba(255,255,255,0.6)', 28)
        nameData.sprite.position.set(wp.x, pillarHeight + 1.4, wp.z)
        nameData.sprite.scale.set(5, 1.5, 1)
        this.scene.add(nameData.sprite)
        this._sprites.push(nameData)
      }

      // Point light at each station for pool lighting on the ground
      const pointLight = new THREE.PointLight(pillarColor, IS_LOW_END ? 1.5 : 3, 18, 2)
      pointLight.position.set(wp.x, pillarHeight + 1, wp.z)
      this.scene.add(pointLight)
    }
  }

  /** Ambient + directional fill + hemisphere for atmosphere. */
  _buildLighting() {
    // Dim ambient
    const ambient = new THREE.AmbientLight(0x111122, 0.4)
    this.scene.add(ambient)

    // Hemisphere light (sky = subtle blue, ground = dark)
    const hemi = new THREE.HemisphereLight(0x1a1a3e, 0x0a0a0a, 0.3)
    this.scene.add(hemi)

    // Directional key light (cool blue, angled)
    const dir = new THREE.DirectionalLight(0x4466aa, 0.4)
    dir.position.set(30, 50, 20)
    this.scene.add(dir)
  }

  /** Set up EffectComposer with UnrealBloomPass. */
  _initComposer() {
    const size = this.renderer.getSize(new THREE.Vector2())

    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    if (!IS_LOW_END) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.x, size.y),
        1.5,   // strength
        0.4,   // radius
        0.2    // threshold
      )
      this.composer.addPass(bloomPass)
      this._bloomPass = bloomPass
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Animation
  // ═══════════════════════════════════════════════════════════════════════════

  _animate() {
    if (this._destroyed) return

    this._rafId = requestAnimationFrame(this._animate)

    if (this._paused) return

    const dt = this._clock.getDelta()
    const elapsed = this._clock.getElapsedTime()

    // ── Flythrough camera on first load ─────────────────────────────────
    if (this._flythrough && this.courseCurve) {
      this._flythroughElapsed += dt
      const t = Math.min(this._flythroughElapsed / this._flythroughDuration, 1)

      // Ease-in-out cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

      // Camera follows the course path, elevated and offset
      const point = this.courseCurve.getPointAt(eased)
      const tangent = this.courseCurve.getTangentAt(eased)

      // Offset camera perpendicular to path + above
      const cameraHeight = 12 + 8 * Math.sin(eased * Math.PI)
      const sideOffset = 10
      const perpX = -tangent.z * sideOffset
      const perpZ = tangent.x * sideOffset

      this.camera.position.set(
        point.x + perpX,
        cameraHeight,
        point.z + perpZ
      )

      // Look slightly ahead along the path
      const lookAhead = Math.min(eased + 0.08, 1)
      const lookTarget = this.courseCurve.getPointAt(lookAhead)
      this.camera.lookAt(lookTarget.x, 1, lookTarget.z)

      // Transition to orbit at end
      if (t >= 1) {
        this._flythrough = false
        this.controls.target.set(0, 0, 0)
        this.camera.position.set(0, 55, 65)
        this.controls.update()
      }
    } else {
      // ── Normal orbit mode ─────────────────────────────────────────────
      this.controls.update()
    }

    // ── Animate tube pulse ──────────────────────────────────────────────
    if (this.tubeMesh) {
      const pulse = 1.5 + 0.5 * Math.sin(elapsed * 2.0)
      this.tubeMesh.material.emissiveIntensity = pulse
    }

    // ── Animate text sprites (gentle hover) ─────────────────────────────
    for (let i = 0; i < this._sprites.length; i++) {
      const { sprite } = this._sprites[i]
      const baseY = sprite.userData.baseY ?? sprite.position.y
      if (!sprite.userData.baseY) sprite.userData.baseY = baseY
      sprite.position.y = baseY + 0.2 * Math.sin(elapsed * 1.5 + i * 0.7)
    }

    // ── Render ──────────────────────────────────────────────────────────
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }
}
