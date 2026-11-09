'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AssessmentQueueItemDto } from '@impactalign/types';
import { Badge, Card, EmptyState } from '@impactalign/ui';
import { ApiError, assessmentsApi, authApi, describeError } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';

export function AssessmentsHome() {
  const [items, setItems] = useState<AssessmentQueueItemDto[] | null>(null);
  const [isReviewer, setIsReviewer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const result = await assessmentsApi.queue();
        if (active) setItems(result.queue);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 403) setIsReviewer(false);
        else setError(describeError(cause));
        setItems([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">My Assessments</h1>
        <p className="mt-2 text-navy-800">
          {isReviewer
            ? 'Submitted projects waiting for human review.'
            : 'Assessments of your submissions by qualified human reviewers.'}
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      {!isReviewer && (
        <Card>
          <p className="text-navy-800">
            Reviewer feedback and decisions appear on each project page. Open one from{' '}
            <Link href="/dashboard/submissions" className="font-semibold text-navy-900 underline underline-offset-4">
              My Submissions
            </Link>
            .
          </p>
        </Card>
      )}

      {isReviewer && items === null && <p role="status">Loading queue…</p>}
      {isReviewer && items !== null && items.length === 0 && (
        <EmptyState title="The queue is empty" description="Submitted projects will appear here." />
      )}
      {isReviewer && items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.project.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/assessments/${item.project.id}`}
                    className="font-serif text-lg font-bold text-navy-900 underline-offset-4 hover:underline"
                  >
                    {item.project.title}
                  </Link>
                  <p className="mt-1 text-sm text-navy-700">
                    By {item.ownerName}
                    {item.project.submittedAt
                      ? ` · submitted ${new Date(item.project.submittedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.assignedToMe && <Badge tone="teal">Assigned to you</Badge>}
                  <Badge tone="gold">{STATUS_LABELS[item.project.status]}</Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}