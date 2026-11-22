import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LegalEditor } from './legal-editor';

const { me, get, save } = vi.hoisted(() => ({ me: vi.fn(), get: vi.fn(), save: vi.fn() }));
vi.mock('@impactalign/api-client', () => ({
  authApi: { me },
  adminSiteContentApi: { get, save },
  describeError: () => 'Request failed',
}));

afterEach(cleanup);

beforeEach(() => {
  me.mockReset().mockResolvedValue({ user: {}, csrfToken: 'csrf' });
  get.mockReset().mockResolvedValue({ entry: null });
  save.mockReset().mockResolvedValue({ entry: { status: 'PUBLISHED' } });
});

describe('LegalEditor', () => {
  it('publishes the title and text', async () => {
    render(<LegalEditor contentKey="privacy" label="Privacy Policy" />);
    const body = await screen.findByLabelText('Text');
    fireEvent.change(body, { target: { value: '## Data\n\nWe keep little.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('legal', 'privacy', {
        status: 'PUBLISHED',
        data: { title: 'Privacy Policy', body: '## Data\n\nWe keep little.' },
      }),
    );
    expect((await screen.findByRole('status')).textContent).toContain('Published');
  });

  it('loads a saved draft', async () => {
    get.mockResolvedValue({
      entry: { status: 'DRAFT', data: { title: 'Privacy', body: 'Saved text' } },
    });
    render(<LegalEditor contentKey="privacy" label="Privacy Policy" />);
    expect(((await screen.findByLabelText('Text')) as HTMLTextAreaElement).value).toBe(
      'Saved text',
    );
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('shows an error when saving fails', async () => {
    save.mockRejectedValue(new Error('boom'));
    render(<LegalEditor contentKey="privacy" label="Privacy Policy" />);
    await screen.findByLabelText('Text');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Request failed');
  });
});
