import { journeySteps } from '@/lib/home-content';

export function Journey() {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {journeySteps.map((step, index) => (
        <li key={step.title} className="rounded-xl border border-white/15 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
            Stage {index + 1}
          </p>
          <h3 className="mt-2 font-serif text-xl font-bold text-white">{step.title}</h3>
          <p className="mt-1 text-navy-100">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
