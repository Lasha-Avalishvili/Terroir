// Demo data. Plot 1's 2025 log follows Dataset A2 (vineyard work log, plot 1, 2025)
// exactly; other years and plots are realistic examples built around it.

import type { BatchRef, BayReport, Plot, Vine, VineEvent, VineyardOperation, OperationType } from './models';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_PLOTS: Plot[] = [
  {
    id: 'p1', name: 'Plot 1', village: 'Gurjaani',
    blocks: [
      { variety: 'Saperavi', wineColor: 'red', fromRow: 1, toRow: 14 },
      { variety: 'Mtsvane Kakhuri', wineColor: 'amber', fromRow: 15, toRow: 20 },
    ],
    areaHa: 0.75, rows: 20, vinesPerRow: 120, vinesPerBay: 5, plantedYear: 2009, training: 'Double Guyot',
    map: { x: 90, y: 110, w: 300, h: 165, tilt: -3 },
  },
  {
    id: 'p2', name: 'Plot 2', village: 'Gurjaani',
    blocks: [{ variety: 'Rkatsiteli', wineColor: 'white', fromRow: 1, toRow: 24 }],
    areaHa: 1.1, rows: 24, vinesPerRow: 140, vinesPerBay: 5, plantedYear: 2014, training: 'Double Guyot',
    map: { x: 480, y: 120, w: 360, h: 180, tilt: 2 },
  },
  {
    id: 'p3', name: 'Plot 3', village: 'Gurjaani',
    blocks: [{ variety: 'Kisi', wineColor: 'amber', fromRow: 1, toRow: 14 }],
    areaHa: 0.4, rows: 14, vinesPerRow: 90, vinesPerBay: 5, plantedYear: 2019, training: 'Single Guyot',
    map: { x: 230, y: 380, w: 220, h: 100, tilt: -1 },
  },
];

export const SEED_BATCHES: BatchRef[] = [
  { id: 'B-2023-04', label: 'Saperavi 2023 · qvevri red' },
  { id: 'B-2024-03', label: 'Saperavi 2024 · qvevri red' },
  { id: 'B-2025-02', label: 'Saperavi 2025 · qvevri red' },
  { id: 'B-2026-02', label: 'Saperavi 2026 · qvevri red' },
  { id: 'B-2023-05', label: 'Mtsvane Kakhuri 2023 · qvevri amber' },
  { id: 'B-2024-04', label: 'Mtsvane Kakhuri 2024 · qvevri amber' },
  { id: 'B-2025-03', label: 'Mtsvane Kakhuri 2025 · qvevri amber' },
  { id: 'B-2026-03', label: 'Mtsvane Kakhuri 2026 · qvevri amber' },
  { id: 'B-2023-01', label: 'Rkatsiteli 2023 · classic white' },
  { id: 'B-2024-01', label: 'Rkatsiteli 2024 · classic white' },
  { id: 'B-2025-01', label: 'Rkatsiteli 2025 · classic white' },
  { id: 'B-2026-01', label: 'Rkatsiteli 2026 · classic white' },
  { id: 'B-2023-06', label: 'Kisi 2023 · qvevri amber' },
  { id: 'B-2024-05', label: 'Kisi 2024 · qvevri amber' },
  { id: 'B-2025-05', label: 'Kisi 2025 · qvevri amber' },
  { id: 'B-2026-04', label: 'Kisi 2026 · qvevri amber' },
];

let opSeq = 0;
const op = (o: Omit<VineyardOperation, 'id'>): VineyardOperation => ({ id: `op${++opSeq}`, ...o });

const PEOPLE = ['Giorgi B.', 'Nino K.', 'Levan M.', 'Davit T.'];
const BORDEAUX = 'Bordeaux mixture (copper)';
const SULFUR = 'Wettable sulfur';

function plotOps(
  plotId: string,
  areaHa: number,
  year: number,
  pruning: string,
  green: string[],
  sprays: [string, string][],
  harvests: [string, number, string, string][], // date, kg, batch, variety
  notes: Partial<Record<string, string>> = {},
): VineyardOperation[] {
  const lPerHa = 800;
  const out: VineyardOperation[] = [];
  out.push(op({ plotId, type: 'pruning', date: `${year}-${pruning}`, person: PEOPLE[0], scope: { kind: 'plot' },
    note: notes[pruning] ?? 'Winter pruning; cut canes taken out of the plot.' }));
  green.forEach((d, i) =>
    out.push(op({ plotId, type: 'green', date: `${year}-${d}`, person: PEOPLE[2], scope: { kind: 'plot' },
      note: notes[d] ?? ['Extra and weak shoots removed.', 'Shoots tied to the support wires.', 'Leaves thinned in the cluster zone.'][i % 3] })),
  );
  sprays.forEach(([d, product]) =>
    out.push(op({ plotId, type: 'spraying', date: `${year}-${d}`, person: PEOPLE[1], scope: { kind: 'plot' },
      product, solutionL: Math.round(areaHa * lPerHa / 10) * 10, areaHa,
      note: notes[d] ?? 'Treatment against fungal diseases.' })),
  );
  harvests.forEach(([d, kg, batchId, variety]) =>
    out.push(op({ plotId, type: 'harvest', date: `${year}-${d}`, person: PEOPLE[0], scope: { kind: 'plot' },
      variety, kg, batchId, note: notes[`${d}:${variety}`] ?? notes[d] ?? 'Picked by hand, taken to the winery the same day.' })),
  );
  return out;
}

export function seedOperations(): VineyardOperation[] {
  opSeq = 0;
  return [
    // ── Plot 1 · Saperavi ──
    ...plotOps('p1', 0.75, 2023, '02-10', ['05-06', '06-02', '07-05'],
      [['05-12', BORDEAUX], ['05-30', BORDEAUX], ['06-17', BORDEAUX], ['07-08', SULFUR]], [['09-20', 4900, 'B-2023-04', 'Saperavi'], ['09-20', 1900, 'B-2023-05', 'Mtsvane Kakhuri']]),
    ...plotOps('p1', 0.75, 2024, '02-14', ['05-10', '06-05', '07-09'],
      [['05-14', BORDEAUX], ['07-02', BORDEAUX], ['07-24', SULFUR]], [['09-17', 3400, 'B-2024-03', 'Saperavi'], ['09-17', 1500, 'B-2024-04', 'Mtsvane Kakhuri']],
      { '07-02': 'Delayed — sprayer pump broken in June. Mildew spots seen in rows 14–17.' }),
    // 2025 — Dataset A2, vineyard work log plot 1
    ...plotOps('p1', 0.75, 2025, '02-12', ['05-08', '06-04', '07-08'],
      [['05-15', BORDEAUX], ['06-06', BORDEAUX], ['07-10', SULFUR]], [['09-19', 4300, 'B-2025-02', 'Saperavi'], ['09-19', 1700, 'B-2025-03', 'Mtsvane Kakhuri']],
      { '09-19': 'Picked by hand. 6,000 kg in total taken to the winery the same day. (Dataset A2)' }),
    ...plotOps('p1', 0.75, 2026, '02-11', ['05-07', '06-03', '07-06'],
      [['05-13', BORDEAUX], ['06-01', BORDEAUX], ['06-20', BORDEAUX], ['07-11', SULFUR]], [['09-18', 3950, 'B-2026-02', 'Saperavi'], ['09-18', 1500, 'B-2026-03', 'Mtsvane Kakhuri']]),

    // ── Plot 2 · Rkatsiteli ──
    ...plotOps('p2', 1.1, 2023, '02-20', ['05-09', '06-06', '07-07'],
      [['05-11', BORDEAUX], ['05-31', BORDEAUX], ['06-19', BORDEAUX], ['07-10', SULFUR]], [['09-14', 11200, 'B-2023-01', 'Rkatsiteli']]),
    ...plotOps('p2', 1.1, 2024, '02-19', ['05-08', '06-04', '07-08'],
      [['05-13', BORDEAUX], ['06-02', BORDEAUX], ['06-21', BORDEAUX], ['07-12', SULFUR]], [['09-12', 9600, 'B-2024-01', 'Rkatsiteli']]),
    ...plotOps('p2', 1.1, 2025, '02-18', ['05-07', '06-03', '07-07'],
      [['05-14', BORDEAUX], ['06-05', BORDEAUX], ['07-09', SULFUR]], [['09-15', 10900, 'B-2025-01', 'Rkatsiteli']]),
    ...plotOps('p2', 1.1, 2026, '02-17', ['05-06', '06-02', '07-07'],
      [['05-12', BORDEAUX], ['06-02', BORDEAUX], ['06-22', BORDEAUX], ['07-13', SULFUR]], [['09-13', 11400, 'B-2026-01', 'Rkatsiteli']]),

    // ── Plot 3 · Kisi (young vineyard) ──
    ...plotOps('p3', 0.4, 2023, '02-24', ['05-12', '06-08'],
      [['05-16', BORDEAUX], ['06-06', BORDEAUX], ['06-27', SULFUR]], [['09-25', 1900, 'B-2023-06', 'Kisi']]),
    ...plotOps('p3', 0.4, 2024, '02-22', ['05-11', '06-07'],
      [['05-15', BORDEAUX], ['06-04', BORDEAUX], ['06-25', SULFUR]], [['09-23', 2300, 'B-2024-05', 'Kisi']]),
    ...plotOps('p3', 0.4, 2025, '02-21', ['05-10', '06-06'],
      [['05-17', BORDEAUX], ['06-07', BORDEAUX], ['06-28', SULFUR]], [['09-24', 2900, 'B-2025-05', 'Kisi']]),
    ...plotOps('p3', 0.4, 2026, '02-20', ['05-09', '06-05'],
      [['05-14', BORDEAUX], ['06-03', BORDEAUX], ['06-24', SULFUR]], [['09-22', 3300, 'B-2026-04', 'Kisi']]),
  ];
}

// ── Vines ──

interface VineSpec {
  count: number;
  rows: [number, number];
  pos: [number, number];
  history: VineEvent[];
  status: Vine['status'];
}

function placeVines(plot: Plot, specs: VineSpec[], seed: number): Vine[] {
  const r = rng(seed);
  const taken = new Set<string>();
  const out: Vine[] = [];
  for (const s of specs) {
    let placed = 0;
    let guard = 0;
    while (placed < s.count && guard++ < 5000) {
      const row = s.rows[0] + Math.floor(r() * (s.rows[1] - s.rows[0] + 1));
      const pos = s.pos[0] + Math.floor(r() * (s.pos[1] - s.pos[0] + 1));
      const k = `${row}:${pos}`;
      if (taken.has(k)) continue;
      taken.add(k);
      out.push({ plotId: plot.id, row, pos, status: s.status, history: s.history.map((h) => ({ ...h })) });
      placed++;
    }
  }
  return out;
}

export function seedVines(): Vine[] {
  const [p1, p2, p3] = SEED_PLOTS;
  const all = (p: Plot): [number, number] => [1, p.vinesPerRow];
  return [
    ...placeVines(p1, [
      { count: 14, rows: [6, 8], pos: [40, 56], status: 'damaged',
        history: [{ date: '2026-07-18', status: 'damaged', person: 'Nino K.', note: 'Leaf striping, dry canes. Possible trunk disease (esca). Check before pruning.' }] },
      { count: 6, rows: [1, 20], pos: all(p1), status: 'damaged',
        history: [{ date: '2026-08-02', status: 'damaged', person: 'Levan M.', note: 'Broken arm, low vigour.' }] },
      { count: 15, rows: [1, 20], pos: all(p1), status: 'missing',
        history: [{ date: '2022-11-10', status: 'missing', person: 'Giorgi B.', note: 'Dead vine removed.' }] },
      { count: 9, rows: [14, 17], pos: all(p1), status: 'missing',
        history: [
          { date: '2024-06-25', status: 'damaged', person: 'Nino K.', note: 'Downy mildew on leaves and clusters.' },
          { date: '2024-11-05', status: 'missing', person: 'Giorgi B.', note: 'Died after the 2024 mildew outbreak. Removed.' },
        ] },
      { count: 7, rows: [1, 20], pos: all(p1), status: 'missing',
        history: [{ date: '2025-10-30', status: 'missing', person: 'Giorgi B.', note: 'Dead vine removed after harvest.' }] },
      { count: 6, rows: [1, 6], pos: [1, 40], status: 'missing',
        history: [
          { date: '2026-04-16', status: 'damaged', person: 'Nino K.', note: 'Young shoots burnt by the 14–15 April frost.' },
          { date: '2026-06-10', status: 'missing', person: 'Giorgi B.', note: 'Did not recover after frost. Removed.' },
        ] },
      { count: 11, rows: [1, 20], pos: all(p1), status: 'replaced',
        history: [
          { date: '2022-08-12', status: 'damaged', person: 'Nino K.', note: 'Weak vine, low vigour.' },
          { date: '2023-04-05', status: 'replaced', person: 'Giorgi B.', note: 'Removed and replanted on rootstock.' },
        ] },
      { count: 18, rows: [1, 20], pos: all(p1), status: 'replaced',
        history: [
          { date: '2025-08-20', status: 'damaged', person: 'Nino K.', note: 'Weak vine, few clusters.' },
          { date: '2026-04-08', status: 'replaced', person: 'Giorgi B.', note: 'Removed and replanted on rootstock.' },
        ] },
    ], 11),
    ...placeVines(p2, [
      { count: 6, rows: [1, 24], pos: all(p2), status: 'damaged',
        history: [{ date: '2026-07-22', status: 'damaged', person: 'Nino K.', note: 'Hail damage on canes.' }] },
      { count: 21, rows: [1, 24], pos: all(p2), status: 'missing',
        history: [{ date: '2023-11-14', status: 'missing', person: 'Giorgi B.', note: 'Dead vine removed.' }] },
      { count: 30, rows: [1, 24], pos: all(p2), status: 'replaced',
        history: [
          { date: '2024-10-02', status: 'missing', person: 'Giorgi B.', note: 'Dead vine removed.' },
          { date: '2025-04-10', status: 'replaced', person: 'Giorgi B.', note: 'Replanted (Rkatsiteli on rootstock).' },
        ] },
    ], 22),
    ...placeVines(p3, [
      { count: 2, rows: [1, 14], pos: all(p3), status: 'damaged',
        history: [{ date: '2026-06-30', status: 'damaged', person: 'Levan M.', note: 'Chlorosis on leaves.' }] },
      { count: 8, rows: [1, 14], pos: all(p3), status: 'missing',
        history: [{ date: '2020-09-20', status: 'missing', person: 'Giorgi B.', note: 'Young vine did not take root.' }] },
      { count: 12, rows: [1, 14], pos: all(p3), status: 'replaced',
        history: [
          { date: '2021-09-15', status: 'missing', person: 'Giorgi B.', note: 'Young vine did not take root.' },
          { date: '2022-04-06', status: 'replaced', person: 'Giorgi B.', note: 'Replanted.' },
        ] },
    ], 33),
  ];
}

export const OPERATION_ORDER: OperationType[] = ['pruning', 'green', 'spraying', 'harvest'];
export const KNOWN_PEOPLE = PEOPLE;
export const KNOWN_PRODUCTS = [BORDEAUX, SULFUR, 'Copper oxychloride'];

// Field reports from the tractor driver (row + bay only, no vine counting).
export function seedReports(): BayReport[] {
  return [
    { id: 'r1', plotId: 'p2', row: 9, bay: 12, issue: 'dead', count: 3, date: '2026-10-20', person: 'Davit T.' },
    { id: 'r2', plotId: 'p2', row: 20, bay: 5, issue: 'post', count: 1, date: '2026-10-21', person: 'Davit T.' },
    { id: 'r3', plotId: 'p1', row: 11, bay: 19, issue: 'damaged', count: 2, date: '2026-10-22', person: 'Davit T.' },
  ];
}
