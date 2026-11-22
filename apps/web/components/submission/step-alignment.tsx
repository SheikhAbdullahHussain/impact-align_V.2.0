'use client';

import { useState } from 'react';
import type { ProjectDto } from '@impactalign/types';
import { Button } from '@impactalign/ui';
import { useCatalogue } from './use-catalogue';

const SDG_NUMBERS = Array.from({ length: 17 }, (_, index) => index + 1);

export interface AlignmentValues {
  readonly sdgNumbers: number[];
  readonly targetIds: string[];
  readonly indicatorIds: string[];
}

function CodeLabel({ code, title }: { readonly code: string; readonly title: string | null }) {
  return (
    <span>
      <strong>{code}</strong>
      {title ? ` ${title}` : ''}
    </span>
  );
}

export function StepAlignment({
  project,
  busy,
  onSave,
  onBack,
}: {
  readonly project: ProjectDto;
  readonly busy: boolean;
  readonly onSave: (values: AlignmentValues) => void;
  readonly onBack: () => void;
}) {
  const [sdgs, setSdgs] = useState<number[]>([...project.sdgNumbers]);
  const [targets, setTargets] = useState<string[]>([...project.targetIds]);
  const [indicators, setIndicators] = useState<string[]>([...project.indicatorIds]);
  const { catalogue, failed } = useCatalogue(sdgs);

  function toggleSdg(number: number) {
    if (!sdgs.includes(number)) {
      setSdgs((current) => [...current, number].sort((a, b) => a - b));
      return;
    }
    setSdgs((current) => current.filter((n) => n !== number));
    const entry = catalogue[number];
    if (entry) {
      const targetIdsOfSdg = new Set(entry.targets.map((t) => t.id));
      const indicatorIdsOfSdg = new Set(entry.indicators.map((i) => i.id));
      setTargets((current) => current.filter((id) => !targetIdsOfSdg.has(id)));
      setIndicators((current) => current.filter((id) => !indicatorIdsOfSdg.has(id)));
    }
  }

  function toggleTarget(id: string, indicatorIdsOfTarget: readonly string[]) {
    if (targets.includes(id)) {
      setTargets((current) => current.filter((x) => x !== id));
      setIndicators((current) => current.filter((x) => !indicatorIdsOfTarget.includes(x)));
    } else {
      setTargets((current) => [...current, id]);
    }
  }

  const toggleIndicator = (id: string) =>
    setIndicators((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-navy-900">SDG alignment</h2>

      <fieldset disabled={busy}>
        <legend className="text-sm font-semibold text-navy-900">Related SDGs</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SDG_NUMBERS.map((n) => (
            <label
              key={n}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3 py-1 text-sm"
            >
              <input type="checkbox" checked={sdgs.includes(n)} onChange={() => toggleSdg(n)} />
              SDG {n}
            </label>
          ))}
        </div>
      </fieldset>

      {sdgs.length === 0 && (
        <p className="text-sm text-navy-800">Select at least one SDG to continue.</p>
      )}

      {sdgs.map((number) => {
        const entry = catalogue[number];
        const loose = entry ? entry.indicators.filter((i) => i.targetId === null) : [];
        return (
          <fieldset key={number} disabled={busy} className="rounded-lg border border-navy-100 p-4">
            <legend className="px-1 font-semibold text-navy-900">SDG {number}</legend>
            {!entry && (
              <p role="status" className="text-sm text-navy-700">
                {failed ? 'The catalogue could not be loaded.' : 'Loading targets…'}
              </p>
            )}
            {entry && entry.targets.length === 0 && loose.length === 0 && (
              <p className="text-sm text-navy-700">
                No targets or indicators have been imported for this goal yet.
              </p>
            )}
            {entry && (
              <ul className="space-y-3">
                {entry.targets.map((target) => {
                  const own = entry.indicators.filter((i) => i.targetId === target.id);
                  const selected = targets.includes(target.id);
                  return (
                    <li key={target.id}>
                      <label className="flex items-start gap-2 text-sm text-navy-900">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleTarget(
                              target.id,
                              own.map((i) => i.id),
                            )
                          }
                          className="mt-1"
                        />
                        <CodeLabel code={target.code} title={target.title} />
                      </label>
                      {selected && own.length > 0 && (
                        <ul className="ml-6 mt-2 space-y-2">
                          {own.map((indicator) => (
                            <li key={indicator.id}>
                              <label className="flex items-start gap-2 text-sm text-navy-800">
                                <input
                                  type="checkbox"
                                  checked={indicators.includes(indicator.id)}
                                  onChange={() => toggleIndicator(indicator.id)}
                                  className="mt-1"
                                />
                                <CodeLabel code={indicator.code} title={indicator.title} />
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
                {loose.map((indicator) => (
                  <li key={indicator.id}>
                    <label className="flex items-start gap-2 text-sm text-navy-800">
                      <input
                        type="checkbox"
                        checked={indicators.includes(indicator.id)}
                        onChange={() => toggleIndicator(indicator.id)}
                        className="mt-1"
                      />
                      <CodeLabel code={indicator.code} title={indicator.title} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={busy || sdgs.length === 0}
          onClick={() => onSave({ sdgNumbers: sdgs, targetIds: targets, indicatorIds: indicators })}
        >
          {busy ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </div>
  );
}
