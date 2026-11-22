'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ContentStatus } from '@impactalign/types';
import { Badge, Button, Card } from '@impactalign/ui';

/** Common frame of the content editors: title, status, messages and Save/Publish buttons. */
export function EditorShell({
  label,
  status,
  loaded,
  busy,
  error,
  message,
  onSave,
  extraActions,
  children,
}: {
  readonly label: string;
  readonly status: ContentStatus | null;
  readonly loaded: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly message: string | null;
  readonly onSave: (status: ContentStatus) => void;
  readonly extraActions?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">{label}</h1>
          <p className="mt-2 text-navy-800">
            <Link href="/console/content" className="underline underline-offset-4">
              Back to website content
            </Link>
          </p>
        </div>
        <Badge tone={status === 'PUBLISHED' ? 'teal' : status === 'DRAFT' ? 'gold' : 'neutral'}>
          {status === 'PUBLISHED' ? 'Published' : status === 'DRAFT' ? 'Draft' : 'Built-in text'}
        </Badge>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!loaded && <p role="status">Loading...</p>}

      {loaded && (
        <>
          {children}
          <Card className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => onSave('DRAFT')} disabled={busy}>
              Save draft
            </Button>
            <Button onClick={() => onSave('PUBLISHED')} disabled={busy}>
              Publish
            </Button>
            {extraActions}
          </Card>
        </>
      )}
    </div>
  );
}
