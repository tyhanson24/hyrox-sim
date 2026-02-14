/**
 * Catmull-Rom spline utilities for smooth course path interpolation.
 * Shared by course-tracker.js and venue-3d.js.
 */

/**
 * Compute a point on a Catmull-Rom spline segment.
 * @param {number} t - Parameter 0..1 within this segment
 * @param {Object} p0 - Control point before segment start
 * @param {Object} p1 - Segment start
 * @param {Object} p2 - Segment end
 * @param {Object} p3 - Control point after segment end
 * @returns {{x: number, y: number}}
 */
function catmullRomPoint(t, p0, p1, p2, p3) {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
  }
}

/**
 * Build ordered station points from station_coordinates JSONB.
 * Returns array of {x, y, key, name, num} sorted station_1..8,
 * optionally including roxzone and start_finish.
 */
export function buildStationPoints(coords, includeSpecial = false) {
  const parsed = typeof coords === 'string' ? JSON.parse(coords) : coords
  const points = []

  // Add start_finish at beginning if present
  if (includeSpecial && parsed.start_finish) {
    points.push({
      x: parsed.start_finish.x,
      y: parsed.start_finish.y,
      key: 'start_finish',
      name: 'Start/Finish',
      num: 0
    })
  }

  for (let i = 1; i <= 8; i++) {
    const s = parsed[`station_${i}`]
    if (s) {
      points.push({ x: s.x, y: s.y, key: `station_${i}`, name: s.name, num: i })
    }
  }

  // Add roxzone if present and requested
  if (includeSpecial && parsed.roxzone) {
    // Insert roxzone roughly in the middle of the course
    const mid = Math.floor(points.length / 2)
    points.splice(mid, 0, {
      x: parsed.roxzone.x,
      y: parsed.roxzone.y,
      key: 'roxzone',
      name: 'ROXZONE',
      num: -1
    })
  }

  return points
}

/**
 * Generate a smooth spline path through station points.
 * @param {Array<{x: number, y: number}>} points - Ordered station positions (percentage 0-100)
 * @param {number} segments - Number of interpolated points per segment
 * @returns {Array<{x: number, y: number}>} - Dense array of path points
 */
export function generateSplinePath(points, segments = 20) {
  if (points.length < 2) return points.map(p => ({ x: p.x, y: p.y }))
  if (points.length === 2) {
    // Linear interpolation for 2 points
    const path = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      path.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t
      })
    }
    return path
  }

  const path = []
  const n = points.length

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]

    for (let s = 0; s < segments; s++) {
      const t = s / segments
      path.push(catmullRomPoint(t, p0, p1, p2, p3))
    }
  }

  // Add final point
  path.push({ x: points[n - 1].x, y: points[n - 1].y })
  return path
}

/**
 * Get position along the spline at a given progress (0-1).
 * @param {Array<{x: number, y: number}>} splinePath - Pre-computed spline path
 * @param {number} progress - 0.0 to 1.0
 * @returns {{x: number, y: number}}
 */
export function getPositionAtProgress(splinePath, progress) {
  if (splinePath.length === 0) return { x: 50, y: 50 }
  const clamped = Math.max(0, Math.min(1, progress))
  const idx = clamped * (splinePath.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.min(lower + 1, splinePath.length - 1)
  const frac = idx - lower

  return {
    x: splinePath[lower].x + (splinePath[upper].x - splinePath[lower].x) * frac,
    y: splinePath[lower].y + (splinePath[upper].y - splinePath[lower].y) * frac
  }
}

/**
 * Compute cumulative arc-length distances along a spline path.
 * Useful for mapping station indices to progress values.
 * @param {Array<{x: number, y: number}>} splinePath
 * @returns {Array<number>} - Cumulative distance at each point, normalized 0-1
 */
export function computeArcLengths(splinePath) {
  if (splinePath.length < 2) return [0]
  const lengths = [0]
  let total = 0

  for (let i = 1; i < splinePath.length; i++) {
    const dx = splinePath[i].x - splinePath[i - 1].x
    const dy = splinePath[i].y - splinePath[i - 1].y
    total += Math.sqrt(dx * dx + dy * dy)
    lengths.push(total)
  }

  // Normalize to 0-1
  return lengths.map(l => l / total)
}

/**
 * Map station index (0-based among the ordered points) to a progress value
 * along the spline, accounting for actual arc-length distance.
 * @param {number} stationIndex - 0-based index in the station points array
 * @param {number} totalStations - Total number of stations
 * @param {Array<number>} arcLengths - From computeArcLengths()
 * @param {number} segmentsPerStation - Number of spline segments per station gap
 * @returns {number} - Progress 0-1
 */
export function stationToProgress(stationIndex, totalStations, arcLengths, segmentsPerStation = 20) {
  if (totalStations <= 1) return 0
  const splineIdx = stationIndex * segmentsPerStation
  const clamped = Math.min(splineIdx, arcLengths.length - 1)
  return arcLengths[clamped] || 0
}
