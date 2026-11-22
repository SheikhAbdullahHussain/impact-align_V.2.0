'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  EDITABLE_PROJECT_STATUSES,
  SUBMISSION_TYPE_LABELS,
  type EvidenceDto,
  type ProjectDto,
  type PublicOrganization,
} from '@impactalign/types';
import { Badge, Button, Card, cn } from '@impactalign/ui';
import {
  authApi,
  describeError,
  evidenceApi,
  organizationsApi,
  projectsApi,
} from '@impactalign/api-client';
import { EvidenceManager } from '@/components/dashboard/evidence-manager';
import { ReviewFeedback } from '@/components/dashboard/review-feedback';
import { STATUS_LABELS } from '@/lib/project-status';
import { StepAlignment, type AlignmentValues } from './step-alignment';
import { StepBasic, type BasicValues } from './step-basic';
import { StepDeclaration } from './step-declaration';
import { StepEvidence } from './step-evidence';
import { useCatalogue } from './use-catalogue';

const STEPS = ['Basic Info', 'SDG Alignment', 'Evidence', 'Declaration'] as const;

export function SubmissionWizard({ projectId }: { readonly projectId?: string }) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [items, setItems] = useState<EvidenceDto[]>([]);
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<ProjectDto | null>(null);
  const { catalogue } = useCatalogue(project?.sdgNumbers ?? []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me(); // restores the CSRF token after a page load
        const [orgs, loaded] = await Promise.all([
          organizationsApi.list().catch(() => ({ organizations: [] as PublicOrganization[] })),
          projectId
            ? Promise.all([projectsApi.get(projectId), evidenceApi.list(projectId)])
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setOrganizations(orgs.organizations);
        if (loaded) {
          setProject(loaded[0].project);
          setItems(loaded[1].evidence);
        }
      } catch (cause) {
        if (active) setError(describeError(cause));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  const saveBasic = (values: BasicValues) =>
    run(async () => {
      const result = project
        ? await projectsApi.update(project.id, {
            title: values.title,
            summary: values.summary,
            sdgNumbers: project.sdgNumbers,
            submissionType: values.submissionType,
            organizationId: values.organizationId,
          })
        : await projectsApi.create({
            title: values.title,
            summary: values.summary,
            sdgNumbers: [],
            submissionType: values.submissionType,
            organizationId: values.organizationId,
          });
      setProject(result.project);
      setStep(1);
    });

  /** Add SDGs first, then map, then remove SDGs: every call is valid for the server's rules. */
  const saveAlignment = (values: AlignmentValues) =>
    run(async () => {
      if (!project) return;
      const base = { title: project.title, summary: project.summary };
      const union = [...new Set([...project.sdgNumbers, ...values.sdgNumbers])].sort(
        (a, b) => a - b,
      );
      let current = project;
      try {
        if (union.length !== current.sdgNumbers.length) {
          current = (await projectsApi.update(project.id, { ...base, sdgNumbers: union })).project;
        }
        current = (
          await projectsApi.setAlignment(project.id, {
            targetIds: values.targetIds,
            indicatorIds: values.indicatorIds,
          })
        ).project;
        if (values.sdgNumbers.length !== union.length) {
          current = (
            await projectsApi.update(project.id, { ...base, sdgNumbers: values.sdgNumbers })
          ).project;
        }
        setItems((await evidenceApi.list(project.id)).evidence); // removed indicators unlink files
        setStep(2);
      } finally {
        setProject(current);
      }
    });

  const submit = () =>
    run(async () => {
      if (!project) return;
      setSubmitted((await projectsApi.submit(project.id, true)).project);
    });

  if (loading) return <p role="status">Loading…</p>;

  if (project && !EDITABLE_PROJECT_STATUSES.includes(project.status) && !submitted) {
    return <EvidenceManager projectId={project.id} />;
  }

  if (projectId && !project) {
    return (
      <div className="space-y-3">
        <p role="alert">{error ?? 'Project not found.'}</p>
        <Link
          href="/dashboard/projects"
          className="font-semibold text-navy-900 underline underline-offset-4"
        >
          ← Projects
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-bold text-navy-900">Submission received</h1>
          <p className="mt-2 text-navy-800">{submitted.title} is now waiting for human review.</p>
        </header>
        <Card>
          <p className="text-sm font-semibold text-navy-700">Your submission code</p>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-900">{submitted.code ?? ''}</p>
          <p className="mt-3 text-sm text-navy-800">
            Keep this code to refer to this submission. You can follow its status under My
            Submissions.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/submissions">My Submissions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/projects">All projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const allIndicators = Object.values(catalogue).flatMap((entry) => entry.indicators);
  const indicatorOptions = (project?.indicatorIds ?? []).map((id) => {
    const found = allIndicators.find((indicator) => indicator.id === id);
    return {
      id,
      label: found ? `${found.code}${found.title ? ` ${found.title}` : ''}` : 'Indicator',
    };
  });
  const organizationName =
    organizations.find((organization) => organization.id === project?.organizationId)?.name ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm">
          <Link
            href="/dashboard/projects"
            className="font-semibold text-navy-900 underline underline-offset-4"
          >
            ← Projects
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            {project ? project.title : 'New submission'}
          </h1>
          {project && <Badge tone="teal">{SUBMISSION_TYPE_LABELS[project.submissionType]}</Badge>}
          {project?.code && <Badge tone="gold">{project.code}</Badge>}
          {project && <Badge>{STATUS_LABELS[project.status]}</Badge>}
        </div>
      </header>

      <ol aria-label="Submission steps" className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? 'step' : undefined}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              index === step
                ? 'border-navy-900 bg-white font-semibold text-navy-900'
                : 'border-navy-100 bg-navy-50 text-navy-700',
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {project?.status === 'CLARIFICATION_REQUIRED' && (
        <ReviewFeedback projectId={project.id} status={project.status} />
      )}

      <Card>
        {step === 0 && (
          <StepBasic
            project={project}
            organizations={organizations}
            busy={busy}
            onSave={saveBasic}
          />
        )}
        {step === 1 && project && (
          <StepAlignment
            project={project}
            busy={busy}
            onSave={saveAlignment}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && project && (
          <StepEvidence
            projectId={project.id}
            items={items}
            onItemsChange={setItems}
            indicators={indicatorOptions}
            onError={setError}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && project && (
          <StepDeclaration
            project={project}
            organizationName={organizationName}
            evidenceCount={items.length}
            linkedCount={items.filter((item) => item.indicatorId !== null).length}
            busy={busy}
            onBack={() => setStep(2)}
            onSubmit={submit}
          />
        )}
      </Card>
    </div>
  );
}
