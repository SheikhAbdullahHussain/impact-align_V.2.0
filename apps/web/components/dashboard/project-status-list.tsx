'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ProjectDto } from '@impactalign/types';
import { Badge, Card, EmptyState } from '@impactalign/ui';
import { authApi, describeError, projectsApi } from '@impactalign/api-client';
import { STATUS_LABELS } from '@/lib/project-status';

const COPY = {
  drafts: {
    title: 'Drafts',
    description: 'Work in progress that has not been submitted.',
    empty: 'No drafts yet',
  },
  submissions: {
    title: 'My Submissions',
    description: 'Projects you have submitted, with their review status.',
    empty: 'No submissions yet',
  },
} as const;

export function ProjectStatusList({ mode }: { readonly mode: 'drafts' | 'submissions' }) {
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
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

  const copy = COPY[mode];
  const shown = (projects ?? []).filter((p) => (mode === 'drafts') === (p.status === 'DRAFT'));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">{copy.title}</h1>
        <p className="mt-2 text-navy-800">{copy.description}</p>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {projects === null && <p role="status">Loading…</p>}
      {projects !== null && shown.length === 0 && (
        <EmptyState title={copy.empty} description="Projects will appear here." />
      )}
      {shown.length > 0 && (
        <ul className="space-y-3">
          {shown.map((project) => (
            <li key={project.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-serif text-lg font-bold text-navy-900 underline-offset-4 hover:underline"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-1 text-sm text-navy-700">
                    {project.submittedAt
                      ? `Submitted ${new Date(project.submittedAt).toLocaleDateString()}`
                      : `Updated ${new Date(project.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge tone={project.status === 'DRAFT' ? 'neutral' : 'gold'}>
                  {STATUS_LABELS[project.status]}
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}