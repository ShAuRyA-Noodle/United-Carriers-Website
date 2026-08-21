/* ============================================================================
   Fabricated network data. Nothing here is real operational information —
   port codes, volumes, ETAs and headlines are all invented for the study.
   ========================================================================= */

/** Network nodes: { id, label, lat, lon, port } */
export const NODES = [
  { id: 'uk',  label: 'UK',           lat:  51.5, lon:  -0.1, port: 'FXT' },
  { id: 'de',  label: 'Germany',      lat:  53.6, lon:   9.9, port: 'HAM' },
  { id: 'es',  label: 'Spain',        lat:  39.5, lon:  -0.4, port: 'VLC' },
  { id: 'it',  label: 'Italy',        lat:  44.4, lon:   8.9, port: 'GOA' },
  { id: 'tr',  label: 'Turkey',       lat:  40.9, lon:  29.0, port: 'AMB' },
  { id: 'il',  label: 'Israel',       lat:  32.8, lon:  35.0, port: 'HFA' },
  { id: 'eg',  label: 'Egypt',        lat:  31.2, lon:  29.9, port: 'ALY' },
  { id: 'qa',  label: 'Qatar',        lat:  25.3, lon:  51.5, port: 'DOH' },
  { id: 'sa',  label: 'Saudi Arabia', lat:  21.5, lon:  39.2, port: 'JED' },
  { id: 'ke',  label: 'Kenya',        lat:  -4.0, lon:  39.7, port: 'MBA' },
  { id: 'za',  label: 'South Africa', lat: -33.9, lon:  18.4, port: 'CPT' },
  { id: 'us',  label: 'USA',          lat:  33.7, lon:-118.2, port: 'LGB' },
  { id: 'ca',  label: 'Canada',       lat:  49.3, lon:-123.1, port: 'VAN' },
  { id: 'mx',  label: 'Mexico',       lat:  19.1, lon:-104.3, port: 'ZLO' },
  { id: 'br',  label: 'Brazil',       lat: -23.9, lon: -46.3, port: 'SSZ' },
  { id: 'ar',  label: 'Argentina',    lat: -34.6, lon: -58.4, port: 'BUE' },
  { id: 'co',  label: 'Colombia',     lat:  10.4, lon: -75.5, port: 'CTG' },
  { id: 'cl',  label: 'Chile',        lat: -33.0, lon: -71.6, port: 'VAP' },
  { id: 'jp',  label: 'Japan',        lat:  35.4, lon: 139.7, port: 'YOK' },
  { id: 'hk',  label: 'Hong Kong',    lat:  22.3, lon: 114.2, port: 'HKG' },
  { id: 'th',  label: 'Thailand',     lat:  13.1, lon: 100.9, port: 'LCH' },
  { id: 'sg',  label: 'Singapore',    lat:   1.3, lon: 103.8, port: 'SIN' },
  { id: 'au',  label: 'Australia',    lat: -33.9, lon: 151.2, port: 'SYD' },
  { id: 'nz',  label: 'New Zealand',  lat: -36.8, lon: 174.8, port: 'AKL' },
  { id: 'cn',  label: 'China',        lat:  31.2, lon: 121.5, port: 'SHA' },
];

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

/** Trade lanes drawn as great-circle arcs. `lift` scales the arc apex. */
export const ROUTES = [
  { from: 'sg', to: 'de', lift: 0.42, weight: 1.0 },
  { from: 'cn', to: 'us', lift: 0.46, weight: 1.0 },
  { from: 'hk', to: 'uk', lift: 0.44, weight: 0.8 },
  { from: 'au', to: 'jp', lift: 0.24, weight: 0.7 },
  { from: 'sg', to: 'au', lift: 0.26, weight: 0.7 },
  { from: 'th', to: 'sa', lift: 0.28, weight: 0.6 },
  { from: 'sa', to: 'it', lift: 0.20, weight: 0.6 },
  { from: 'eg', to: 'es', lift: 0.18, weight: 0.5 },
  { from: 'za', to: 'br', lift: 0.34, weight: 0.7 },
  { from: 'br', to: 'uk', lift: 0.36, weight: 0.7 },
  { from: 'cl', to: 'cn', lift: 0.48, weight: 0.8 },
  { from: 'co', to: 'us', lift: 0.20, weight: 0.6 },
  { from: 'mx', to: 'ca', lift: 0.18, weight: 0.5 },
  { from: 'ar', to: 'za', lift: 0.32, weight: 0.6 },
  { from: 'ke', to: 'qa', lift: 0.20, weight: 0.5 },
  { from: 'nz', to: 'us', lift: 0.44, weight: 0.6 },
  { from: 'tr', to: 'il', lift: 0.14, weight: 0.4 },
  { from: 'jp', to: 'ca', lift: 0.34, weight: 0.6 },
];

/** Ticker headlines — invented. */
export const HEADLINES = [
  { tag: 'NEWS', text: 'Transpacific spot rates soften for a fourth consecutive week' },
  { tag: 'ADVISORY', text: 'Port congestion easing at northern European terminals' },
  { tag: 'NEWS', text: 'Low-sulphur bunker spread widens across Singapore stems' },
  { tag: 'NETWORK', text: 'Two additional intra-Asia sailings added to the SIN–LCH loop' },
  { tag: 'ADVISORY', text: 'Revised customs filing windows take effect across the Gulf' },
  { tag: 'NEWS', text: 'Airfreight capacity out of South America tightens ahead of peak' },
];

/** Rotating telemetry for the live-lane readout — all invented. */
export const LANES = [
  { lane: 'SIN → RTM', mode: 'OCEAN FCL', eta: '18D 04H', teu: '1,240' },
  { lane: 'SHA → LGB', mode: 'OCEAN FCL', eta: '13D 21H', teu: '2,085' },
  { lane: 'HKG → FXT', mode: 'AIR CHARTER', eta: '02D 06H', teu: '  —  ' },
  { lane: 'JED → GOA', mode: 'OCEAN LCL', eta: '07D 12H', teu: '  318' },
  { lane: 'SSZ → HAM', mode: 'OCEAN FCL', eta: '21D 09H', teu: '1,690' },
  { lane: 'SYD → AKL', mode: 'COASTAL RORO', eta: '03D 18H', teu: '  452' },
  { lane: 'CTG → LGB', mode: 'OCEAN FCL', eta: '06D 02H', teu: '  874' },
];

/** Preloader status lines. */
export const BOOT_STEPS = [
  'ESTABLISHING UPLINK',
  'LOADING TERRAIN MASK',
  'PLOTTING TRADE LANES',
  'SYNCING LANE TELEMETRY',
  'CALIBRATING HORIZON',
  'READY',
];


/** Loader roulette copy — invented network, generic industry service names. */
export const LOADER_COUNTRIES = [
  'Singapore', 'Australia', 'New Zealand', 'Hong Kong', 'China', 'Vietnam',
  'United States', 'Thailand', 'Germany', 'United Kingdom', 'Brazil', 'Chile',
];

export const LOADER_SERVICES = [
  'Air Freight',
  'Ocean Freight',
  'Customs Brokerage',
  'Warehousing & 3PL',
  'Project Cargo',
  'Domestic & Linehaul Transport',
];
