import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { newId, plotVineCounts, useStore } from '../../shared/store';
import type { Plot, VarietyBlock, WineColor } from '../../shared/models';
import { blockColor, blockIndexForRow } from '../../shared/models';
import { useI18n } from '../../shared/i18n';

const VARIETIES = ['Saperavi', 'Rkatsiteli', 'Kisi', 'Mtsvane Kakhuri', 'Khikhvi', 'Chinuri', 'Tsitska', 'Tsolikouri', 'Alexandrouli', 'Ojaleshi'];

interface Props {
  openPlot(id: string): void;
  toast(msg: string): void;
}

export function EstateView({ openPlot, toast }: Props) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = i18n.num;
  const vars = (p: Plot) => p.blocks.map((b) => i18n.d(b.variety)).join(' / ');
  const svgRef = useRef<SVGSVGElement>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [hintKey, setHintKey] = useState<'idle' | 'fill'>('idle');
  const hint = hintKey === 'idle'
    ? t('Click an empty spot on the plan to add a new plot.', 'ახალი ნაკვეთის დასამატებლად დააწკაპუნეთ გეგმის თავისუფალ ადგილზე.')
    : t('Fill in the plot details on the right.', 'შეავსეთ ნაკვეთის მონაცემები მარჯვნივ.');

  function onPaintingClick(e: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    setPending({ x: p.x, y: p.y });
    setHintKey('fill');
  }

  const totals = store.plots.reduce(
    (acc, p) => {
      const c = plotVineCounts(p, store.vines);
      acc.vines += c.standing;
      acc.problems += c.damaged;
      acc.missing += c.missing;
      acc.area += p.areaHa;
      return acc;
    },
    { vines: 0, problems: 0, missing: 0, area: 0 },
  );
  const harvest2026 = store.operations.filter((o) => o.type === 'harvest' && o.date.startsWith('2026')).reduce((s, o) => s + (o.kg ?? 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{t('Estate · Gurjaani, Kakheti', 'მამული · გურჯაანი, კახეთი')}</div>
          <h1>{t('Your vineyard', 'თქვენი ვენახი')}</h1>
          <p className="muted">{t('Every plot of the estate on one plan. Open a plot to see each vine, log work and follow the season.', 'მამულის ყველა ნაკვეთი ერთ გეგმაზე. გახსენით ნაკვეთი, რომ ნახოთ თითოეული ვაზი, ჩაწეროთ სამუშაოები და ადევნოთ თვალი სეზონს.')}</p>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><span className="stat-label">{t('Plots', 'ნაკვეთები')}</span><span className="num">{store.plots.length}</span></div>
        <div className="card stat"><span className="stat-label">{t('Area', 'ფართობი')}</span><span className="num">{totals.area.toFixed(2)} {t('ha', 'ჰა')}</span></div>
        <div className="card stat"><span className="stat-label">{t('Standing vines', 'მდგარი ვაზი')}</span><span className="num">{fmt(totals.vines)}</span></div>
        <div className="card stat"><span className="stat-label"><i className="dot" style={{ background: 'var(--sick)' }} />{t('Problem vines', 'პრობლემური ვაზი')}</span><span className="num">{totals.problems}</span></div>
        <div className="card stat"><span className="stat-label">{t('Harvest 2026', 'რთველი 2026')}</span><span className="num">{fmt(harvest2026)} {t('kg', 'კგ')}</span></div>
      </div>

      <div className="estate-layout">
        <div className="painting-wrap">
          <svg ref={svgRef} className="painting" viewBox="0 0 1000 600" role="img" aria-label={t('Estate plan with its vineyard plots', 'მამულის გეგმა ვენახის ნაკვეთებით')} onClick={onPaintingClick} style={{ fontFamily: 'var(--f-body)' }}>
            <rect width="1000" height="600" fill="var(--plan-bg)" />
            {Array.from({ length: 19 }, (_, i) => (i + 1) * 50).map((x) => <line key={`gx${x}`} x1={x} x2={x} y1="0" y2="600" stroke="var(--plan-grid)" strokeWidth="1" />)}
            {Array.from({ length: 11 }, (_, i) => (i + 1) * 50).map((y) => <line key={`gy${y}`} x1="0" x2="1000" y1={y} y2={y} stroke="var(--plan-grid)" strokeWidth="1" />)}
            {/* north arrow */}
            <g transform="translate(955 48)" fill="var(--muted)">
              <path d="M0 -22 L8 6 L0 0 L-8 6Z" />
              <text y="22" textAnchor="middle" fontSize="12" fontWeight="600">{t('N', 'ჩ')}</text>
            </g>
            {/* scale bar: 100 m ≈ 150 units on this plan */}
            <g transform="translate(820 572)" fontSize="11" fill="var(--muted)">
              <rect x="0" y="0" width="75" height="5" fill="var(--muted)" />
              <rect x="75" y="0" width="75" height="5" fill="none" stroke="var(--muted)" />
              <text x="0" y="-5">0</text><text x="150" y="-5" textAnchor="end">{t('100 m', '100 მ')}</text>
            </g>
            <text x="20" y="30" fontSize="12" fontWeight="600" fill="var(--muted)" letterSpacing="0.08em">{t('ESTATE PLAN · GURJAANI', 'მამულის გეგმა · გურჯაანი')}</text>

            {store.plots.map((p) => {
              const c = plotVineCounts(p, store.vines);
              const lines = Math.min(p.rows, 11);
              const step = p.map.h / (lines + 1);
              const cx = p.map.x + p.map.w / 2;
              const cy = p.map.y + p.map.h / 2;
              const label = `${i18n.plotName(p.name)} · ${vars(p)}`;
              return (
                <g
                  key={p.id}
                  className="plot-patch"
                  tabIndex={0}
                  role="button"
                  aria-label={t(`Open ${label}`, `გახსნა: ${label}`)}
                  onClick={(e) => { e.stopPropagation(); openPlot(p.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') openPlot(p.id); }}
                >
                  <g transform={`rotate(${p.map.tilt} ${cx} ${cy})`}>
                    <rect x={p.map.x} y={p.map.y} width={p.map.w} height={p.map.h} rx="2" fill="var(--plot-fill)" />
                    {Array.from({ length: lines }, (_, i) => (
                      <line key={i} x1={p.map.x + 10} x2={p.map.x + p.map.w - 10} y1={p.map.y + step * (i + 1)} y2={p.map.y + step * (i + 1)}
                        stroke={p.blocks.length > 1 ? blockColor(blockIndexForRow(p, Math.round(((i + 1) / (lines + 1)) * p.rows) || 1)) : 'var(--row)'} strokeWidth="1.4" />
                    ))}
                    <rect className="patch-edge" x={p.map.x} y={p.map.y} width={p.map.w} height={p.map.h} rx="2" fill="none" stroke="var(--plot-edge)" strokeWidth="1.5" />
                  </g>
                  <g transform={`translate(${cx} ${p.map.y - 12})`}>
                    <text textAnchor="middle" y="3" fontSize="13" fontWeight="600" fill="var(--ink)">{label}</text>
                    {c.damaged > 0 && (
                      <g transform={`translate(${label.length * 3.6 + 16} -1)`}>
                        <rect x="-11" y="-9" width="22" height="18" rx="3" fill="var(--sick)" />
                        <text textAnchor="middle" y="4" fontSize="11" fontWeight="600" fill="#fff">{c.damaged}</text>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}

            {pending && (
              <g transform={`translate(${pending.x} ${pending.y})`} pointerEvents="none">
                <circle r="14" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" />
                <circle r="3.5" fill="var(--accent)" />
              </g>
            )}
          </svg>
          <div className="painting-hint" role="status">{hint}</div>
        </div>

        <div className="card card-pad">
          {pending ? (
            <AddPlotForm
              at={pending}
              nextNumber={store.plots.length + 1}
              onCancel={() => { setPending(null); setHintKey('idle'); }}
              onSave={(plot) => {
                store.addPlot(plot);
                setPending(null);
                toast(t(`${plot.name} added with ${fmt(plot.rows * plot.vinesPerRow)} vines`, `${i18n.plotName(plot.name)} დაემატა, ${fmt(plot.rows * plot.vinesPerRow)} ვაზი`));
                openPlot(plot.id);
              }}
            />
          ) : (
            <div className="form">
              <h2>{t('Add a plot', 'ნაკვეთის დამატება')}</h2>
              <p className="muted" style={{ margin: 0 }}>{t('Click a free spot on the plan. Then enter the plot size and number of vines, and the app draws every vine so you can track it.', 'დააწკაპუნეთ გეგმის თავისუფალ ადგილზე. შემდეგ შეიყვანეთ ნაკვეთის ზომა და ვაზების რაოდენობა — აპლიკაცია დახატავს თითოეულ ვაზს, რომ თვალი ადევნოთ.')}</p>
              <div className="calc">{t('The vine register replaces walking the rows to find a damaged or replaced vine again (Challenge 3.4, W03).', 'ვაზების რეესტრი გათავისუფლებთ რიგებში სიარულისგან, როცა დაზიანებული ან შეცვლილი ვაზის პოვნა გჭირდებათ (გამოწვევა 3.4, W03).')}</div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="section-title"><h2>{t('Plots', 'ნაკვეთები')}</h2></div>
        <div className="plot-cards">
          {store.plots.map((p) => {
            const c = plotVineCounts(p, store.vines);
            const hs = store.operations.filter((o) => o.plotId === p.id && o.type === 'harvest').sort((a, b) => b.date.localeCompare(a.date));
            const last = hs.filter((o) => hs[0] && o.date.slice(0, 4) === hs[0].date.slice(0, 4));
            const lastKg = last.reduce((sum, o) => sum + (o.kg ?? 0), 0);
            return (
              <button key={p.id} className="card plot-card" onClick={() => openPlot(p.id)}>
                <div className="vine-head">
                  <h3>{i18n.plotName(p.name)} · {vars(p)}</h3>
                  {c.damaged > 0 && <span className="pill pill-damaged">{c.damaged} {t('problems', 'პრობლემა')}</span>}
                </div>
                <div className="kv"><span>{t('Area', 'ფართობი')}</span><span className="num">{p.areaHa} {t('ha', 'ჰა')}</span></div>
                <div className="kv"><span>{t('Vines', 'ვაზი')}</span><span className="num">{fmt(c.standing)} / {fmt(c.total)}</span></div>
                <div className="kv"><span>{t('Missing', 'აკლია')}</span><span className="num">{c.missing}</span></div>
                <div className="kv">
                  <span>{t('Last harvest', 'ბოლო რთველი')}</span>
                  {last.length ? <span style={{ textAlign: 'right' }}><span className="num">{fmt(lastKg)} {t('kg', 'კგ')}</span> {last.map((o) => <span key={o.id} className="batch-chip" title={i18n.d(o.variety)} style={{ marginLeft: 4 }}>{o.batchId}</span>)}</span> : <span className="muted">{t('none yet', 'ჯერ არ არის')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface BlockDraft { variety: string; color: WineColor; rows: string }

function AddPlotForm({ at, nextNumber, onCancel, onSave }: { at: { x: number; y: number }; nextNumber: number; onCancel(): void; onSave(p: Plot): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = i18n.num;
  const [name, setName] = useState(`Plot ${nextNumber}`);
  const [blocks, setBlocks] = useState<BlockDraft[]>([{ variety: 'Saperavi', color: 'red', rows: '16' }]);
  const [area, setArea] = useState('0.5');
  const [vines, setVines] = useState('1600');
  const [year, setYear] = useState('2026');
  const [perBay, setPerBay] = useState('5');
  const [training, setTraining] = useState('Double Guyot');
  const [error, setError] = useState('');

  const nVines = Number(vines);
  const nArea = Number(area);
  const nRows = blocks.reduce((s, b) => s + (Number(b.rows) || 0), 0);
  const perRow = nRows > 0 ? Math.ceil(nVines / nRows) : 0;

  const setBlock = (i: number, patch: Partial<BlockDraft>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!(nArea > 0 && nArea <= 50)) return setError(t('Enter the area in hectares, for example 0.75.', 'შეიყვანეთ ფართობი ჰექტრებში, მაგალითად 0.75.'));
    if (!(nVines >= 10 && nVines <= 20000)) return setError(t('Enter between 10 and 20,000 vines.', 'შეიყვანეთ 10-დან 20 000-მდე ვაზი.'));
    if (blocks.some((b) => !b.variety.trim() || !(Number(b.rows) >= 1))) return setError(t('Each variety needs a name and at least 1 row.', 'თითოეულ ჯიშს სჭირდება სახელი და მინიმუმ 1 რიგი.'));
    if (!(nRows >= 1 && nRows <= 80)) return setError(t('Enter between 1 and 80 rows in total.', 'სულ შეიყვანეთ 1-დან 80-მდე რიგი.'));
    if (perRow > 300) return setError(t('That is more than 300 vines per row. Add more rows.', 'ეს 300-ზე მეტი ვაზია ერთ რიგში. დაამატეთ რიგები.'));
    if (!(Number(perBay) >= 1 && Number(perBay) <= 20)) return setError(t('Enter 1 to 20 vines between two posts.', 'შეიყვანეთ 1-დან 20-მდე ვაზი ორ ბოძს შორის.'));
    let from = 1;
    const vb: VarietyBlock[] = blocks.map((b) => {
      const n = Number(b.rows);
      const block = { variety: b.variety.trim(), wineColor: b.color, fromRow: from, toRow: from + n - 1 };
      from += n;
      return block;
    });
    const w = Math.max(150, Math.min(340, 150 + nArea * 110));
    const h = w * 0.5;
    onSave({
      id: newId('p'),
      name: name.trim() || `Plot ${nextNumber}`,
      village: 'Gurjaani',
      blocks: vb,
      areaHa: nArea,
      rows: nRows,
      vinesPerRow: perRow,
      plantedYear: Number(year) || 2026,
      training,
      vinesPerBay: Number(perBay),
      map: {
        x: Math.max(10, Math.min(990 - w, at.x - w / 2)),
        y: Math.max(50, Math.min(585 - h, at.y - h / 2)),
        w, h, tilt: 0,
      },
    });
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>{t('New plot', 'ახალი ნაკვეთი')}</h2>
      <div className="field"><label htmlFor="np-name">{t('Name', 'სახელი')}</label><input id="np-name" value={name} onChange={(e) => setName(e.target.value)} /></div>

      <div className="blocks-editor">
        <div className="eyebrow">{t('Varieties, from row 1 onward', 'ჯიშები, პირველი რიგიდან')}</div>
        {blocks.map((b, i) => (
          <div className="block-row" key={i}>
            <div className="field">
              <label htmlFor={`np-v${i}`}><i className="swatch" style={{ background: blockColor(i), marginRight: 4 }} />{t('Variety', 'ჯიში')}</label>
              <input id={`np-v${i}`} list="varieties" value={b.variety} onChange={(e) => setBlock(i, { variety: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor={`np-c${i}`}>{t('Wine', 'ღვინო')}</label>
              <select id={`np-c${i}`} value={b.color} onChange={(e) => setBlock(i, { color: e.target.value as WineColor })}>
                {(['red', 'white', 'amber', 'rose'] as WineColor[]).map((c) => <option key={c} value={c}>{i18n.wine(c)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`np-r${i}`}>{t('Rows', 'რიგები')}</label>
              <input id={`np-r${i}`} inputMode="numeric" value={b.rows} onChange={(e) => setBlock(i, { rows: e.target.value })} />
            </div>
            <button type="button" className="icon-btn" aria-label={t(`Remove ${b.variety || 'variety'}`, `წაშლა: ${i18n.d(b.variety) || 'ჯიში'}`)} disabled={blocks.length === 1}
              onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <datalist id="varieties">{VARIETIES.map((v) => <option key={v} value={v}>{i18n.lang === 'ka' ? i18n.d(v) : undefined}</option>)}</datalist>
        <button type="button" className="btn btn-small" style={{ justifySelf: 'start' }}
          onClick={() => setBlocks([...blocks, { variety: '', color: 'white', rows: '4' }])}>{t('+ Add variety', '+ ჯიშის დამატება')}</button>
      </div>

      <div className="row-2">
        <div className="field"><label htmlFor="np-area">{t('Area (ha)', 'ფართობი (ჰა)')}</label><input id="np-area" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} /></div>
        <div className="field"><label htmlFor="np-vines">{t('Number of vines', 'ვაზების რაოდენობა')}</label><input id="np-vines" inputMode="numeric" value={vines} onChange={(e) => setVines(e.target.value)} /></div>
      </div>
      <div className="row-2">
        <div className="field"><label htmlFor="np-year">{t('Planted', 'დარგვის წელი')}</label><input id="np-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} /></div>
        <div className="field"><label htmlFor="np-bay">{t('Vines between posts', 'ვაზი ორ ბოძს შორის')}</label><input id="np-bay" inputMode="numeric" value={perBay} onChange={(e) => setPerBay(e.target.value)} /></div>
      </div>
      <div className="row-2">
        <div className="field">
          <label htmlFor="np-training">{t('Training', 'ფორმირება')}</label>
          <select id="np-training" value={training} onChange={(e) => setTraining(e.target.value)}>
            {['Double Guyot', 'Single Guyot', 'Cordon', 'Pergola (Kakhuri)'].map((o) => <option key={o} value={o}>{i18n.d(o)}</option>)}
          </select>
        </div>
      </div>
      {perRow > 0 && nVines > 0 && (
        <div className="calc">
          <span className="num">{nRows}</span> {t('rows', 'რიგი')} × <span className="num">{perRow}</span> {t('vines', 'ვაზი')}
          {nArea > 0 && <> · <span className="num">{fmt(Math.round(nVines / nArea))}</span> {t('vines/ha', 'ვაზი/ჰა')}</>}
        </div>
      )}
      {error && <div className="pill pill-damaged" role="alert" style={{ whiteSpace: 'normal', padding: '6px 10px' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary">{t('Create plot', 'ნაკვეთის შექმნა')}</button>
        <button type="button" className="btn" onClick={onCancel}>{t('Cancel', 'გაუქმება')}</button>
      </div>
    </form>
  );
}
