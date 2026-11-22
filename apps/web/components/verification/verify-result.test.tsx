import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifyResult } from './verify-result';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@impactalign/api-client', () => ({ verifyApi: { get } }));

const verification = {
  code: 'IASDG-ABC123',
  certificateNumber: 'CERT-2026-0A1B2C3D',
  title: 'Solar schools',
  submissionType: 'PROJECT_PROPOSAL',
  sdgNumbers: [2, 13],
  status: 'VALID',
  issuedAt: '2026-11-18T10:00:00.000Z',
  expiresAt: '2027-11-18T10:00:00.000Z',
  revokedAt: null,
};

beforeEach(() => {
  get.mockReset().mockResolvedValue({ verification });
});

describe('VerifyResult', () => {
  it('shows the public details and the status in words', async () => {
    render(<VerifyResult code="IASDG-ABC123" />);
    expect(await screen.findByText('Solar schools')).toBeTruthy();
    expect(screen.getByText('Valid')).toBeTruthy();
    expect(screen.getByText('CERT-2026-0A1B2C3D')).toBeTruthy();
    expect(screen.getByText('SDG 2, SDG 13')).toBeTruthy();
    expect(get).toHaveBeenCalledWith('IASDG-ABC123');
  });

  it('says a revoked certificate is no longer valid', async () => {
    get.mockResolvedValue({
      verification: { ...verification, status: 'REVOKED', revokedAt: '2026-12-01T10:00:00.000Z' },
    });
    render(<VerifyResult code="IASDG-ABC123" />);
    expect(await screen.findByText('Revoked')).toBeTruthy();
    expect(screen.getByText('Revoked on')).toBeTruthy();
  });

  it('shows one generic message when the code is not found', async () => {
    get.mockRejectedValue(new Error('404'));
    render(<VerifyResult code="IASDG-ZZZZZZ" />);
    expect((await screen.findByRole('alert')).textContent).toContain('No certificate was found');
  });
});
