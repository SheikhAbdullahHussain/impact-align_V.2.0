// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dashboardNav } from '@impactalign/config';
import DashboardHomePage from '@/app/dashboard/page';
import { DashboardPage } from './dashboard-page';
import { DashboardShell } from './dashboard-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard/projects' }));

afterEach(cleanup);

describe('DashboardShell', () => {
  it('states clearly that it is a preview and exposes labelled landmarks', () => {
    render(
      <DashboardShell>
        <p>child</p>
      </DashboardShell>,
    );
    expect(screen.getByText(/Preview · not signed in/)).toBeTruthy();
    expect(screen.getAllByRole('note')[0]?.textContent).toMatch(/not built yet/i);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Dashboard' })).toBeTruthy();
  });

  it('lists every dashboard link and marks only the current page', () => {
    render(<DashboardShell>{null}</DashboardShell>);
    const nav = screen.getByRole('navigation', { name: 'Dashboard' });
    expect(within(nav).getAllByRole('link')).toHaveLength(dashboardNav.length);
    expect(within(nav).getByRole('link', { name: 'Projects' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      within(nav).getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current'),
    ).toBeNull();
  });
});

describe('Dashboard pages', () => {
  it('home shows the five metrics as empty, never as fake numbers', () => {
    render(<DashboardHomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByLabelText('No value yet')).toHaveLength(5);
    expect(screen.getByText('Accreditation Status'.replace('Status', 'status'))).toBeTruthy();
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
