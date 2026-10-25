import { methodSteps } from '@/lib/home-content';

/** Diagnose → Align → Measure → Validate → Improve, as numbered steps joined by a line on wide screens. */
export function MethodSteps() {
  return (
    <ol className="grid gap-6 md:grid-cols-5">
      {methodSteps.map((step, index) => (
        <li key={step.title} className="relative">
          {index < methodSteps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-12 top-6 hidden h-px w-[calc(100%-2rem)] bg-navy-200 md:block"
            />
          )}
          <span
            aria-hidden="true"
            className="relative z-10 flex size-12 items-center justify-center rounded-full bg-navy-900 font-serif text-xl font-bold text-gold-400"
          >
            {index + 1}
          </span>
          <h3 className="mt-4 font-serif text-xl font-bold text-navy-900">{step.title}</h3>
          <p className="mt-1 text-navy-800">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
