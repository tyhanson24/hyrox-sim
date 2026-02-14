/* ══════════════════════════════════════════════════════════
   VenueRealMap — Mapbox GL JS satellite map with station markers
   ES module for HYROX SIM venue visualization
   ══════════════════════════════════════════════════════════ */

const MAPBOX_GL_CSS = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
const MAPBOX_GL_JS  = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';

// Design system tokens
const COLORS = {
  neon:       '#c8ff00',
  accent:     '#ff3c00',
  white:      '#ffffff',
  dark:       '#0a0a0a',
  card:       '#141414',
  textMuted:  '#888',
};

// Station ordering for the route line
const ROUTE_ORDER = [
  'start_finish',
  'station_1', 'roxzone',
  'station_2', 'roxzone',
  'station_3', 'roxzone',
  'station_4', 'roxzone',
  'station_5', 'roxzone',
  'station_6', 'roxzone',
  'station_7', 'roxzone',
  'station_8',
  'start_finish',
];

/**
 * Lazy-load a CSS file into <head> if not already present.
 */
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * Lazy-load a JS script if the global `mapboxgl` is not already defined.
 */
function loadScript(src) {
  if (window.mapboxgl) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Convert percentage-based coordinates (0-100) to geographic lng/lat
 * within a bounding box centered on the venue.
 *
 * The bounding box is a 200m x 200m square around the center.
 * At a given latitude, 1 degree of latitude ~ 111,320m,
 * and 1 degree of longitude ~ 111,320m * cos(lat).
 */
function percentToLngLat(pctX, pctY, centerLat, centerLng, radiusMeters = 200) {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);

  const halfLat = radiusMeters / metersPerDegreeLat;
  const halfLng = radiusMeters / metersPerDegreeLng;

  // pctX: 0 = west edge, 100 = east edge
  // pctY: 0 = north edge (top), 100 = south edge (bottom)
  const lng = (centerLng - halfLng) + (pctX / 100) * (2 * halfLng);
  const lat = (centerLat + halfLat) - (pctY / 100) * (2 * halfLat);

  return [lng, lat];
}

/**
 * Determine the marker style based on station key.
 */
function markerStyle(key) {
  if (key === 'start_finish') {
    return { bg: COLORS.white, color: COLORS.dark, label: 'S/F', glow: 'rgba(255,255,255,0.5)' };
  }
  if (key === 'roxzone') {
    return { bg: COLORS.accent, color: COLORS.white, label: 'RZ', glow: 'rgba(255,60,0,0.5)' };
  }
  // station_N
  const num = key.replace('station_', '');
  return { bg: COLORS.neon, color: COLORS.dark, label: num, glow: 'rgba(200,255,0,0.5)' };
}

/**
 * Create an HTML marker element.
 */
function createMarkerEl(key, name) {
  const style = markerStyle(key);

  const el = document.createElement('div');
  el.className = 'vrm-marker';
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${style.bg};
    color: ${style.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 800;
    border: 2px solid rgba(0,0,0,0.5);
    box-shadow: 0 0 10px ${style.glow}, 0 2px 8px rgba(0,0,0,0.6);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    z-index: 2;
  `;
  el.textContent = style.label;

  // Hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.25)';
    el.style.boxShadow = `0 0 20px ${style.glow}, 0 4px 12px rgba(0,0,0,0.8)`;
    el.style.zIndex = '10';
    tooltip.style.display = 'block';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
    el.style.boxShadow = `0 0 10px ${style.glow}, 0 2px 8px rgba(0,0,0,0.6)`;
    el.style.zIndex = '2';
    tooltip.style.display = 'none';
  });

  // Tooltip showing station name
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: ${COLORS.card};
    color: ${COLORS.white};
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    display: none;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.6);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;
  tooltip.textContent = name || key.replace(/_/g, ' ');
  el.appendChild(tooltip);

  return el;
}


export class VenueRealMap {

  /**
   * @param {HTMLElement} container — DOM element to render into
   * @param {Object} opts
   * @param {Object} opts.coordinates — station_coordinates JSONB { station_1: {x,y,name}, ... }
   * @param {number} opts.lat — venue center latitude
   * @param {number} opts.lng — venue center longitude
   * @param {string} [opts.mapImageUrl] — unused in satellite mode, reserved for fallback
   */
  constructor(container, { coordinates, lat, lng, mapImageUrl } = {}) {
    this.container = container;
    this.coordinates = coordinates || {};
    this.lat = lat;
    this.lng = lng;
    this.mapImageUrl = mapImageUrl;
    this.map = null;
    this.markers = [];
    this._animFrame = null;
    this._destroyed = false;

    this._init();
  }

  async _init() {
    // Validate required data
    if (!this.lat || !this.lng) {
      this._showNoLocation();
      return;
    }

    if (!VenueRealMap.MAPBOX_TOKEN) {
      this._showError('Mapbox token not configured');
      return;
    }

    // Show loading state
    this._showLoading();

    try {
      // Lazy-load Mapbox GL JS
      await Promise.all([
        loadCSS(MAPBOX_GL_CSS),
        loadScript(MAPBOX_GL_JS),
      ]);

      if (this._destroyed) return;

      this._createMap();
    } catch (err) {
      console.error('[VenueRealMap] Failed to load Mapbox GL:', err);
      this._showError('Failed to load map library');
    }
  }

  /**
   * Show a "no location data" message inside the container.
   */
  _showNoLocation() {
    this.container.innerHTML = '';
    const msg = document.createElement('div');
    msg.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      background: ${COLORS.card};
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 4px;
      color: ${COLORS.textMuted};
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      text-align: center;
      padding: 2rem;
    `;
    msg.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${COLORS.textMuted}" stroke-width="1.5" style="margin-bottom:1rem;opacity:0.5;">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <div style="font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.3rem;">No Location Data</div>
      <div style="font-size:0.75rem;opacity:0.6;">Venue coordinates have not been set for this event.</div>
    `;
    this.container.appendChild(msg);
  }

  /**
   * Show a generic error message.
   */
  _showError(text) {
    this.container.innerHTML = '';
    const msg = document.createElement('div');
    msg.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      background: ${COLORS.card};
      border: 1px solid rgba(255,60,0,0.2);
      border-radius: 4px;
      color: ${COLORS.accent};
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 2rem;
    `;
    msg.textContent = text;
    this.container.appendChild(msg);
  }

  /**
   * Show a loading spinner while Mapbox loads.
   */
  _showLoading() {
    this.container.innerHTML = '';
    const loader = document.createElement('div');
    loader.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      background: ${COLORS.dark};
      border-radius: 4px;
    `;
    loader.innerHTML = `
      <div style="
        width: 36px; height: 36px;
        border: 3px solid rgba(200,255,0,0.15);
        border-top-color: ${COLORS.neon};
        border-radius: 50%;
        animation: vrm-spin 0.8s linear infinite;
      "></div>
      <div style="
        margin-top: 0.75rem;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.35);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
      ">Loading satellite map</div>
      <style>
        @keyframes vrm-spin { to { transform: rotate(360deg); } }
      </style>
    `;
    this.container.appendChild(loader);
  }

  /**
   * Build the Mapbox map, dark overlay, markers, and route line.
   */
  _createMap() {
    this.container.innerHTML = '';

    // Map wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 300px;
      position: relative;
      border-radius: 4px;
      overflow: hidden;
    `;
    this.container.appendChild(wrapper);

    // Set token
    window.mapboxgl.accessToken = VenueRealMap.MAPBOX_TOKEN;

    // Create map
    this.map = new window.mapboxgl.Map({
      container: wrapper,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [this.lng, this.lat],
      zoom: 17,
      pitch: 60,
      bearing: -20,
      antialias: true,
      attributionControl: false,
    });

    // Compact attribution
    this.map.addControl(new window.mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Navigation controls (zoom + compass)
    this.map.addControl(new window.mapboxgl.NavigationControl({
      visualizePitch: true,
    }), 'top-right');

    this.map.on('load', () => {
      if (this._destroyed) return;

      this._addDarkOverlay();
      this._addMarkers();
      this._addRouteLine();
      this._startDashAnimation();
    });
  }

  /**
   * Add a semi-transparent dark layer over satellite imagery for readability.
   * Uses a fill layer covering the entire world.
   */
  _addDarkOverlay() {
    this.map.addSource('dark-overlay', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ]],
        },
      },
    });

    this.map.addLayer({
      id: 'dark-overlay-layer',
      type: 'fill',
      source: 'dark-overlay',
      paint: {
        'fill-color': COLORS.dark,
        'fill-opacity': 0.35,
      },
    });
  }

  /**
   * Place HTML markers on the map for each station in coordinates.
   */
  _addMarkers() {
    const entries = Object.entries(this.coordinates);
    if (!entries.length) return;

    for (const [key, val] of entries) {
      const lngLat = percentToLngLat(val.x, val.y, this.lat, this.lng);
      const el = createMarkerEl(key, val.name);

      const marker = new window.mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(this.map);

      this.markers.push(marker);
    }
  }

  /**
   * Draw an animated dashed route line connecting stations in race order.
   */
  _addRouteLine() {
    const coords = this.coordinates;
    const routeCoords = [];

    // Build route from ROUTE_ORDER, only including keys that have coordinates.
    // For roxzone, reuse the same coordinate each time it appears.
    for (const key of ROUTE_ORDER) {
      const entry = coords[key];
      if (entry) {
        routeCoords.push(percentToLngLat(entry.x, entry.y, this.lat, this.lng));
      }
    }

    // Fallback: if ROUTE_ORDER produced too few points, just connect all stations in order
    if (routeCoords.length < 2) {
      const orderedKeys = Object.keys(coords).sort((a, b) => {
        const order = ['start_finish', 'station_1', 'station_2', 'station_3', 'station_4',
                       'station_5', 'station_6', 'station_7', 'station_8', 'roxzone'];
        return order.indexOf(a) - order.indexOf(b);
      });
      for (const key of orderedKeys) {
        const entry = coords[key];
        if (entry) routeCoords.push(percentToLngLat(entry.x, entry.y, this.lat, this.lng));
      }
    }

    if (routeCoords.length < 2) return;

    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeCoords,
        },
      },
    });

    // Outer glow line
    this.map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': COLORS.neon,
        'line-width': 6,
        'line-opacity': 0.15,
        'line-blur': 4,
      },
    });

    // Main dashed line
    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': COLORS.neon,
        'line-width': 2.5,
        'line-opacity': 0.7,
        'line-dasharray': [2, 4],
      },
    });
  }

  /**
   * Animate the dash offset for the route line to create a marching-ants effect.
   */
  _startDashAnimation() {
    if (!this.map.getLayer('route-line')) return;

    let step = 0;
    const dashLength = 2;
    const gapLength = 4;
    const totalLength = dashLength + gapLength;

    const animate = () => {
      if (this._destroyed) return;

      step = (step + 0.15) % totalLength;

      // Shift the dash pattern to create animation
      const dashPhase = step;
      const d1 = Math.max(0, dashLength - dashPhase);
      const g1 = gapLength;
      const d2 = Math.min(dashPhase, dashLength);

      // Construct a valid dasharray that creates the marching effect
      if (d1 > 0 && d2 > 0) {
        this.map.setPaintProperty('route-line', 'line-dasharray', [d1, g1, d2, 0]);
      } else if (d1 > 0) {
        this.map.setPaintProperty('route-line', 'line-dasharray', [d1, g1]);
      } else {
        this.map.setPaintProperty('route-line', 'line-dasharray', [0, gapLength - (dashPhase - dashLength), dashLength, 0]);
      }

      this._animFrame = requestAnimationFrame(animate);
    };

    this._animFrame = requestAnimationFrame(animate);
  }

  /**
   * Tear down the map and clean up all resources.
   */
  destroy() {
    this._destroyed = true;

    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }

    // Remove markers
    for (const marker of this.markers) {
      marker.remove();
    }
    this.markers = [];

    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Clear container
    this.container.innerHTML = '';
  }
}

/** Configurable Mapbox access token. Set before creating instances. */
VenueRealMap.MAPBOX_TOKEN = '';

export default VenueRealMap;
