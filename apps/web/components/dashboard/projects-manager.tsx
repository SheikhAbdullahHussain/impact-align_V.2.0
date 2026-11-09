'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ProjectDto } from '@impactalign/types';
import { Badge, Button, Card, EmptyState } from '@impactalign/ui';
import { authApi, describeError, projectsApi } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';

const SDG_NUMBERS = Array.from({ length: 17 }, (_, index) => index + 1);

export function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sdgs, setSdgs] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me(); // restores the CSRF token after a page load
        const result = await projectsApi.list();
        if (active) setProjects(result.projects);
      } catch (cause) {
        if (active) {
          setError(describeError(cause));
          setProjects([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleSdg = (n: number) =>
    setSdgs((current) => (current.includes(n) ? current.filter((x) => x !== n) : [...current, n]));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    setSaving(true);
    try {
      const { project } = await projectsApi.create({
        title: title.trim(),
        summary: summary.trim(),
        sdgNumbers: sdgs,
      });
      setProjects((current) => [project, ...(current ?? [])]);
      setTitle('');
      setSummary('');
      setSdgs([]);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this project?')) return;
    setError(null);
    try {
      await projectsApi.remove(id);
      setProjects((current) => (current ?? []).filter((p) => p.id !== id));
    } catch (cause) {
      setError(describeError(cause));
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">Projects</h1>
        <p className="mt-2 text-navy-800">Projects and activities mapped to the SDG framework.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-4" aria-busy={saving}>
          <h2 className="font-serif text-xl font-bold text-navy-900">New project</h2>
          <div>
            <label htmlFor="project-title" className="block text-sm font-semibold text-navy-900">
              Title
            </label>
            <input
              id="project-title"
              value={title}
              maxLength={200}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 block h-11 w-full rounded-md border border-navy-300 bg-white px-3 text-navy-950"
            />
          </div>
          <div>
            <label htmlFor="project-summary" className="block text-sm font-semibold text-navy-900">
              Summary
            </label>
            <textarea
              id="project-summary"
              value={summary}
              maxLength={2000}
              rows={3}
              disabled={saving}
              onChange={(event) => setSummary(event.target.value)}
              className="mt-1 block w-full rounded-md border border-navy-300 bg-white px-3 py-2 text-navy-950"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Related SDGs</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SDG_NUMBERS.map((n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={sdgs.includes(n)}
                    disabled={saving}
                    onChange={() => toggleSdg(n)}
                  />
                  SDG {n}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create project'}
          </Button>
        </form>
      </Card>

      {projects === null && <p role="status">Loading projects…</p>}
      {projects !== null && projects.length === 0 && (
        <EmptyState title="No projects yet" description="Create your first project above." />
      )}
      {projects !== null && projects.length > 0 && (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-bold text-navy-900">{project.title}</h2>
                  <Badge>{STATUS_LABELS[project.status]}</Badge><Badge>{project.status}</Badge>
                </div>
                {project.summary && <p className="mt-2 text-navy-800">{project.summary}</p>}
                {project.sdgNumbers.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.sdgNumbers.map((n) => (
                      <li key={n}>
                        <Badge tone="teal">SDG {n}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/projects/${project.id}`}>Open</Link>
                  </Button>
                  {project.status === 'DRAFT' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => remove(project.id)}>
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