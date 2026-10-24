import { useI18n } from '../../shared/i18n';
import { plotVineCounts, useStore } from '../../shared/store';
import { CellarLink } from '../../shared/cellar';

// Entry screen: the two halves of Terroir, in the same visual language as MyCellar.
// MyVineyard = this React app (Challenge 3.4). MyCellar = cellar.html (Challenge 3.1).

export function HomeView({ openVineyard }: { openVineyard(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const store = useStore();
  const vines = store.plots.reduce((n, p) => n + plotVineCounts(p, store.vines).standing, 0);
  const problems = store.plots.reduce((n, p) => n + plotVineCounts(p, store.vines).damaged, 0);
  const area = store.plots.reduce((n, p) => n + p.areaHa, 0);

  return (
    <div className="landing-body">
      <div className="landing-head">
        <div className="eyebrow">{t('Terroir · Gurjaani, Kakheti', 'Terroir · გურჯაანი, კახეთი')}</div>
        <h1>{t('From vineyard to bottle', 'ვენახიდან ბოთლამდე')}</h1>
        <p className="muted">
          {t('One record for every wine: where the grapes grew, what was done in the vineyard, and what happened in the cellar until bottling.',
             'ერთი ჩანაწერი ყოველი ღვინისთვის: სად მოიყვანეს ყურძენი, რა გაკეთდა ვენახში და რა მოხდა მარანში ჩამოსხმამდე.')}
        </p>
        <div className="chips" aria-label={t('Value chain', 'ღირებულებათა ჯაჭვი')}>
          {[t('Vineyard', 'ვენახი'), t('Harvest', 'რთველი'), t('Wine batch', 'ღვინის პარტია'), t('Cellar', 'მარანი'), t('Bottle', 'ბოთლი')].map((s, n, a) => (
            <span key={s} className="chain-step"><span className="chip">{s}</span>{n < a.length - 1 && <span className="muted" aria-hidden="true">→</span>}</span>
          ))}
        </div>
      </div>

      <div className="landing-grid">
        <section className="card landing-card">
          <div className="landing-card-head">
            <div>
              <div className="eyebrow">{t('Challenge 3.4 · Vineyard', 'გამოწვევა 3.4 · ვენახი')}</div>
              <h2 className="landing-title">MyVineyard</h2>
            </div>
            <span className="pill">{t('Live demo data', 'დემო მონაცემები')}</span>
          </div>
          <div className="landing-stats">
            <div className="stat card"><span className="stat-label">{t('Plots', 'ნაკვეთები')}</span><span className="num">{store.plots.length}</span></div>
            <div className="stat card"><span className="stat-label">{t('Area', 'ფართობი')}</span><span className="num">{area.toFixed(2)} {t('ha', 'ჰა')}</span></div>
            <div className="stat card"><span className="stat-label">{t('Vines', 'ვაზი')}</span><span className="num">{i18n.num(vines)}</span></div>
            <div className="stat card"><span className="stat-label">{t('Need attention', 'ყურადღება სჭირდება')}</span><span className="num" style={{ color: 'var(--danger)' }}>{problems}</span></div>
          </div>
          <ul className="landing-list">
            <li>{t('Plots, rows and numbered bays — every vine on one plan', 'ნაკვეთები, რიგები და დანომრილი მონაკვეთები — ყველა ვაზი ერთ გეგმაზე')}</li>
            <li>{t('Work log: pruning, green work, spraying, harvest', 'სამუშაოები: სხვლა, მწვანე ოპერაციები, შეწამვლა, რთველი')}</li>
            <li>{t('Field reports from the tractor in four taps', 'შეტყობინება ტრაქტორიდან ოთხი შეხებით')}</li>
            <li>{t('AI advice and season analysis', 'AI რჩევები და სეზონის ანალიზი')}</li>
          </ul>
          <button type="button" className="btn btn-primary landing-go" onClick={openVineyard}>{t('Open MyVineyard', 'MyVineyard-ის გახსნა')} →</button>
        </section>

        <section className="card landing-card">
          <div className="landing-card-head">
            <div>
              <div className="eyebrow">{t('Challenge 3.1 · Cellar', 'გამოწვევა 3.1 · მარანი')}</div>
              <h2 className="landing-title">MyCellar</h2>
            </div>
            <span className="pill">{t('Live demo data', 'დემო მონაცემები')}</span>
          </div>
          <div className="landing-stats">
            <div className="stat card"><span className="stat-label">{t('Wine lots', 'ღვინის ლოტები')}</span><span className="num">5</span></div>
            <div className="stat card"><span className="stat-label">{t('Tanks', 'ტანკები')}</span><span className="num">10</span></div>
            <div className="stat card"><span className="stat-label">{t('Qvevri', 'ქვევრები')}</span><span className="num">15</span></div>
            <div className="stat card"><span className="stat-label">{t('Barrels', 'კასრები')}</span><span className="num">30</span></div>
          </div>
          <ul className="landing-list">
            <li>{t('Wine lots from grape reception to bottling', 'ღვინის ლოტები ყურძნის მიღებიდან ჩამოსხმამდე')}</li>
            <li>{t('Tanks, qvevri and barrels on a 3D cellar map', 'ტანკები, ქვევრები და კასრები მარნის 3D რუკაზე')}</li>
            <li>{t('Full traceability and Excel export', 'სრული მიკვლევადობა და Excel ექსპორტი')}</li>
            <li>{t('Costs and price per bottle', 'ხარჯები და ბოთლის თვითღირებულება')}</li>
          </ul>
          <CellarLink className="btn btn-primary landing-go">{t('Open MyCellar', 'MyCellar-ის გახსნა')} →</CellarLink>
        </section>
      </div>
    </div>
  );
}
