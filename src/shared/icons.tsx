import type { OperationType } from './models';

const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function OpIcon({ type }: { type: OperationType }) {
  switch (type) {
    case 'pruning': // shears
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="6" cy="17" r="3" /><circle cx="6" cy="7" r="3" />
          <path d="M8.5 15.5 20 5M8.5 8.5 20 19M14 12h0" />
        </svg>
      );
    case 'green': // leaf
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14Z" /><path d="M5 19 13 11" />
        </svg>
      );
    case 'spraying': // droplet
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" />
        </svg>
      );
    case 'harvest': // grape cluster
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 2v3M12 5c2-1 4-1 5 0" />
          <circle cx="9" cy="8.5" r="2" /><circle cx="15" cy="8.5" r="2" /><circle cx="12" cy="9" r="2" />
          <circle cx="10.5" cy="12.5" r="2" /><circle cx="13.5" cy="12.5" r="2" />
          <circle cx="12" cy="16" r="2" />
        </svg>
      );
  }
}
