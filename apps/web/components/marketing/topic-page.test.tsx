import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { SectionContent } from '@/lib/section-content';
import { TopicPage } from './topic-page';

afterEach(cleanup);

const section: SectionContent = {
  slug: 'about',
  title: 'About',
  eyebrow: 'About',
  intro: 'Intro',
  topics: [],
};

describe('TopicPage', () => {
  it('shows the under-development note when the topic has no body', () => {
    render(<TopicPage section={section} topic={{ title: 'Vision', description: 'Short' }} />);
    expect(screen.getByRole('note').textContent).toMatch(/under development/i);
  });

  it('shows real copy and no note when the topic has a body', () => {
    render(
      <TopicPage
        section={section}
        topic={{
          title: 'Vision',
          description: 'Short',
          body: ['First paragraph.', 'Second paragraph.'],
        }}
      />,
    );
    expect(screen.getByText('First paragraph.')).toBeTruthy();
    expect(screen.getByText('Second paragraph.')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });
});