import { useMemo, useState } from 'react';
import type { OperationScope, Plot, Vine } from '../../shared/models';
import { bayAddress, bayOf, blockColor } from '../../shared/models';
import { FieldReport, ReportPanel } from './FieldReport';
import { useI18n } from '../../shared/i18n';
import { plotVineCounts, useStore } from '../../shared/store';
import { KNOWN_PEOPLE } from '../../shared/seed';
import { buildAdvice, YEARS } from '../insights/insightsData';
import { VineField, vineKey } from './VineField';
import { ProblemList, QuickLog, StatusDot, VinePanel } from './SidePanels';
import { WeatherChart, WorkLog } from './Season';


interface Props {
  plot: Plot;
  goEstate(): void;
  goInsights(plotId: string): void;
  toast(msg: string): void;
}

export function PlotView({ plot, goEstate, goInsights, toast }: Props) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = i18n.num;
  const [sel, setSel] = useState<{ row: number; pos: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [scopeKind, setScopeKind] = useState<OperationScope['kind']>('plot');
  const [zoom, setZoom] = useState(plot.vinesPerRow > 80 ? 2 : 1);
  const [dim, setDim] = useState(false);
  const [person, setPerson] = useState(KNOWN_PEOPLE[1]);
  const plotYears = YEARS.filter((y) => y >= plot.plantedYear);
  const [year, setYear] = useState(plotYears[plotYears.length - 1] ?? 2026);

  const vines = useMemo(() => store.vines.filter((v) => v.plotId === plot.id), [store.vines, plot.id]);
  const vineMap = useMemo(() => new Map<string, Vine>(vines.map((v) => [vineKey(v.row, v.pos), v])), [vines]);
  const counts = plotVineCounts(plot, store.vines);
  const reports = store.reports.filter((r) => r.plotId === plot.id);
  const report = reports.find((r) => r.id === reportId) ?? null;
  const selectedBay = report ? { row: report.row, bay: report.bay } : sel ? { row: sel.row, bay: bayOf(plot, sel.pos) } : null;
  const ops = store.operations.filter((o) => o.plotId === plot.id);
  const yearOps = ops.filter((o) => o.date.startsWith(String(year))).sort((a, b) => a.date.localeCompare(b.date));
  const harvestsSorted = ops.filter((o) => o.type === 'harvest').sort((a, b) => b.date.localeCompare(a.date));
  const lastHarvests = harvestsSorted.filter((o) => harvestsSorted[0] && o.date.slice(0, 4) === harvestsSorted[0].date.slice(0, 4));
  const lastHarvestKg = lastHarvests.reduce((s, o) => s + (o.kg ?? 0), 0);
  const advice = buildAdvice(store, i18n).filter((a) => a.plotId === plot.id);
  const urgent = advice.filter((a) => a.level === 'act').length;

  function pickVine(row: number, pos: number) {
    setReportId(null);
    setSel({ row, pos });
    setSelectedRow(row);
    setScopeKind('vine');
  }

  function openReport(id: string) {
    const r = reports.find((x) => x.id === id);
    if (!r) return;
    setSel(null);
    setReportId(id);
    setSelectedRow(r.row);
    setScopeKind('bay');
    if (zoom < 2) setZoom(2);
  }

  return (
    <>
      {reporting && (
        <FieldReport
          plot={plot}
          initial={selectedBay}
          onClose={() => setReporting(false)}
          onSent={(r) => {
            setReporting(false);
            setSel(null);
            setReportId(r.id);
            setSelectedRow(r.row);
            setScopeKind('bay');
            toast(t(`Report sent: ${bayAddress(plot, r.row, r.bay)}`, `შეტყობინება გაიგზავნა: ${bayAddress(plot, r.row, r.bay)}`));
          }}
        />
      )}
      <div className="page-head">
        <div>
          <button className="btn-link" onClick={goEstate}>← {t('Estate', 'მამული')}</button>
          <h1 style={{ marginTop: 6 }}>{i18n.plotName(plot.name)} · {plot.blocks.map((b) => i18n.d(b.variety)).join(' / ')}</h1>
          <p className="muted">
            {i18n.d(plot.village)} · {plot.areaHa} {t('ha', 'ჰა')} · {plot.rows} {t('rows', 'რიგი')} × {plot.vinesPerRow} {t('vines', 'ვაზი')} · {t(`${plot.vinesPerBay} vines per bay`, `${plot.vinesPerBay} ვაზი მონაკვეთში`)} · {t('planted', 'დარგულია')} {plot.plantedYear} · {i18n.d(plot.training)}
          </p>
        </div>
        <button type="button" className="btn btn-report" onClick={() => setReporting(true)}>{t('Report a problem', 'პრობლემის შეტყობინება')}</button>
      </div>

      <div className="stats">
        <div className="card stat"><span className="stat-label"><StatusDot status="healthy" />{t('Standing vines', 'მდგარი ვაზი')}</span><span className="num">{fmt(counts.standing)}</span></div>
        <div className="card stat"><span className="stat-label"><StatusDot status="damaged" />{i18n.status('damaged')}</span><span className="num" style={{ color: counts.damaged ? 'var(--danger)' : undefined }}>{counts.damaged}</span></div>
        <div className="card stat"><span className="stat-label"><StatusDot status="missing" />{i18n.status('missing')}</span><span className="num">{counts.missing}</span></div>
        <div className="card stat"><span className="stat-label"><StatusDot status="replaced" />{i18n.status('replaced')}</span><span className="num">{counts.replaced}</span></div>
        <div className="card stat">
          <span className="stat-label">{t('Harvest', 'რთველი')} {lastHarvests[0]?.date.slice(0, 4) ?? ''}</span>
          {lastHarvests.length ? (
            <>
              <span className="num">{fmt(lastHarvestKg)} {t('kg', 'კგ')}</span>
              <span className="chips" style={{ marginTop: 4 }}>{lastHarvests.map((h) => <span key={h.id} className="batch-chip" title={i18n.d(h.variety)}>{h.batchId}</span>)}</span>
            </>
          ) : <span className="num muted">—</span>}
        </div>
      </div>

      {advice.length > 0 && (
        <div className="card advice-strip">
          <span className="pill pill-ai">AI</span>
          <span style={{ flex: 1, minWidth: 200 }}>
            <b>{t(`${advice.length} recommendations for this plot`, `${advice.length} რეკომენდაცია ამ ნაკვეთისთვის`)}</b>
            {urgent > 0 && <span className="muted">{t(`, ${urgent} to act on now: `, `, ${urgent} სასწრაფო: `)}{i18n.lang === 'en' ? advice.find((a) => a.level === 'act')?.title.toLowerCase() : advice.find((a) => a.level === 'act')?.title}</span>}
          </span>
          <button className="btn btn-small" onClick={() => goInsights(plot.id)}>{t('Open AI insights', 'AI ანალიზის გახსნა')}</button>
        </div>
      )}

      <div className="plot-layout">
        <div className="card" style={{ overflow: 'hidden', minWidth: 0 }}>
          <div className="field-toolbar">
            <div className="legend">
              <span><StatusDot status="healthy" />{i18n.status('healthy')}</span>
              <span><StatusDot status="damaged" />{t('Needs attention', 'ყურადღება სჭირდება')}</span>
              <span><StatusDot status="missing" />{i18n.status('missing')}</span>
              <span><StatusDot status="replaced" />{t('Replaced (young)', 'შეცვლილი (ახალგაზრდა)')}</span>
            </div>
            <div className="zoom">
              <button className="chip" aria-pressed={dim} onClick={() => setDim(!dim)}>{t('Problems only', 'მხოლოდ პრობლემები')}</button>
              <button className="btn btn-small" onClick={() => setZoom(Math.max(1, zoom - 1))} aria-label={t('Zoom out', 'დაპატარავება')} disabled={zoom === 1}>−</button>
              <span className="num" style={{ fontSize: '0.8rem', width: 28, textAlign: 'center' }}>{zoom}×</span>
              <button className="btn btn-small" onClick={() => setZoom(Math.min(4, zoom + 1))} aria-label={t('Zoom in', 'გადიდება')} disabled={zoom === 4}>+</button>
            </div>
          </div>
          {plot.blocks.length > 0 && (
            <div className="var-legend" aria-label={t('Varieties in this plot', 'ჯიშები ამ ნაკვეთში')}>
              {plot.blocks.map((b, i) => (
                <span key={i}>
                  <i className="swatch" style={{ background: blockColor(i) }} />
                  <b>{i18n.d(b.variety)}</b>
                  <span className="muted">{i18n.wine(b.wineColor)} · {t('rows', 'რიგები')} {b.fromRow}–{b.toRow}</span>
                </span>
              ))}
            </div>
          )}
          <div className="field-scroll">
            <VineField
              plot={plot}
              vineMap={vineMap}
              selected={sel}
              selectedRow={selectedRow}
              selectedBay={selectedBay}
              reports={reports}
              zoom={zoom}
              dimHealthy={dim}
              onVine={pickVine}
              onRow={(r) => { setSelectedRow(r); setSel(null); setReportId(null); setScopeKind('row'); }}
              onReport={(id) => openReport(id)}
            />
          </div>
        </div>

        <div className="side">
          {report ? (
            <ReportPanel plot={plot} report={report} onClose={() => { setReportId(null); setScopeKind('plot'); }} />
          ) : sel ? (
            <VinePanel
              key={vineKey(sel.row, sel.pos)}
              plot={plot}
              sel={sel}
              vine={vineMap.get(vineKey(sel.row, sel.pos))}
              person={person}
              onClose={() => { setSel(null); setScopeKind(selectedRow ? 'row' : 'plot'); }}
              onLogHere={() => { setScopeKind('vine'); document.getElementById('ql-date')?.focus(); }}
              toast={toast}
            />
          ) : (
            <ProblemList
              plot={plot}
              vines={vines}
              reports={reports}
              onPick={(r, p) => { pickVine(r, p); if (zoom < 2) setZoom(2); }}
              onReport={(id) => openReport(id)}
              onNewReport={() => setReporting(true)}
            />
          )}
          <QuickLog
            key={plot.id}
            plot={plot}
            sel={sel}
            selectedRow={selectedRow}
            selectedBay={selectedBay}
            scopeKind={scopeKind}
            setScopeKind={setScopeKind}
            person={person}
            setPerson={setPerson}
            toast={toast}
          />
        </div>
      </div>

      <div>
        <div className="section-title">
          <h2>{t('Season', 'სეზონი')} {year}</h2>
          <div className="chips" role="group" aria-label={t('Season', 'სეზონი')}>
            {plotYears.map((y) => <button key={y} className="chip" aria-pressed={y === year} onClick={() => setYear(y)}>{y}</button>)}
          </div>
        </div>
        <div className="season-layout">
          <div className="card card-pad" style={{ minWidth: 0 }}>
            <h3 style={{ marginBottom: 10 }}>{t('Temperature, rain and work done', 'ტემპერატურა, ნალექი და შესრულებული სამუშაო')}</h3>
            <WeatherChart year={year} ops={yearOps} />
          </div>
          <div className="card card-pad" style={{ minWidth: 0 }}>
            <h3 style={{ marginBottom: 6 }}>{t('Work log', 'სამუშაოების ჟურნალი')}</h3>
            <WorkLog plot={plot} year={year} ops={yearOps} vines={vines} reports={reports} />
          </div>
        </div>
      </div>
    </>
  );
}
