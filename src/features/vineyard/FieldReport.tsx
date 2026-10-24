import { useEffect, useState } from 'react';
import type { BayReport, Plot, ReportIssue } from '../../shared/models';
import { bayAddress, baysPerRow, TODAY } from '../../shared/models';
import { newId, useStore } from '../../shared/store';
import { KNOWN_PEOPLE } from '../../shared/seed';
import { useI18n, type I18n } from '../../shared/i18n';

// Field report: made for a tractor driver. Row → bay → problem → (how many) → send.
// No typing, no vine counting. Bay numbers are painted on the posts.

export const issueLabel = (i: I18n, k: ReportIssue) =>
  ({
    dead: i.t('Dead or missing vine', 'მკვდარი ან დაკარგული ვაზი'),
    damaged: i.t('Damaged vine', 'დაზიანებული ვაზი'),
    post: i.t('Broken post or wire', 'გატეხილი ბოძი ან მავთული'),
    other: i.t('Something else', 'სხვა პრობლემა'),
  })[k];

export const reportSummary = (i: I18n, r: BayReport) =>
  r.issue === 'dead' || r.issue === 'damaged'
    ? i.t(`${r.count === 4 ? '4+' : r.count} ${r.issue === 'dead' ? 'dead/missing' : 'damaged'}`, `${r.count === 4 ? '4+' : r.count} ${r.issue === 'dead' ? 'მკვდარი/დაკარგული' : 'დაზიანებული'}`)
    : issueLabel(i, r.issue);

interface FieldReportProps {
  plot: Plot;
  initial?: { row: number; bay: number } | null;
  onClose(): void;
  onSent(r: BayReport): void;
}

export function FieldReport({ plot, initial, onClose, onSent }: FieldReportProps) {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [row, setRow] = useState<number | null>(initial?.row ?? null);
  const [bay, setBay] = useState<number | null>(initial?.bay ?? null);
  const [issue, setIssue] = useState<ReportIssue | null>(null);
  const [count, setCount] = useState(1);
  const [person, setPerson] = useState(KNOWN_PEOPLE[3]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ready = row !== null && bay !== null && issue !== null;
  const needsCount = issue === 'dead' || issue === 'damaged';

  function send() {
    if (!ready) return;
    const r: BayReport = { id: newId('r'), plotId: plot.id, row, bay, issue, count: needsCount ? count : 1, date: TODAY, person };
    store.addReport(r);
    onSent(r);
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="fr-title" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="vine-head">
          <div>
            <div className="eyebrow">{i18n.plotName(plot.name)}</div>
            <h2 id="fr-title">{t('Report a problem', 'პრობლემის შეტყობინება')}</h2>
          </div>
          <button className="btn btn-small" onClick={onClose}>{t('Cancel', 'გაუქმება')}</button>
        </div>

        <div className="form" style={{ gap: 8 }}>
          <div className="step-label"><span>1 · {t('Row', 'რიგი')}</span>{row && <span className="addr">R{String(row).padStart(2, '0')}</span>}</div>
          <div className="num-grid" role="group" aria-label={t('Row', 'რიგი')}>
            {Array.from({ length: plot.rows }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={row === n} onClick={() => setRow(n)}>{n}</button>
            ))}
          </div>
        </div>

        <div className="form" style={{ gap: 8 }}>
          <div className="step-label">
            <span>2 · {t('Bay (number on the post)', 'მონაკვეთი (ნომერი ბოძზე)')}</span>
            {bay && <span className="addr">B{String(bay).padStart(2, '0')}</span>}
          </div>
          <div className="num-grid" role="group" aria-label={t('Bay', 'მონაკვეთი')}>
            {Array.from({ length: baysPerRow(plot) }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={bay === n} onClick={() => setBay(n)}>{n}</button>
            ))}
          </div>
        </div>

        <div className="form" style={{ gap: 8 }}>
          <div className="step-label"><span>3 · {t('What is wrong', 'რა პრობლემაა')}</span></div>
          <div className="issue-grid" role="group" aria-label={t('What is wrong', 'რა პრობლემაა')}>
            {(['dead', 'damaged', 'post', 'other'] as ReportIssue[]).map((k) => (
              <button key={k} type="button" aria-pressed={issue === k} onClick={() => setIssue(k)}>{issueLabel(i18n, k)}</button>
            ))}
          </div>
        </div>

        {needsCount && (
          <div className="form" style={{ gap: 8 }}>
            <div className="step-label"><span>4 · {t('About how many vines', 'დაახლოებით რამდენი ვაზი')}</span></div>
            <div className="num-grid" role="group" aria-label={t('How many', 'რამდენი')}>
              {[1, 2, 3, 4].map((n) => (
                <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}>{n === 4 ? '4+' : n}</button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="fr-person">{t('Who', 'ვინ')}</label>
          <select id="fr-person" value={person} onChange={(e) => setPerson(e.target.value)}>
            {KNOWN_PEOPLE.map((p) => <option key={p} value={p}>{i18n.d(p)}</option>)}
          </select>
        </div>

        <button type="button" className="btn btn-primary big-send" disabled={!ready} onClick={send} style={{ opacity: ready ? 1 : 0.45 }}>
          {ready
            ? t(`Send report · ${bayAddress(plot, row!, bay!)}`, `გაგზავნა · ${bayAddress(plot, row!, bay!)}`)
            : t('Choose row, bay and problem', 'აირჩიეთ რიგი, მონაკვეთი და პრობლემა')}
        </button>
      </div>
    </div>
  );
}

/** Side panel for one report: what the driver saw and where. */
export function ReportPanel({ plot, report, onClose }: { plot: Plot; report: BayReport; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  return (
    <div className="card card-pad form" aria-live="polite">
      <div className="vine-head">
        <div>
          <div className="eyebrow">{t('Field report', 'შეტყობინება ველიდან')}</div>
          <h2><span className="addr">{bayAddress(plot, report.row, report.bay)}</span></h2>
        </div>
        <button className="btn btn-small" onClick={onClose}>{t('Close', 'დახურვა')}</button>
      </div>
      <div className="kv"><span>{t('Problem', 'პრობლემა')}</span><b>{reportSummary(i18n, report)}</b></div>
      <div className="kv"><span>{t('Where', 'სად')}</span><span>{t(`Row ${report.row}, bay ${report.bay}`, `რიგი ${report.row}, მონაკვეთი ${report.bay}`)}</span></div>
      <div className="kv"><span>{t('Reported by', 'შეატყობინა')}</span><span>{i18n.d(report.person)} · {i18n.date(report.date)}</span></div>
      <div className="calc">
        {t('Optional: zoom in and tap the vines in this bay to mark them one by one.',
           'სურვილისამებრ: გაადიდეთ და ამ მონაკვეთში თითოეული ვაზი ცალ-ცალკე მონიშნეთ.')}
      </div>
    </div>
  );
}
