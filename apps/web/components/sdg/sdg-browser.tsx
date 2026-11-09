'use client';

import { useMemo, useState } from 'react';
import type { SdgIndicatorDto, SdgTargetDto } from '@impactalign/types';
import { Card, EmptyState } from '@impactalign/ui';

export interface SdgBrowserProps {
  readonly targets: readonly SdgTargetDto[];
  readonly indicators: readonly SdgIndicatorDto[];
}

const matches = (query: string, ...fields: (string | null)[]) =>
  fields.some((field) => field?.toLowerCase().includes(query));

/** Search and filter targets/indicators of one goal. Everything shown comes from the API. */
export function SdgBrowser({ targets, indicators }: SdgBrowserProps) {
  const [query, setQuery] = useState('');
  const [targetId, setTargetId] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return targets
      .filter((target) => !targetId || target.id === targetId)
      .map((target) => {
        const own = indicators.filter((i) => i.targetId === target.id);
        const targetHit = !q || matches(q, target.code, target.title, target.description);
        const shown = targetHit
          ? own
          : own.filter((i) => matches(q, i.code, i.title, i.description));
        return { target, indicators: shown, visible: targetHit || shown.length > 0 };
      })
      .filter((group) => group.visible);
  }, [targets, indicators, query, targetId]);

  if (targets.length === 0 && indicators.length === 0) {
    return (
      <EmptyState
        title="Targets and indicators are not loaded yet"
        description="They will appear here once the official data has been imported from a verified source."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
        <div>
          <label htmlFor="sdg-search" className="block text-sm font-semibold text-navy-900">
            Search targets and indicators
          </label>
          <input
            id="sdg-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 block h-11 w-full rounded-md border border-navy-300 bg-white px-3 text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          />
        </div>
        <div>
          <label htmlFor="sdg-target" className="block text-sm font-semibold text-navy-900">
            Target
          </label>
          <select
            id="sdg-target"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="mt-1 block h-11 w-full rounded-md border border-navy-300 bg-white px-3 text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <option value="">All targets</option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p role="status" className="mt-4 text-sm text-navy-700">
        {groups.length} {groups.length === 1 ? 'target' : 'targets'} shown
      </p>

      <ul className="mt-4 space-y-4">
        {groups.map(({ target, indicators: shown }) => (
          <li key={target.id}>
            <Card>
              <h2 className="font-serif text-xl font-bold text-navy-900">
                Target {target.code}
                {target.title ? `: ${target.title}` : ''}
              </h2>
              {target.description && <p className="mt-2 text-navy-800">{target.description}</p>}
              {shown.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-navy-100 pt-4">
                  {shown.map((indicator) => (
                    <li key={indicator.id} className="text-sm text-navy-800">
                      <strong className="text-navy-900">{indicator.code}</strong>
                      {indicator.title ? ` ${indicator.title}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}