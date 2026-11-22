'use client';

import { useState } from 'react';
import type { CertificateDto } from '@impactalign/types';
import { Badge, Button, Card } from '@impactalign/ui';
import { authApi, certificatesApi, describeError } from '@impactalign/api-client';

const day = (iso: string) => new Date(iso).toLocaleDateString();

/** ASSESSOR tool: find a certificate by its submission code and revoke it with a reason. */
export function AccreditationPanel() {
  const [code, setCode] = useState('');
  const [cert, setCert] = useState<CertificateDto | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function find() {
    setError(null);
    setMessage(null);
    setCert(null);
    setBusy(true);
    try {
      await authApi.me();
      setCert((await certificatesApi.lookup(code.trim())).certificate);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!cert) return;
    setError(null);
    setBusy(true);
    try {
      const result = await certificatesApi.revoke(cert.projectId, reason.trim());
      setCert(result.certificate);
      setReason('');
      setMessage('Certificate revoked.');
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">Accreditation</h1>
        <p className="mt-2 text-navy-800">
          Find a certificate by its submission code. Only an assessor can revoke it.
        </p>
      </header>

      <Card>
        <label htmlFor="cert-code" className="block font-semibold text-navy-900">
          Submission code
        </label>
        <input
          id="cert-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="IASDG-XXXXXX"
          className="mt-2 w-full rounded-md border border-navy-700 p-2"
        />
        <div className="mt-3">
          <Button onClick={find} disabled={busy || code.trim().length === 0}>
            Find certificate
          </Button>
        </div>
      </Card>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}

      {cert && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy-900">{cert.title}</h2>
              <p className="mt-1 text-sm text-navy-700">
                {cert.code} · {cert.certificateNumber} · Issued {day(cert.issuedAt)} · Valid until{' '}
                {day(cert.expiresAt)}
              </p>
            </div>
            <Badge
              tone={
                cert.status === 'VALID' ? 'teal' : cert.status === 'EXPIRED' ? 'gold' : 'neutral'
              }
            >
              {cert.status === 'VALID'
                ? 'Valid'
                : cert.status === 'EXPIRED'
                  ? 'Expired'
                  : 'Revoked'}
            </Badge>
          </div>

          {cert.status === 'REVOKED' ? (
            <p className="mt-3 text-navy-800">
              Revoked on {cert.revokedAt ? day(cert.revokedAt) : 'an earlier date'}.
            </p>
          ) : (
            <div className="mt-4">
              <label htmlFor="revoke-reason" className="block font-semibold text-navy-900">
                Reason (10 to 1000 characters, kept internal)
              </label>
              <textarea
                id="revoke-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-navy-700 p-2"
              />
              <p className="mt-1 text-sm text-navy-700">
                Revoking cannot be undone. The public page will show this certificate as revoked.
              </p>
              <div className="mt-3">
                <Button onClick={revoke} disabled={busy || reason.trim().length < 10}>
                  Revoke certificate
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
