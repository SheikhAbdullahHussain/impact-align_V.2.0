'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { EvidenceDto, ProjectDto } from '@impactalign/types';
import { Badge, Button, Card, EmptyState } from '@impactalign/ui';
import { authApi, describeError, evidenceApi, projectsApi } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';
import { EDITABLE_PROJECT_STATUSES } from '@impactalign/types';
import { ReviewFeedback } from './review-feedback';

const ACCEPT = '.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg';
const MAX_BYTES = 8 * 1024 * 1024;
const SDG_NUMBERS = Array.from({ length: 17 }, (_, index) => index + 1);

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function EvidenceManager({ projectId }: { readonly projectId: string }) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [items, setItems] = useState<EvidenceDto[] | null>(null);
  const [sdgs, setSdgs] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me(); // restores the CSRF token after a page load
        const [p, e] = await Promise.all([projectsApi.get(projectId), evidenceApi.list(projectId)]);
        if (active) {
          setProject(p.project);
          setSdgs(p.project.sdgNumbers);
          setItems(e.evidence);
        }
      } catch (cause) {
        if (active) {
          setError(describeError(cause));
          setItems([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  const isDraft = project ? EDITABLE_PROJECT_STATUSES.includes(project.status) : false;
  const hasSdgs = (project?.sdgNumbers.length ?? 0) > 0;
  const hasEvidence = (items?.length ?? 0) > 0;

  const toggleSdg = (n: number) =>
    setSdgs((current) => (current.includes(n) ? current.filter((x) => x !== n) : [...current, n]));

  async function saveSdgs() {
    if (!project) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await projectsApi.update(project.id, {
        title: project.title,
        summary: project.summary,
        sdgNumbers: sdgs,
      });
      setProject(result.project);
      setSdgs(result.project.sdgNumbers);
      setMessage('SDGs saved.');
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(action: 'submit' | 'withdraw') {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await (action === 'submit'
        ? projectsApi.submit(projectId)
        : projectsApi.withdraw(projectId));
      setProject(result.project);
      setMessage(action === 'submit' ? 'Project submitted.' : 'Project moved back to drafts.');
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const file = input.current?.files?.[0];
    if (!file) {
      setError('Choose a file first.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('The file is too large (maximum 8 MB).');
      return;
    }
    setUploading(true);
    try {
      const { evidence } = await evidenceApi.upload(projectId, file);
      setItems((current) => [evidence, ...(current ?? [])]);
      if (input.current) input.current.value = '';
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this file?')) return;
    setError(null);
    setMessage(null);
    try {
      await evidenceApi.remove(projectId, id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
    } catch (cause) {
      setError(describeError(cause));
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm">
          <Link href="/dashboard/projects" className="font-semibold text-navy-900 underline underline-offset-4">
            ← Projects
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            {project ? project.title : 'Project evidence'}
          </h1>
          {project && <Badge tone={isDraft ? 'neutral' : 'gold'}>{STATUS_LABELS[project.status]}</Badge>}
        </div>
        <p className="mt-2 text-navy-800">Upload files that support this project&apos;s SDG claims.</p>
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

      {project && (
        <Card>
          <h2 className="font-serif text-xl font-bold text-navy-900">Submission</h2>
          <ul className="mt-3 space-y-1 text-sm text-navy-800">
            <li>{hasSdgs ? '✓' : '✗'} At least one SDG selected</li>
            <li>{hasEvidence ? '✓' : '✗'} At least one evidence file uploaded</li>
          </ul>

          {isDraft && (
            <>
              <fieldset className="mt-4" disabled={busy}>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={saveSdgs}>
                  Save SDGs
                </Button>
                <Button
                  type="button"
                  disabled={busy || !hasSdgs || !hasEvidence}
                  onClick={() => changeStatus('submit')}
                >
                  Submit project
                </Button>
              </div>
            </>
          )}

          {project.status === 'SUBMITTED' && (
            <div className="mt-4">
              <p className="text-sm text-navy-800">
                Submitted{project.submittedAt ? ` on ${new Date(project.submittedAt).toLocaleDateString()}` : ''}.
                The project is locked while it waits for review.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={busy}
                onClick={() => changeStatus('withdraw')}
              >
                Withdraw submission
              </Button>
            </div>
          )}

          {!isDraft && project.status !== 'SUBMITTED' && (
            <p className="mt-4 text-sm text-navy-800">This project is locked while it is being reviewed.</p>
          )}
        </Card>
      )}
      {project && <ReviewFeedback projectId={projectId} status={project.status} />}
      {isDraft && (
        <Card>
          <form onSubmit={onUpload} className="space-y-4" aria-busy={uploading}>
            <h2 className="font-serif text-xl font-bold text-navy-900">Upload evidence</h2>
            <div>
              <label htmlFor="evidence-file" className="block text-sm font-semibold text-navy-900">
                File (PDF, DOCX, XLSX, CSV, PNG, JPG, up to 8 MB)
              </label>
              <input
                id="evidence-file"
                ref={input}
                type="file"
                accept={ACCEPT}
                disabled={uploading}
                className="mt-1 block w-full text-sm"
              />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </form>
        </Card>
      )}

      {items === null && <p role="status">Loading evidence…</p>}
      {items !== null && items.length === 0 && (
        <EmptyState title="No evidence yet" description="Uploaded files will appear here." />
      )}
      {items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-navy-900">{item.fileName}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-navy-700">
                    <Badge tone="teal">{item.fileName.split('.').pop()?.toUpperCase()}</Badge>
                    {formatSize(item.sizeBytes)} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={evidenceApi.fileUrl(projectId, item.id)}>Download</a>
                  </Button>
                  {isDraft && (
                    <Button type="button" variant="outline" size="sm" onClick={() => remove(item.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}