/** The GTA map canvas, as the mock and the prototype draw it (design: event-map, GtaProjection). */
export const MAP_WIDTH = 480;
export const MAP_HEIGHT = 560;

const COS_LAT = Math.cos((43.7 * Math.PI) / 180);
const SCALE = Math.max(
  1,
  Math.min((MAP_WIDTH - 112) / ((-79.28 + 79.82) * COS_LAT), (MAP_HEIGHT - 112) / (43.9 - 43.56)),
);

const round = (n: number) => Math.round(n * 10) / 10;

/** Projects longitude and latitude onto the 480 × 560 canvas with cosine-of-latitude scaling. */
export function project(lng: number, lat: number): [number, number] {
  return [
    round(MAP_WIDTH / 2 + (lng + 79.55) * COS_LAT * SCALE),
    round(MAP_HEIGHT * 0.42 - (lat - 43.73) * SCALE),
  ];
}

/** Lake Ontario's north shore, west to east. */
const SHORE: [number, number][] = [
  [-80.3, 43.27],
  [-79.9, 43.29],
  [-79.78, 43.36],
  [-79.69, 43.43],
  [-79.6, 43.5],
  [-79.53, 43.57],
  [-79.48, 43.615],
  [-79.42, 43.63],
  [-79.37, 43.638],
  [-79.32, 43.655],
  [-79.25, 43.68],
  [-79.18, 43.725],
  [-79.1, 43.78],
  [-79, 43.825],
  [-78.86, 43.86],
  [-78.4, 43.9],
];

export const PLACES: { label: string; x: number; y: number; water: boolean }[] = [
  ['Toronto', -79.415, 43.705, false],
  ['Mississauga', -79.655, 43.622, false],
  ['Brampton', -79.76, 43.72, false],
  ['Vaughan', -79.53, 43.83, false],
  ['Markham', -79.31, 43.885, false],
  ['Scarborough', -79.23, 43.775, false],
  ['Lake Ontario', -79.4, 43.52, true],
].map(([label, lng, lat, water]) => {
  const [x, y] = project(lng as number, lat as number);
  return {
    label: water ? (label as string) : (label as string).toUpperCase(),
    x,
    y,
    water: water as boolean,
  };
});

/** Downtown Toronto, where stream arcs land. */
export const HUB = project(-79.383, 43.648);

/** Land above the shoreline and lake below it, as SVG paths. */
export function regions(): { land: string; lake: string } {
  const pts = SHORE.map(([lng, lat]) => project(lng, lat));
  const line = pts.map(([x, y]) => `${x},${y}`).join(' L');
  const first = pts[0];
  const last = pts[pts.length - 1];
  return {
    land: `M${line} L${last[0]},-800 L${first[0]},-800 Z`,
    lake: `M${line} L${last[0]},${MAP_HEIGHT + 800} L${first[0]},${MAP_HEIGHT + 800} Z`,
  };
}

/** A point on a quadratic Bézier curve. */
export function bezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  return [
    round(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]),
    round(u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]),
  ];
}
