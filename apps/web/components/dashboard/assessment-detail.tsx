'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AssessmentDetailDto } from '@impactalign/types';
import { Badge, Button, Card } from '@impactalign/ui';
import { assessmentsApi, authApi, describeError } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';

const NOTE_LABELS = {
  CLARIFICATION_REQUEST: 'Clarification requested',
  DECISION_VERIFIED: 'Decision: verified',
  DECISION_REJECTED: 'Decision: rejected',
} as const;

const fieldClass =
  'mt-1 block w-full rounded-md border border-navy-300 bg-white px-3 py-2 text-navy-950';

export function AssessmentDetail({ projectId }: { readonly projectId: string }) {
  const [detail, setDetail] = useState<AssessmentDetailDto | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clarification, setClarification] = useState('');
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rationale, setRationale] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const result = await assessmentsApi.get(projectId);
        if (active) setDetail(result.assessment);
      } catch (cause) {
        if (active) setError(describeError(cause));
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, version]);

  async function run(action: () => Promise<unknown>, success: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await action();
      setMessage(success);
      setClarification('');
      setRationale('');
      setVersion((v) => v + 1);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  const project = detail?.project;
  const underMyReview = project?.status === 'UNDER_REVIEW' && detail?.assignedToMe === true;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm">
          <Link href="/dashboard/assessments" className="font-semibold text-navy-900 underline underline-offset-4">
            ← Review queue
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            {project ? project.title : 'Assessment'}
          </h1>
          {project && <Badge tone="gold">{STATUS_LABELS[project.status]}</Badge>}
        </div>
        {detail && <p className="mt-2 text-navy-800">Submitted by {detail.ownerName}</p>}
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-md border border-teal-700 bg-teal-50 p-3 text-sm text-teal-900">
          {message}
        </p>
      )}

      {detail && project && (
        <>
          <Card>
            <h2 className="font-serif text-xl font-bold text-navy-900">Project</h2>
            {project.summary && <p className="mt-2 whitespace-pre-wrap text-navy-800">{project.summary}</p>}
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.sdgNumbers.map((n) => (
                <li key={n}>
                  <Badge tone="teal">SDG {n}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-xl font-bold text-navy-900">Evidence</h2>
            {detail.evidence.length === 0 && <p className="mt-2 text-navy-800">No files.</p>}
            <ul className="mt-3 space-y-2">
              {detail.evidence.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="break-words text-navy-900">{item.fileName}</span>
                  <Button asChild variant="outline" size="sm">
                    <a href={assessmentsApi.fileUrl(projectId, item.id)}>Download</a>
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          {detail.notes.length > 0 && (
            <Card>
              <h2 className="font-serif text-xl font-bold text-navy-900">History</h2>
              <ul className="mt-3 space-y-4">
                {detail.notes.map((note) => (
                  <li key={note.id}>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-navy-700">
                      <Badge>{NOTE_LABELS[note.kind]}</Badge>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-navy-800">{note.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {project.status === 'SUBMITTED' && (
            <Card>
              <h2 className="font-serif text-xl font-bold text-navy-900">Start review</h2>
              <p className="mt-2 text-navy-800">Taking the project assigns it to you.</p>
              <Button
                type="button"
                className="mt-3"
                disabled={busy}
                onClick={() => run(() => assessmentsApi.start(projectId), 'Review started.')}
              >
                Start review
              </Button>
            </Card>
          )}

          {project.status === 'UNDER_REVIEW' && !underMyReview && (
            <p className="text-navy-800">This project is being reviewed by another reviewer.</p>
          )}

          {project.status === 'CLARIFICATION_REQUIRED' && (
            <p className="text-navy-800">Waiting for the applicant to respond and resubmit.</p>
          )}

          {underMyReview && (
            <>
              <Card>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (clarification.trim().length < 10) {
                      setError('Write at least 10 characters.');
                      return;
                    }
                    void run(
                      () => assessmentsApi.requestClarification(projectId, clarification.trim()),
                      'Clarification sent to the applicant.',
                    );
                  }}
                >
                  <h2 className="font-serif text-xl font-bold text-navy-900">Request clarification</h2>
                  <label htmlFor="clarification" className="block text-sm font-semibold text-navy-900">
                    What does the applicant need to add or explain?
                  </label>
                  <textarea
                    id="clarification"
                    rows={3}
                    maxLength={2000}
                    value={clarification}
                    disabled={busy}
                    onChange={(event) => setClarification(event.target.value)}
                    className={fieldClass}
                  />
                  <Button type="submit" variant="outline" disabled={busy}>
                    Send request
                  </Button>
                </form>
              </Card>

              {detail.canDecide ? (
                <Card>
                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (rationale.trim().length < 20) {
                        setError('Write a rationale of at least 20 characters.');
                        return;
                      }
                      if (!window.confirm(`Record the decision "${decision}"? This is final.`)) return;
                      void run(
                        () => assessmentsApi.decide(projectId, { decision, rationale: rationale.trim() }),
                        'Decision recorded.',
                      );
                    }}
                  >
                    <h2 className="font-serif text-xl font-bold text-navy-900">Final decision</h2>
                    <label htmlFor="decision" className="block text-sm font-semibold text-navy-900">
                      Decision
                    </label>
                    <select
                      id="decision"
                      value={decision}
                      disabled={busy}
                      onChange={(event) => setDecision(event.target.value as 'VERIFIED' | 'REJECTED')}
                      className={fieldClass}
                    >
                      <option value="VERIFIED">Verified</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <label htmlFor="rationale" className="block text-sm font-semibold text-navy-900">
                      Rationale (shown to the applicant)
                    </label>
                    <textarea
                      id="rationale"
                      rows={4}
                      maxLength={4000}
                      value={rationale}
                      disabled={busy}
                      onChange={(event) => setRationale(event.target.value)}
                      className={fieldClass}
                    />
                    <Button type="submit" disabled={busy}>
                      Record decision
                    </Button>
                  </form>
                </Card>
              ) : (
                <p className="text-navy-800">Only an assessor can give the final decision.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}