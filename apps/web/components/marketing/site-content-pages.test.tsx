import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LegalPage } from './legal-page';
import { LiveSectionPage } from './section-page-live';

const { getPublishedContent } = vi.hoisted(() => ({ getPublishedContent: vi.fn() }));
vi.mock('@/lib/site-content', () => ({ getPublishedContent }));

afterEach(cleanup);
beforeEach(() => getPublishedContent.mockReset());

describe('LegalPage', () => {
  it('shows the published text instead of the placeholder', async () => {
    getPublishedContent.mockResolvedValue({
      title: 'Privacy Policy',
      body: '## Data\n\nWe keep little.',
    });
    render(await LegalPage({ slug: 'privacy' }));
    expect(screen.getByText('We keep little.')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('falls back to the placeholder when nothing is published', async () => {
    getPublishedContent.mockResolvedValue(null);
    render(await LegalPage({ slug: 'privacy' }));
    expect(screen.getByRole('note').textContent).toContain('placeholder');
  });
});

describe('LiveSectionPage', () => {
  it('shows published topics and hides the under-development note', async () => {
    getPublishedContent.mockResolvedValue({
      title: 'About ImpactAlign',
      eyebrow: 'About',
      intro: 'Intro text.',
      topics: [{ title: 'Our vision', description: 'Short.', body: [] }],
    });
    render(await LiveSectionPage({ slug: 'about' }));
    expect(screen.getByText('Our vision')).toBeTruthy();
    expect(screen.queryByText(/under development/)).toBeNull();
  });

  it('falls back to the built-in section', async () => {
    getPublishedContent.mockResolvedValue(null);
    render(await LiveSectionPage({ slug: 'about' }));
    expect(screen.getByText(/under development/)).toBeTruthy();
  });
});
