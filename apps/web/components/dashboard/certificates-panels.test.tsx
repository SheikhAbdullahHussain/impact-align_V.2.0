import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccreditationPanel } from './accreditation-panel';
import { CertificatesList } from './certificates-list';

const { me, list, lookup, revoke } = vi.hoisted(() => ({
  me: vi.fn(),
  list: vi.fn(),
  lookup: vi.fn(),
  revoke: vi.fn(),
}));
vi.mock('@impactalign/api-client', () => ({
  authApi: { me },
  certificatesApi: {
    list,
    lookup,
    revoke,
    downloadUrl: (id: string) => `/api/v1/certificates/${id}/download`,
  },
  describeError: () => 'Request failed',
}));

const cert = {
  id: 'c1',
  projectId: 'p1',
  certificateNumber: 'CERT-2026-0A1B2C3D',
  code: 'IASDG-ABC123',
  title: 'Solar schools',
  submissionType: 'PROJECT_PROPOSAL',
  sdgNumbers: [13],
  status: 'VALID',
  issuedAt: '2026-11-18T10:00:00.000Z',
  expiresAt: '2027-11-18T10:00:00.000Z',
  revokedAt: null,
};

afterEach(cleanup);

beforeEach(() => {
  me.mockReset().mockResolvedValue({ user: {}, csrfToken: 'csrf' });
  list.mockReset().mockResolvedValue({ certificates: [cert] });
  lookup.mockReset().mockResolvedValue({ certificate: cert });
  revoke.mockReset().mockResolvedValue({
    certificate: { ...cert, status: 'REVOKED', revokedAt: '2026-12-01T10:00:00.000Z' },
  });
});

describe('CertificatesList', () => {
  it('offers the PDF only for a valid certificate', async () => {
    render(<CertificatesList />);
    expect(await screen.findByText('Solar schools')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Download certificate (PDF)' }).getAttribute('href'),
    ).toBe('/api/v1/certificates/p1/download');
    expect(
      screen.getByRole('link', { name: 'Public verification page' }).getAttribute('href'),
    ).toBe('/verify/IASDG-ABC123');
  });

  it('hides the PDF link for a revoked certificate', async () => {
    list.mockResolvedValue({ certificates: [{ ...cert, status: 'REVOKED' }] });
    render(<CertificatesList />);
    expect(await screen.findByText('Revoked')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Download certificate (PDF)' })).toBeNull();
  });

  it('shows an empty state', async () => {
    list.mockResolvedValue({ certificates: [] });
    render(<CertificatesList />);
    expect(await screen.findByText('No certificates yet')).toBeTruthy();
  });
});

describe('AccreditationPanel', () => {
  it('finds a certificate and revokes it with a reason', async () => {
    render(<AccreditationPanel />);
    fireEvent.change(screen.getByLabelText('Submission code'), {
      target: { value: 'IASDG-ABC123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find certificate' }));
    expect(await screen.findByText('Solar schools')).toBeTruthy();
    expect(lookup).toHaveBeenCalledWith('IASDG-ABC123');

    const button = screen.getByRole('button', { name: 'Revoke certificate' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'Evidence was forged.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Revoke certificate' }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('p1', 'Evidence was forged.'));
    expect((await screen.findByRole('status')).textContent).toContain('Certificate revoked.');
  });

  it('shows an error when the certificate is not found', async () => {
    lookup.mockRejectedValue(new Error('404'));
    render(<AccreditationPanel />);
    fireEvent.change(screen.getByLabelText('Submission code'), {
      target: { value: 'IASDG-ZZZZZZ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find certificate' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Request failed');
  });
});
