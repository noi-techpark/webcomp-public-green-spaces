
// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ViewportDataLoader } from "./ViewportDataLoader.js";
import { getGreenSpaceInfo } from "./GreenSpaceDictionary.js";
import { iconUrlMap, navBtnUrl } from "./iconAssets.js";

const MAPLIBRE_CSS_FILE = "maplibre-gl.css";
const MAPLIBRE_JS_FILE = "maplibre-gl.js";
const COMPONENT_ASSET_SCRIPT_NAMES = [
  "webcomp-boilerplate.min.js",
  "webcomp-boilerplate.js",
  "maplibre-gl.js"
];
const DEFAULT_CENTER = [11.8768, 45.4064]; // Padova
const DEFAULT_ZOOM = 13;
const DEBOUNCE_MS = 300;
const LIVE_ZOOM_IN = 14.5;
const LIVE_ZOOM_OUT = 13.5;

const MAIN_TYPES = {
  "1": {
    name: "Vegetation",
    color: "#4CAF50",
    subcategories: {
      "all": {
        name: "All Vegetation",
        subtypes: null,
        geometries: null,
        color: "#4CAF50",
        multiColor: true,
        tooltip: "Trees, shrubs, hedges, lawns, flowerbeds, and ground cover"
      },
      "trees": {
        name: "Trees & Plants",
        subtypes: ["03"],
        geometries: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"],
        icon: "ic-trees.svg",
        color: "#228B22",
        tooltip: "Individual trees, shrubs, and plant groups"
      },
      "hedges": {
        name: "Hedges & Roadsides",
        subtypes: ["03"],
        geometries: ["LineString"],
        icon: "hedge.svg",
        color: "#3CB371",
        tooltip: "Hedges, roadside vegetation, and tree lines"
      },
      "lawns": {
        name: "Lawns & Ground",
        subtypes: ["01"],
        geometries: ["Polygon"],
        icon: "lawn.svg",
        color: "#90EE90",
        tooltip: "Grass lawns, bare ground, green road banks, meadows"
      },
      "flowerbeds": {
        name: "Flowerbeds",
        subtypes: ["02"],
        geometries: ["Polygon"],
        icon: "flowerbed.svg",
        color: "#FF69B4",
        tooltip: "Flowerbeds, perennial beds, grated flowerbeds"
      }
    }
  },
  "2": {
    name: "Urban Furniture",
    color: "#8D6E63",
    subcategories: {
      // Grouped subcategories for better UX (6 groups instead of 14)
      "all": {
        name: "All Furniture",
        subtypes: null,
        geometries: null,
        color: "#8D6E63",
        multiColor: true,
        tooltip: "All urban furniture and infrastructure elements"
      },
      "street": {
        name: "Street Furniture",
        subtypes: ["14", "19", "24"],
        geometries: null,
        icon: "bench.svg",
        color: "#A0522D",
        tooltip: "Benches, litter bins, bollards, planters, bike racks, streetlamps, play equipment"
      },
      "boundaries": {
        name: "Boundaries",
        subtypes: ["15", "16", "17", "18"],
        geometries: ["LineString"],
        icon: null,
        color: "#8B4513",
        tooltip: "Walls, fences, gates, guardrails, kerbs"
      },
      "ground": {
        name: "Ground Surfaces",
        subtypes: ["05", "31", "42"],
        geometries: ["Polygon", "LineString"],
        icon: null,
        color: "#FF5722",
        tooltip: "Paving, stairs, ramps, safety surfacing"
      },
      "utilities": {
        name: "Utilities",
        subtypes: ["20", "21", "23", "32"],
        geometries: null,
        icon: null,
        color: "#607D8B",
        tooltip: "Manholes, hydrants, drainage pipes, irrigation systems"
      },
      "structures": {
        name: "Water & Structures",
        subtypes: ["04", "13", "22"],
        geometries: null,
        icon: null,
        color: "#03A9F4",
        tooltip: "Drinking fountains, water features, buildings, monuments, canopies"
      }
    }
  },
  "3": {
    name: "Use & Management",
    color: "#2196F3",
    subcategories: {
      "all": {
        name: "All Areas",
        subtypes: null,
        geometries: ["Polygon"],
        color: "#2196F3",
        multiColor: true,
        tooltip: "Management areas, activity zones, and temporary sites"
      },
      "boundary": {
        name: "Management Areas",
        subtypes: ["25"],
        geometries: ["Polygon"],
        icon: null,
        color: "#64B5F6",
        tooltip: "Green area boundaries and management zones"
      },
      "playground": {
        name: "Playgrounds & Sports",
        subtypes: ["27"],
        geometries: ["Polygon"],
        icon: null,
        color: "#FF6347",
        tooltip: "Playgrounds, sports areas, dog parks, community gardens"
      },
      "temporary": {
        name: "Construction Sites",
        subtypes: ["26"],
        geometries: ["Polygon"],
        icon: null,
        color: "#FFB74D",
        tooltip: "Active construction and temporary work zones"
      }
    }
  }
};


const SUBTYPE_COLORS = {
  // Vegetation (Type 1)
  "01": "#90EE90",  // Lawns & Ground - light green
  "02": "#FF69B4",  // Flowerbeds - hot pink
  "03": "#228B22",  // Trees/Shrubs/Hedges - forest green
  // Urban Furniture (Type 2) - based on API data analysis
  "04": "#03A9F4",  // Water features - light blue
  "05": "#FF5722",  // Paving - deep orange
  "08": "#9E9E9E",  // Roller rink - gray
  "09": "#81C784",  // Football pitch - light green
  "10": "#81C784",  // Futsal pitch - light green
  "11": "#81C784",  // Sport facility - light green
  "12": "#795548",  // Building - brown
  "13": "#9E9E9E",  // Structures (construction, canopy, monument) - gray
  "14": "#FFD700",  // Urban furniture points (bollards, planters, bike rack, etc.) - gold
  "15": "#795548",  // Walls - brown
  "16": "#E91E63",  // Kerbs - pink
  "17": "#8B4513",  // Fences - saddle brown
  "18": "#8B4513",  // Gates - saddle brown
  "19": "#A0522D",  // Benches (lines) - sienna
  "20": "#607D8B",  // Drainage - blue gray
  "21": "#607D8B",  // Manholes - blue gray
  "22": "#1E90FF",  // Drinking fountains - dodger blue
  "23": "#F44336",  // Hydrants - red
  "24": "#2E7D32",  // Litter bins - green
  "28": "#795548",  // Bicycle path - brown
  "31": "#BCAAA4",  // Stairs/Ramps - light brown
  "32": "#03A9F4",  // Irrigation - light blue
  "34": "#D84315",  // Tennis court - deep orange
  "37": "#616161",  // Running track - dark gray
  "42": "#FF9800",  // Safety surfacing - orange
  // Management (Type 3)
  "25": "#64B5F6",  // Management areas - light blue
  "26": "#FFB74D",  // Construction sites - orange
  "27": "#FF6347"   // Playgrounds/Sports/Dogs areas - tomato
};

const LIVE_LAYER_IDS = [
  "polygons-fill",
  "polygons-outline",
  "polygons-outline-outer",
  "lines-outer",
  "lines",
  "points"
];

const POLYGON_GEOMETRY_FILTER = ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]];
const LINE_GEOMETRY_FILTER = ["in", ["geometry-type"], ["literal", ["LineString", "MultiLineString"]]];
const POINT_GEOMETRY_FILTER = ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]];

class UrbanGreenMapV2 extends HTMLElement {
  static get observedAttributes() {
    return ["layers", "lat", "lng", "zoom", "city", "country"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.map = null;
    this.loader = null;
    this.currentType = null;
    this.currentSubCategory = null;
    this.debounceTimer = null;
    this._seq = 0;
    this._currentFeatures = null;
    this._featureClicked = false;
    this._configuredLayers = [];
    this._viewRequestSeq = 0;
    this._geocodeCache = new Map();
    this._resizeObserver = null;
  }

  connectedCallback() {
    this._configuredLayers = this.parseLayersAttribute();
    this.render();
    this.initMap();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "layers") {
      this._configuredLayers = this.parseLayersAttribute();
      this.syncControlsVisibility();
      this.refreshLayerSelection();
      return;
    }

    if ((name === "lat" || name === "lng" || name === "zoom" || name === "city" || name === "country") && this.map) {
      this.applyConfiguredView({ preserveCurrentWhenMissing: true });
      return;
    }
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this.loader?.abort();
    this.map?.remove();
  }

  // Data origin: Open Data Hub (https://opendatahub.com) — UrbanGreen dataset.
  get apiBase() {
    return this.getAttribute("api-base") || "https://api.tourism.testingmachine.eu";
  }

  get lang() {
    return this.getAttribute("lang") || "en";
  }

  get liveZoomIn() {
    const val = this.parseNumberAttribute("live-zoom-in");
    return Number.isFinite(val) ? val : LIVE_ZOOM_IN;
  }

  get liveZoomOut() {
    const val = this.parseNumberAttribute("live-zoom-out");
    return Number.isFinite(val) ? val : LIVE_ZOOM_OUT;
  }

  get initialLat() {
    const val = this.parseNumberAttribute("lat");
    return Number.isFinite(val) && val >= -90 && val <= 90 ? val : null;
  }

  get initialLng() {
    const val = this.parseNumberAttribute("lng");
    return Number.isFinite(val) && val >= -180 && val <= 180 ? val : null;
  }

  get initialZoom() {
    const val = this.parseNumberAttribute("zoom");
    return Number.isFinite(val) ? Math.max(0, Math.min(22, val)) : null;
  }

  parseNumberAttribute(name) {
    const raw = this.getAttribute(name);
    if (!raw || !raw.trim()) return NaN;
    return Number(raw.trim().replace(",", "."));
  }

  get cityName() {
    const val = this.getAttribute("city");
    return val && val.trim() ? val.trim() : null;
  }

  get countryName() {
    const val = this.getAttribute("country");
    return val && val.trim() ? val.trim() : null;
  }

  getConfiguredCenter(fallback = DEFAULT_CENTER) {
    const lat = this.initialLat;
    const lng = this.initialLng;

    if (lat == null && lng == null) return fallback;
    return [lng ?? fallback[0], lat ?? fallback[1]];
  }

  getConfiguredZoom(fallback = DEFAULT_ZOOM) {
    const zoom = this.initialZoom;
    return zoom == null ? fallback : zoom;
  }

  async geocodeCityCenter() {
    const city = this.cityName;
    if (!city) return null;

    const country = this.countryName;
    const cacheKey = `${city.toLowerCase()}|${(country || "").toLowerCase()}`;
    if (this._geocodeCache.has(cacheKey)) {
      return this._geocodeCache.get(cacheKey);
    }

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", country ? `${city}, ${country}` : city);

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const results = await response.json();
      const hit = Array.isArray(results) ? results[0] : null;
      const lat = hit ? Number(hit.lat) : NaN;
      const lng = hit ? Number(hit.lon) : NaN;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        this._geocodeCache.set(cacheKey, null);
        return null;
      }

      const center = [lng, lat];
      this._geocodeCache.set(cacheKey, center);
      return center;
    } catch (err) {
      console.warn("City geocoding failed:", err?.message || err);
      return null;
    }
  }

  async resolveConfiguredCenter(fallback = DEFAULT_CENTER) {
    if (this.initialLat != null || this.initialLng != null) {
      return this.getConfiguredCenter(fallback);
    }

    const cityCenter = await this.geocodeCityCenter();
    return cityCenter || fallback;
  }

  async applyConfiguredView({ preserveCurrentWhenMissing = false, duration = 500 } = {}) {
    if (!this.map) return;
    const reqSeq = ++this._viewRequestSeq;

    const currentCenter = this.map.getCenter?.();
    const centerFallback = preserveCurrentWhenMissing && currentCenter
      ? [currentCenter.lng, currentCenter.lat]
      : DEFAULT_CENTER;
    const zoomFallback = preserveCurrentWhenMissing && Number.isFinite(this.map.getZoom?.())
      ? this.map.getZoom()
      : DEFAULT_ZOOM;

    const center = await this.resolveConfiguredCenter(centerFallback);
    if (!this.map || reqSeq !== this._viewRequestSeq) return;

    this.map.easeTo({
      center,
      zoom: this.getConfiguredZoom(zoomFallback),
      duration
    });
  }

  parseLayersAttribute() {
    const raw = this.getAttribute("layers");
    if (!raw || !raw.trim()) return [];

    const tokens = raw.split(/[;,]/).map(t => t.trim()).filter(Boolean);
    const seen = new Set();
    const parsed = [];

    for (const token of tokens) {
      const match = token.match(/^(\d)(?::|\.)([\w-]+)$/) || token.match(/^(\d)$/);
      if (!match) {
        console.warn(`Invalid layer token "${token}". Use format "type:subkey" (e.g. "1:trees").`);
        continue;
      }

      const typeKey = match[1];
      const subKey = match[2] || "all";
      const key = `${typeKey}:${subKey}`;
      if (seen.has(key)) continue;

      const category = this.buildCategoryConfig(typeKey, subKey);
      if (!category) {
        console.warn(`Unknown layer token "${token}" (resolved as "${key}").`);
        continue;
      }

      seen.add(key);
      parsed.push(category);
    }

    return parsed;
  }

  hasConfiguredLayersSelection() {
    return this._configuredLayers.length > 0;
  }

  syncControlsVisibility() {
    const layerSelect = this.shadowRoot?.querySelector("#layerSelect");
    const subChips = this.shadowRoot?.querySelector("#subChips");
    if (!layerSelect || !subChips) return;

    if (this.hasConfiguredLayersSelection()) {
      layerSelect.style.display = "none";
      subChips.classList.remove("show");
    } else {
      layerSelect.style.display = "";
    }
  }

  refreshLayerSelection() {
    if (!this.map) return;

    this.closeSidebar();
    this.hideLoader();

    if (this.getSelectedCategories().length) {
      this.loadData();
    } else {
      this.loader?.abort();
      this.clearMap();
    }
  }

  buildCategoryConfig(typeKey, subKey = "all") {
    const typeConfig = MAIN_TYPES[typeKey];
    if (!typeConfig) return null;

    const subConfig = typeConfig.subcategories[subKey];
    if (!subConfig) return null;

    return {
      type: typeKey,
      subKey,
      key: `${typeKey}:${subKey}`,
      typeName: typeConfig.name,
      name: subConfig.name,
      subtypes: subConfig.subtypes,
      geometries: subConfig.geometries,
      color: subConfig.color,
      multiColor: subConfig.multiColor,
      icon: subConfig.icon
    };
  }

  getSelectedCategories() {
    if (this.hasConfiguredLayersSelection()) {
      return this._configuredLayers;
    }
    const active = this.getActiveCategory();
    return active ? [active] : [];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this.getAssetUrl(MAPLIBRE_CSS_FILE)}">
      <style>
        :host { display: block; width: 100%; min-height: 700px; height: 100%; font-family: system-ui, sans-serif; }
        .container { display: flex; flex-direction: column; min-height: inherit; height: 100%; }
        .title { padding: 16px; text-align: center; background: #fff; }
        .title h2 { margin: 0 0 8px; font-size: 20px; text-transform: uppercase; }
        .title p { margin: 0; color: #666; font-size: 14px; }
        .controls { padding: 12px; background: #fff; border-bottom: 1px solid #ddd; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        select { min-width: 160px; padding: 8px 12px; border: 1px solid #333; border-radius: 4px; font-size: 14px; }
        button { padding: 8px 16px; border: 1px solid #333; border-radius: 4px; background: #fff; cursor: pointer; }
        button:hover { background: #333; color: #fff; }

        /* Chip container for sub-categories */
        .chip-container { display: none; gap: 6px; flex-wrap: wrap; align-items: center; }
        .chip-container.show { display: flex; }
        .chip-divider { width: 1px; height: 24px; background: #ddd; margin: 0 4px; }

        /* Chip/pill buttons - uses CSS custom property for color */
        .chip { position: relative; padding: 6px 14px; border: 1px solid var(--chip-color, #4CAF50); border-radius: 20px; background: #fff;
                color: var(--chip-color, #4CAF50); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .chip:hover { background: color-mix(in srgb, var(--chip-color, #4CAF50) 15%, white); }
        .chip.active { background: var(--chip-color, #4CAF50); color: #fff; }
        .chip.active:hover { filter: brightness(0.9); }

        /* Chip tooltip on hover */
        .chip-tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
                        background: #333; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px;
                        font-weight: 400; white-space: normal; width: max-content; max-width: 220px; text-align: center;
                        opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; z-index: 100;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2); line-height: 1.4; }
        .chip-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
                               border: 6px solid transparent; border-top-color: #333; }
        .chip:hover .chip-tooltip { opacity: 1; visibility: visible; }
        /* Map wrapper for sidebar positioning */
        .map-wrapper { position: relative; flex: 1 1 auto; min-height: 400px; }
        .map-wrapper #map { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
        .map-error { position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
                     padding: 24px; background: #f8f8f8; color: #333; text-align: center; z-index: 20; }
        .map-error.show { display: flex; }
        .map-error strong { display: block; margin-bottom: 8px; }
        .map-error span { display: block; max-width: 520px; line-height: 1.45; }

        .sidebar { position: absolute; top: 12px; left: -340px; width: 300px; max-height: calc(100% - 24px);
                   background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                   transition: left 0.3s ease; z-index: 1000; overflow: hidden; display: flex; flex-direction: column; }
        .sidebar.open { left: 12px; }
        .sidebar-header { padding: 8px 12px; background: #fff; display: flex; justify-content: flex-end; align-items: center;
                          border-bottom: 1px solid #eee; flex-shrink: 0; }
        .sidebar-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; padding: 4px 8px; line-height: 1; }
        .sidebar-close:hover { color: #333; }
        .sidebar-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; }

        .sidebar-icon { width: 100%; aspect-ratio: 1.2; max-height: 120px; background: #f8f8f8; border-radius: 12px;
                        display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
        .sidebar-icon img { max-width: 70px; max-height: 70px; object-fit: contain; }
        .sidebar-icon.empty { display: none; }

        /* Info pills/badges */
        .info-pill { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: #fff;
                     border-radius: 24px; font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .info-pill-label { color: #666; text-transform: uppercase; font-size: 11px; font-weight: 500; }
        .info-pill-value { color: #333; font-weight: 600; }
        .info-pills-row { display: flex; gap: 8px; flex-wrap: wrap; }

        /* Directions button */
        .directions-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;
                          padding: 12px 20px; background: #fff; border: 2px solid #333; border-radius: 28px;
                          font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: all 0.2s; }
        .directions-btn:hover { background: #f5f5f5; }
        .directions-btn img { width: 32px; height: 32px; }

        .toast { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
                 background: #333; color: #fff; padding: 10px 20px; border-radius: 4px;
                 opacity: 0; transition: opacity 0.3s; z-index: 2000; }
        .toast.show { opacity: 1; }

        .loader { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  display: none; flex-direction: column; align-items: center; gap: 12px;
                  background: rgba(255,255,255,0.95); padding: 24px 32px; border-radius: 8px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 1500; }
        .loader.show { display: flex; }
        .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0;
                   border-top-color: #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-text { font-size: 14px; color: #333; font-weight: 500; }
      </style>

      <div class="container">
        <div class="title">
          <h2>Explore Urban Green Spaces</h2>
          <p>Discover vegetation, urban furniture, and green infrastructure in Padova</p>
        </div>
        <div class="controls">
          <select id="layerSelect">
            <option value="">Select a category</option>
            <option value="1">Vegetation</option>
            <option value="2">Urban Furniture</option>
            <option value="3">Use & Management</option>
          </select>
          <div class="chip-container" id="subChips">
            <!-- Chips will be dynamically generated based on selected type -->
          </div>
          <button id="clearCache">Clear cache</button>
        </div>
        <div class="map-wrapper">
          <div id="map"></div>
          <div class="map-error" id="mapError" role="status" aria-live="polite"></div>
          <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
              <button class="sidebar-close" id="closeSidebar">&times;</button>
            </div>
            <div class="sidebar-content" id="sidebarContent">
              <div class="sidebar-icon" id="sidebarIcon"></div>
              <div id="sidebarPills"></div>
              <button class="directions-btn" id="directionsBtn">
                <img src="${navBtnUrl}" alt="Navigate" />
                Get Directions
              </button>
            </div>
          </div>
          <div class="toast" id="toast"></div>
          <div class="loader" id="loader">
            <div class="spinner"></div>
            <div class="loader-text" id="loaderText">Loading...</div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.querySelector("#layerSelect").addEventListener("change", e => {
      this.onTypeChange(e.target.value);
    });

    this.shadowRoot.querySelector("#clearCache").addEventListener("click", () => {
      this.clearCache();
    });

    this.shadowRoot.querySelector("#closeSidebar").addEventListener("click", () => {
      this.closeSidebar();
    });

    this.syncControlsVisibility();
  }

  // Generate chips for a given type's subcategories
  generateChips(typeKey) {
    const chipContainer = this.shadowRoot.querySelector("#subChips");
    chipContainer.innerHTML = "";

    if (!typeKey || !MAIN_TYPES[typeKey]) {
      chipContainer.classList.remove("show");
      return;
    }

    const typeConfig = MAIN_TYPES[typeKey];
    const subcats = typeConfig.subcategories;

    // Add divider
    const divider = document.createElement("span");
    divider.className = "chip-divider";
    chipContainer.appendChild(divider);

    // Add chip for each subcategory
    Object.entries(subcats).forEach(([subKey, subConfig], index) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (index === 0 ? " active" : "");
      chip.dataset.sub = subKey;
      chip.style.setProperty("--chip-color", subConfig.color);

      // Chip label
      const label = document.createElement("span");
      label.textContent = subConfig.name;
      chip.appendChild(label);

      // Add tooltip if description exists
      if (subConfig.tooltip) {
        const tooltip = document.createElement("span");
        tooltip.className = "chip-tooltip";
        tooltip.textContent = subConfig.tooltip;
        chip.appendChild(tooltip);
      }

      chip.addEventListener("click", () => {
        this.onSubCategoryChange(subKey);
        chipContainer.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      });

      chipContainer.appendChild(chip);
    });

    chipContainer.classList.add("show");
  }

  onTypeChange(typeKey) {
    if (!typeKey) {
      // No selection - hide chips, clear map
      this.shadowRoot.querySelector("#subChips").classList.remove("show");
      this.currentType = null;
      this.currentSubCategory = null;
      this._currentFeatures = null;
      this.clearMap();
      this.closeSidebar();
      return;
    }

    // Generate chips for this type
    this.generateChips(typeKey);

    // Set current type and default to "all" subcategory
    this.currentType = typeKey;
    this.currentSubCategory = "all";

    // Reset zoom to default when changing category
    this.resetMapView();
    this.loadData();
  }

  onSubCategoryChange(subKey) {
    this.currentSubCategory = subKey;

    // Reset zoom to default when changing subcategory
    this.resetMapView();

    // Data is already cached by type, just re-filter and display
    this.loadData();
  }

  // Reset map to default center and zoom
  resetMapView() {
    this.applyConfiguredView({ duration: 500 });
  }

  initMap() {
    this.loader = new ViewportDataLoader(this.apiBase, this.lang);
    const maplibregl = this.getMapLibre();

    if (!maplibregl) {
      this.loadMapLibreScript()
        .then(() => {
          if (this.isConnected && !this.map) this.initMap();
        })
        .catch(err => {
          console.error("MapLibre loading error:", err);
          this.showMapError(
            "MapLibre is not loaded",
            `The component could not load ${this.getAssetUrl(MAPLIBRE_JS_FILE)}.`
          );
        });
      return;
    }

    try {
      this.map = new maplibregl.Map({
        container: this.shadowRoot.querySelector("#map"),
        center: this.getConfiguredCenter(),
        zoom: this.getConfiguredZoom(),
        failIfMajorPerformanceCaveat: false,
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256
            }
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }]
        }
      });
    } catch (err) {
      console.error("MapLibre initialization error:", err);
      this.showMapError(
        "Map initialization failed",
        err?.message || "The browser could not initialize the WebGL map."
      );
      this.map = null;
      return;
    }

    this.hideMapError();

    this.map.addControl(new maplibregl.NavigationControl());
    this.setupMapResizeObserver();

    this.map.on("error", e => {
      const err = e?.error || e;
      console.error("MapLibre error:", err);
      if (String(err?.message || err).includes("WebGL")) {
        this.showMapError(
          "WebGL is not available",
          "This map needs WebGL. Enable hardware acceleration/WebGL in the browser or test with another browser/profile."
        );
      }
    });

    this.map.on("load", () => {
      this.setupLiveLayers();
      this.setupBaseInteractions();
      this.setupLiveInteractions();
      if (this.getSelectedCategories().length) {
        this.loadData();
      }
      this.applyConfiguredView({ duration: 0 });
      this.map.resize();
    });
  }

  getMapLibre() {
    return window.maplibregl || null;
  }

  loadMapLibreScript() {
    if (window.maplibregl) return Promise.resolve();

    if (!window.__urbanGreenMapLibreScriptPromise) {
      window.__urbanGreenMapLibreScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = this.getAssetUrl(MAPLIBRE_JS_FILE);
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${script.src}`));
        document.head.appendChild(script);
      });
    }

    return window.__urbanGreenMapLibreScriptPromise;
  }

  getAssetUrl(fileName) {
    return new URL(fileName, this.getComponentAssetBaseUrl()).href;
  }

  getComponentAssetBaseUrl() {
    const currentScriptUrl = document.currentScript?.src;
    if (currentScriptUrl) return currentScriptUrl;

    const scripts = Array.from(document.scripts);
    const assetScript = scripts.find(script => {
      if (!script.src) return false;
      return COMPONENT_ASSET_SCRIPT_NAMES.some(fileName => script.src.includes(`/${fileName}`) || script.src.endsWith(fileName));
    });

    return assetScript?.src || window.location.href;
  }

  showMapError(title, message) {
    const errorEl = this.shadowRoot?.querySelector("#mapError");
    if (!errorEl) return;

    errorEl.innerHTML = `
      <span>
        <strong>${title}</strong>
        ${message}
      </span>
    `;
    errorEl.classList.add("show");
  }

  hideMapError() {
    const errorEl = this.shadowRoot?.querySelector("#mapError");
    if (!errorEl) return;

    errorEl.innerHTML = "";
    errorEl.classList.remove("show");
  }

  setupMapResizeObserver() {
    if (typeof ResizeObserver === "undefined") {
      requestAnimationFrame(() => this.map?.resize());
      return;
    }

    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      this.map?.resize();
    });
    this._resizeObserver.observe(this);
    this._resizeObserver.observe(this.shadowRoot.querySelector(".map-wrapper"));

    requestAnimationFrame(() => this.map?.resize());
  }

  setupLiveLayers() {
    // Single source for all data
    this.map.addSource("data", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    // Fill layer for polygons
    this.map.addLayer({
      id: "polygons-fill",
      type: "fill",
      source: "data",
      filter: POLYGON_GEOMETRY_FILTER,
      paint: {
        "fill-color": ["get", "_color"],
        "fill-opacity": 0.7
      }
    });

    // Outline for polygons - thicker colored border for visibility
    this.map.addLayer({
      id: "polygons-outline",
      type: "line",
      source: "data",
      filter: POLYGON_GEOMETRY_FILTER,
      paint: {
        "line-color": ["get", "_color"],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 2,    // At zoom 10: 2px border
          14, 3,    // At zoom 14: 3px border
          18, 4     // At zoom 18: 4px border
        ],
        "line-opacity": 0.9
      }
    });

    // Extra outline for small polygons - white outer stroke for contrast
    this.map.addLayer({
      id: "polygons-outline-outer",
      type: "line",
      source: "data",
      filter: POLYGON_GEOMETRY_FILTER,
      paint: {
        "line-color": "#ffffff",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 3,
          14, 4,
          18, 5
        ],
        "line-opacity": 0.5,
        "line-gap-width": 0
      }
    });

    // Move polygons-outline above the outer stroke
    this.map.moveLayer("polygons-outline");

    // Line layer outer stroke (for contrast)
    this.map.addLayer({
      id: "lines-outer",
      type: "line",
      source: "data",
      filter: LINE_GEOMETRY_FILTER,
      paint: {
        "line-color": "#ffffff",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 5,
          14, 7,
          18, 9
        ],
        "line-opacity": 0.6
      }
    });

    // Line layer (hedges, tree rows)
    this.map.addLayer({
      id: "lines",
      type: "line",
      source: "data",
      filter: LINE_GEOMETRY_FILTER,
      paint: {
        "line-color": ["get", "_color"],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 3,
          14, 4,
          18, 6
        ],
        "line-opacity": 0.9
      }
    });

    // Individual points
    this.map.addLayer({
      id: "points",
      type: "circle",
      source: "data",
      filter: POINT_GEOMETRY_FILTER,
      paint: {
        "circle-radius": 6,
        "circle-color": ["get", "_color"],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
      }
    });
  }

  setupBaseInteractions() {
    this._featureClicked = false;

    // Close sidebar when clicking empty map area
    this.map.on("click", () => {
      // Use setTimeout to check after feature click handlers have run
      setTimeout(() => {
        if (!this._featureClicked) {
          this.closeSidebar();
        }
        this._featureClicked = false;
      }, 0);
    });
  }

  setupLiveInteractions() {
    // Click handlers for live features
    ["polygons-fill", "lines", "points"].forEach(layer => {
      this.map.on("click", layer, e => {
        if (e.features?.[0]) {
          this._featureClicked = true;
          this.showSidebar(e.features[0]);
        }
      });
      this.map.on("mouseenter", layer, () => this.map.getCanvas().style.cursor = "pointer");
      this.map.on("mouseleave", layer, () => this.map.getCanvas().style.cursor = "");
    });

  }

  isLiveMode() {
    return true;
  }

  getActiveCategory() {
    // Get the active category config based on current selections
    if (!this.currentType) return null;
    const subKey = this.currentSubCategory || "all";
    return this.buildCategoryConfig(this.currentType, subKey);
  }

  matchesCategory(feature, category) {
    const props = feature?.properties || {};
    const geomType = feature?.geometry?.type;
    const typeCode = String(props.greenCodeType || props.type || "");
    const subtype = String(props.greenCodeSubtype || "").padStart(2, "0");

    if (typeCode && typeCode !== String(category.type)) return false;
    if (category.geometries && !this.categoryAllowsGeometry(category, geomType)) return false;
    if (category.subtypes && !category.subtypes.includes(subtype)) return false;
    return true;
  }

  categoryAllowsGeometry(category, geomType) {
    if (!category.geometries || !geomType) return true;
    return category.geometries.some(allowed => this.expandGeometryType(allowed).includes(geomType));
  }

  expandGeometryType(geomType) {
    switch (geomType) {
      case "Point":
      case "MultiPoint":
        return ["Point", "MultiPoint"];
      case "LineString":
      case "MultiLineString":
        return ["LineString", "MultiLineString"];
      case "Polygon":
      case "MultiPolygon":
        return ["Polygon", "MultiPolygon"];
      default:
        return [geomType];
    }
  }

  getColorForFeature(feature, categories) {
    const matched = categories.find(category => this.matchesCategory(feature, category));
    if (!matched) return "#888888";

    if (matched.multiColor) {
      const subtype = String(feature.properties?.greenCodeSubtype || "").padStart(2, "0");
      return SUBTYPE_COLORS[subtype] || "#888888";
    }
    return matched.color || "#888888";
  }

  async loadData() {
    const categories = this.getSelectedCategories();
    if (!categories.length) return;
    if (!this.isLiveMode()) return;

    const seq = ++this._seq;
    const loadRequests = this.getApiLoadRequests(categories);
    const loadingLabel = categories.length === 1 ? categories[0].name : `${categories.length} layers`;

    console.log(`🔄 Loading ${loadingLabel}...`);
    this.showLoader(`Loading ${loadingLabel}...`);

    // Abort any pending requests
    this.loader.abort();

    // Clear map immediately
    this.clearMap();
    this.closeSidebar();

    try {
      const features = [];
      const seenFeatureIds = new Set();
      for (const request of loadRequests) {
        const typeFeatures = await this.loader.loadTypeData(request.type, null, request.subtype);
        if (seq !== this._seq) {
          this.hideLoader();
          return; // Outdated request
        }
        typeFeatures.forEach(feature => {
          const key = feature.properties?.id || JSON.stringify(feature.geometry);
          if (seenFeatureIds.has(key)) return;
          seenFeatureIds.add(key);
          features.push(feature);
        });
      }

      // Filter by category criteria
      const filtered = this.filterFeatures(features, categories);
      console.log(`🎯 Filtered to ${filtered.length} features`);

      // Update map
      this.updateMap(filtered, categories);
      this.hideLoader();

    } catch (err) {
      console.error("Load error:", err);
      this.hideLoader();
    }
  }

  filterFeatures(features, categoryOrCategories) {
    const categories = Array.isArray(categoryOrCategories) ? categoryOrCategories : [categoryOrCategories];
    if (!categories.length) return [];

    // Debug: count subtypes and geometry types before filtering
    const subtypeCounts = {};
    const geomCounts = {};
    features.forEach(f => {
      const st = f.properties.greenCodeSubtype;
      const gt = f.geometry?.type;
      subtypeCounts[st] = (subtypeCounts[st] || 0) + 1;
      geomCounts[gt] = (geomCounts[gt] || 0) + 1;
    });
    console.log('📊 Subtypes in data:', subtypeCounts);
    console.log('📊 Geometries in data:', geomCounts);
    console.log('🎯 Filter config:', categories.map(c => ({ key: c.key, subtypes: c.subtypes, geometries: c.geometries })));

    const filtered = features.filter(f => {
      return categories.some(category => this.matchesCategory(f, category));
    });

    console.log(`🔍 Filter (${categories.length} layer selections) → ${filtered.length} features`);
    return filtered;
  }

  getApiLoadRequests(categories) {
    const seen = new Set();
    const requests = [];

    categories.forEach(category => {
      const subtypes = category.subtypes?.length
        ? category.subtypes
        : this.getKnownSubtypesForType(category.type);
      subtypes.forEach(subtype => {
        const key = `${category.type}:${subtype || "*"}`;
        if (seen.has(key)) return;
        seen.add(key);
        requests.push({ type: category.type, subtype });
      });
    });

    return requests;
  }

  getKnownSubtypesForType(typeKey) {
    const subcategories = MAIN_TYPES[typeKey]?.subcategories || {};
    const subtypes = new Set();

    Object.entries(subcategories).forEach(([subKey, subConfig]) => {
      if (subKey === "all") return;
      subConfig.subtypes?.forEach(subtype => subtypes.add(subtype));
    });

    return subtypes.size ? [...subtypes] : [null];
  }

  updateMap(features, categoryOrCategories) {
    const categories = Array.isArray(categoryOrCategories) ? categoryOrCategories : [categoryOrCategories];

    // Add color to features based on matched selected layer
    const enriched = features.map(f => {
      const color = this.getColorForFeature(f, categories);

      return {
        ...f,
        properties: {
          ...f.properties,
          _color: color
        }
      };
    });

    this._currentFeatures = enriched;
    this.renderFeatures();
  }

  renderFeatures() {
    if (!this.map || !this._currentFeatures) return;

    const source = this.map.getSource("data");
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: this._currentFeatures
      });
    }

    console.log(`🗺️ Rendered: ${this._currentFeatures.length} features`);
  }

  clearMap() {
    if (!this.map) return;
    const source = this.map.getSource("data");
    if (source) {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }

  showSidebar(feature) {
    const props = feature.properties || {};
    const langKey = `name_${this.lang}`;
    const rawGreenCode = props.greenCode || props.code || null;

    let typeCode = props.greenCodeType || props.type || null;
    if (!typeCode && rawGreenCode) {
      typeCode = String(rawGreenCode).slice(1, 2);
    }
    typeCode = typeCode ? String(typeCode) : "";

    let subtype = props.greenCodeSubtype || null;
    if (!subtype && rawGreenCode) {
      subtype = String(rawGreenCode).slice(2, 4);
    }
    subtype = String(subtype || "").padStart(2, "0");

    const info = getGreenSpaceInfo(typeCode, subtype, this.lang);
    const apiName = props.name || props[langKey] || props.title;
    const displayName = apiName && String(apiName).trim() ? apiName : info.name;

    let greenCode = rawGreenCode;
    if (!greenCode && typeCode) {
      greenCode = `P${typeCode}${subtype}${String(props.id || "").slice(-2)}`;
    }
    if (!greenCode) {
      greenCode = "N/A";
    }

    // Get feature center for directions
    const geom = feature.geometry;
    let center = null;
    if (geom?.type === "Point") {
      center = geom.coordinates;
    } else if (geom?.type === "Polygon" && geom.coordinates?.[0]) {
      // Get centroid of polygon
      const coords = geom.coordinates[0];
      let sumLng = 0, sumLat = 0;
      for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat; }
      center = [sumLng / coords.length, sumLat / coords.length];
    } else if (geom?.type === "MultiPolygon" && geom.coordinates?.[0]?.[0]) {
      // Approximate centroid from first polygon outer ring
      const coords = geom.coordinates[0][0];
      let sumLng = 0, sumLat = 0;
      for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat; }
      center = [sumLng / coords.length, sumLat / coords.length];
    } else if (geom?.type === "LineString" && geom.coordinates?.length) {
      // Get midpoint of line
      const mid = Math.floor(geom.coordinates.length / 2);
      center = geom.coordinates[mid];
    }

    const iconEl = this.shadowRoot.querySelector("#sidebarIcon");
    const iconUrl = info.icon ? iconUrlMap[info.icon] : null;
    if (iconUrl) {
      iconEl.innerHTML = `<img src="${iconUrl}" alt="${displayName}" />`;
      iconEl.classList.remove("empty");
    } else {
      iconEl.innerHTML = "";
      iconEl.classList.add("empty");
    }

    // Pills section - now shows actual API name
    this.shadowRoot.querySelector("#sidebarPills").innerHTML = `
      <div class="info-pill">
        <span class="info-pill-label">Name:</span>
        <span class="info-pill-value">${displayName}</span>
      </div>
      <div class="info-pill">
        <span class="info-pill-label">Category:</span>
        <span class="info-pill-value">${info.typeName}</span>
      </div>
      <div class="info-pills-row">
        <div class="info-pill">
          <span class="info-pill-label">Green Code:</span>
          <span class="info-pill-value">${greenCode}</span>
        </div>
        <div class="info-pill">
          <span class="info-pill-label">Geometry:</span>
          <span class="info-pill-value">${geom?.type || 'N/A'}</span>
        </div>
      </div>
      <div class="info-pill">
        <span class="info-pill-label">ID:</span>
        <span class="info-pill-value">${props.id || 'N/A'}</span>
      </div>
    `;

    // Directions button - store center for click handler
    const directionsBtn = this.shadowRoot.querySelector("#directionsBtn");
    if (center) {
      directionsBtn.style.display = "flex";
      directionsBtn.onclick = () => {
        const [lng, lat] = center;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
      };
    } else {
      directionsBtn.style.display = "none";
    }

    this.shadowRoot.querySelector("#sidebar").classList.add("open");
  }

  closeSidebar() {
    this.shadowRoot.querySelector("#sidebar").classList.remove("open");
  }

  showToast(msg) {
    const toast = this.shadowRoot.querySelector("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  showLoader(text = "Loading...") {
    const loader = this.shadowRoot.querySelector("#loader");
    const loaderText = this.shadowRoot.querySelector("#loaderText");
    loaderText.textContent = text;
    loader.classList.add("show");
  }

  hideLoader() {
    this.shadowRoot.querySelector("#loader").classList.remove("show");
  }

  async clearCache() {
    this.loader.clearCache();
    try {
      indexedDB.deleteDatabase('UrbanGreenTileCache');
    } catch (e) {}
    this.showToast("Cache cleared");
    if (this.currentType && this.isLiveMode()) {
      this.loadData();
    }
  }
}

customElements.define("r3gis-urbangreen-v2", UrbanGreenMapV2);
export default UrbanGreenMapV2;
