// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

vi.mock('next/navigation', () => ({ usePathname: () => '/about' }));

afterEach(cleanup);

describe('SiteHeader', () => {
  it('renders the brand navigation in order with the primary CTA', () => {
    render(<SiteHeader />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels).toEqual([
      'HOME',
      'ABOUT',
      'SDGs',
      'HOW IT WORKS',
      'PLATFORM',
      'RESOURCES',
      'COMMUNITY',
      'ACCREDITATION',
      'LOGIN',
      'JOIN IMPACTALIGN',
    ]);
  });

  it('marks the current page for assistive technology', () => {
    render(<SiteHeader />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'ABOUT' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'HOME' }).getAttribute('aria-current')).toBeNull();
  });

  it('exposes the mobile menu as a collapsed disclosure button', () => {
    render(<SiteHeader />);
    const button = screen.getByRole('button', { name: 'Menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
