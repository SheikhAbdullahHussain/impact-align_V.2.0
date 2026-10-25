// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button, SkipLink, cn } from './index';

afterEach(cleanup);

describe('cn', () => {
  it('resolves conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('Button', () => {
  it('defaults to type="button" so it never submits forms accidentally', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('can render a link with button styling', () => {
    render(
      <Button asChild>
        <a href="/join-impactalign">JOIN IMPACTALIGN</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'JOIN IMPACTALIGN' });
    expect(link.getAttribute('href')).toBe('/join-impactalign');
    expect(link.getAttribute('type')).toBeNull();
  });
});

describe('SkipLink', () => {
  it('targets the main landmark', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: /skip to main content/i }).getAttribute('href')).toBe(
      '#main-content',
    );
  });
});

describe('Badge and Card', () => {
  it('render their content', async () => {
    const { Badge, Card } = await import('./index');
    render(
      <Card>
        <Badge tone="gold">Planned</Badge>
      </Card>,
    );
    expect(screen.getByText('Planned')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('shows title and description', async () => {
    const { EmptyState } = await import('./index');
    render(<EmptyState title="Nothing here yet" description="Coming in a later phase." />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(screen.getByText('Coming in a later phase.')).toBeTruthy();
  });
});
