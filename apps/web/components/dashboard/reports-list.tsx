'use client';

import { useEffect, useState } from 'react';
import type { AssessmentReportDto } from '@impactalign/types';
import { SUBMISSION_TYPE_LABELS, type SubmissionType } from '@impactalign/types';
import { Badge, Card, EmptyState } from '@impactalign/ui';
import { authApi, describeError, reportsApi } from '@impactalign/api-client';

const formatSize = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** The owner's immutable assessment reports (one per decided project). */
export function ReportsList() {
  const [reports, setReports] = useState<AssessmentReportDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const result = await reportsApi.list();
        if (active) setReports(result.reports);
      } catch (cause) {
        if (active) {
          setError(describeError(cause));
          setReports([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">My Reports</h1>
        <p className="mt-2 text-navy-800">
          Assessment reports for projects that received a final decision.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {reports === null && <p role="status">Loading...</p>}
      {reports !== null && reports.length === 0 && !error && (
        <EmptyState
          title="No reports yet"
          description="A report appears here once your project is verified or rejected."
        />
      )}

      {reports && reports.length > 0 && (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-900">{report.title}</h2>
                    <p className="mt-1 text-sm text-navy-700">
                      {report.code} ·{' '}
                      {SUBMISSION_TYPE_LABELS[report.submissionType as SubmissionType] ??
                        report.submissionType}{' '}
                      · Decided {new Date(report.decidedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone={report.decision === 'VERIFIED' ? 'teal' : 'neutral'}>
                    {report.decision === 'VERIFIED' ? 'Verified' : 'Rejected'}
                  </Badge>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-navy-900">
                    View report
                  </summary>
                  <div className="mt-3 space-y-4 text-navy-800">
                    <section>
                      <h3 className="font-semibold">SDGs</h3>
                      <p>{report.sdgNumbers.map((n) => `SDG ${n}`).join(', ') || 'None'}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold">Targets</h3>
                      <p>{report.targets.map((t) => t.code).join(', ') || 'None'}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold">Indicators</h3>
                      <p>{report.indicators.map((i) => i.code).join(', ') || 'None'}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold">Evidence</h3>
                      {report.evidence.length === 0 ? (
                        <p>No files.</p>
                      ) : (
                        <ul className="space-y-2">
                          {report.evidence.map((file) => (
                            <li key={`${file.sha256}-${file.fileName}`} className="text-sm">
                              <span className="font-medium">{file.fileName}</span> (
                              {formatSize(file.sizeBytes)})
                              {file.indicatorCode ? ` · ${file.indicatorCode}` : ''}
                              <br />
                              <code className="break-all text-xs">SHA-256: {file.sha256}</code>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                    <section>
                      <h3 className="font-semibold">Reviewer rationale</h3>
                      <p className="whitespace-pre-wrap">{report.rationale}</p>
                    </section>
                  </div>
                </details>

                <p className="mt-4">
                  <a
                    href={reportsApi.downloadUrl(report.projectId)}
                    className="font-semibold text-navy-900 underline underline-offset-4"
                  >
                    Download report (JSON)
                  </a>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
