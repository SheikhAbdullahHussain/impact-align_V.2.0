'use client';

import { useState } from 'react';
import {
  SUBMISSION_TYPES,
  SUBMISSION_TYPE_LABELS,
  type ProjectDto,
  type PublicOrganization,
  type SubmissionType,
} from '@impactalign/types';
import { Button } from '@impactalign/ui';

export interface BasicValues {
  readonly title: string;
  readonly summary: string;
  readonly submissionType: SubmissionType;
  readonly organizationId: string | null;
}

const fieldClass =
  'mt-1 block w-full rounded-md border border-navy-300 bg-white px-3 py-2 text-navy-950';

export function StepBasic({
  project,
  organizations,
  busy,
  onSave,
}: {
  readonly project: ProjectDto | null;
  readonly organizations: readonly PublicOrganization[];
  readonly busy: boolean;
  readonly onSave: (values: BasicValues) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [summary, setSummary] = useState(project?.summary ?? '');
  const [submissionType, setSubmissionType] = useState<SubmissionType>(
    project?.submissionType ?? 'PROJECT_PROPOSAL',
  );
  const [organizationId, setOrganizationId] = useState(project?.organizationId ?? '');
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    setError(null);
    onSave({
      title: title.trim(),
      summary: summary.trim(),
      submissionType,
      organizationId: organizationId === '' ? null : organizationId,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <h2 className="font-serif text-xl font-bold text-navy-900">Basic information</h2>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      <div>
        <label htmlFor="basic-type" className="block text-sm font-semibold text-navy-900">
          Submission type
        </label>
        <select
          id="basic-type"
          value={submissionType}
          disabled={busy}
          onChange={(event) => setSubmissionType(event.target.value as SubmissionType)}
          className={fieldClass}
        >
          {SUBMISSION_TYPES.map((type) => (
            <option key={type} value={type}>
              {SUBMISSION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="basic-title" className="block text-sm font-semibold text-navy-900">
          Title
        </label>
        <input
          id="basic-title"
          value={title}
          maxLength={200}
          disabled={busy}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="basic-summary" className="block text-sm font-semibold text-navy-900">
          Summary
        </label>
        <textarea
          id="basic-summary"
          rows={4}
          maxLength={2000}
          value={summary}
          disabled={busy}
          onChange={(event) => setSummary(event.target.value)}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="basic-org" className="block text-sm font-semibold text-navy-900">
          Organization (optional)
        </label>
        <select
          id="basic-org"
          value={organizationId}
          disabled={busy}
          onChange={(event) => setOrganizationId(event.target.value)}
          className={fieldClass}
        >
          <option value="">No organization</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save and continue'}
      </Button>
    </form>
  );
}
