import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BatchRef, BayReport, HarvestLink, Plot, Vine, VineStatus, VineyardOperation } from './models';
import { SEED_BATCHES, SEED_PLOTS, seedOperations, seedReports, seedVines } from './seed';

// MVP storage: one JSON blob in localStorage (works offline).
// Later: swap for IndexedDB (Dexie) or a sync backend without changing the components.

export interface AppState {
  plots: Plot[];
  vines: Vine[];
  operations: VineyardOperation[];
  batches: BatchRef[];
  reports: BayReport[];
}

const KEY = 'terroir-demo-v3';

function seedState(): AppState {
  return { plots: SEED_PLOTS, vines: seedVines(), operations: seedOperations(), batches: SEED_BATCHES, reports: seedReports() };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* storage blocked — fall back to demo data */
  }
  return seedState();
}

interface Store extends AppState {
  addPlot(p: Plot): void;
  setVineStatus(plotId: string, row: number, pos: number, status: VineStatus, note: string, person: string, date: string): void;
  addOperation(o: VineyardOperation, newBatch?: BatchRef): void;
  addReport(r: BayReport): void;
  resetDemo(): void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const store = useMemo<Store>(
    () => ({
      ...state,
      addPlot: (p) => setState((s) => ({ ...s, plots: [...s.plots, p] })),
      setVineStatus: (plotId, row, pos, status, note, person, date) =>
        setState((s) => {
          const idx = s.vines.findIndex((v) => v.plotId === plotId && v.row === row && v.pos === pos);
          const ev = { date, status, note: note || undefined, person };
          const vines = [...s.vines];
          if (idx >= 0) {
            vines[idx] = { ...vines[idx], status, history: [...vines[idx].history, ev] };
          } else {
            vines.push({ plotId, row, pos, status, history: [ev] });
          }
          return { ...s, vines };
        }),
      addOperation: (o, newBatch) =>
        setState((s) => ({
          ...s,
          operations: [...s.operations, o],
          batches: newBatch ? [...s.batches, newBatch] : s.batches,
        })),
      addReport: (r) => setState((s) => ({ ...s, reports: [...s.reports, r] })),
      resetDemo: () => setState(seedState()),
    }),
    [state],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/** What the traceability module reads: every harvest that feeds a wine batch. */
export function harvestLinks(state: AppState): HarvestLink[] {
  return state.operations
    .filter((o) => o.type === 'harvest' && o.batchId && o.kg)
    .map((o) => ({
      operationId: o.id,
      plotId: o.plotId,
      batchId: o.batchId!,
      date: o.date,
      kg: o.kg!,
      variety: o.variety ?? state.plots.find((p) => p.id === o.plotId)?.blocks[0]?.variety ?? '',
    }));
}

export function plotVineCounts(plot: Plot, vines: Vine[]) {
  const mine = vines.filter((v) => v.plotId === plot.id);
  const total = plot.rows * plot.vinesPerRow;
  const damaged = mine.filter((v) => v.status === 'damaged').length;
  const missing = mine.filter((v) => v.status === 'missing').length;
  const replaced = mine.filter((v) => v.status === 'replaced').length;
  return { total, damaged, missing, replaced, standing: total - missing };
}

let idSeq = Date.now();
export const newId = (prefix: string) => `${prefix}${(idSeq++).toString(36)}`;
