import Link from 'next/link';
import { Badge } from '@impactalign/ui';
import { SDG_COUNT } from '@/lib/home-content';

const numbers = Array.from({ length: SDG_COUNT }, (_, index) => index + 1);

/**
 * Preview of the 17-goal explorer. It shows goal NUMBERS only: official titles, targets and
 * indicators are not hard-coded and will load from the platform database in the SDG explorer phase.
 */
export function SdgPreviewGrid() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone="gold">Preview</Badge>
        <p className="text-sm text-navy-200">
          Official goal titles, targets and indicators will load from the platform.
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
        {numbers.map((n) => (
          <li key={n}>
            <Link
              href="/sdgs"
              aria-label={`Sustainable Development Goal ${n}`}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              <span className="text-xs uppercase tracking-wide text-navy-200">SDG</span>
              <span className="font-serif text-2xl font-bold">{n}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/sdgs"
            className="flex aspect-square items-center justify-center rounded-xl bg-gold-400 p-2 text-center text-xs font-bold text-navy-950 hover:bg-gold-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Explore all
          </Link>
        </li>
      </ul>
    </div>
  );
}
