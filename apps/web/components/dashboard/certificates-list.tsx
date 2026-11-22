'use client';

import { useEffect, useState } from 'react';
import {
  SUBMISSION_TYPE_LABELS,
  type CertificateDto,
  type SubmissionType,
} from '@impactalign/types';
import { Badge, Card, EmptyState } from '@impactalign/ui';
import { authApi, certificatesApi, describeError } from '@impactalign/api-client';

const day = (iso: string) => new Date(iso).toLocaleDateString();

const NOTE = {
  VALID: null,
  EXPIRED: 'This certificate has expired, so it cannot be downloaded.',
  REVOKED: 'This certificate was revoked, so it cannot be downloaded.',
} as const;

/** The owner's certificates (one per verified project). */
export function CertificatesList() {
  const [certs, setCerts] = useState<CertificateDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const result = await certificatesApi.list();
        if (active) setCerts(result.certificates);
      } catch (cause) {
        if (active) {
          setError(describeError(cause));
          setCerts([]);
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
        <h1 className="font-serif text-3xl font-bold text-navy-900">My Certificates</h1>
        <p className="mt-2 text-navy-800">Certificates issued for your verified projects.</p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {certs === null && <p role="status">Loading...</p>}
      {certs !== null && certs.length === 0 && !error && (
        <EmptyState
          title="No certificates yet"
          description="A certificate is issued when your project is verified."
        />
      )}

      {certs && certs.length > 0 && (
        <ul className="space-y-4">
          {certs.map((cert) => (
            <li key={cert.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-900">{cert.title}</h2>
                    <p className="mt-1 text-sm text-navy-700">
                      {cert.code} · {cert.certificateNumber} ·{' '}
                      {SUBMISSION_TYPE_LABELS[cert.submissionType as SubmissionType] ??
                        cert.submissionType}
                    </p>
                    <p className="mt-1 text-sm text-navy-700">
                      Issued {day(cert.issuedAt)} · Valid until {day(cert.expiresAt)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      cert.status === 'VALID'
                        ? 'teal'
                        : cert.status === 'EXPIRED'
                          ? 'gold'
                          : 'neutral'
                    }
                  >
                    {cert.status === 'VALID'
                      ? 'Valid'
                      : cert.status === 'EXPIRED'
                        ? 'Expired'
                        : 'Revoked'}
                  </Badge>
                </div>

                {NOTE[cert.status] && (
                  <p className="mt-3 text-sm text-navy-800">{NOTE[cert.status]}</p>
                )}

                <p className="mt-4 flex flex-wrap gap-4">
                  {cert.status === 'VALID' && (
                    <a
                      href={certificatesApi.downloadUrl(cert.projectId)}
                      className="font-semibold text-navy-900 underline underline-offset-4"
                    >
                      Download certificate (PDF)
                    </a>
                  )}
                  <a
                    href={`/verify/${cert.code}`}
                    className="font-semibold text-navy-900 underline underline-offset-4"
                  >
                    Public verification page
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
