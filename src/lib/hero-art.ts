// Build-time art for the wordmark effects: haze, pixel debris, circuit traces, data drips, glitch slices and a
// floor reflection, drawn around the BYO pixel wordmark. One scene per place it appears. Everything is
// generated from a fixed seed, so a build is deterministic.
//
// Every stage is a whole number of 14-unit cells on both axes and the wordmark sits on a cell boundary, so a
// CSS width that is a multiple of (stage width ÷ 14) px keeps every pixel crisp. See HeroArt.astro.
import { WORDMARK_PATH } from "./wordmark";

export const CELL = 14;
const HALF = CELL / 2;

export type Variant = "hero" | "footer" | "notfound" | "ambient";
type Cell = [number, number];
type Frag = [number, number, string, number];
type Rect = { x: number; y: number; width: number; height: number };

export interface Bucket {
  op: string;
  d: string;
}

export interface ProductFacts {
  pkg: string;
  version?: string;
  exitTo: string[];
}

interface Scene {
  seed: number;
  stage: Rect;
  /** Top-left of the 49×13 wordmark grid in stage units. Omitted: the scene has haze and debris but no mark. */
  ink?: { x: number; y: number };
  floor?: number;
  haze: { cx: number; cy: number; rx: number; ry: number; op: number; blur: number }[];
  smoke: { cx: number; cy: number; rx: number; ry: number; op: number; seed: number };
  scatter: { n: number; cx: number; cy: number; sx: number; sy: number; clip: Rect; hole?: Rect };
  flakes?: number;
  /** [wordmark column, length] */
  drips?: [number, number][];
  /** [wordmark row, side, length, opacity] */
  streaks?: [number, "l" | "r", number, number][];
  rain?: { xs: number[]; y: number };
  traces?: [number, number][][];
  /** One-row bands of the wordmark shifted sideways. */
  slices?: { row: number; rows: number; dx: number }[];
  refl?: { y1: number; y2: number; blur: number };
  horizon?: { x: number; width: number };
  /** Letters from this column on break apart and fall. */
  dissolve?: { from: number; span: number };
  frags: (p: ProductFacts[]) => Frag[];
}

export interface ArtData {
  variant: Variant;
  viewBox: string;
  stage: Rect;
  /** CSS pixels of width per cell: the art's width is a multiple of this. */
  step: number;
  hasMark: boolean;
  inkD: string;
  inkTransform: string;
  reflTransform: string;
  haze: Scene["haze"];
  blurs: number[];
  smoke: Scene["smoke"];
  scatter: Bucket[];
  flakes: Bucket[];
  drips: Bucket[];
  streaks: { x: number; y: number; width: number; op: number }[];
  rain: { x: number; y: number; ch: string; op: string }[];
  frags: { x: number; y: number; text: string; op: number }[];
  traces: { d: string; end: [number, number] }[];
  slices: { y: number; height: number; dx: number }[];
  refl?: { y1: number; y2: number; blur: number };
  horizon?: { x: number; y: number; width: number };
}

const toBinary = (word: string) => [...word].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
const toHex = (word: string) => [...word].map((c) => "0x" + c.charCodeAt(0).toString(16)).join(" ");

const SCENES: Record<Variant, Scene> = {
  // The home page: the wordmark beside the copy. Traces and left-hand streaks stop in the gap before it.
  hero: {
    seed: 7,
    stage: { x: 624, y: 100, width: 784, height: 700 },
    ink: { x: 680, y: 240 },
    floor: 520,
    haze: [
      { cx: 1030, cy: 330, rx: 520, ry: 190, op: 0.1, blur: 60 },
      { cx: 900, cy: 380, rx: 300, ry: 120, op: 0.09, blur: 40 },
      { cx: 1190, cy: 300, rx: 270, ry: 110, op: 0.08, blur: 50 },
      { cx: 1000, cy: 620, rx: 600, ry: 130, op: 0.07, blur: 70 },
      { cx: 760, cy: 250, rx: 200, ry: 90, op: 0.05, blur: 45 },
    ],
    smoke: { cx: 1016, cy: 420, rx: 392, ry: 300, op: 0.45, seed: 11 },
    scatter: { n: 330, cx: 1030, cy: 340, sx: 250, sy: 130, clip: { x: 624, y: 110, width: 784, height: 670 } },
    flakes: 46,
    drips: [[10, 12], [16, 15], [23, 18], [25, 11], [32, 14], [38, 10]],
    streaks: [[3, "l", 98, 0.3], [5, "l", 90, 0.2], [7, "l", 56, 0.3], [9, "l", 104, 0.25], [4, "r", 90, 0.3], [8, "r", 50, 0.2]],
    rain: { xs: [716, 748, 786, 842, 868, 934, 1052, 1096, 1148, 1204, 1262, 1320], y: 430 },
    traces: [
      [[700, 418], [660, 418], [640, 438], [640, 610], [596, 610]],
      [[690, 324], [650, 324], [632, 342], [632, 372], [596, 372]],
      [[1250, 396], [1250, 460], [1280, 490], [1400, 490]],
      [[1140, 254], [1140, 226], [1170, 196], [1330, 196]],
      [[800, 254], [800, 214], [776, 190], [700, 190]],
    ],
    slices: [{ row: 3, rows: 0.5, dx: CELL }, { row: 6, rows: 1, dx: -2 * CELL }, { row: 9, rows: 0.5, dx: 2 * CELL }],
    refl: { y1: 632, y2: 790, blur: 2.5 },
    horizon: { x: 624, width: 784 },
    frags: (p) => {
      const lead = p[0];
      return [
        [1170, 174, lead.pkg, 0.42],
        [1186, 228, "plugins: [inbox()]", 0.3],
        [720, 176, toBinary("byo"), 0.3],
        [746, 206, toHex("byo"), 0.22],
        [1262, 452, "user_id · created_at", 0.28],
        ...(lead.version ? ([[1356, 262, `v${lead.version}`, 0.4]] as Frag[]) : []),
        [1352, 330, "MIT", 0.4],
        [690, 470, "SELECT * FROM notification", 0.26],
        [900, 238, `exit → ${lead.exitTo.join(" · ").toLowerCase()}`, 0.24],
      ];
    },
  },

  // The footer: a big wordmark standing on its reflection.
  footer: {
    seed: 21,
    stage: { x: 0, y: 0, width: 840, height: 476 },
    ink: { x: 56, y: 70 },
    floor: 266,
    haze: [
      { cx: 400, cy: 160, rx: 420, ry: 110, op: 0.1, blur: 60 },
      { cx: 220, cy: 200, rx: 220, ry: 80, op: 0.08, blur: 45 },
      { cx: 600, cy: 150, rx: 240, ry: 80, op: 0.07, blur: 50 },
    ],
    smoke: { cx: 420, cy: 190, rx: 400, ry: 200, op: 0.45, seed: 5 },
    scatter: { n: 150, cx: 420, cy: 160, sx: 250, sy: 70, clip: { x: 0, y: 14, width: 840, height: 330 } },
    flakes: 30,
    drips: [[10, 4], [16, 5], [23, 6], [32, 4], [38, 5]],
    streaks: [[4, "r", 56, 0.3], [8, "r", 28, 0.2]],
    slices: [{ row: 4, rows: 0.5, dx: CELL }, { row: 8, rows: 0.5, dx: -CELL }],
    refl: { y1: 294, y2: 440, blur: 3 },
    horizon: { x: 0, width: 840 },
    frags: (p) => [
      [56, 44, p[0]?.pkg ?? "", 0.4],
      [336, 40, p[1]?.pkg ?? "", 0.3],
      [588, 52, p[2]?.pkg ?? "", 0.3],
      [760, 150, "MIT", 0.34],
    ],
  },

  // 404: the wordmark comes apart and falls.
  notfound: {
    seed: 404,
    stage: { x: 0, y: 0, width: 784, height: 504 },
    ink: { x: 42, y: 84 },
    floor: 280,
    haze: [
      { cx: 390, cy: 180, rx: 340, ry: 120, op: 0.09, blur: 60 },
      { cx: 600, cy: 210, rx: 190, ry: 90, op: 0.07, blur: 50 },
      { cx: 250, cy: 240, rx: 170, ry: 80, op: 0.06, blur: 40 },
    ],
    smoke: { cx: 392, cy: 230, rx: 380, ry: 230, op: 0.4, seed: 9 },
    scatter: { n: 200, cx: 450, cy: 190, sx: 220, sy: 90, clip: { x: 0, y: 14, width: 784, height: 420 } },
    flakes: 30,
    dissolve: { from: 16, span: 30 },
    drips: [[10, 8], [16, 10], [23, 7]],
    streaks: [[3, "l", 36, 0.3], [7, "l", 30, 0.2]],
    rain: { xs: [84, 126, 182, 266], y: 266 },
    refl: { y1: 308, y2: 456, blur: 2.5 },
    horizon: { x: 28, width: 728 },
    frags: () => [
      [420, 56, "GET /… → 404", 0.42],
      [650, 70, "110010100", 0.3],
      [44, 70, "ENOENT", 0.3],
      [706, 250, "0x194", 0.3],
    ],
  },

  // Behind a product page's live demo: haze and debris, no wordmark.
  ambient: {
    seed: 33,
    stage: { x: 0, y: 0, width: 784, height: 560 },
    haze: [
      { cx: 392, cy: 280, rx: 360, ry: 200, op: 0.09, blur: 60 },
      { cx: 160, cy: 180, rx: 200, ry: 120, op: 0.06, blur: 50 },
      { cx: 650, cy: 400, rx: 220, ry: 120, op: 0.06, blur: 50 },
    ],
    smoke: { cx: 392, cy: 280, rx: 390, ry: 270, op: 0.4, seed: 3 },
    scatter: { n: 260, cx: 392, cy: 280, sx: 270, sy: 180, clip: { x: 0, y: 0, width: 784, height: 560 }, hole: { x: 84, y: 70, width: 616, height: 420 } },
    traces: [
      [[728, 90], [756, 90], [770, 104], [770, 200]],
      [[56, 470], [28, 470], [14, 484], [14, 530]],
    ],
    frags: () => [],
  },
};

function parseCells(): Cell[] {
  const cells: Cell[] = [];
  for (const m of WORDMARK_PATH.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g))
    for (let i = 0; i < Number(m[3]); i++) cells.push([Number(m[1]) + i, Number(m[2])]);
  return cells;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Squares grouped by opacity so each opacity is one <path>. */
class Pixels {
  private buckets = new Map<string, string[]>();
  add(x: number, y: number, size: number, op: number) {
    const q = Math.round(op * 20) / 20;
    if (q < 0.04) return;
    const key = q.toFixed(2);
    this.buckets.set(key, [...(this.buckets.get(key) ?? []), `M${x} ${y}h${size}v${size}h-${size}z`]);
  }
  get(): Bucket[] {
    return [...this.buckets].map(([op, list]) => ({ op, d: list.join("") }));
  }
}

function cellsToPath(cells: Cell[]): string {
  const rows = new Map<number, number[]>();
  for (const [x, y] of cells) rows.set(y, [...(rows.get(y) ?? []), x]);
  let d = "";
  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = rows.get(y)!.sort((a, b) => a - b);
    let start = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (xs[i] !== xs[i - 1] + 1) {
        d += `M${start} ${y}h${xs[i - 1] - start + 1}v1h-${xs[i - 1] - start + 1}z`;
        start = xs[i];
      }
    }
  }
  return d;
}

const within = (r: Rect, X: number, Y: number) => X >= r.x && X <= r.x + r.width - HALF && Y >= r.y && Y <= r.y + r.height - HALF;

export function buildArt(variant: Variant, products: ProductFacts[]): ArtData {
  const s = SCENES[variant];
  const rand = mulberry32(s.seed);
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 0.5774;
  const ink = s.ink;
  const origin = ink ?? { x: s.stage.x, y: s.stage.y };
  const snapX = (v: number) => origin.x + Math.round((v - origin.x) / HALF) * HALF;
  const snapY = (v: number) => origin.y + Math.round((v - origin.y) / HALF) * HALF;

  // the letters: all of them, or the ones left after the rest break off and fall
  const all = ink ? parseCells() : [];
  const fallen = new Pixels();
  let kept = all;
  if (s.dissolve && ink) {
    kept = [];
    for (const [x, y] of all) {
      const p = Math.pow(Math.min(1, Math.max(0, (x - s.dissolve.from) / s.dissolve.span)), 1.2) * 0.9;
      if (rand() < p) {
        const reach = 40 + (x - s.dissolve.from) * 10;
        for (const qx of [0, 1])
          for (const qy of [0, 1])
            if (rand() < 0.6) {
              const dy = Math.round((Math.pow(rand(), 1.6) * reach) / HALF) * HALF;
              fallen.add(ink.x + x * CELL + qx * HALF + (rand() < 0.3 ? HALF : 0), ink.y + y * CELL + qy * HALF + dy, HALF, Math.max(0.1, 0.85 - (dy / reach) * 0.8));
            }
      } else kept.push([x, y]);
    }
  }
  const inkSet = new Set(kept.map(([x, y]) => `${x},${y}`));
  const inInk = (X: number, Y: number) => !!ink && inkSet.has(`${Math.floor((X - ink.x) / CELL)},${Math.floor((Y - ink.y) / CELL)}`);

  // scattered pixels, thinning out from the centre
  const scatter = new Pixels();
  const { clip, hole } = s.scatter;
  for (let i = 0; i < s.scatter.n; i++) {
    const X = snapX(s.scatter.cx + gauss() * s.scatter.sx);
    const Y = snapY(s.scatter.cy + gauss() * s.scatter.sy);
    if (!within(clip, X, Y) || (hole && within(hole, X, Y)) || inInk(X, Y)) continue;
    const op = [0.12, 0.2, 0.3, 0.45][Math.floor(rand() * 4)];
    scatter.add(X, Y, HALF, op);
    if (rand() < 0.35) {
      const len = 1 + Math.floor(rand() * 4);
      const horizontal = rand() < 0.7;
      for (let k = 1; k <= len; k++) {
        const X2 = X + (horizontal ? k * HALF : 0);
        const Y2 = Y + (horizontal ? 0 : k * HALF);
        if (!inInk(X2, Y2) && !(hole && within(hole, X2, Y2))) scatter.add(X2, Y2, HALF, op * 0.85);
      }
    }
  }

  // pixels flaking off the letters' edges, plus the ones that fell
  const flakes = new Pixels();
  if (ink && kept.length) {
    const edges: [number, number, number, number][] = [];
    for (const [x, y] of kept)
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (!inkSet.has(`${x + dx},${y + dy}`)) edges.push([x, y, dx, dy]);
    for (let i = 0; i < (s.flakes ?? 0); i++) {
      const [x, y, dx, dy] = edges[Math.floor(rand() * edges.length)];
      flakes.add(ink.x + (x + dx) * CELL + (rand() < 0.5 ? 0 : HALF), ink.y + (y + dy) * CELL + (rand() < 0.5 ? 0 : HALF), HALF, 0.35 + rand() * 0.5);
    }
  }

  // drips under the letters
  const drips = new Pixels();
  if (ink)
    for (const [col, n] of s.drips ?? []) {
      const rows = kept.filter(([x]) => x === col).map(([, y]) => y);
      if (!rows.length) continue;
      let y = ink.y + (Math.max(...rows) + 1) * CELL + 3;
      const x = ink.x + col * CELL + (col % 2 ? HALF : 0);
      for (let k = 0; k < n; k++) {
        drips.add(x, y, HALF, 0.9 * Math.pow(1 - k / n, 1.5));
        y += HALF + Math.floor(rand() * 8);
      }
    }

  const streaks = ink
    ? (s.streaks ?? []).map(([row, side, len, op]) => ({
        x: side === "l" ? ink.x - len : ink.x + 49 * CELL + 8,
        y: ink.y + row * CELL + 3,
        width: side === "l" ? len - 8 : len,
        op,
      }))
    : [];

  const rain: ArtData["rain"] = [];
  for (const x of s.rain?.xs ?? []) {
    const n = 5 + Math.floor(rand() * 9);
    for (let k = 0; k < n; k++)
      rain.push({ x, y: Math.round(s.rain!.y + k * 11 + rand() * 4), ch: "0123456789abcdef"[Math.floor(rand() * 16)], op: (0.5 * (1 - k / n)).toFixed(2) });
  }

  return {
    variant,
    viewBox: `${s.stage.x} ${s.stage.y} ${s.stage.width} ${s.stage.height}`,
    stage: s.stage,
    step: s.stage.width / CELL,
    hasMark: !!ink,
    inkD: cellsToPath(kept),
    inkTransform: ink ? `translate(${ink.x} ${ink.y}) scale(${CELL})` : "",
    reflTransform: `translate(0 ${2 * (s.floor ?? 0)}) scale(1 -1)`,
    haze: s.haze,
    blurs: [...new Set(s.haze.map((h) => h.blur))],
    smoke: s.smoke,
    scatter: scatter.get(),
    flakes: [...flakes.get(), ...fallen.get()],
    drips: drips.get(),
    streaks,
    rain,
    frags: s.frags(products).filter(([, , text]) => text).map(([x, y, text, op]) => ({ x, y, text, op })),
    traces: (s.traces ?? []).map((pts) => ({ d: "M" + pts.map((p) => p.join(" ")).join("L"), end: pts[pts.length - 1] })),
    slices: ink ? (s.slices ?? []).map((l) => ({ y: ink.y + l.row * CELL, height: l.rows * CELL, dx: l.dx })) : [],
    refl: ink ? s.refl : undefined,
    horizon: s.horizon && s.floor ? { x: s.horizon.x, y: s.floor, width: s.horizon.width } : undefined,
  };
}
