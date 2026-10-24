import { memo, useMemo, type MouseEvent } from 'react';
import type { BayReport, Plot, Vine } from '../../shared/models';
import { baysPerRow, blockColor, blockIndexForRow } from '../../shared/models';
import { useI18n } from '../../shared/i18n';

// Plan view of one plot: every vine is drawn, problem vines are red.
// Vines are <use> clones of a few shapes, so even 5,000+ vines stay fast.
// Animation: the canopy shapes sway (3 phases → a wave across the field).

export const CW = 16; // width of one vine cell
export const RH = 34; // row spacing
const LEFT = 40;
const TOP = 30;
const BOTTOM = 18;

export const vineKey = (row: number, pos: number) => `${row}:${pos}`;

interface Props {
  plot: Plot;
  vineMap: Map<string, Vine>;
  selected: { row: number; pos: number } | null;
  selectedRow: number | null;
  selectedBay: { row: number; bay: number } | null;
  reports: BayReport[];
  zoom: number;
  dimHealthy: boolean;
  onVine(row: number, pos: number): void;
  onRow(row: number): void;
  onReport(id: string): void;
}

export function VineField({ plot, vineMap, selected, selectedRow, selectedBay, reports, zoom, dimHealthy, onVine, onRow, onReport }: Props) {
  const { t } = useI18n();
  const W = LEFT + plot.vinesPerRow * CW + 20;
  const H = TOP + plot.rows * RH + BOTTOM;
  const baseY = (r: number) => TOP + r * RH - 6;
  const xOf = (p: number) => LEFT + (p - 0.5) * CW;

  function onClick(e: MouseEvent<SVGSVGElement>) {
    const t = e.target as Element;
    const v = t.getAttribute('data-v');
    if (v) {
      const [r, p] = v.split(':').map(Number);
      onVine(r, p);
      return;
    }
    const rep = t.getAttribute('data-report');
    if (rep) {
      onReport(rep);
      return;
    }
    const row = t.getAttribute('data-row');
    if (row) onRow(Number(row));
  }

  return (
    <svg
      className={`vinefield${dimHealthy ? ' dim-healthy' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${Math.round(W * 0.42 * zoom)}px` : undefined }}
      onClick={onClick}
      role="img"
      aria-label={t(`${plot.name}: ${plot.rows} rows of ${plot.vinesPerRow} vines. Red vines need attention.`, `${plot.rows} რიგი, თითოეულში ${plot.vinesPerRow} ვაზი. წითელ ვაზებს ყურადღება სჭირდება.`)}
    >
      <defs>
        {[0, 1, 2].map((i) => (
          <g id={`vh${i}`} key={`h${i}`}>
            <rect x="-8" y="-27" width="16" height="29" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="-10" stroke="var(--stem)" strokeWidth="1.4" />
            <g className={`sway${i}`}>
              <circle cx="0" cy="-15.5" r="5.6" fill="var(--vine)" />
              <circle cx="1.6" cy="-17" r="2.2" fill="var(--vine-2)" />
            </g>
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g id={`vr${i}`} key={`r${i}`}>
            <rect x="-8" y="-27" width="16" height="29" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="-7" stroke="var(--stem)" strokeWidth="1" />
            <g className={`sway${i}`}>
              <circle cx="0" cy="-11" r="3.8" fill="var(--young)" />
            </g>
          </g>
        ))}
        <g id="vd">
          <rect x="-8" y="-27" width="16" height="29" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="-10" stroke="var(--stem)" strokeWidth="1.4" />
          <circle cx="0" cy="-15.5" r="5.8" fill="var(--sick)" stroke="var(--sick-2)" strokeWidth="1" />
        </g>
        <g id="vm">
          <rect x="-8" y="-27" width="16" height="29" fill="transparent" />
          <circle cx="0" cy="-12" r="4.6" fill="none" stroke="var(--gone)" strokeWidth="1.2" strokeDasharray="2 2" />
        </g>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="var(--field)" />

      <Rows plot={plot} baseY={baseY} W={W} selectedRow={selectedRow} />

      {/* bay numbers — the same numbers are painted on the posts in the vineyard */}
      <g className="baylabels" aria-hidden="true">
        <text x="6" y="19">{t('Bay', 'მონ.')}</text>
        {Array.from({ length: baysPerRow(plot) }, (_, i) => (
          <text key={i} x={LEFT + (i * plot.vinesPerBay + Math.min(plot.vinesPerBay, plot.vinesPerRow - i * plot.vinesPerBay) / 2) * CW} y="19" textAnchor="middle">{i + 1}</text>
        ))}
      </g>

      <VineLayer plot={plot} vineMap={vineMap} xOf={xOf} baseY={baseY} />

      {reports.map((r) => {
        const x = LEFT + (r.bay - 1) * plot.vinesPerBay * CW;
        const y = baseY(r.row) - 30;
        const w = Math.min(plot.vinesPerBay, plot.vinesPerRow - (r.bay - 1) * plot.vinesPerBay) * CW;
        return (
          <g key={r.id} className="report-mark">
            <rect x={x + 1} y={y + 1} width={w - 2} height={RH - 2} rx="3" fill="var(--sick)" fillOpacity="0.08" stroke="var(--sick)" strokeWidth="1.6" strokeDasharray="4 3" data-report={r.id} />
            <circle cx={x + w - 3} cy={y + 3} r="6.5" fill="var(--sick)" data-report={r.id} />
            <text x={x + w - 3} y={y + 6.2} textAnchor="middle" className="report-bang" data-report={r.id}>!</text>
          </g>
        );
      })}

      {selectedBay && (
        <rect
          key={`bay-${selectedBay.row}-${selectedBay.bay}`}
          x={LEFT + (selectedBay.bay - 1) * plot.vinesPerBay * CW}
          y={baseY(selectedBay.row) - 30}
          width={Math.min(plot.vinesPerBay, plot.vinesPerRow - (selectedBay.bay - 1) * plot.vinesPerBay) * CW}
          height={RH}
          rx="3"
          fill="var(--select)"
          fillOpacity="0.14"
          stroke="var(--select)"
          strokeWidth="2"
          pointerEvents="none"
        />
      )}

      {selected && (
        <circle
          key={vineKey(selected.row, selected.pos)}
          className="sel-ring"
          cx={xOf(selected.pos)}
          cy={baseY(selected.row) - 12}
          r="11"
          fill="none"
          stroke="var(--select)"
          strokeWidth="2.5"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}

const Rows = memo(function Rows({ plot, baseY, W, selectedRow }: { plot: Plot; baseY: (r: number) => number; W: number; selectedRow: number | null }) {
  const rows = [];
  for (let r = 1; r <= plot.rows; r++) {
    const y = baseY(r);
    const posts = [];
    for (let k = 0; k <= plot.vinesPerRow; k += plot.vinesPerBay) {
      posts.push(<rect key={k} x={LEFT + k * CW - 0.8} y={y - 22} width="1.6" height="22" fill="var(--post)" />);
    }
    if (plot.vinesPerRow % plot.vinesPerBay) posts.push(<rect key="end" x={LEFT + plot.vinesPerRow * CW - 0.8} y={y - 22} width="1.6" height="22" fill="var(--post)" />);
    rows.push(
      <g key={r}>
        <rect x="0" y={y - 30} width={W} height={RH} fill={blockColor(blockIndexForRow(plot, r))} opacity={plot.blocks.length > 1 ? 0.07 : 0} />
        <rect x="0" y={y - 30} width="4" height={RH} fill={blockColor(blockIndexForRow(plot, r))} />
        {selectedRow === r && <rect x="0" y={y - 30} width={W} height={RH} fill="var(--select)" opacity="0.16" />}
        <line x1="0" x2={W} y1={y + 5} y2={y + 5} stroke="var(--furrow)" strokeWidth="4" />
        <line x1={LEFT} x2={LEFT + plot.vinesPerRow * CW} y1={y - 15} y2={y - 15} stroke="var(--wire)" strokeWidth="0.8" />
        {posts}
        <text className="rowlabel" data-row={r} x="6" y={y - 8}>R{r}</text>
      </g>,
    );
  }
  return <g>{rows}</g>;
});

const VineLayer = memo(function VineLayer({ plot, vineMap, xOf, baseY }: { plot: Plot; vineMap: Map<string, Vine>; xOf: (p: number) => number; baseY: (r: number) => number }) {
  return useMemo(() => {
    const out = [];
    for (let r = 1; r <= plot.rows; r++) {
      for (let p = 1; p <= plot.vinesPerRow; p++) {
        const v = vineMap.get(vineKey(r, p));
        const phase = (r + Math.floor(p / 6)) % 3;
        let href = `#vh${phase}`;
        let cls = 'v vh';
        if (v?.status === 'damaged') { href = '#vd'; cls = 'v'; }
        else if (v?.status === 'missing') { href = '#vm'; cls = 'v'; }
        else if (v?.status === 'replaced') { href = `#vr${phase}`; cls = 'v'; }
        out.push(<use key={`${r}:${p}`} href={href} x={xOf(p)} y={baseY(r)} className={cls} data-v={`${r}:${p}`} />);
      }
    }
    return <g>{out}</g>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot.id, plot.rows, plot.vinesPerRow, vineMap]);
});
