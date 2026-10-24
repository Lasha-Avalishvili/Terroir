// ─────────────────────────────────────────────────────────────
// SHARED DATA MODEL — agree changes with the whole team.
// The vineyard module (3.4) owns Plot, Vine, VineyardOperation.
// The traceability module (3.1) owns Batch, Vessel, Transfer, LabResult.
// HarvestLink is the bridge: a harvest operation → a wine batch.
// ─────────────────────────────────────────────────────────────

export type ISODate = string; // "2026-10-24"

export type WineColor = 'red' | 'white' | 'amber' | 'rose';

/** A block of consecutive rows planted with one variety. A plot can have several. */
export interface VarietyBlock {
  variety: string; // e.g. "Saperavi"
  wineColor: WineColor;
  fromRow: number; // 1-based, inclusive
  toRow: number;
}

export interface Plot {
  id: string;
  name: string;
  village: string;
  blocks: VarietyBlock[];
  areaHa: number;
  rows: number;
  vinesPerRow: number;
  plantedYear: number;
  training: string; // e.g. "Double Guyot"
  /** Vines between two trellis posts. A bay = the space between two posts; bays are numbered from 1 in each row. */
  vinesPerBay: number;
  /** Position of the plot patch on the estate painting (viewBox 1000×600). */
  map: { x: number; y: number; w: number; h: number; tilt: number };
}

export type VineStatus = 'healthy' | 'damaged' | 'missing' | 'replaced';

export interface VineEvent {
  date: ISODate;
  status: VineStatus;
  note?: string;
  person?: string;
}

/**
 * Only vines that differ from "healthy, never changed" are stored.
 * A vine is addressed by plot + row + position (1-based).
 */
export interface Vine {
  plotId: string;
  row: number;
  pos: number;
  status: VineStatus;
  history: VineEvent[];
}

export type OperationType = 'pruning' | 'green' | 'spraying' | 'harvest';

export type OperationScope =
  | { kind: 'plot' }
  | { kind: 'row'; row: number }
  | { kind: 'bay'; row: number; bay: number }
  | { kind: 'vine'; row: number; pos: number };

/** A quick report from the field (e.g. a tractor driver): row + bay + what is wrong. */
export type ReportIssue = 'dead' | 'damaged' | 'post' | 'other';
export interface BayReport {
  id: string;
  plotId: string;
  row: number;
  bay: number;
  issue: ReportIssue;
  count: number; // vines affected (1 for posts / other)
  date: ISODate;
  person: string;
}

export interface VineyardOperation {
  id: string;
  plotId: string;
  type: OperationType;
  date: ISODate;
  person: string;
  scope: OperationScope;
  note?: string;
  // spraying
  product?: string;
  solutionL?: number; // total working solution used, litres
  areaHa?: number; // area treated, hectares
  // harvest
  variety?: string; // which variety was picked (plots can have several)
  kg?: number;
  batchId?: string; // → HarvestLink to the traceability module
}

/** Bridge record read by the traceability module (3.1). */
export interface HarvestLink {
  operationId: string;
  plotId: string;
  batchId: string;
  date: ISODate;
  kg: number;
  variety: string;
}

/** Minimal batch stub — the traceability module owns the full record. */
export interface BatchRef {
  id: string; // "B-2025-02"
  label: string; // "Saperavi 2025 · qvevri red"
}

export interface WeatherDay {
  date: ISODate;
  tMin: number;
  tMax: number;
  tMean: number;
  rainMm: number;
}

export const OPERATION_LABEL: Record<OperationType, string> = {
  pruning: 'Pruning',
  green: 'Green work',
  spraying: 'Spraying',
  harvest: 'Harvest',
};

export const STATUS_LABEL: Record<VineStatus, string> = {
  healthy: 'Healthy',
  damaged: 'Damaged',
  missing: 'Missing',
  replaced: 'Replaced',
};

export const TODAY: ISODate = '2026-10-24';

export const plotVarieties = (p: Plot) => p.blocks.map((b) => b.variety).join(' / ');
export const blockForRow = (p: Plot, row: number) => p.blocks.find((b) => row >= b.fromRow && row <= b.toRow) ?? p.blocks[0];
export const blockIndexForRow = (p: Plot, row: number) => Math.max(0, p.blocks.findIndex((b) => row >= b.fromRow && row <= b.toRow));
const pad2 = (n: number) => String(n).padStart(2, '0');
export const bayOf = (p: Plot, pos: number) => Math.ceil(pos / p.vinesPerBay);
export const posInBay = (p: Plot, pos: number) => ((pos - 1) % p.vinesPerBay) + 1;
export const baysPerRow = (p: Plot) => Math.ceil(p.vinesPerRow / p.vinesPerBay);
/** Short field address painted on posts and used in reports, e.g. "P1-R06-B04". */
export const bayAddress = (p: Plot, row: number, bay: number) => `P${p.name.match(/\d+/)?.[0] ?? ''}-R${pad2(row)}-B${pad2(bay)}`;
export const blockColor = (i: number) => `var(--var-${(i % 4) + 1})`;
export const WINE_LABEL: Record<WineColor, string> = { red: 'red', white: 'white', amber: 'amber', rose: 'rosé' };
