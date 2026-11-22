// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmissionWizard } from './submission-wizard';

const api = vi.hoisted(() => ({
  me: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  setAlignment: vi.fn(),
  submit: vi.fn(),
  evidenceList: vi.fn(),
  orgs: vi.fn(),
  targets: vi.fn(),
  indicators: vi.fn(),
}));

vi.mock('@impactalign/api-client', () => ({
  authApi: { me: api.me },
  projectsApi: {
    create: api.create,
    get: api.get,
    update: api.update,
    setAlignment: api.setAlignment,
    submit: api.submit,
    feedback: vi.fn().mockResolvedValue({ notes: [] }),
  },
  evidenceApi: {
    list: api.evidenceList,
    upload: vi.fn(),
    remove: vi.fn(),
    linkIndicator: vi.fn(),
    fileUrl: (projectId: string, evidenceId: string) => `/files/${projectId}/${evidenceId}`,
  },
  organizationsApi: { list: api.orgs },
  sdgsApi: { targets: api.targets, indicators: api.indicators },
  describeError: () => 'Request failed',
}));

const stamp = '2026-01-01T00:00:00.000Z';
const project = {
  id: 'p1',
  title: 'Clean water pilot',
  summary: '',
  sdgNumbers: [6],
  submissionType: 'PROJECT_PROPOSAL',
  organizationId: null,
  code: null,
  targetIds: [],
  indicatorIds: [],
  status: 'DRAFT',
  submittedAt: null,
  createdAt: stamp,
  updatedAt: stamp,
};
const file = {
  id: 'e1',
  projectId: 'p1',
  fileName: 'proof.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 100,
  sha256: 'x',
  indicatorId: null,
  createdAt: stamp,
};

beforeEach(() => {
  api.me.mockResolvedValue({ user: {}, csrfToken: 'csrf' });
  api.orgs.mockResolvedValue({
    organizations: [
      { id: 'o1', name: 'Acme', slug: 'acme', createdAt: stamp, role: 'ORGANIZATION_ADMIN' },
    ],
  });
  api.targets.mockResolvedValue({ data: [] });
  api.indicators.mockResolvedValue({ data: [] });
  api.get.mockResolvedValue({ project });
  api.evidenceList.mockResolvedValue({ evidence: [file] });
  api.create.mockResolvedValue({ project });
  api.update.mockResolvedValue({ project });
  api.setAlignment.mockResolvedValue({ project });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const saveAndContinue = () => screen.getByRole('button', { name: 'Save and continue' });

describe('SubmissionWizard', () => {
  it('offers the seven types and creates the draft with the chosen organization', async () => {
    render(<SubmissionWizard />);
    const type = (await screen.findByLabelText('Submission type')) as HTMLSelectElement;
    expect(type.options).toHaveLength(7);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Clean water pilot' } });
    await screen.findByRole('option', { name: 'Acme' });
    fireEvent.change(screen.getByLabelText('Organization (optional)'), { target: { value: 'o1' } });
    fireEvent.click(saveAndContinue());

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Clean water pilot',
          submissionType: 'PROJECT_PROPOSAL',
          organizationId: 'o1',
        }),
      ),
    );
    expect(await screen.findByRole('heading', { name: 'SDG alignment' })).toBeTruthy();
  });

  it('walks through all four steps and needs the declaration before submitting', async () => {
    render(<SubmissionWizard projectId="p1" />);
    await screen.findByRole('heading', { name: 'Basic information' });
    fireEvent.click(saveAndContinue());

    await screen.findByRole('heading', { name: 'SDG alignment' });
    expect(await screen.findByText(/No targets or indicators have been imported/)).toBeTruthy();
    fireEvent.click(saveAndContinue());

    await screen.findByRole('heading', { name: 'Evidence' });
    expect(screen.getByText('proof.pdf')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByRole('heading', { name: 'Declaration' });
    const submit = screen.getByRole('button', {
      name: 'Submit for assessment',
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I declare/));
    await waitFor(() => expect(submit.disabled).toBe(false));

    api.submit.mockResolvedValue({
      project: { ...project, status: 'SUBMITTED', code: 'IASDG-ABC234' },
    });
    fireEvent.click(submit);
    await waitFor(() => expect(api.submit).toHaveBeenCalledWith('p1', true));
    expect(await screen.findByText('IASDG-ABC234')).toBeTruthy();
  });
});
