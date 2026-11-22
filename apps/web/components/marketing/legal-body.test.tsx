import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LegalBody } from './legal-body';

afterEach(cleanup);

describe('LegalBody', () => {
  it('renders headings, bullets and paragraphs', () => {
    render(<LegalBody text={'## Data we keep\n\nWe keep little.\n\n- one\n- two'} />);
    expect(screen.getByRole('heading', { name: 'Data we keep' })).toBeTruthy();
    expect(screen.getByText('We keep little.')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['one', 'two']);
  });

  it('shows HTML as plain text, never as markup', () => {
    const { container } = render(<LegalBody text={'<script>alert(1)</script> <b>bold</b>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});
