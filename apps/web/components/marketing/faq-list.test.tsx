import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { faqGroups } from '@/lib/faq-content';
import { FaqList } from './faq-list';

afterEach(cleanup);

describe('FaqList', () => {
  it('renders one collapsed item per question', () => {
    const { container } = render(<FaqList groups={faqGroups} />);
    const details = Array.from(container.querySelectorAll('details'));
    expect(details).toHaveLength(47);
    expect(details.every((item) => !item.open)).toBe(true);
  });

  it('has a labelled topic navigation and one heading per group', () => {
    render(<FaqList groups={faqGroups} />);
    expect(screen.getByRole('navigation', { name: 'FAQ topics' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(faqGroups.length);
  });
});