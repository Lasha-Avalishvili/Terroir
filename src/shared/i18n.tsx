import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OperationType, VineStatus, WineColor } from './models';

// Two languages: English (for the jury) and Georgian (for the wineries).
// Usage in components:  const { t } = useI18n();  t('Estate', 'მამული')
// Demo data (notes, varieties, people) is translated at display time with the dictionaries below,
// so what a user types is always shown exactly as typed.

export type Lang = 'en' | 'ka';

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
};

const OPS: Record<Lang, Record<OperationType, string>> = {
  en: { pruning: 'Pruning', green: 'Green work', spraying: 'Spraying', harvest: 'Harvest' },
  ka: { pruning: 'სხვლა', green: 'მწვანე ოპერაციები', spraying: 'შეწამვლა', harvest: 'რთველი' },
};
const STATUS: Record<Lang, Record<VineStatus, string>> = {
  en: { healthy: 'Healthy', damaged: 'Damaged', missing: 'Missing', replaced: 'Replaced' },
  ka: { healthy: 'ჯანსაღი', damaged: 'დაზიანებული', missing: 'აკლია', replaced: 'შეცვლილი' },
};
const WINE: Record<Lang, Record<WineColor, string>> = {
  en: { red: 'red', white: 'white', amber: 'amber', rose: 'rosé' },
  ka: { red: 'წითელი', white: 'თეთრი', amber: 'ქარვისფერი', rose: 'ვარდისფერი' },
};

const KA_WORDS: Record<string, string> = {
  // varieties
  Saperavi: 'საფერავი', Rkatsiteli: 'რქაწითელი', Kisi: 'ქისი', 'Mtsvane Kakhuri': 'მწვანე კახური', Khikhvi: 'ხიხვი',
  Chinuri: 'ჩინური', Tsitska: 'ციცქა', Tsolikouri: 'ცოლიკოური', Alexandrouli: 'ალექსანდროული', Ojaleshi: 'ოჯალეში',
  // people
  'Giorgi B.': 'გიორგი ბ.', 'Nino K.': 'ნინო კ.', 'Levan M.': 'ლევან მ.', 'Davit T.': 'დავით თ.',
  // places, products, training
  Gurjaani: 'გურჯაანი',
  'Bordeaux mixture (copper)': 'ბორდოს ნარევი (სპილენძი)', 'Wettable sulfur': 'სველებადი გოგირდი', 'Copper oxychloride': 'სპილენძის ქლორჟანგი',
  'Double Guyot': 'ორმხრივი გიიო', 'Single Guyot': 'ცალმხრივი გიიო', Cordon: 'კორდონი', 'Pergola (Kakhuri)': 'ტალავერი (კახური)',
  // demo notes
  'Winter pruning; cut canes taken out of the plot.': 'ზამთრის სხვლა; მოჭრილი რქები ნაკვეთიდან გატანილია.',
  'Extra and weak shoots removed.': 'ზედმეტი და სუსტი ყლორტები მოცილებულია.',
  'Shoots tied to the support wires.': 'ყლორტები მავთულზეა მიმაგრებული.',
  'Leaves thinned in the cluster zone.': 'მტევნების ზონაში ფოთოლი შეთხელებულია.',
  'Treatment against fungal diseases.': 'დამუშავება სოკოვანი დაავადებების წინააღმდეგ.',
  'Picked by hand, taken to the winery the same day.': 'ხელით დაიკრიფა და იმავე დღეს მარანში მივიდა.',
  'Delayed — sprayer pump broken in June. Mildew spots seen in rows 14–17.': 'დაგვიანდა — ივნისში შესაწამლი აპარატის ტუმბო გაფუჭდა. 14–17 რიგებში ჭრაქის ლაქები შეინიშნა.',
  'Picked by hand. 6,000 kg in total taken to the winery the same day. (Dataset A2)': 'ხელით დაიკრიფა. სულ 6 000 კგ იმავე დღეს მარანში მივიდა. (მონაცემები A2)',
  'Leaf striping, dry canes. Possible trunk disease (esca). Check before pruning.': 'ფოთლების ზოლიანობა, გამხმარი რქები. შესაძლოა მერქნის დაავადება (ესკა). შეამოწმეთ სხვლამდე.',
  'Broken arm, low vigour.': 'მოტეხილი მხარი, სუსტი ზრდა.',
  'Dead vine removed.': 'გამხმარი ვაზი ამოღებულია.',
  'Downy mildew on leaves and clusters.': 'ჭრაქი ფოთლებსა და მტევნებზე.',
  'Died after the 2024 mildew outbreak. Removed.': 'გახმა 2024 წლის ჭრაქის შემდეგ. ამოღებულია.',
  'Dead vine removed after harvest.': 'გამხმარი ვაზი რთველის შემდეგ ამოღებულია.',
  'Young shoots burnt by the 14–15 April frost.': '14–15 აპრილის ყინვამ ახალგაზრდა ყლორტები დაწვა.',
  'Did not recover after frost. Removed.': 'ყინვის შემდეგ ვერ აღდგა. ამოღებულია.',
  'Weak vine, low vigour.': 'სუსტი ვაზი, დაბალი ზრდა.',
  'Removed and replanted on rootstock.': 'ამოღებულია და ხელახლა დარგულია საძირეზე.',
  'Weak vine, few clusters.': 'სუსტი ვაზი, ცოტა მტევანი.',
  'Hail damage on canes.': 'რქები სეტყვამ დააზიანა.',
  'Replanted (Rkatsiteli on rootstock).': 'ხელახლა დარგულია (რქაწითელი საძირეზე).',
  'Chlorosis on leaves.': 'ფოთლებზე ქლოროზი.',
  'Young vine did not take root.': 'ახალგაზრდა ვაზი არ გაიხარა.',
  'Replanted.': 'ხელახლა დარგულია.',
};

export interface I18n {
  lang: Lang;
  setLang(l: Lang): void;
  /** Pick the string for the current language. */
  t(en: string, ka: string): string;
  /** Translate a known data value (variety, person, demo note…); unknown text is returned as typed. */
  d(value: string | undefined): string;
  plotName(name: string): string;
  op(t: OperationType): string;
  status(s: VineStatus): string;
  wine(c: WineColor): string;
  batchLabel(label: string): string;
  num(n: number): string;
  date(iso: string): string; // 24 Oct 2026
  dayMonth(iso: string): string; // 24 Oct
  month(i: number): string;
}

const Ctx = createContext<I18n | null>(null);
const KEY = 'terroir-lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem(KEY) === 'ka' ? 'ka' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const ka = lang === 'ka';
    const d = (v: string | undefined) => (v ? (ka ? KA_WORDS[v] ?? v : v) : '');
    const parts = (iso: string) => {
      const [y, m, day] = iso.split('-').map(Number);
      return { y, m: m - 1, day };
    };
    return {
      lang,
      setLang: setLangState,
      t: (en, kaStr) => (ka ? kaStr : en),
      d,
      plotName: (name) => (ka ? name.replace(/^Plot (\d+)$/, 'ნაკვეთი $1') : name),
      op: (o) => OPS[lang][o],
      status: (s) => STATUS[lang][s],
      wine: (c) => WINE[lang][c],
      batchLabel: (label) => {
        if (!ka) return label;
        let out = label;
        for (const [en, k] of Object.entries(KA_WORDS)) out = out.split(en).join(k);
        return out
          .replace('qvevri', 'ქვევრის')
          .replace('classic', 'კლასიკური')
          .replace(/\bred\b/, 'წითელი')
          .replace(/\bwhite\b/, 'თეთრი')
          .replace(/\bamber\b/, 'ქარვისფერი');
      },
      num: (n) => (ka ? n.toLocaleString('en-US').replace(/,/g, ' ') : n.toLocaleString('en-US')),
      date: (iso) => {
        const p = parts(iso);
        return `${p.day} ${MONTHS[lang][p.m]} ${p.y}`;
      },
      dayMonth: (iso) => {
        const p = parts(iso);
        return `${p.day} ${MONTHS[lang][p.m]}`;
      },
      month: (i) => MONTHS[lang][i],
    };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside LangProvider');
  return v;
}
