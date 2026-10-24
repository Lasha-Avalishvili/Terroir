// PRE-GENERATED "AI" CONTENT FOR THE DEMO.
// The wording was written in advance; numbers are filled in from the live data so the
// text always matches what the app shows. In production this module would call an LLM
// with the same inputs (operations, vine events, weather) and return the same shape.

import type { AppState } from '../../shared/store';
import { plotVineCounts } from '../../shared/store';
import type { Plot, VineyardOperation } from '../../shared/models';
import { weatherForYear, weatherStats } from '../../shared/weather';
import type { I18n } from '../../shared/i18n';

export const YEARS = [2023, 2024, 2025, 2026];

export type Impact = 'neg' | 'pos' | 'neutral';
export type FactorKind = 'Weather' | 'Spraying' | 'Vine health' | 'Vine age';

export interface Factor {
  kind: FactorKind;
  impact: Impact;
  text: string;
}

export interface YearInsight {
  year: number;
  tPerHa: number | null;
  changePct: number | null;
  headline: string;
  summary: string;
  factors: Factor[];
}

export type AdviceLevel = 'act' | 'plan' | 'watch';

export interface Advice {
  id: string;
  plotId: string;
  level: AdviceLevel;
  title: string;
  why: string;
  action: string;
  when: string;
}


export function yieldFor(state: AppState, plot: Plot, year: number) {
  const kg = state.operations
    .filter((o) => o.plotId === plot.id && o.type === 'harvest' && o.date.startsWith(String(year)))
    .reduce((s, o) => s + (o.kg ?? 0), 0);
  return kg ? { kg, tPerHa: Math.round((kg / plot.areaHa / 1000) * 10) / 10 } : null;
}

function sprays(ops: VineyardOperation[], plotId: string, year: number) {
  const list = ops
    .filter((o) => o.plotId === plotId && o.type === 'spraying' && o.date.startsWith(String(year)))
    .map((o) => o.date)
    .sort();
  let gap = 0;
  let gapFrom = '';
  let gapTo = '';
  for (let i = 1; i < list.length; i++) {
    const d = (Date.parse(list[i]) - Date.parse(list[i - 1])) / 86400000;
    if (d > gap) {
      gap = d;
      gapFrom = list[i - 1];
      gapTo = list[i];
    }
  }
  const litres = ops
    .filter((o) => o.plotId === plotId && o.type === 'spraying' && o.date.startsWith(String(year)))
    .reduce((s, o) => s + (o.solutionL ?? 0), 0);
  return { count: list.length, gap, gapFrom, gapTo, litres };
}

export function buildAnalysis(state: AppState, plot: Plot, i: I18n): YearInsight[] {
  const L = i.t;
  const dm = i.dayMonth;
  const w = Object.fromEntries(YEARS.map((y) => [y, weatherStats(weatherForYear(y))]));
  const s = Object.fromEntries(YEARS.map((y) => [y, sprays(state.operations, plot.id, y)]));
  const y = Object.fromEntries(YEARS.map((yr) => [yr, yieldFor(state, plot, yr)]));
  const counts = plotVineCounts(plot, state.vines);
  const change = (yr: number) => {
    const a = y[yr - 1]?.kg;
    const b = y[yr]?.kg;
    return a && b ? Math.round(((b - a) / a) * 100) : null;
  };
  const sprayFactor = (yr: number): Factor => ({
    kind: 'Spraying',
    impact: s[yr].gap > 40 ? 'neg' : 'pos',
    text:
      s[yr].gap > 40
        ? L(`${s[yr].gap} days without spraying (${dm(s[yr].gapFrom)} – ${dm(s[yr].gapTo)}).`,
            `${s[yr].gap} დღე შეწამვლის გარეშე (${dm(s[yr].gapFrom)} – ${dm(s[yr].gapTo)}).`)
        : L(`${s[yr].count} sprays, longest gap ${s[yr].gap} days. Steady protection.`,
            `${s[yr].count} შეწამვლა, ყველაზე დიდი შუალედი ${s[yr].gap} დღე. სტაბილური დაცვა.`),
  });

  const base = (yr: number, headline: string, summary: string, factors: Factor[]): YearInsight => ({
    year: yr,
    tPerHa: y[yr]?.tPerHa ?? null,
    changePct: change(yr),
    headline,
    summary,
    factors,
  });

  if (plot.id === 'p1') {
    return [
      base(2023, L('Strongest season of the four', 'ოთხი სეზონიდან საუკეთესო'),
        L('A wet May and June raised disease pressure, but sprays kept a steady rhythm and the crop stayed clean.',
          'წვიმიანმა მაისმა და ივნისმა დაავადების რისკი გაზარდა, მაგრამ შეწამვლა რეგულარულად ტარდებოდა და მოსავალი სუფთა დარჩა.'),
        [
          { kind: 'Weather', impact: 'neutral', text: L(`${w[2023].mayJunRain} mm of rain in May–June, high mildew pressure.`, `მაის–ივნისში ${w[2023].mayJunRain} მმ ნალექი, ჭრაქის მაღალი რისკი.`) },
          sprayFactor(2023),
          { kind: 'Vine health', impact: 'neutral', text: L('15 missing vines, 11 weak vines replanted in April.', '15 ვაზი აკლია, აპრილში 11 სუსტი ვაზი ხელახლა დაირგო.') },
        ]),
      base(2024, L('Large drop: heat plus a spraying gap', 'დიდი კლება: სიცხე და შეწამვლის შეფერხება'),
        L('Plot 2 had the same weather but lost only 14%. The extra loss on Plot 1 most likely comes from the spraying gap during a rainy June, when the sprayer pump was broken.',
          'ნაკვეთ 2-ზე იგივე ამინდი იყო, მაგრამ მოსავალი მხოლოდ 14%-ით შემცირდა. ნაკვეთ 1-ის დამატებითი დანაკარგი, სავარაუდოდ, წვიმიან ივნისში შეწამვლის შეფერხებითაა გამოწვეული, როცა აპარატის ტუმბო გაფუჭებული იყო.'),
        [
          { kind: 'Weather', impact: 'neg', text: L(`July heatwave: ${w[2024].hotDays} days at or above 35 °C, peak ${w[2024].peakMax.toFixed(1)} °C. Summer rain only ${w[2024].summerRain} mm.`, `ივლისის სიცხე: ${w[2024].hotDays} დღე 35 °C-ზე მეტი, მაქსიმუმი ${w[2024].peakMax.toFixed(1)} °C. ზაფხულის ნალექი მხოლოდ ${w[2024].summerRain} მმ.`) },
          { ...sprayFactor(2024), text: L(`${s[2024].gap} days without spraying (${dm(s[2024].gapFrom)} – ${dm(s[2024].gapTo)}), across a rainy spell on 3–12 June. Mildew seen in rows 14–17.`, `${s[2024].gap} დღე შეწამვლის გარეშე (${dm(s[2024].gapFrom)} – ${dm(s[2024].gapTo)}), მათ შორის 3–12 ივნისის წვიმიან პერიოდში. 14–17 რიგებში ჭრაქი გამოჩნდა.`) },
          { kind: 'Vine health', impact: 'neg', text: L('9 vines in rows 14–17 died after the mildew outbreak, on the border of the Saperavi and Mtsvane Kakhuri blocks.', '14–17 რიგებში ჭრაქის შემდეგ 9 ვაზი გახმა, საფერავისა და მწვანე კახურის ბლოკების საზღვარზე.') },
        ]),
      base(2025, L('Recovery with a regular spray rhythm', 'აღდგენა რეგულარული შეწამვლით'),
        L('Normal weather and sprays every 3–5 weeks (Dataset A2 log). The 6,000 kg harvest went to batches B-2025-02 (Saperavi, 4,300 kg) and B-2025-03 (Mtsvane Kakhuri, 1,700 kg).',
          'ნორმალური ამინდი და შეწამვლა ყოველ 3–5 კვირაში (მონაცემები A2). 6 000 კგ მოსავალი წავიდა პარტიებში B-2025-02 (საფერავი, 4 300 კგ) და B-2025-03 (მწვანე კახური, 1 700 კგ).'),
        [
          { kind: 'Weather', impact: 'pos', text: L(`No heatwave: ${w[2025].hotDays === 1 ? 'only 1 day' : `${w[2025].hotDays} days`} at or above 35 °C.`, `სიცხის ტალღა არ ყოფილა: 35 °C-ზე მეტი მხოლოდ ${w[2025].hotDays} დღე.`) },
          sprayFactor(2025),
          { kind: 'Vine health', impact: 'neg', text: L('31 vines missing and not replanted, about 75 kg of grapes lost.', '31 ვაზი აკლია და არ დარგულა — დაახლოებით 75 კგ ყურძნის დანაკარგი.') },
        ]),
      base(2026, L('Late frost and more vine losses', 'გვიანი ყინვა და მეტი დაკარგული ვაზი'),
        L('Spraying was on time. The loss comes from the April frost and a growing number of missing and damaged vines.',
          'შეწამვლა დროულად ჩატარდა. დანაკარგი აპრილის ყინვით და დაკარგული და დაზიანებული ვაზების ზრდით არის გამოწვეული.'),
        [
          { kind: 'Weather', impact: 'neg', text: L(`Frost after bud break on 14–15 April, down to ${w[2026].frostMin.toFixed(1)} °C. Young shoots burnt.`, `ყინვა კვირტის გაშლის შემდეგ, 14–15 აპრილს, ${w[2026].frostMin.toFixed(1)} °C-მდე. ახალგაზრდა ყლორტები დაიწვა.`) },
          sprayFactor(2026),
          { kind: 'Vine health', impact: 'neg', text: L(`${counts.missing} missing and ${counts.damaged} damaged vines. 18 vines replanted in April will bear fruit from about 2029.`, `${counts.missing} ვაზი აკლია, ${counts.damaged} დაზიანებულია. აპრილში დარგული 18 ვაზი მოსავალს დაახლოებით 2029 წლიდან მოგვცემს.`) },
        ]),
    ];
  }

  if (plot.id === 'p2') {
    return [
      base(2023, L('Normal season', 'ნორმალური სეზონი'), L('Good crop. Wet late spring, handled with four sprays.', 'კარგი მოსავალი. წვიმიანი გვიანი გაზაფხული ოთხი შეწამვლით გადაიჭრა.'),
        [
          { kind: 'Weather', impact: 'neutral', text: L(`${w[2023].mayJunRain} mm of rain in May–June.`, `მაის–ივნისში ${w[2023].mayJunRain} მმ ნალექი.`) },
          sprayFactor(2023),
        ]),
      base(2024, L('Heat cost about 14%', 'სიცხემ დაახლოებით 14% წაიღო'),
        L('The July heatwave reduced berry size. Sprays stayed on schedule, so there was no disease loss.', 'ივლისის სიცხემ მარცვალი დააპატარავა. შეწამვლა გრაფიკით ტარდებოდა, ამიტომ დაავადებით დანაკარგი არ ყოფილა.'),
        [
          { kind: 'Weather', impact: 'neg', text: L(`${w[2024].hotDays} days at or above 35 °C in July, summer rain ${w[2024].summerRain} mm.`, `ივლისში ${w[2024].hotDays} დღე 35 °C-ზე მეტი, ზაფხულის ნალექი ${w[2024].summerRain} მმ.`) },
          sprayFactor(2024),
        ]),
      base(2025, L('Back to normal', 'ნორმას დაუბრუნდა'), L('Normal weather. 30 dead vines replanted in April (first crop around 2028).', 'ნორმალური ამინდი. აპრილში 30 გამხმარი ვაზი ხელახლა დაირგო (პირველი მოსავალი დაახლოებით 2028 წელს).'),
        [
          { kind: 'Weather', impact: 'pos', text: L('Normal summer temperatures.', 'ზაფხულის ნორმალური ტემპერატურა.') },
          sprayFactor(2025),
          { kind: 'Vine health', impact: 'neutral', text: L('30 vines replanted in April 2025.', '2025 წლის აპრილში 30 ვაზი ხელახლა დაირგო.') },
        ]),
      base(2026, L('Best season of the four', 'ოთხი სეზონიდან საუკეთესო'), L('No frost damage was recorded on this plot and protection was steady.', 'ამ ნაკვეთზე ყინვის დაზიანება არ დაფიქსირებულა და დაცვა სტაბილური იყო.'),
        [
          { kind: 'Weather', impact: 'neutral', text: L('April frost did not damage this plot.', 'აპრილის ყინვამ ეს ნაკვეთი არ დააზიანა.') },
          sprayFactor(2026),
          { kind: 'Vine health', impact: 'neutral', text: L(`${counts.damaged} vines damaged by hail in July.`, `ივლისში სეტყვამ ${counts.damaged} ვაზი დააზიანა.`) },
        ]),
    ];
  }

  if (plot.id === 'p3') {
    return YEARS.map((yr) =>
      base(yr, yr === 2023 ? L('Young vineyard, still growing', 'ახალგაზრდა ვენახი, ჯერ კიდევ იზრდება') : L('Yield rising with vine age', 'მოსავალი ვაზის ასაკთან ერთად იზრდება'),
        L(`Planted in ${plot.plantedYear}. Vines are ${yr - plot.plantedYear} years old, so the crop is still growing toward full production.`,
          `დარგულია ${plot.plantedYear} წელს. ვაზები ${yr - plot.plantedYear} წლისაა, ამიტომ მოსავალი ჯერ კიდევ იზრდება სრული მსხმოიარობისკენ.`),
        [
          { kind: 'Vine age', impact: 'pos', text: L(`Vine age ${yr - plot.plantedYear} years. Full crop is expected from about year 8.`, `ვაზის ასაკი ${yr - plot.plantedYear} წელი. სრული მოსავალი დაახლოებით მე-8 წლიდან არის მოსალოდნელი.`) },
          sprayFactor(yr),
          ...(yr === 2024 ? [{ kind: 'Weather' as const, impact: 'neg' as const, text: L('The July heatwave slowed growth, but vine age had a stronger effect.', 'ივლისის სიცხემ ზრდა შეანელა, მაგრამ ვაზის ასაკის გავლენა უფრო ძლიერი იყო.') }] : []),
        ]),
    );
  }

  // Plots created in the app: no history yet.
  return [];
}

export function buildAdvice(state: AppState, i: I18n): Advice[] {
  const L = i.t;
  const fmt = i.num;
  const out: Advice[] = [];
  const byId = Object.fromEntries(state.plots.map((p) => [p.id, p]));
  const p1 = byId.p1;
  const p2 = byId.p2;
  const p3 = byId.p3;

  if (p1) {
    const c = plotVineCounts(p1, state.vines);
    const s26 = sprays(state.operations, 'p1', 2026);
    const days = Math.ceil(c.standing / 250);
    out.push(
      { id: 'a1', plotId: 'p1', level: 'act', when: L('Before 1 December', '1 დეკემბრამდე'),
        title: L('Check the damaged group in rows 6–8 before pruning', 'სხვლამდე შეამოწმეთ დაზიანებული ვაზები 6–8 რიგებში'),
        why: L('14 vines in rows 6–8 show leaf striping and dry canes (noted 18 July). This may be trunk disease, which can spread through pruning cuts.',
               '6–8 რიგებში 14 ვაზს აქვს ფოთლების ზოლიანობა და გამხმარი რქები (შენიშნულია 18 ივლისს). შესაძლოა ეს მერქნის დაავადებაა, რომელიც სხვლის ჭრილობებით ვრცელდება.'),
        action: L('Mark these vines, prune them last and clean the shears between vines. Ask an agronomist to confirm.',
                  'მონიშნეთ ეს ვაზები, გასხლეთ ბოლოს და ვაზებს შორის გაასუფთავეთ სასხლავი. დასადასტურებლად მიმართეთ აგრონომს.') },
      { id: 'a2', plotId: 'p1', level: 'plan', when: L('December – February', 'დეკემბერი – თებერვალი'),
        title: L('Plan winter pruning', 'დაგეგმეთ ზამთრის სხვლა'),
        why: L(`Last season this plot was pruned on 11 February. ${fmt(c.standing)} vines are standing.`, `წინა სეზონში ეს ნაკვეთი 11 თებერვალს გაისხლა. მდგარია ${fmt(c.standing)} ვაზი.`),
        action: L(`Book the crew. At about 250 vines per person per day this is around ${days} person-days. Adjust to your team's pace.`,
                  `დაჯავშნეთ მუშები. დღეში ერთ კაცზე დაახლოებით 250 ვაზით, ეს დაახლოებით ${days} კაც-დღეა. მოარგეთ თქვენი გუნდის ტემპს.`) },
      { id: 'a3', plotId: 'p1', level: 'plan', when: L('Order by January', 'შეუკვეთეთ იანვრამდე'),
        title: L(`Order ${c.missing} replacement vines`, `შეუკვეთეთ ${c.missing} ნერგი`),
        why: L(`${c.missing} vines are missing, up from 15 in 2023. At this plot's yield each missing vine costs about 2.5 kg of grapes a year.`,
               `${c.missing} ვაზი აკლია (2023 წელს 15 იყო). ამ ნაკვეთის მოსავლიანობით თითოეული დაკარგული ვაზი წელიწადში დაახლოებით 2.5 კგ ყურძენი ღირს.`),
        action: L('Order Saperavi (rows 1–14) and Mtsvane Kakhuri (rows 15–20) plants on rootstock now. The vine register shows exactly which places are empty.',
                  'ახლავე შეუკვეთეთ საფერავის (1–14 რიგები) და მწვანე კახურის (15–20 რიგები) ნერგები საძირეზე. ვაზების რეესტრში ზუსტად ჩანს, რომელი ადგილებია ცარიელი.') },
      { id: 'a4', plotId: 'p1', level: 'plan', when: L('By March', 'მარტამდე'),
        title: L('Get spray materials and the sprayer ready', 'მოამზადეთ პრეპარატები და შესაწამლი აპარატი'),
        why: L(`This season used ${s26.count} sprays and ${fmt(s26.litres)} L of working solution on Plot 1. In 2024 a broken pump left a 49-day gap and the plot lost 28% of its harvest.`,
               `ამ სეზონში ნაკვეთ 1-ზე ჩატარდა ${s26.count} შეწამვლა და დაიხარჯა ${fmt(s26.litres)} ლ სამუშაო ხსნარი. 2024 წელს გაფუჭებული ტუმბოს გამო 49-დღიანი შუალედი გაჩნდა და ნაკვეთმა მოსავლის 28% დაკარგა.`),
        action: L('Check product stock, service the sprayer in February and plan the first spray before mid-May.',
                  'შეამოწმეთ პრეპარატების მარაგი, თებერვალში გაასწორეთ აპარატი და პირველი შეწამვლა მაისის შუამდე დაგეგმეთ.') },
      { id: 'a5', plotId: 'p1', level: 'watch', when: L('From early April', 'აპრილის დასაწყისიდან'),
        title: L('Frost risk after bud break', 'ყინვის რისკი კვირტის გაშლის შემდეგ'),
        why: L('The 14–15 April 2026 frost burnt young shoots and 6 vines died.', '2026 წლის 14–15 აპრილის ყინვამ ახალგაზრდა ყლორტები დაწვა და 6 ვაზი გახმა.'),
        action: L('Watch the forecast from early April. Record any frost damage per row so it shows in next year’s analysis.',
                  'აპრილის დასაწყისიდან ადევნეთ თვალი ამინდის პროგნოზს. ყინვის დაზიანება რიგების მიხედვით ჩაწერეთ, რომ შემდეგი წლის ანალიზში გამოჩნდეს.') },
    );
  }
  if (p2) {
    const c = plotVineCounts(p2, state.vines);
    const days = Math.ceil(c.standing / 250);
    out.push(
      { id: 'b1', plotId: 'p2', level: 'plan', when: L('December – February', 'დეკემბერი – თებერვალი'),
        title: L('Plan winter pruning', 'დაგეგმეთ ზამთრის სხვლა'),
        why: L(`${fmt(c.standing)} vines are standing on Plot 2.`, `ნაკვეთ 2-ზე მდგარია ${fmt(c.standing)} ვაზი.`),
        action: L(`About ${days} person-days at 250 vines per person per day.`, `დაახლოებით ${days} კაც-დღე, დღეში ერთ კაცზე 250 ვაზით.`) },
      { id: 'b2', plotId: 'p2', level: 'watch', when: L('During pruning', 'სხვლის დროს'),
        title: L(`Check ${c.damaged} hail-damaged vines`, `შეამოწმეთ სეტყვით დაზიანებული ${c.damaged} ვაზი`),
        why: L('Hail on 22 July damaged canes on 6 vines.', '22 ივლისის სეტყვამ 6 ვაზს რქები დაუზიანა.'),
        action: L('Choose healthy canes for next year. Mark vines that do not recover as missing.', 'შემდეგი წლისთვის აარჩიეთ ჯანსაღი რქები. ვაზები, რომლებიც ვერ აღდგება, მონიშნეთ როგორც დაკარგული.') },
      { id: 'b3', plotId: 'p2', level: 'plan', when: L('Order by January', 'შეუკვეთეთ იანვრამდე'),
        title: L(`Order ${c.missing} replacement vines`, `შეუკვეთეთ ${c.missing} ნერგი`),
        why: L(`${c.missing} vines are missing since 2023.`, `2023 წლიდან ${c.missing} ვაზი აკლია.`),
        action: L('Plant Rkatsiteli on rootstock in March–April.', 'დარგეთ რქაწითელი საძირეზე მარტ–აპრილში.') },
    );
  }
  if (p3) {
    const c = plotVineCounts(p3, state.vines);
    out.push(
      { id: 'c1', plotId: 'p3', level: 'plan', when: L('Before bud break', 'კვირტის გაშლამდე'),
        title: L('Check trellis posts and wires', 'შეამოწმეთ ბოძები და მავთულები'),
        why: L('The crop on this young plot grew 14% in 2026 and keeps growing. Heavier canes load the trellis more.', 'ამ ახალგაზრდა ნაკვეთზე მოსავალი 2026 წელს 14%-ით გაიზარდა და კვლავ იზრდება. მძიმე რქები შპალერს მეტად ტვირთავს.'),
        action: L('Walk the rows in February and tighten or replace weak wires and posts.', 'თებერვალში შემოიარეთ რიგები და გაჭიმეთ ან შეცვალეთ სუსტი მავთულები და ბოძები.') },
      { id: 'c2', plotId: 'p3', level: 'plan', when: L('Order by January', 'შეუკვეთეთ იანვრამდე'),
        title: L(`Fill ${c.missing} empty places`, `შეავსეთ ${c.missing} ცარიელი ადგილი`),
        why: L(`${c.missing} young vines never took root.`, `${c.missing} ახალგაზრდა ვაზი არ გაიხარა.`),
        action: L('Plant Kisi on rootstock in spring.', 'გაზაფხულზე დარგეთ ქისი საძირეზე.') },
    );
  }
  return out;
}
