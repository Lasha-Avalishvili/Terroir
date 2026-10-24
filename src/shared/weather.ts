// Demo weather for Gurjaani, built from the Kakheti regional reference data (Dataset A1/B1, point M1).
// Seasonal averages follow Dataset A1 (winter ≈ 2.3 °C, summer ≈ 24.3 °C).
// Each year has a deliberate "story" so the AI analysis has something real to explain.
// Replace generateYear() with a real source (Open-Meteo / field sensor) later — same output shape.

import type { WeatherDay } from './models';
import { TODAY } from './models';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9);
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const pad = (n: number) => String(n).padStart(2, '0');

// Dataset B1 — NASA POWER, 01–10.09.2025 (real values)
const B1_2025: Record<string, [number, number, number, number]> = {
  '2025-09-01': [24.12, 17.12, 31.92, 0.0],
  '2025-09-02': [23.38, 17.23, 31.58, 0.01],
  '2025-09-03': [22.11, 16.38, 29.76, 1.05],
  '2025-09-04': [20.81, 15.66, 26.62, 0.76],
  '2025-09-05': [17.9, 13.96, 22.58, 0.19],
  '2025-09-06': [19.02, 13.4, 25.35, 1.69],
  '2025-09-07': [17.59, 13.75, 23.17, 9.13],
  '2025-09-08': [16.62, 13.25, 21.83, 5.25],
  '2025-09-09': [17.5, 12.66, 23.63, 1.78],
  '2025-09-10': [16.85, 13.16, 21.29, 4.69],
};

const cache = new Map<number, WeatherDay[]>();

export function weatherForYear(year: number): WeatherDay[] {
  const hit = cache.get(year);
  if (hit) return hit;
  const r = rng(year * 7919);
  const days: WeatherDay[] = [];
  let noise = 0;
  const start = Date.UTC(year, 0, 1);
  for (let doy = 0; doy < 366; doy++) {
    const d = new Date(start + doy * 86400000);
    if (d.getUTCFullYear() !== year) break;
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const date = `${year}-${pad(m)}-${pad(day)}`;
    if (date > TODAY) break;

    noise = 0.72 * noise + gauss(r) * 1.6;
    let mean = 13.3 - 11 * Math.cos((2 * Math.PI * (doy - 15)) / 365) + noise;
    let half = 4.6 + 1.6 * Math.sin((Math.PI * (doy - 60)) / 300);

    // rain
    let pRain = m >= 3 && m <= 5 ? 0.34 : m >= 6 && m <= 8 ? 0.21 : m >= 9 && m <= 11 ? 0.23 : 0.2;
    let rainMean = m >= 3 && m <= 6 ? 7 : 5;

    // ── year stories ──
    if (year === 2023 && (m === 5 || m === 6)) {
      pRain *= 1.6; // wet late spring
      rainMean = 8;
    }
    if (year === 2024) {
      if (m >= 6 && m <= 8) pRain *= 0.45; // dry summer
      if (m === 6 && day >= 3 && day <= 12) {
        pRain = 0.85; // rainy spell — high mildew pressure
        rainMean = 9;
      }
      if (m === 7 && day >= 8 && day <= 20) {
        const peak = 1 - Math.abs(day - 14) / 7;
        mean += 5 + 3 * peak; // heatwave
        half = 7.5;
      }
    }
    if (year === 2026 && m === 4 && (day === 14 || day === 15)) {
      mean = 3.2;
      half = 5.8; // late frost night → tMin ≈ −2.6
    }

    let rainMm = r() < pRain ? Math.round(-Math.log(Math.max(r(), 1e-6)) * rainMean * 10) / 10 : 0;
    if (rainMm > 0) half *= 0.75;

    let tMean = Math.round(mean * 10) / 10;
    let tMin = Math.round((mean - half) * 10) / 10;
    let tMax = Math.round((mean + half) * 10) / 10;

    const real = B1_2025[date];
    if (real) {
      [tMean, tMin, tMax, rainMm] = real;
    }
    days.push({ date, tMin, tMax, tMean, rainMm });
  }
  cache.set(year, days);
  return days;
}

export function weatherStats(days: WeatherDay[]) {
  const summer = days.filter((d) => d.date.slice(5, 7) >= '06' && d.date.slice(5, 7) <= '08');
  return {
    hotDays: days.filter((d) => d.tMax >= 35).length,
    peakMax: Math.max(...days.map((d) => d.tMax)),
    frostAfterBudbreak: days.filter((d) => d.date.slice(5) >= '04-01' && d.date.slice(5) <= '05-15' && d.tMin < 0).length,
    summerRain: Math.round(summer.reduce((s, d) => s + d.rainMm, 0)),
    mayJunRain: Math.round(days.filter((d) => d.date.slice(5, 7) === '05' || d.date.slice(5, 7) === '06').reduce((s, d) => s + d.rainMm, 0)),
    frostMin: Math.min(...days.filter((d) => d.date.slice(5) >= '04-01' && d.date.slice(5) <= '05-15').map((d) => d.tMin)),
    totalRain: Math.round(days.reduce((s, d) => s + d.rainMm, 0)),
  };
}
