import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FaqEditor } from './faq-editor';
import { SectionEditor } from './section-editor';

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
  vi.unstubAllGlobals();
});

const faq = {
  status: 'DRAFT',
  data: {
    groups: [
      {
        id: 'general',
        title: 'General',
        items: [{ number: 1, question: 'What is it?', answer: ['Paragraph.', ['a', 'b']] }],
      },
    ],
  },
};

describe('FaqEditor', () => {
  it('shows the saved FAQ and publishes edits as blocks', async () => {
    get.mockResolvedValue({ entry: faq });
    render(<FaqEditor contentKey="accreditation" label="Accreditation FAQ" />);
    const question = (await screen.findByLabelText('Group 1 question 1')) as HTMLInputElement;
    expect(question.value).toBe('What is it?');
    expect((screen.getByLabelText('Group 1 question 1 answer') as HTMLTextAreaElement).value).toBe(
      'Paragraph.\n\n- a\n- b',
    );

    fireEvent.change(question, { target: { value: 'What is ImpactAlign?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('faq', 'accreditation', {
        status: 'PUBLISHED',
        data: {
          groups: [
            {
              id: 'general',
              title: 'General',
              items: [
                { number: 1, question: 'What is ImpactAlign?', answer: ['Paragraph.', ['a', 'b']] },
              ],
            },
          ],
        },
      }),
    );
  });

  it('adds a question with the next free number', async () => {
    get.mockResolvedValue({ entry: faq });
    render(<FaqEditor contentKey="accreditation" label="Accreditation FAQ" />);
    await screen.findByLabelText('Group 1 question 1');
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    expect((screen.getByLabelText('Group 1 question 2 number') as HTMLInputElement).value).toBe(
      '2',
    );
  });

  it('loads the built-in text on request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => faq.data }));
    render(<FaqEditor contentKey="accreditation" label="Accreditation FAQ" />);
    await screen.findByRole('button', { name: 'Load built-in text' });
    fireEvent.click(screen.getByRole('button', { name: 'Load built-in text' }));
    expect(((await screen.findByLabelText('Group 1 question 1')) as HTMLInputElement).value).toBe(
      'What is it?',
    );
  });
});

describe('SectionEditor', () => {
  it('saves title, intro and topic text', async () => {
    get.mockResolvedValue({
      entry: {
        status: 'DRAFT',
        data: {
          title: 'About',
          eyebrow: 'About',
          intro: 'Intro.',
          topics: [{ title: 'Vision', description: 'Short.', body: ['One.', 'Two.'] }],
        },
      },
    });
    render(<SectionEditor contentKey="about" label="About" />);
    const text = (await screen.findByLabelText('Topic 1 text')) as HTMLTextAreaElement;
    expect(text.value).toBe('One.\n\nTwo.');
    fireEvent.change(text, { target: { value: 'Only one.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('section', 'about', {
        status: 'DRAFT',
        data: {
          title: 'About',
          eyebrow: 'About',
          intro: 'Intro.',
          topics: [{ title: 'Vision', description: 'Short.', body: ['Only one.'] }],
        },
      }),
    );
  });
});
