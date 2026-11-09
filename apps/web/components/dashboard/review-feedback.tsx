'use client';

import { useEffect, useState } from 'react';
import type { ProjectStatus, ReviewNoteDto } from '@impactalign/types';
import { Badge, Card } from '@impactalign/ui';
import { projectsApi } from '@impactalign/api-client';

const LABELS: Record<ReviewNoteDto['kind'], string> = {
  CLARIFICATION_REQUEST: 'Clarification requested',
  DECISION_VERIFIED: 'Decision: verified',
  DECISION_REJECTED: 'Decision: rejected',
};

/** Reviewer messages and decisions on the owner's project. Reloads when the status changes. */
export function ReviewFeedback({
  projectId,
  status,
}: {
  readonly projectId: string;
  readonly status: ProjectStatus;
}) {
  const [notes, setNotes] = useState<ReviewNoteDto[]>([]);

  useEffect(() => {
    let active = true;
    projectsApi
      .feedback(projectId)
      .then((result) => {
        if (active) setNotes(result.notes);
      })
      .catch(() => {
        if (active) setNotes([]);
      });
    return () => {
      active = false;
    };
  }, [projectId, status]);

  if (notes.length === 0) return null;

  return (
    <Card>
      <h2 className="font-serif text-xl font-bold text-navy-900">Reviewer feedback</h2>
      <ul className="mt-3 space-y-4">
        {notes.map((note) => (
          <li key={note.id}>
            <p className="flex flex-wrap items-center gap-2 text-sm text-navy-700">
              <Badge tone={note.kind === 'CLARIFICATION_REQUEST' ? 'gold' : 'teal'}>
                {LABELS[note.kind]}
              </Badge>
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-navy-800">{note.message}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}