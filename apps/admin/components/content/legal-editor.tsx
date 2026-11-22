'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ContentStatus, LegalContentDto } from '@impactalign/types';
import { Badge, Button, Card } from '@impactalign/ui';
import { adminSiteContentApi, authApi } from '@impactalign/api-client';
import { reason } from '../../lib/errors';
export function LegalEditor({
  contentKey,
  label,
}: {
  readonly contentKey: string;
  readonly label: string;
}) {
  const [title, setTitle] = useState(label);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const { entry } = await adminSiteContentApi.get('legal', contentKey);
        if (!active) return;
        if (entry) {
          const data = entry.data as LegalContentDto;
          setTitle(data.title);
          setBody(data.body);
          setStatus(entry.status);
        }
      } catch (cause) {
        if (active) setError(reason(cause));
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [contentKey]);

  async function save(next: ContentStatus) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { entry } = await adminSiteContentApi.save('legal', contentKey, {
        status: next,
        data: { title: title.trim(), body },
      });
      setStatus(entry.status);
      setMessage(
        next === 'PUBLISHED' ? 'Published. The website now shows this text.' : 'Draft saved.',
      );
    } catch (cause) {
      setError(reason(cause));
    } finally {
      setBusy(false);
    }
  }

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
        <Card>
          <label htmlFor="legal-title" className="block font-semibold text-navy-900">
            Title
          </label>
          <input
            id="legal-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-md border border-navy-700 p-2"
          />

          <label htmlFor="legal-body" className="mt-4 block font-semibold text-navy-900">
            Text
          </label>
          <p className="mt-1 text-sm text-navy-700">
            Plain text. Start a line with ## for a heading and - for a bullet. Leave a blank line
            between paragraphs.
          </p>
          <textarea
            id="legal-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={20}
            className="mt-2 w-full rounded-md border border-navy-700 p-2 font-mono text-sm"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => save('DRAFT')} disabled={busy}>
              Save draft
            </Button>
            <Button onClick={() => save('PUBLISHED')} disabled={busy}>
              Publish
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
