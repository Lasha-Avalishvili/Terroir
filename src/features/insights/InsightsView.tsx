import { useState } from 'react';
import { useStore } from '../../shared/store';
import type { Plot } from '../../shared/models';
import { useI18n, type I18n } from '../../shared/i18n';
import { buildAdvice, buildAnalysis, yieldFor, YEARS, type AdviceLevel } from './insightsData';

const level = (i: I18n, l: AdviceLevel) => ({
  act: { label: i.t('Act now', 'სასწრაფო'), group: i.t('Act now', 'სასწრაფო') },
  plan: { label: i.t('Plan', 'დაგეგმეთ'), group: i.t('Plan ahead', 'წინასწარ დასაგეგმი') },
  watch: { label: i.t('Watch', 'თვალყური'), group: i.t('Keep an eye on', 'ადევნეთ თვალი') },
})[l];
const IMPACT_SIGN = { neg: '↓', pos: '↑', neutral: '·' } as const;
const impactLabel = (i: I18n, k: 'neg' | 'pos' | 'neutral') =>
  ({ neg: i.t('Lowered the yield', 'შეამცირა მოსავალი'), pos: i.t('Helped the yield', 'გაზარდა მოსავალი'), neutral: i.t('Context', 'კონტექსტი') })[k];
const kindLabel = (i: I18n, k: string) =>
  ({ Weather: i.t('Weather', 'ამინდი'), Spraying: i.t('Spraying', 'შეწამვლა'), 'Vine health': i.t('Vine health', 'ვაზის მდგომარეობა'), 'Vine age': i.t('Vine age', 'ვაზის ასაკი') } as Record<string, string>)[k] ?? k;
const varietiesOf = (i: I18n, p: Plot) => p.blocks.map((b) => i.d(b.variety)).join(' / ');

export function InsightsView({ initialPlot, openPlot }: { initialPlot?: string; openPlot(id: string): void }) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [filter, setFilter] = useState<string>(initialPlot ?? 'all');
  const plotsWithHistory = store.plots.filter((p) => buildAnalysis(store, p, i18n).length > 0);
  const [analysisPlot, setAnalysisPlot] = useState<string>(
    initialPlot && plotsWithHistory.some((p) => p.id === initialPlot) ? initialPlot : plotsWithHistory[0]?.id ?? '',
  );

  const advice = buildAdvice(store, i18n).filter((a) => filter === 'all' || a.plotId === filter);
  const plotName = (id: string) => {
    const p = store.plots.find((x) => x.id === id);
    return p ? `${i18n.plotName(p.name)} · ${varietiesOf(i18n, p)}` : id;
  };
  const plot = store.plots.find((p) => p.id === analysisPlot);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{t('AI insights · as of 24 October 2026', 'AI ანალიზი · 2026 წლის 24 ოქტომბრის მდგომარეობით')}</div>
          <h1>{t('What to do next, and why the harvest changed', 'რა უნდა გაკეთდეს შემდეგ და რატომ შეიცვალა მოსავალი')}</h1>
          <p className="muted">{t('Built from your work log, vine register and weather. Each point says which records it is based on, so you can check it.', 'აგებულია თქვენი სამუშაოების ჟურნალის, ვაზების რეესტრისა და ამინდის მიხედვით. თითოეულ პუნქტში ჩანს, რომელ ჩანაწერებს ეყრდნობა, რომ შეამოწმოთ.')}</p>
        </div>
      </div>

      <section className="card card-pad">
        <div className="section-title">
          <h2>{t('Advice', 'რჩევები')} <span className="pill pill-ai" style={{ verticalAlign: 'middle' }}>AI</span></h2>
          <div className="chips" role="group" aria-label={t('Filter by plot', 'ნაკვეთის მიხედვით')}>
            <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('All plots', 'ყველა ნაკვეთი')}</button>
            {store.plots.map((p) => (
              <button key={p.id} className="chip" aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}>{i18n.plotName(p.name)}</button>
            ))}
          </div>
        </div>
        {(['act', 'plan', 'watch'] as AdviceLevel[]).map((lvl) => {
          const list = advice.filter((a) => a.level === lvl);
          if (!list.length) return null;
          return (
            <div key={lvl}>
              <div className="group-label"><h3>{level(i18n, lvl).group}</h3><span className="muted">{list.length}</span></div>
              <div className="advice-grid">
                {list.map((a) => (
                  <article key={a.id} className="card advice">
                    <div className="advice-top">
                      <span className={`pill pill-${lvl}`}>{level(i18n, lvl).label} · {a.when}</span>
                      <button className="btn-link" style={{ fontSize: '0.8rem' }} onClick={() => openPlot(a.plotId)}>{plotName(a.plotId)}</button>
                    </div>
                    <h3>{a.title}</h3>
                    <p className="muted">{a.why}</p>
                    <p className="do"><b>{t('What to do:', 'რა გავაკეთოთ:')}</b> {a.action}</p>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
        {!advice.length && <p className="muted">{t('No advice for this plot yet. Advice appears once a season of work is recorded.', 'ამ ნაკვეთისთვის რჩევები ჯერ არ არის. ისინი გამოჩნდება, როცა ერთი სეზონის სამუშაოები ჩაიწერება.')}</p>}
      </section>

      <section className="card card-pad">
        <div className="section-title">
          <h2>{t('Season analysis', 'სეზონების ანალიზი')} <span className="pill pill-ai" style={{ verticalAlign: 'middle' }}>AI</span></h2>
          <div className="chips" role="group" aria-label={t('Plot', 'ნაკვეთი')}>
            {plotsWithHistory.map((p) => (
              <button key={p.id} className="chip" aria-pressed={analysisPlot === p.id} onClick={() => setAnalysisPlot(p.id)}>{i18n.plotName(p.name)} · {varietiesOf(i18n, p)}</button>
            ))}
          </div>
        </div>
        {plot && <Analysis plot={plot} />}
        <p className="disclaimer">
          {t('These are possible reasons found in your records, not proof. The winemaker confirms them. For the demo the texts were generated in advance; the numbers come live from the data on this page.', 'ეს არის თქვენს ჩანაწერებში ნაპოვნი შესაძლო მიზეზები და არა მტკიცებულება. საბოლოოდ მათ მეღვინე ადასტურებს. დემოსთვის ტექსტები წინასწარ არის მომზადებული, ციფრები კი პირდაპირ ამ გვერდის მონაცემებიდან მოდის.')}
        </p>
      </section>
    </>
  );
}

function Analysis({ plot }: { plot: Plot }) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const items = buildAnalysis(store, plot, i18n);
  const ys = YEARS.map((y) => ({ year: y, v: yieldFor(store, plot, y) }));
  const max = Math.max(...ys.map((y) => y.v?.tPerHa ?? 0), 1);
  const W = 520, H = 190, L = 34, B = 24, T = 14;
  const bw = (W - L - 10) / ys.length;
  const top = Math.ceil(max / 2) * 2 + 2;
  const yOf = (v: number) => T + (H - T - B) * (1 - v / top);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'center' }}>
        <div className="chart-wrap">
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 300 }} role="img" aria-label={t(`Yield per hectare for ${plot.name} by year`, 'მოსავლიანობა ჰექტარზე წლების მიხედვით')}>
            {Array.from({ length: top / 2 + 1 }, (_, i) => i * 2).map((t) => (
              <g key={t}>
                <line x1={L} x2={W - 10} y1={yOf(t)} y2={yOf(t)} stroke="var(--line)" strokeWidth="0.7" />
                <text x={L - 6} y={yOf(t) + 3} textAnchor="end">{t}</text>
              </g>
            ))}
            <text x={L - 6} y={T - 4} textAnchor="end">{t('t/ha', 'ტ/ჰა')}</text>
            {ys.map((y, i) => {
              const v = y.v?.tPerHa ?? 0;
              const x = L + i * bw + bw * 0.22;
              const w = bw * 0.56;
              const best = v === max;
              return (
                <g key={y.year}>
                  <rect x={x} y={yOf(v)} width={w} height={yOf(0) - yOf(v)} rx="4" fill={best ? 'var(--accent)' : 'var(--bar)'} />
                  <text x={x + w / 2} y={yOf(v) - 5} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 11 }}>{v ? v.toFixed(1) : '—'}</text>
                  <text x={x + w / 2} y={H - 6} textAnchor="middle">{y.year}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div>
          <h3>{i18n.plotName(plot.name)} · {varietiesOf(i18n, plot)}, {plot.areaHa} {t('ha', 'ჰა')}</h3>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {t('Harvest per hectare from the work log. Each season card below lists what most likely raised or lowered the result, using weather, spraying and vine records.', 'მოსავალი ჰექტარზე სამუშაოების ჟურნალიდან. ქვემოთ თითოეულ სეზონზე ჩანს, რა გაზარდა ან შეამცირა შედეგი — ამინდის, შეწამვლისა და ვაზების ჩანაწერების მიხედვით.')}
          </p>
        </div>
      </div>

      <div className="years">
        {items.map((it) => (
          <article key={it.year} className="card year">
            <div className="year-top">
              <span className="year-num">{it.year}</span>
              <span>
                <span className="num" style={{ fontSize: '1.05rem' }}>{it.tPerHa?.toFixed(1)} {t('t/ha', 'ტ/ჰა')}</span>{' '}
                {it.changePct !== null && (
                  <span className={`delta ${it.changePct < 0 ? 'delta-neg' : 'delta-pos'}`}>{it.changePct > 0 ? '+' : ''}{it.changePct}%</span>
                )}
              </span>
            </div>
            <h3>{it.headline}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{it.summary}</p>
            <ul className="factors">
              {it.factors.map((f, i) => (
                <li key={i}>
                  <span className={`impact impact-${f.impact}`} title={impactLabel(i18n, f.impact)} aria-label={impactLabel(i18n, f.impact)}>{IMPACT_SIGN[f.impact]}</span>
                  <span><b>{kindLabel(i18n, f.kind)}.</b> {f.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
