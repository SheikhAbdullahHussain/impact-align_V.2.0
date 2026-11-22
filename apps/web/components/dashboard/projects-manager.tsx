'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SUBMISSION_TYPE_LABELS, type ProjectDto } from '@impactalign/types';
import { Badge, Button, Card, EmptyState } from '@impactalign/ui';
import { authApi, describeError, projectsApi } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';

export function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">Projects</h1>
          <p className="mt-2 text-navy-800">Projects and activities mapped to the SDG framework.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">New submission</Link>
        </Button>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      {projects === null && <p role="status">Loading projects…</p>}
      {projects !== null && projects.length === 0 && (
        <EmptyState title="No projects yet" description="Start your first submission above." />
      )}
      {projects !== null && projects.length > 0 && (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-bold text-navy-900">{project.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="teal">{SUBMISSION_TYPE_LABELS[project.submissionType]}</Badge>
                    {project.code && <Badge tone="gold">{project.code}</Badge>}
                    <Badge>{STATUS_LABELS[project.status]}</Badge>
                  </div>
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
                    <Link href={`/dashboard/projects/${project.id}`}>
                      {project.status === 'DRAFT' ? 'Continue' : 'Open'}
                    </Link>
                  </Button>
                  {project.status === 'DRAFT' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(project.id)}
                    >
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
