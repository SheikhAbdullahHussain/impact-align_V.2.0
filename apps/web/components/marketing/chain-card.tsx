import { chainSteps } from '@/lib/home-content';

/** The platform's core model, shown as a connected vertical chain (decorative numbers, real concept). */
export function ChainCard() {
  return (
    <figure className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
      <figcaption className="text-xs font-semibold uppercase tracking-widest text-gold-400">
        The ImpactAlign chain
      </figcaption>
      <ol className="mt-5">
        {chainSteps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
            {index < chainSteps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-4 top-9 h-[calc(100%-1.5rem)] w-px bg-white/25"
              />
            )}
            <span
              aria-hidden="true"
              className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-navy-950"
            >
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-white">{step.title}</p>
              <p className="text-sm text-navy-100">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
