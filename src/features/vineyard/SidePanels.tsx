import { useState, type FormEvent } from 'react';
import type { BayReport, OperationScope, OperationType, Plot, Vine, VineStatus } from '../../shared/models';
import { bayAddress, bayOf, blockForRow, posInBay, TODAY, WINE_LABEL } from '../../shared/models';
import { reportSummary } from './FieldReport';
import { newId, useStore } from '../../shared/store';
import { KNOWN_PEOPLE, KNOWN_PRODUCTS, OPERATION_ORDER } from '../../shared/seed';
import { OpIcon } from '../../shared/icons';
import { useI18n } from '../../shared/i18n';

const STATUS_DOT: Record<VineStatus, string> = {
  healthy: 'var(--vine)',
  damaged: 'var(--sick)',
  missing: 'var(--gone)',
  replaced: 'var(--young)',
};

export function StatusDot({ status }: { status: VineStatus }) {
  return <i className="dot" style={{ background: STATUS_DOT[status], outline: status === 'missing' ? '1px dashed var(--gone)' : undefined }} />;
}

// ── Selected vine ──

interface VinePanelProps {
  plot: Plot;
  sel: { row: number; pos: number };
  vine: Vine | undefined;
  person: string;
  onClose(): void;
  onLogHere(): void;
  toast(msg: string): void;
}

export function VinePanel({ plot, sel, vine, person, onClose, onLogHere, toast }: VinePanelProps) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [note, setNote] = useState('');
  const status: VineStatus = vine?.status ?? 'healthy';
  const history = [...(vine?.history ?? [])].reverse();

  function mark(s: VineStatus) {
    if (s === status && !note) return;
    store.setVineStatus(plot.id, sel.row, sel.pos, s, note, person, TODAY);
    setNote('');
    toast(t(
      `Row ${sel.row}, vine ${sel.pos} marked ${i18n.status(s).toLowerCase()}`,
      `რიგი ${sel.row}, ვაზი ${sel.pos}: ${i18n.status(s)}`,
    ));
  }

  return (
    <div className="card card-pad form" aria-live="polite">
      <div className="vine-head">
        <div>
          <div className="eyebrow">{i18n.plotName(plot.name)} · {i18n.d(blockForRow(plot, sel.row).variety)}</div>
          <h2>{t(`Row ${sel.row} · Bay ${bayOf(plot, sel.pos)}`, `რიგი ${sel.row} · მონაკვეთი ${bayOf(plot, sel.pos)}`)}</h2>
          <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
            <span className="addr">{bayAddress(plot, sel.row, bayOf(plot, sel.pos))}</span>{' '}
            {t(`vine ${posInBay(plot, sel.pos)} of ${plot.vinesPerBay} in this bay`, `ვაზი ${posInBay(plot, sel.pos)} / ${plot.vinesPerBay} ამ მონაკვეთში`)}
          </div>
        </div>
        <button className="btn btn-small" onClick={onClose} aria-label={t('Close vine details', 'ვაზის დეტალების დახურვა')}>{t('Close', 'დახურვა')}</button>
      </div>
      <div><span className={`pill pill-${status}`}><StatusDot status={status} />{i18n.status(status)}</span></div>

      <div className="field">
        <label htmlFor="vine-note">{t('Note (optional)', 'შენიშვნა (არასავალდებულო)')}</label>
        <input id="vine-note" placeholder={t('e.g. dry canes, frost damage', 'მაგ. გამხმარი რქები, ყინვის დაზიანება')} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="status-grid" role="group" aria-label={t('Set vine status', 'ვაზის სტატუსი')}>
        {(['healthy', 'damaged', 'missing', 'replaced'] as VineStatus[]).map((s) => (
          <button key={s} className="status-btn" aria-pressed={status === s} onClick={() => mark(s)}>
            <StatusDot status={s} />{i18n.status(s)}
          </button>
        ))}
      </div>
      <button className="btn" onClick={onLogHere}>{t('Log work on this vine', 'სამუშაოს ჩაწერა ამ ვაზზე')}</button>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('History', 'ისტორია')}</div>
        {history.length ? (
          <ul className="timeline">
            {history.map((h, i) => (
              <li key={i}>
                <span className="date">{i18n.date(h.date)}</span>
                <span>
                  <span className={`pill pill-${h.status}`}>{i18n.status(h.status)}</span>{' '}
                  {i18n.d(h.note)}
                  {h.person && <span className="muted"> · {i18n.d(h.person)}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {t(`No events. This vine has been healthy since planting in ${plot.plantedYear}.`, `ჩანაწერები არ არის. ვაზი ჯანსაღია ${plot.plantedYear} წელს დარგვის შემდეგ.`)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Problem list + find a vine ──

interface ProblemListProps {
  plot: Plot;
  vines: Vine[];
  reports: BayReport[];
  onPick(row: number, pos: number): void;
  onReport(id: string): void;
  onNewReport(): void;
}

export function ProblemList({ plot, vines, reports, onPick, onReport, onNewReport }: ProblemListProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const recent = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  const [row, setRow] = useState('');
  const [pos, setPos] = useState('');
  const damaged = vines.filter((v) => v.status === 'damaged').sort((a, b) => a.row - b.row || a.pos - b.pos);

  function find(e: FormEvent) {
    e.preventDefault();
    const r = Number(row);
    const p = Number(pos);
    if (r >= 1 && r <= plot.rows && p >= 1 && p <= plot.vinesPerRow) onPick(r, p);
  }

  return (
    <div className="card card-pad form">
      <button type="button" className="btn btn-report big-send" onClick={onNewReport}>{t('Report a problem from the field', 'პრობლემის შეტყობინება ველიდან')}</button>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('Field reports', 'შეტყობინებები ველიდან')} · {recent.length}</div>
        {recent.length ? (
          <div className="report-list">
            {recent.slice(0, 8).map((r) => (
              <button key={r.id} type="button" className="report-item" onClick={() => onReport(r.id)}>
                <span><span className="addr">{bayAddress(plot, r.row, r.bay)}</span> {reportSummary(i18n, r)}</span>
                <span className="muted" style={{ whiteSpace: 'nowrap' }}>{i18n.dayMonth(r.date)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>{t('No reports yet.', 'შეტყობინებები ჯერ არ არის.')}</p>
        )}
      </div>
      <h2>{t('Find a vine', 'ვაზის პოვნა')}</h2>
      <form className="row-2" onSubmit={find} style={{ alignItems: 'end' }}>
        <div className="row-2" style={{ gap: 6 }}>
          <div className="field"><label htmlFor="f-row">{t('Row', 'რიგი')}</label><input id="f-row" inputMode="numeric" placeholder={`1–${plot.rows}`} value={row} onChange={(e) => setRow(e.target.value)} /></div>
          <div className="field"><label htmlFor="f-pos">{t('Vine', 'ვაზი')}</label><input id="f-pos" inputMode="numeric" placeholder={`1–${plot.vinesPerRow}`} value={pos} onChange={(e) => setPos(e.target.value)} /></div>
        </div>
        <button className="btn" type="submit">{t('Show', 'ჩვენება')}</button>
      </form>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('Needs attention', 'ყურადღება სჭირდება')} · {damaged.length}</div>
        {damaged.length ? (
          <div className="chips">
            {damaged.slice(0, 30).map((v) => (
              <button key={`${v.row}:${v.pos}`} className="chip" onClick={() => onPick(v.row, v.pos)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                R{v.row} · {v.pos}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>{t('No damaged vines on this plot.', 'ამ ნაკვეთზე დაზიანებული ვაზი არ არის.')}</p>
        )}
      </div>
    </div>
  );
}

// ── Quick log ──

interface QuickLogProps {
  plot: Plot;
  sel: { row: number; pos: number } | null;
  selectedRow: number | null;
  selectedBay: { row: number; bay: number } | null;
  scopeKind: OperationScope['kind'];
  setScopeKind(k: OperationScope['kind']): void;
  person: string;
  setPerson(p: string): void;
  toast(msg: string): void;
}

export function QuickLog({ plot, sel, selectedRow, selectedBay, scopeKind, setScopeKind, person, setPerson, toast }: QuickLogProps) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [type, setType] = useState<OperationType>('spraying');
  const [date, setDate] = useState(TODAY);
  const [note, setNote] = useState('');
  const [product, setProduct] = useState(KNOWN_PRODUCTS[0]);
  const [solution, setSolution] = useState('');
  const [area, setArea] = useState(String(plot.areaHa));
  const [kg, setKg] = useState('');
  const year = date.slice(0, 4);
  const yearBatches = store.batches.filter((b) => b.id.startsWith(`B-${year}`));
  const nextBatchId = `B-${year}-${String(yearBatches.length + 1).padStart(2, '0')}`;
  const [batch, setBatch] = useState<string>('new');
  const [pickedVariety, setPickedVariety] = useState('');

  const row = sel?.row ?? selectedRow;
  const rowBlock = row ? blockForRow(plot, row) : plot.blocks[0];
  const variety = pickedVariety || rowBlock.variety;
  const varBlock = plot.blocks.find((b) => b.variety === variety) ?? rowBlock;
  const scope: OperationScope =
    scopeKind === 'vine' && sel ? { kind: 'vine', row: sel.row, pos: sel.pos }
    : scopeKind === 'bay' && selectedBay ? { kind: 'bay', row: selectedBay.row, bay: selectedBay.bay }
    : scopeKind === 'row' && row ? { kind: 'row', row }
    : { kind: 'plot' };

  const sol = Number(solution);
  const ar = Number(area);
  const lPerHa = sol > 0 && ar > 0 ? Math.round(sol / ar) : null;

  function save(e: FormEvent) {
    e.preventDefault();
    if (type === 'spraying' && !(sol > 0 && ar > 0)) return toast(t('Enter the solution used (L) and the area treated (ha).', 'შეიყვანეთ გამოყენებული ხსნარი (ლ) და დამუშავებული ფართობი (ჰა).'));
    if (type === 'harvest' && !(Number(kg) > 0)) return toast(t('Enter the harvest weight in kg.', 'შეიყვანეთ მოსავლის წონა კილოგრამებში.'));
    const batchId = type === 'harvest' ? (batch === 'new' ? nextBatchId : batch) : undefined;
    store.addOperation(
      {
        id: newId('op'),
        plotId: plot.id,
        type,
        date,
        person,
        scope,
        note: note || undefined,
        ...(type === 'spraying' ? { product, solutionL: sol, areaHa: ar } : {}),
        ...(type === 'harvest' ? { kg: Number(kg), batchId, variety } : {}),
      },
      type === 'harvest' && batch === 'new' ? { id: nextBatchId, label: `${variety} ${year} · ${WINE_LABEL[varBlock.wineColor]}` } : undefined,
    );
    setNote('');
    setSolution('');
    setKg('');
    setBatch('new');
    toast(type === 'harvest'
      ? t(`${variety} harvest saved and sent to batch ${batchId}`, `${i18n.d(variety)}: რთველი შენახულია და გადაეცა პარტიას ${batchId}`)
      : t(`${i18n.op(type)} saved`, `${i18n.op(type)} შენახულია`));
  }

  const vineLabel = t('Vine', 'ვაზი');

  return (
    <form className="card card-pad form" onSubmit={save}>
      <div className="vine-head">
        <h2>{t('Log work', 'სამუშაოს ჩაწერა')}</h2>
        <span className="muted" style={{ fontSize: '0.8rem' }}>{t('3 taps for most entries', 'უმეტესობას 3 შეხება ჰყოფნის')}</span>
      </div>
      <div className="op-tiles" role="group" aria-label={t('Type of work', 'სამუშაოს ტიპი')}>
        {OPERATION_ORDER.map((o) => (
          <button type="button" key={o} className="op-tile" aria-pressed={type === o} onClick={() => setType(o)}>
            <OpIcon type={o} />{i18n.op(o)}
          </button>
        ))}
      </div>

      <div className="seg" role="group" aria-label={t('Where', 'სად')}>
        <button type="button" aria-pressed={scope.kind === 'plot'} onClick={() => setScopeKind('plot')}>{t('Whole plot', 'მთელი ნაკვეთი')}</button>
        <button type="button" aria-pressed={scope.kind === 'row'} disabled={!row} onClick={() => setScopeKind('row')}>{row ? t(`Row ${row}`, `რიგი ${row}`) : t('Row', 'რიგი')}</button>
        <button type="button" aria-pressed={scope.kind === 'bay'} disabled={!selectedBay} onClick={() => setScopeKind('bay')}>{selectedBay ? t(`Bay ${selectedBay.bay}`, `მონ. ${selectedBay.bay}`) : t('Bay', 'მონაკვეთი')}</button>
        <button type="button" aria-pressed={scope.kind === 'vine'} disabled={!sel} onClick={() => setScopeKind('vine')}>{vineLabel}</button>
      </div>
      {!row && (
        <span className="muted" style={{ fontSize: '0.8rem', marginTop: -6 }}>
          {t('Tap a row label (R1, R2…) or a vine to log work for just that row, bay or vine.', 'შეეხეთ რიგის ნომერს (R1, R2…) ან ვაზს, რომ სამუშაო მხოლოდ იმ რიგს, მონაკვეთს ან ვაზს ჩაეწეროს.')}
        </span>
      )}

      <div className="row-2">
        <div className="field"><label htmlFor="ql-date">{t('Date', 'თარიღი')}</label><input id="ql-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field">
          <label htmlFor="ql-person">{t('Who', 'ვინ')}</label>
          <select id="ql-person" value={person} onChange={(e) => setPerson(e.target.value)}>
            {KNOWN_PEOPLE.map((p) => <option key={p} value={p}>{i18n.d(p)}</option>)}
          </select>
        </div>
      </div>

      {type === 'spraying' && (
        <>
          <div className="field">
            <label htmlFor="ql-product">{t('Product', 'პრეპარატი')}</label>
            <input id="ql-product" list="products" value={product} onChange={(e) => setProduct(e.target.value)} />
            <datalist id="products">{KNOWN_PRODUCTS.map((p) => <option key={p} value={p}>{i18n.lang === 'ka' ? i18n.d(p) : undefined}</option>)}</datalist>
          </div>
          <div className="row-2">
            <div className="field"><label htmlFor="ql-sol">{t('Solution used (L)', 'გამოყენებული ხსნარი (ლ)')}</label><input id="ql-sol" inputMode="decimal" placeholder="600" value={solution} onChange={(e) => setSolution(e.target.value)} /></div>
            <div className="field"><label htmlFor="ql-area">{t('Area treated (ha)', 'დამუშავებული ფართობი (ჰა)')}</label><input id="ql-area" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} /></div>
          </div>
          <div className="calc">
            {lPerHa
              ? <><span className="num">{i18n.num(lPerHa)}</span> {t(`L per hectare, linked to ${plot.name}`, `ლ ჰექტარზე, მიბმულია: ${i18n.plotName(plot.name)}`)}</>
              : t('L per hectare is calculated for you.', 'ლიტრი ჰექტარზე ავტომატურად გამოითვლება.')}
          </div>
        </>
      )}

      {type === 'harvest' && (
        <>
          {plot.blocks.length > 1 && (
            <div className="field">
              <label htmlFor="ql-variety">{t('Variety picked', 'დაკრეფილი ჯიში')}</label>
              <select id="ql-variety" value={variety} onChange={(e) => setPickedVariety(e.target.value)}>
                {plot.blocks.map((b) => <option key={b.variety} value={b.variety}>{i18n.d(b.variety)} · {t('rows', 'რიგები')} {b.fromRow}–{b.toRow}</option>)}
              </select>
            </div>
          )}
          <div className="row-2">
            <div className="field"><label htmlFor="ql-kg">{t('Grapes (kg)', 'ყურძენი (კგ)')}</label><input id="ql-kg" inputMode="numeric" placeholder="6000" value={kg} onChange={(e) => setKg(e.target.value)} /></div>
            <div className="field">
              <label htmlFor="ql-batch">{t('Wine batch', 'ღვინის პარტია')}</label>
              <select id="ql-batch" value={batch} onChange={(e) => setBatch(e.target.value)}>
                <option value="new">{t(`New batch ${nextBatchId}`, `ახალი პარტია ${nextBatchId}`)}</option>
                {yearBatches.map((b) => <option key={b.id} value={b.id}>{b.id} · {i18n.batchLabel(b.label)}</option>)}
              </select>
            </div>
          </div>
          <div className="handoff">
            {t(`This ${variety} harvest becomes the grape intake of batch `, `ეს მოსავალი (${i18n.d(variety)}) ხდება პარტიის `)}
            <span className="batch-chip">{batch === 'new' ? nextBatchId : batch}</span>
            {t('. The traceability module follows it from there to the bottle.', ' ყურძნის მიღება. აქედან მიკვლევადობის მოდული მას ბოთლამდე მიჰყვება.')}
          </div>
        </>
      )}

      <div className="field"><label htmlFor="ql-note">{t('Note (optional)', 'შენიშვნა (არასავალდებულო)')}</label><input id="ql-note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <button type="submit" className="btn btn-primary">{t(`Save ${i18n.op(type).toLowerCase()}`, `შენახვა: ${i18n.op(type)}`)}</button>
    </form>
  );
}
