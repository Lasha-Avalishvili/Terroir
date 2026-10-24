import { useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore } from './shared/store';
import { EstateView } from './features/vineyard/EstateView';
import { PlotView } from './features/vineyard/PlotView';
import { InsightsView } from './features/insights/InsightsView';
import { buildAdvice } from './features/insights/insightsData';
import { LangProvider, useI18n } from './shared/i18n';
import { HomeView } from './features/home/HomeView';

type View = { kind: 'home' } | { kind: 'estate' } | { kind: 'plot'; id: string } | { kind: 'insights'; plotId?: string };

function parseHash(): View {
  let h = '';
  try { h = location.hash.slice(1); } catch { /* ignore */ }
  if (h.startsWith('plot-')) return { kind: 'plot', id: h.slice(5) };
  if (h === 'insights') return { kind: 'insights' };
  if (h.startsWith('insights-')) return { kind: 'insights', plotId: h.slice(9) };
  if (h === 'estate') return { kind: 'estate' };
  return { kind: 'home' };
}
function toHash(v: View) {
  return v.kind === 'home' ? 'home' : v.kind === 'estate' ? 'estate' : v.kind === 'plot' ? `plot-${v.id}` : v.plotId ? `insights-${v.plotId}` : 'insights';
}

function Shell() {
  const store = useStore();
  const i = useI18n();
  const { t } = i;
  const [view, setView] = useState<View>(parseHash);
  const [toastMsg, setToastMsg] = useState('');
  const timer = useRef<number>();

  useEffect(() => {
    const on = () => setView(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  function go(v: View) {
    setView(v);
    try { history.replaceState(null, '', `#${toHash(v)}`); } catch { /* ignore */ }
    window.scrollTo({ top: 0 });
  }
  function toast(msg: string) {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(''), 2600);
  }

  const plot = view.kind === 'plot' ? store.plots.find((p) => p.id === view.id) : undefined;
  const urgent = buildAdvice(store, i).filter((a) => a.level === 'act').length;

  const crumb =
    view.kind === 'home' ? t('Home', 'მთავარი')
    : view.kind === 'estate' ? t('Estate', 'მამული')
    : view.kind === 'plot' ? (plot ? i.plotName(plot.name) : '')
    : t('AI insights', 'AI ანალიზი');

  const langSwitch = (
    <div className="seg lang-switch" role="group" aria-label={t('Language', 'ენა')}>
      <button type="button" aria-pressed={i.lang === 'en'} onClick={() => i.setLang('en')}>EN</button>
      <button type="button" aria-pressed={i.lang === 'ka'} onClick={() => i.setLang('ka')} lang="ka">ქარ</button>
    </div>
  );

  if (view.kind === 'home') {
    return (
      <div className="landing">
        <div className="top">
          <div className="logo logo-dark">terr<span>oir</span> ◈</div>
          <div className="topright"><span className="pill">{t('DEMO DATA', 'დემო მონაცემები')}</span>{langSwitch}</div>
        </div>
        <div className="content">
          <HomeView openVineyard={() => go({ kind: 'estate' })} />
        </div>
        {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <button type="button" className="home-link" onClick={() => go({ kind: 'home' })}>← Terroir <small>· {t('Home', 'მთავარი')}</small></button>
        <div className="logo">terr<span>oir</span> ◈</div>
        <div className="tagline">{t('VINEYARD INTELLIGENCE', 'ვენახის მართვა')}</div>
        <nav className="navgroup" aria-label={t('MyVineyard', 'MyVineyard')}>
          <button className={`nav${view.kind === 'estate' ? ' active' : ''}`} onClick={() => go({ kind: 'estate' })}>
            <span className="ic" aria-hidden="true">◫</span>{t('Estate', 'მამული')}
          </button>
          <div className="nav-caption">{t('PLOTS', 'ნაკვეთები')}</div>
          {store.plots.map((p, n) => (
            <button key={p.id} className={`nav nav-sub${view.kind === 'plot' && view.id === p.id ? ' active' : ''}`} onClick={() => go({ kind: 'plot', id: p.id })}>
              <span className="nav-index">{String(n + 1).padStart(2, '0')}</span>
              <span>{i.plotName(p.name)} <small>· {p.blocks.map((b) => i.d(b.variety)).join(' / ')}</small></span>
            </button>
          ))}
          <button className={`nav${view.kind === 'insights' ? ' active' : ''}`} onClick={() => go({ kind: 'insights' })}>
            <span className="ic" aria-hidden="true">✦</span>{t('AI insights', 'AI ანალიზი')}
            {urgent > 0 && <span className="badge" aria-label={t(`${urgent} urgent`, `${urgent} სასწრაფო`)}>{urgent}</span>}
          </button>
          <a className="nav" href="cellar.html"><span className="ic" aria-hidden="true">◈</span>MyCellar ↗</a>
        </nav>
        <div className="sidebarfoot">
          <div>● {t('Demo data · Gurjaani, Kakheti', 'დემო მონაცემები · გურჯაანი, კახეთი')}</div>
          <div>{t('Works offline; data stays on this device.', 'მუშაობს ინტერნეტის გარეშე; მონაცემები ამ მოწყობილობაზე ინახება.')}</div>
          <button className="foot-btn" onClick={() => { store.resetDemo(); toast(t('Demo data restored', 'სადემონსტრაციო მონაცემები აღდგენილია')); }}>↺ {t('Reset demo data', 'დემო მონაცემების აღდგენა')}</button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <div className="crumb">TERROIR / MYVINEYARD / <b>{crumb}</b></div>
          <div className="topright"><span className="pill">{t('DEMO DATA', 'დემო მონაცემები')}</span>{langSwitch}</div>
        </div>
        <div className="content page">
          {view.kind === 'estate' && <EstateView openPlot={(id) => go({ kind: 'plot', id })} toast={toast} />}
          {view.kind === 'plot' && plot && (
            <PlotView
              key={plot.id}
              plot={plot}
              goEstate={() => go({ kind: 'estate' })}
              goInsights={(id) => go({ kind: 'insights', plotId: id })}
              toast={toast}
            />
          )}
          {view.kind === 'plot' && !plot && <p>{t('This plot no longer exists.', 'ეს ნაკვეთი აღარ არსებობს.')} <button className="btn-link" onClick={() => go({ kind: 'estate' })}>{t('Back to the estate', 'მამულზე დაბრუნება')}</button></p>}
          {view.kind === 'insights' && (
            <InsightsView key={view.plotId ?? 'all'} initialPlot={view.plotId} openPlot={(id) => go({ kind: 'plot', id })} />
          )}
        </div>
      </main>

      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </LangProvider>
  );
}
