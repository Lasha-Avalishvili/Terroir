import type { BayReport, Plot, Vine, VineyardOperation, WeatherDay } from '../../shared/models';
import { bayAddress } from '../../shared/models';
import { reportSummary } from './FieldReport';
import { weatherForYear, weatherStats } from '../../shared/weather';
import { useI18n } from '../../shared/i18n';

const OP_COLOR = { pruning: 'var(--muted)', green: 'var(--ok)', spraying: 'var(--teal)', harvest: 'var(--wine)' } as const;

export function WeatherChart({ year, ops }: { year: number; ops: VineyardOperation[] }) {
  const i18n = useI18n();
  const { t } = i18n;
  const days: WeatherDay[] = weatherForYear(year);
  const st = weatherStats(days);
  const W = 760, L = 34, R = 10, T = 26, TH = 150, GAP = 12, RAINH = 40, B = 20;
  const H = T + TH + GAP + RAINH + B;
  const PW = W - L - R;
  const x = (i: number) => L + (i / 365) * PW;
  const yT = (t: number) => T + TH - ((t + 10) / 52) * TH;
  const doy = (iso: string) => Math.round((Date.parse(iso) - Date.parse(`${year}-01-01`)) / 86400000);

  const band =
    days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yT(d.tMax).toFixed(1)}`).join(' ') +
    ' ' +
    [...days].map((d, i) => [d, i] as const).reverse().map(([d, i]) => `L${x(i).toFixed(1)} ${yT(d.tMin).toFixed(1)}`).join(' ') + ' Z';
  const mean = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yT(d.tMean).toFixed(1)}`).join(' ');
  const rainTop = T + TH + GAP;

  return (
    <div>
      <div className="wstats">
        <span className={`wstat${st.hotDays >= 5 ? ' wstat-bad' : ''}`}>{t('Days ≥ 35 °C', 'დღეები ≥ 35 °C')} <b>{st.hotDays}</b></span>
        <span className="wstat">{t('Peak', 'მაქსიმუმი')} <b>{st.peakMax.toFixed(1)} °C</b></span>
        <span className={`wstat${st.frostAfterBudbreak ? ' wstat-bad' : ''}`}>{t('Frost after bud break', 'ყინვა კვირტის გაშლის შემდეგ')} <b>{st.frostAfterBudbreak}</b></span>
        <span className="wstat">{t('Rain Jun–Aug', 'ნალექი ივნ–აგვ')} <b>{st.summerRain} {t('mm', 'მმ')}</b></span>
      </div>
      <div className="chart-wrap">
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 560 }} role="img" aria-label={t(`Temperature and rain in ${year}, with work done on the plot`, `ტემპერატურა და ნალექი ${year} წელს, ნაკვეთზე შესრულებული სამუშაოებით`)}>
          {[-10, 0, 10, 20, 30, 40].map((deg) => (
            <g key={deg}>
              <line x1={L} x2={W - R} y1={yT(deg)} y2={yT(deg)} stroke="var(--line)" strokeWidth={deg === 0 ? 1.2 : 0.7} />
              <text x={L - 6} y={yT(deg) + 3} textAnchor="end">{deg}°</text>
            </g>
          ))}
          <line x1={L} x2={W - R} y1={yT(35)} y2={yT(35)} stroke="var(--danger)" strokeDasharray="4 3" strokeWidth="1" />
          <text x={W - R} y={yT(35) - 4} textAnchor="end" style={{ fill: 'var(--danger)' }}>{t('35 °C heat', '35 °C სიცხე')}</text>
          <path d={band} fill="var(--select)" opacity="0.3" />
          <path d={mean} fill="none" stroke="var(--warn)" strokeWidth="1.4" />

          {/* rain */}
          <line x1={L} x2={W - R} y1={rainTop + RAINH} y2={rainTop + RAINH} stroke="var(--line)" />
          <text x={L - 6} y={rainTop + 10} textAnchor="end">{t('mm', 'მმ')}</text>
          {days.map((d, i) => d.rainMm > 0 && (
            <rect key={i} x={x(i) - 0.8} width="1.6" y={rainTop + RAINH - Math.min(RAINH, (d.rainMm / 30) * RAINH)} height={Math.min(RAINH, (d.rainMm / 30) * RAINH)} fill="var(--rain)" />
          ))}

          {/* months */}
          {Array.from({ length: 12 }, (_, i) => i18n.month(i)).map((m, i) => {
            const xi = x(doy(`${year}-${String(i + 1).padStart(2, '0')}-01`));
            return (
              <g key={i}>
                <line x1={xi} x2={xi} y1={T} y2={rainTop + RAINH} stroke="var(--line)" strokeWidth="0.5" />
                <text x={xi + 3} y={H - 6}>{m}</text>
              </g>
            );
          })}

          {/* work done */}
          {ops.map((o) => {
            const xi = x(doy(o.date));
            return (
              <g key={o.id}>
                <line x1={xi} x2={xi} y1={14} y2={T + TH} stroke={OP_COLOR[o.type]} strokeWidth="1" opacity="0.55" />
                <circle cx={xi} cy={11} r="5" fill={OP_COLOR[o.type]}>
                  <title>{`${i18n.op(o.type)} · ${i18n.date(o.date)}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend" style={{ marginTop: 6 }}>
        {(['pruning', 'green', 'spraying', 'harvest'] as const).map((o) => (
          <span key={o}><i className="dot" style={{ background: OP_COLOR[o] }} />{i18n.op(o)}</span>
        ))}
        <span><i className="dot" style={{ background: 'var(--select)', opacity: 0.6 }} />{t('Daily min–max', 'დღის მინ–მაქს')}</span>
      </div>
      <p className="note">{t('Demo weather for Gurjaani, built from the Kakheti seasonal averages in Dataset A1. 1–10 Sep 2025 use the real NASA POWER values from Dataset B1. A field sensor or weather service can replace it later.', 'გურჯაანის სადემონსტრაციო ამინდი, აგებული კახეთის სეზონური საშუალოებით (მონაცემები A1). 2025 წლის 1–10 სექტემბერი — NASA POWER-ის რეალური მნიშვნელობები (მონაცემები B1). მოგვიანებით შეიძლება ჩანაცვლდეს საველე სენსორით ან ამინდის სერვისით.')}</p>
    </div>
  );
}

type LogItem =
  | { kind: 'op'; date: string; op: VineyardOperation }
  | { kind: 'vine'; date: string; vine: Vine; status: Vine['status']; note?: string; person?: string }
  | { kind: 'report'; date: string; report: BayReport };

export function WorkLog({ plot, year, ops, vines, reports }: { plot: Plot; year: number; ops: VineyardOperation[]; vines: Vine[]; reports: BayReport[] }) {
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = i18n.num;
  const items: LogItem[] = [
    ...ops.map((op) => ({ kind: 'op' as const, date: op.date, op })),
    ...reports.filter((r) => r.date.startsWith(String(year))).map((r) => ({ kind: 'report' as const, date: r.date, report: r })),
    ...vines.flatMap((v) =>
      v.history.filter((h) => h.date.startsWith(String(year))).map((h) => ({ kind: 'vine' as const, date: h.date, vine: v, status: h.status, note: h.note, person: h.person })),
    ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // group vine events of the same day + status + note into one line
  const grouped: (LogItem & { count?: number })[] = [];
  for (const it of items) {
    const prev = grouped[grouped.length - 1];
    if (it.kind === 'vine' && prev?.kind === 'vine' && prev.date === it.date && prev.status === it.status && prev.note === it.note) {
      prev.count = (prev.count ?? 1) + 1;
    } else grouped.push({ ...it });
  }

  if (!grouped.length) return <p className="muted">{t(`Nothing recorded for ${plot.name} in ${year} yet.`, `${i18n.plotName(plot.name)}: ${year} წელს ჯერ არაფერია ჩაწერილი.`)}</p>;

  return (
    <ul className="log">
      {grouped.map((it, i) => (
        <li key={i}>
          <span className="date">{i18n.dayMonth(it.date)}</span>
          {it.kind === 'report' ? (
            <div>
              <div className="line1">
                <span className="pill pill-damaged">{t('Field report', 'შეტყობინება')}</span>
                <span className="addr" style={{ fontSize: '0.8rem' }}>{bayAddress(plot, it.report.row, it.report.bay)}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{reportSummary(i18n, it.report)}</span>
              </div>
              <div className="line2">{i18n.d(it.report.person)}</div>
            </div>
          ) : it.kind === 'op' ? (
            <div>
              <div className="line1">
                <span className={`pill op-${it.op.type}`}>{i18n.op(it.op.type)}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                  {it.op.type === 'harvest' && it.op.variety ? (() => { const bl = plot.blocks.find((x) => x.variety === it.op.variety); return bl ? `${i18n.d(bl.variety)} · ${t('rows', 'რიგები')} ${bl.fromRow}–${bl.toRow}` : i18n.d(it.op.variety); })() : it.op.scope.kind === 'plot' ? t('Whole plot', 'მთელი ნაკვეთი') : it.op.scope.kind === 'row' ? t(`Row ${it.op.scope.row}`, `რიგი ${it.op.scope.row}`) : it.op.scope.kind === 'bay' ? bayAddress(plot, it.op.scope.row, it.op.scope.bay) : t(`Row ${it.op.scope.row}, vine ${it.op.scope.pos}`, `რიგი ${it.op.scope.row}, ვაზი ${it.op.scope.pos}`)}
                </span>
                {it.op.type === 'harvest' && it.op.kg && <span className="num" style={{ fontSize: '0.86rem' }}>{fmt(it.op.kg)} {t('kg', 'კგ')}</span>}
                {it.op.batchId && <span className="batch-chip" title={t('Sent to the traceability module', 'გადაეცა მიკვლევადობის მოდულს')}>→ {it.op.batchId}</span>}
              </div>
              <div className="line2">
                {it.op.type === 'spraying' && it.op.solutionL && it.op.areaHa
                  ? <>{i18n.d(it.op.product)} · {fmt(it.op.solutionL)} {t('L on', 'ლ,')} {it.op.areaHa} {t('ha', 'ჰა')} = <span className="num">{fmt(Math.round(it.op.solutionL / it.op.areaHa))} {t('L/ha', 'ლ/ჰა')}</span>. </>
                  : null}
                {i18n.d(it.op.note)} <span>· {i18n.d(it.op.person)}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="line1">
                <span className="pill op-vine">{t('Vine', 'ვაზი')}</span>
                <span className={`pill pill-${it.status}`}>{i18n.status(it.status)}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                  {it.count && it.count > 1 ? t(`${it.count} vines`, `${it.count} ვაზი`) : t(`Row ${it.vine.row}, vine ${it.vine.pos}`, `რიგი ${it.vine.row}, ვაზი ${it.vine.pos}`)}
                </span>
              </div>
              <div className="line2">{i18n.d(it.note)}{it.person && <> · {i18n.d(it.person)}</>}</div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
