import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsList } from './reports-list';

const { me, list } = vi.hoisted(() => ({ me: vi.fn(), list: vi.fn() }));
vi.mock('@impactalign/api-client', () => ({
  authApi: { me },
  reportsApi: { list, downloadUrl: (id: string) => `/api/v1/reports/${id}/download` },
  describeError: () => 'Request failed',
}));

const report = {
  id: 'r1',
  projectId: 'p1',
  code: 'IASDG-ABC123',
  title: 'Solar schools',
  submissionType: 'PROJECT_PROPOSAL',
  sdgNumbers: [2, 13],
  targets: [{ code: '13.2', title: null }],
  indicators: [{ code: '13.2.1', title: null }],
  evidence: [{ fileName: 'plan.pdf', sha256: 'abc123', sizeBytes: 2048, indicatorCode: '13.2.1' }],
  decision: 'VERIFIED',
  rationale: 'Evidence matches the claimed indicators.',
  decidedAt: '2026-11-18T10:00:00.000Z',
  createdAt: '2026-11-18T10:00:00.000Z',
};

beforeEach(() => {
  me.mockReset().mockResolvedValue({ user: {}, csrfToken: 'csrf' });
  list.mockReset().mockResolvedValue({ reports: [report] });
});

describe('ReportsList', () => {
  it('shows the report with its download link', async () => {
    render(<ReportsList />);
    expect(await screen.findByText('Solar schools')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.getByText('SDG 2, SDG 13')).toBeTruthy();
    expect(screen.getByText('Evidence matches the claimed indicators.')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Download report (JSON)' });
    expect(link.getAttribute('href')).toBe('/api/v1/reports/p1/download');
  });

  it('shows an empty state when there are no reports', async () => {
    list.mockResolvedValue({ reports: [] });
    render(<ReportsList />);
    expect(await screen.findByText('No reports yet')).toBeTruthy();
  });

  it('shows an error when loading fails', async () => {
    list.mockRejectedValue(new Error('boom'));
    render(<ReportsList />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Request failed'));
  });
});
