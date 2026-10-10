import { AI_GENERATED_LABEL } from '@impactalign/ai';
import { Badge, Card } from '@impactalign/ui';
import { aiPrinciples } from '@/lib/home-content';

export function AiPanel() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <ul className="space-y-4">
        {aiPrinciples.map((principle) => (
          <li key={principle} className="flex gap-3 text-lg text-navy-800">
            <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-teal-700" />
            {principle}
          </li>
        ))}
      </ul>
      <Card tone="muted" aria-label="Example of the AI label">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          Example label
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-navy-300 bg-white p-4">
          <Badge tone="teal">{AI_GENERATED_LABEL}</Badge>
          <p className="mt-3 text-navy-800">
            Suggested recommendations will always appear with a label like this, next to the human
            reviewer&apos;s decision.
          </p>
        </div>
        <p className="mt-3 text-xs text-navy-700">
          Illustration of the labelling rule — no AI output is shown yet.
        </p>
      </Card>
    </div>
  );
}
