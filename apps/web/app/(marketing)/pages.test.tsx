// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AI_GENERATED_LABEL } from '@impactalign/ai';
import { legalPages } from '@impactalign/config';
import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { SectionPage } from '@/components/marketing/section-page';
import { sections } from '@/lib/section-content';
import HomePage from './page';

afterEach(cleanup);

describe('Home page', () => {
  it('has exactly one h1 and the primary call to action', () => {
    render(<HomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'JOIN IMPACTALIGN' }).length).toBeGreaterThan(0);
  });

  it('labels every section landmark with a heading that exists', () => {
    const { container } = render(<HomePage />);
    const sectionsWithLabel = container.querySelectorAll('section[aria-labelledby]');
    expect(sectionsWithLabel.length).toBeGreaterThanOrEqual(10);
    sectionsWithLabel.forEach((section) => {
      const id = section.getAttribute('aria-labelledby') ?? '';
      expect(container.querySelector(`#${id}`)?.textContent).toBeTruthy();
    });
  });

  it('shows all five methodology steps', () => {
    render(<HomePage />);
    for (const step of ['Diagnose', 'Align', 'Measure', 'Validate', 'Improve']) {
      expect(screen.getAllByRole('heading', { name: step }).length).toBeGreaterThan(0);
    }
  });

  it('previews 17 goals by number only, without hard-coded official titles', () => {
    render(<HomePage />);
    const goals = screen.getAllByRole('link', { name: /^Sustainable Development Goal \d+$/ });
    expect(goals).toHaveLength(17);
    expect(screen.queryByText(/no poverty|zero hunger/i)).toBeNull();
  });

  it('is honest: dashboard preview is marked as sample and the AI rule is shown', () => {
    render(<HomePage />);
    expect(screen.getByText('Sample layout — no real data')).toBeTruthy();
    expect(screen.getByText(AI_GENERATED_LABEL)).toBeTruthy();
    expect(screen.getAllByText('Planned').length).toBe(6);
  });
});

describe('Section pages', () => {
  it.each(sections.map((s) => s.slug))(
    '/%s renders one h1, breadcrumbs and a placeholder note',
    (slug) => {
      render(<SectionPage slug={slug} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(crumbs).getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
      expect(screen.getByRole('note').textContent).toMatch(/placeholder/i);
    },
  );

  it('lists the planned topics for a section', () => {
    render(<SectionPage slug="about" />);
    expect(screen.getByRole('heading', { name: 'Governance' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Partners & Collaborations' })).toBeTruthy();
  });
});

describe('Legal pages', () => {
  it.each(legalPages.map((p) => p.slug))('/%s makes no legal claims', (slug) => {
    render(<LegalPlaceholder slug={slug} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('note').textContent).toMatch(/placeholder/i);
  });
});
