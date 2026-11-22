'use client';

import { useState } from 'react';
import { SUBMISSION_TYPE_LABELS, type ProjectDto } from '@impactalign/types';
import { Button } from '@impactalign/ui';

export function StepDeclaration({
  project,
  organizationName,
  evidenceCount,
  linkedCount,
  busy,
  onBack,
  onSubmit,
}: {
  readonly project: ProjectDto;
  readonly organizationName: string | null;
  readonly evidenceCount: number;
  readonly linkedCount: number;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
}) {
  const [declared, setDeclared] = useState(false);
  const hasSdgs = project.sdgNumbers.length > 0;
  const hasEvidence = evidenceCount > 0;
  const ready = hasSdgs && hasEvidence;

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-navy-900">Declaration</h2>

      <dl className="grid gap-4 rounded-xl border border-navy-100 bg-white p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-navy-700">Type</dt>
          <dd className="mt-1">{SUBMISSION_TYPE_LABELS[project.submissionType]}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-navy-700">Organization</dt>
          <dd className="mt-1">{organizationName ?? 'None'}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-navy-700">SDGs</dt>
          <dd className="mt-1">{project.sdgNumbers.map((n) => `SDG ${n}`).join(', ') || 'None'}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-navy-700">Mapped</dt>
          <dd className="mt-1">
            {project.targetIds.length} targets, {project.indicatorIds.length} indicators
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-navy-700">Evidence</dt>
          <dd className="mt-1">
            {evidenceCount} files, {linkedCount} linked to an indicator
          </dd>
        </div>
      </dl>

      <ul className="space-y-1 text-sm text-navy-800">
        <li>{hasSdgs ? '✓' : '✗'} At least one SDG selected</li>
        <li>{hasEvidence ? '✓' : '✗'} At least one evidence file uploaded</li>
      </ul>

      <label className="flex items-start gap-2 text-sm text-navy-900">
        <input
          type="checkbox"
          checked={declared}
          disabled={busy}
          onChange={(event) => setDeclared(event.target.checked)}
          className="mt-1"
        />
        <span>
          I declare that the information and evidence in this submission are accurate and that I am
          entitled to share them with ImpactAlign for assessment.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={busy || !declared || !ready} onClick={onSubmit}>
          {busy ? 'Submitting…' : 'Submit for assessment'}
        </Button>
      </div>
    </div>
  );
}
