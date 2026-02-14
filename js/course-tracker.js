/**
 * CourseTracker — F1 TV-style animated race course visualization.
 *
 * Renders on a <canvas>:
 * - Venue map at reduced opacity as base layer
 * - Smooth Catmull-Rom spline course path with neon glow
 * - Animated athlete dot with pulsing halo and particle comet-tail
 * - Station waypoints that activate (scale + pulse) as the dot passes
 * - Split time popups sliding in at each station
 * - Ghost racer dot with translucent trail
 * - Gap time label between athlete and ghost
 * - Progress bar at the bottom with station markers
 */

import {
  buildStationPoints,
  generateSplinePath,
  getPositionAtProgress,
  computeArcLengths,
  stationToProgress
} from './spline-utils.js'

const NEON = '#c8ff00'
const ACCENT = '#ff3c00'
const GHOST_COLOR = '#6495ed'
const BG = '#0a0a0a'

export class CourseTracker {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {string|Object} options.coordinates - station_coordinates JSONB
   * @param {string} [options.mapImageUrl] - venue map PNG URL (drawn at low opacity)
   * @param {Array} [options.splits] - array of {stationNum, timeMs, name}
   * @param {Array} [options.ghostSplits] - ghost racer splits
   * @param {string} [options.ghostLabel] - ghost racer name (default: "PRO")
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.dpr = window.devicePixelRatio || 1

    this.coordinates = options.coordinates
    this.splits = options.splits || []
    this.ghostSplits = options.ghostSplits || []
    this.ghostLabel = options.ghostLabel || 'PRO'

    // Build path data
    this.stationPoints = buildStationPoints(this.coordinates)
    this.splinePath = generateSplinePath(this.stationPoints, 30)
    this.arcLengths = computeArcLengths(this.splinePath)

    // Compute station progress positions
    this.stationProgresses = this.stationPoints.map((_, i) =>
      stationToProgress(i, this.stationPoints.length, this.arcLengths, 30)
    )

    // Compute cumulative split times for progress mapping
    this.totalTimeMs = 0
    this.splitCumulative = []
    if (this.splits.length > 0) {
      let cum = 0
      for (const s of this.splits) {
        cum += s.timeMs
        this.splitCumulative.push(cum)
      }
      this.totalTimeMs = cum
    }

    // Ghost cumulative
    this.ghostTotalMs = 0
    this.ghostCumulative = []
    if (this.ghostSplits.length > 0) {
      let cum = 0
      for (const s of this.ghostSplits) {
        cum += s.timeMs
        this.ghostCumulative.push(cum)
      }
      this.ghostTotalMs = cum
    }

    // State
    this.isPlaying = false
    this.progress = 0           // 0-1 along the course
    this.elapsedMs = 0
    this.speed = 10             // default 10x
    this.showGhost = this.ghostSplits.length > 0
    this.lastTimestamp = null
    this.animFrameId = null

    // Particles
    this.particles = []
    this.ghostParticles = []

    // Split popup
    this.activeSplit = null      // {text, opacity, x, y}
    this.lastStationIndex = -1

    // Map image
    this.mapImage = null
    this.mapLoaded = false
    if (options.mapImageUrl) {
      this.mapImage = new Image()
      this.mapImage.crossOrigin = 'anonymous'
      this.mapImage.onload = () => { this.mapLoaded = true }
      this.mapImage.src = options.mapImageUrl
    }

    // Callbacks
    this.onStationReached = null   // (stationNum, splitTime) => {}
    this.onComplete = null         // () => {}

    // Sizing
    this._resize()
    this._resizeObserver = new ResizeObserver(() => this._resize())
    this._resizeObserver.observe(canvas.parentElement || canvas)

    // Initial draw
    requestAnimationFrame(() => this._draw())
  }

  // ── Public API ──

  play() {
    if (this.isPlaying) return
    if (this.progress >= 1) this.restart()
    this.isPlaying = true
    this.lastTimestamp = performance.now()
    this._tick()
  }

  pause() {
    this.isPlaying = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  restart() {
    this.pause()
    this.progress = 0
    this.elapsedMs = 0
    this.particles = []
    this.ghostParticles = []
    this.activeSplit = null
    this.lastStationIndex = -1
    this._draw()
  }

  seekTo(progress) {
    this.progress = Math.max(0, Math.min(1, progress))
    this.elapsedMs = this.progress * this.totalTimeMs
    this.particles = []
    this.ghostParticles = []
    this._draw()
  }

  setSpeed(multiplier) {
    this.speed = multiplier
  }

  setGhostSplits(splits, label) {
    this.ghostSplits = splits || []
    this.ghostLabel = label || 'PRO'
    this.ghostCumulative = []
    this.ghostTotalMs = 0
    if (this.ghostSplits.length > 0) {
      let cum = 0
      for (const s of this.ghostSplits) {
        cum += s.timeMs
        this.ghostCumulative.push(cum)
      }
      this.ghostTotalMs = cum
    }
    this.showGhost = this.ghostSplits.length > 0
  }

  toggleGhost() {
    this.showGhost = !this.showGhost
  }

  destroy() {
    this.pause()
    this._resizeObserver?.disconnect()
  }

  // ── Internals ──

  _resize() {
    const parent = this.canvas.parentElement || this.canvas
    const rect = parent.getBoundingClientRect()
    const w = rect.width || 600
    const h = rect.height || 400

    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.W = w
    this.H = h
  }

  _tick() {
    if (!this.isPlaying) return

    const now = performance.now()
    const dt = now - (this.lastTimestamp || now)
    this.lastTimestamp = now

    // Advance elapsed time
    this.elapsedMs += dt * this.speed
    if (this.totalTimeMs > 0) {
      this.progress = Math.min(1, this.elapsedMs / this.totalTimeMs)
    }

    // Check station crossings
    this._checkStations()

    // Update particles
    this._updateParticles(dt)

    // Update split popup
    if (this.activeSplit) {
      this.activeSplit.opacity -= dt / 1500  // fade over 1.5s
      if (this.activeSplit.opacity <= 0) this.activeSplit = null
    }

    // Draw
    this._draw()

    // Check completion
    if (this.progress >= 1) {
      this.isPlaying = false
      this.onComplete?.()
      return
    }

    this.animFrameId = requestAnimationFrame(() => this._tick())
  }

  _checkStations() {
    for (let i = 0; i < this.stationProgresses.length; i++) {
      if (this.progress >= this.stationProgresses[i] && i > this.lastStationIndex) {
        this.lastStationIndex = i
        const station = this.stationPoints[i]
        const splitTime = this.splits[i]

        // Trigger split popup
        if (splitTime) {
          const pos = getPositionAtProgress(this.splinePath, this.stationProgresses[i])
          this.activeSplit = {
            text: `${station.name}: ${this._formatTime(splitTime.timeMs)}`,
            opacity: 1,
            x: pos.x,
            y: pos.y
          }
        }

        this.onStationReached?.(station.num, splitTime)
      }
    }
  }

  _updateParticles(dt) {
    // Spawn new athlete particle
    const pos = getPositionAtProgress(this.splinePath, this.progress)
    this.particles.push({
      x: pos.x, y: pos.y,
      life: 1, // 1.0 → 0.0
      size: 3 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3
    })

    // Update & cull
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt / 800
      p.x += p.vx
      p.y += p.vy
      if (p.life <= 0) this.particles.splice(i, 1)
    }

    // Keep max 30 particles
    while (this.particles.length > 30) this.particles.shift()

    // Ghost particles
    if (this.showGhost && this.ghostTotalMs > 0) {
      const ghostProgress = Math.min(1, this.elapsedMs / this.ghostTotalMs)
      const gPos = getPositionAtProgress(this.splinePath, ghostProgress)
      this.ghostParticles.push({
        x: gPos.x, y: gPos.y,
        life: 1, size: 2 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2
      })

      for (let i = this.ghostParticles.length - 1; i >= 0; i--) {
        const p = this.ghostParticles[i]
        p.life -= dt / 600
        p.x += p.vx
        p.y += p.vy
        if (p.life <= 0) this.ghostParticles.splice(i, 1)
      }
      while (this.ghostParticles.length > 20) this.ghostParticles.shift()
    }
  }

  _draw() {
    const ctx = this.ctx
    const W = this.W
    const H = this.H

    // Clear
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)

    // Draw map image at reduced opacity
    if (this.mapLoaded && this.mapImage) {
      ctx.globalAlpha = 0.35
      const imgAspect = this.mapImage.width / this.mapImage.height
      const canvasAspect = W / H
      let dw, dh, dx, dy
      if (imgAspect > canvasAspect) {
        dw = W; dh = W / imgAspect; dx = 0; dy = (H - dh) / 2
      } else {
        dh = H; dw = H * imgAspect; dy = 0; dx = (W - dw) / 2
      }
      ctx.drawImage(this.mapImage, dx, dy, dw, dh)
      ctx.globalAlpha = 1
    }

    // Draw course path with glow
    this._drawCoursePath(ctx, W, H)

    // Draw station waypoints
    this._drawStations(ctx, W, H)

    // Draw ghost particles + dot
    if (this.showGhost && this.ghostTotalMs > 0) {
      this._drawGhostRacer(ctx, W, H)
    }

    // Draw athlete particles + dot
    this._drawAthleteDot(ctx, W, H)

    // Draw split popup
    if (this.activeSplit) {
      this._drawSplitPopup(ctx, W, H)
    }

    // Draw gap time
    if (this.showGhost && this.ghostTotalMs > 0 && this.isPlaying) {
      this._drawGapTime(ctx, W, H)
    }

    // Draw progress bar
    this._drawProgressBar(ctx, W, H)

    // Draw elapsed time
    this._drawElapsedTime(ctx, W, H)
  }

  _toPixel(percentX, percentY, W, H) {
    return { x: (percentX / 100) * W, y: (percentY / 100) * H }
  }

  _drawCoursePath(ctx, W, H) {
    if (this.splinePath.length < 2) return

    // Glow layer
    ctx.save()
    ctx.strokeStyle = NEON
    ctx.lineWidth = 6
    ctx.globalAlpha = 0.15
    ctx.shadowColor = NEON
    ctx.shadowBlur = 20
    ctx.beginPath()
    const first = this._toPixel(this.splinePath[0].x, this.splinePath[0].y, W, H)
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < this.splinePath.length; i++) {
      const p = this._toPixel(this.splinePath[i].x, this.splinePath[i].y, W, H)
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.restore()

    // Main path
    ctx.save()
    ctx.strokeStyle = NEON
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < this.splinePath.length; i++) {
      const p = this._toPixel(this.splinePath[i].x, this.splinePath[i].y, W, H)
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Highlighted portion (already traversed)
    if (this.progress > 0) {
      const traversedCount = Math.floor(this.progress * (this.splinePath.length - 1)) + 1
      ctx.save()
      ctx.strokeStyle = NEON
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8
      ctx.shadowColor = NEON
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(first.x, first.y)
      for (let i = 1; i < traversedCount && i < this.splinePath.length; i++) {
        const p = this._toPixel(this.splinePath[i].x, this.splinePath[i].y, W, H)
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  _drawStations(ctx, W, H) {
    for (let i = 0; i < this.stationPoints.length; i++) {
      const station = this.stationPoints[i]
      const p = this._toPixel(station.x, station.y, W, H)
      const isReached = i <= this.lastStationIndex
      const isActive = i === this.lastStationIndex && this.isPlaying

      const radius = isActive ? 16 : (isReached ? 13 : 11)

      // Glow for reached stations
      if (isReached) {
        ctx.save()
        ctx.fillStyle = NEON
        ctx.globalAlpha = isActive ? 0.4 : 0.15
        ctx.shadowColor = NEON
        ctx.shadowBlur = isActive ? 20 : 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Station circle
      ctx.save()
      ctx.fillStyle = isReached ? NEON : 'rgba(200,255,0,0.3)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Border
      ctx.strokeStyle = isReached ? 'rgba(0,0,0,0.6)' : 'rgba(200,255,0,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Number
      ctx.fillStyle = isReached ? '#000' : 'rgba(200,255,0,0.6)'
      ctx.font = `bold ${isActive ? 12 : 10}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(station.num.toString(), p.x, p.y)
      ctx.restore()

      // Station name label
      ctx.save()
      ctx.fillStyle = isReached ? '#fff' : 'rgba(255,255,255,0.4)'
      ctx.font = '600 8px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(station.name.toUpperCase(), p.x, p.y + radius + 12)
      ctx.restore()
    }
  }

  _drawAthleteDot(ctx, W, H) {
    const pos = getPositionAtProgress(this.splinePath, this.progress)
    const p = this._toPixel(pos.x, pos.y, W, H)

    // Draw particle trail
    for (const particle of this.particles) {
      const pp = this._toPixel(particle.x, particle.y, W, H)
      ctx.save()
      ctx.fillStyle = NEON
      ctx.globalAlpha = particle.life * 0.6
      ctx.beginPath()
      ctx.arc(pp.x, pp.y, particle.size * particle.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Outer glow
    ctx.save()
    ctx.fillStyle = NEON
    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(performance.now() / 300)
    ctx.shadowColor = NEON
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Main dot
    ctx.save()
    ctx.fillStyle = NEON
    ctx.shadowColor = NEON
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
    ctx.fill()

    // White inner
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // "YOU" label
    ctx.save()
    ctx.fillStyle = NEON
    ctx.font = 'bold 7px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('YOU', p.x, p.y - 14)
    ctx.restore()
  }

  _drawGhostRacer(ctx, W, H) {
    const ghostProgress = Math.min(1, this.elapsedMs / this.ghostTotalMs)
    const pos = getPositionAtProgress(this.splinePath, ghostProgress)
    const p = this._toPixel(pos.x, pos.y, W, H)

    // Ghost particles
    for (const particle of this.ghostParticles) {
      const pp = this._toPixel(particle.x, particle.y, W, H)
      ctx.save()
      ctx.fillStyle = GHOST_COLOR
      ctx.globalAlpha = particle.life * 0.4
      ctx.beginPath()
      ctx.arc(pp.x, pp.y, particle.size * particle.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Ghost glow
    ctx.save()
    ctx.fillStyle = GHOST_COLOR
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Ghost dot
    ctx.save()
    ctx.fillStyle = GHOST_COLOR
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.5
    ctx.stroke()
    ctx.restore()

    // Ghost label
    ctx.save()
    ctx.fillStyle = GHOST_COLOR
    ctx.globalAlpha = 0.7
    ctx.font = 'bold 6px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.ghostLabel, p.x, p.y - 12)
    ctx.restore()
  }

  _drawGapTime(ctx, W, H) {
    if (this.ghostTotalMs <= 0 || this.totalTimeMs <= 0) return

    // Calculate gap: positive = behind ghost, negative = ahead
    const ghostElapsed = this.progress * this.ghostTotalMs
    const gapMs = this.elapsedMs - ghostElapsed
    const gapSec = Math.round(gapMs / 1000)

    const label = gapSec > 0
      ? `+${gapSec}s behind ${this.ghostLabel}`
      : gapSec < 0
        ? `${gapSec}s ahead!`
        : `Even with ${this.ghostLabel}`

    const color = gapSec > 0 ? ACCENT : gapSec < 0 ? NEON : '#fff'

    ctx.save()
    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    const textW = ctx.measureText(label).width + 16
    ctx.beginPath()
    const pillX = W - textW - 12
    const pillY = 10
    ctx.roundRect(pillX, pillY, textW, 22, 4)
    ctx.fill()

    // Text
    ctx.fillStyle = color
    ctx.font = 'bold 10px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(label, W - 16, 25)
    ctx.restore()
  }

  _drawSplitPopup(ctx, W, H) {
    if (!this.activeSplit) return
    const p = this._toPixel(this.activeSplit.x, this.activeSplit.y, W, H)

    ctx.save()
    ctx.globalAlpha = this.activeSplit.opacity

    // Background
    const text = this.activeSplit.text
    ctx.font = 'bold 11px Inter, sans-serif'
    const tw = ctx.measureText(text).width + 20
    const bx = p.x - tw / 2
    const by = p.y - 40

    ctx.fillStyle = 'rgba(10,10,10,0.9)'
    ctx.strokeStyle = NEON
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(bx, by, tw, 24, 6)
    ctx.fill()
    ctx.stroke()

    // Text
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, p.x, by + 12)

    ctx.restore()
  }

  _drawProgressBar(ctx, W, H) {
    const barY = H - 20
    const barH = 4
    const barX = 16
    const barW = W - 32

    // Background track
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW, barH, 2)
    ctx.fill()

    // Filled progress
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    grad.addColorStop(0, NEON)
    grad.addColorStop(1, ACCENT)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW * this.progress, barH, 2)
    ctx.fill()

    // Station markers on the bar
    for (let i = 0; i < this.stationProgresses.length; i++) {
      const sx = barX + barW * this.stationProgresses[i]
      const reached = i <= this.lastStationIndex
      ctx.fillStyle = reached ? NEON : 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.arc(sx, barY + barH / 2, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  _drawElapsedTime(ctx, W, H) {
    const timeStr = this._formatTime(this.elapsedMs)
    const totalStr = this.totalTimeMs > 0 ? ` / ${this._formatTime(this.totalTimeMs)}` : ''

    ctx.save()
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.beginPath()
    ctx.roundRect(10, H - 48, 130, 22, 4)
    ctx.fill()

    ctx.font = 'bold 12px monospace'
    ctx.fillStyle = NEON
    ctx.textAlign = 'left'
    ctx.fillText(timeStr, 16, H - 34)

    if (totalStr) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px monospace'
      ctx.fillText(totalStr, 16 + ctx.measureText(timeStr).width + 4, H - 34)
    }

    // Speed indicator
    ctx.fillStyle = 'rgba(200,255,0,0.5)'
    ctx.font = 'bold 9px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${this.speed}×`, 134, H - 34)

    ctx.restore()
  }

  _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
}
