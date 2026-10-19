// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardNav } from '@impactalign/config';
import DashboardHomePage from '@/app/dashboard/page';
import { setCsrfToken } from '@/lib/api/client';
import { DashboardPage } from './dashboard-page';
import { DashboardShell } from './dashboard-shell';

const router = { replace: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/projects',
  useRouter: () => router,
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
  vi.unstubAllGlobals();
  setCsrfToken(null);
});

const user = { displayName: 'Ada Lovelace' };

describe('DashboardShell', () => {
  it('shows who is signed in, a sign-out button and labelled landmarks', () => {
    render(
      <DashboardShell user={user}>
        <p>child</p>
      </DashboardShell>,
    );
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy();
    expect(screen.getAllByRole('note')[0]?.textContent).toMatch(/still being built/i);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Dashboard' })).toBeTruthy();
  });

  it('lists every dashboard link and marks only the current page', () => {
    render(<DashboardShell user={user} />);
    const nav = screen.getByRole('navigation', { name: 'Dashboard' });
    expect(within(nav).getAllByRole('link')).toHaveLength(dashboardNav.length);
    expect(within(nav).getByRole('link', { name: 'Projects' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      within(nav).getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('signs out with a fresh CSRF token, then leaves for the sign-in page', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: {}, csrfToken: 'csrf-9' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('empty')),
      });
    render(<DashboardShell user={user} />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/v1/auth/logout');
    expect(fetchMock.mock.calls[1]![1].headers['X-CSRF-Token']).toBe('csrf-9');
  });

  it('still leaves the dashboard when the session is already gone', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r' } }),
    });
    render(<DashboardShell user={user} />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
  });
});

describe('Dashboard pages', () => {
  it('home shows the five metrics as empty, never as fake numbers', () => {
    render(<DashboardHomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByLabelText('No value yet')).toHaveLength(5);
  });

  it.each(dashboardNav.filter((n) => n.href !== '/dashboard').map((n) => n.href))(
    '%s renders one h1 and an honest empty state',
    (href) => {
      render(<DashboardPage href={href} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByText('This feature is built in a later phase.')).toBeTruthy();
    },
  );

  it('shows the evidence status legend on submissions and file types on uploads', () => {
    render(<DashboardPage href="/dashboard/submissions" />);
    expect(screen.getByText('CLARIFICATION_REQUIRED')).toBeTruthy();
    cleanup();
    render(<DashboardPage href="/dashboard/uploads/new" />);
    expect(screen.getByText('XLSX')).toBeTruthy();
  });
});
