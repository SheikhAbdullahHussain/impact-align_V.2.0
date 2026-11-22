'use client';

import { useEffect, useState } from 'react';
import {
  SUBMISSION_TYPE_LABELS,
  type CertificateStatus,
  type PublicVerificationDto,
  type SubmissionType,
} from '@impactalign/types';
import { Badge, Card } from '@impactalign/ui';
import { verifyApi } from '@impactalign/api-client';

const STATUS_TEXT: Record<CertificateStatus, { label: string; note: string }> = {
  VALID: { label: 'Valid', note: 'This certificate is currently valid.' },
  EXPIRED: {
    label: 'Expired',
    note: 'This certificate was valid but its validity period has ended.',
  },
  REVOKED: { label: 'Revoked', note: 'This certificate was revoked and is no longer valid.' },
};

const day = (iso: string) => new Date(iso).toLocaleDateString();

/** Public result for a certificate code. Shows only what the API exposes publicly. */
export function VerifyResult({ code }: { readonly code: string }) {
  const [result, setResult] = useState<PublicVerificationDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    verifyApi
      .get(code)
      .then((response) => {
        if (active) setResult(response.verification);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">Certificate verification</h1>
        <p className="mt-2 text-navy-800">Checks a certificate code against our records.</p>
      </header>

      {loading && <p role="status">Checking...</p>}

      {failed && (
        <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-navy-900">
          No certificate was found for this code, or it could not be checked right now.
        </p>
      )}

      {result && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-navy-900">{result.title}</h2>
            <Badge
              tone={
                result.status === 'VALID'
                  ? 'teal'
                  : result.status === 'EXPIRED'
                    ? 'gold'
                    : 'neutral'
              }
            >
              {STATUS_TEXT[result.status].label}
            </Badge>
          </div>
          <p role="status" className="mt-2 text-navy-800">
            {STATUS_TEXT[result.status].note}
          </p>
          <dl className="mt-4 space-y-2 text-navy-800">
            <div>
              <dt className="font-semibold">Submission code</dt>
              <dd>{result.code}</dd>
            </div>
            <div>
              <dt className="font-semibold">Certificate number</dt>
              <dd>{result.certificateNumber}</dd>
            </div>
            <div>
              <dt className="font-semibold">Type</dt>
              <dd>
                {SUBMISSION_TYPE_LABELS[result.submissionType as SubmissionType] ??
                  result.submissionType}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Goals</dt>
              <dd>{result.sdgNumbers.map((n) => `SDG ${n}`).join(', ') || 'None'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Issued</dt>
              <dd>{day(result.issuedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Valid until</dt>
              <dd>{day(result.expiresAt)}</dd>
            </div>
            {result.revokedAt && (
              <div>
                <dt className="font-semibold">Revoked on</dt>
                <dd>{day(result.revokedAt)}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}
    </div>
  );
}
