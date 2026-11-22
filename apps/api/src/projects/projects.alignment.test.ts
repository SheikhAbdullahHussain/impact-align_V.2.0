import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { SUBMISSION_TYPES } from '@impactalign/types';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';
import { SUBMISSION_CODE_PATTERN } from './submission-code';

type Ctx = ReturnType<typeof buildTestContext>;

async function signIn(t: Ctx, address: string) {
  await t.signUp(address);
  const agent = request.agent(t.app);
  const res = await agent
    .post('/api/v1/auth/login')
    .send({ email: address, password: STRONG_PASSWORD });
  return { agent, csrf: res.body.csrfToken as string };
}
type Person = Awaited<ReturnType<typeof signIn>>;

const pdf = Buffer.from('%PDF-1.4 test');

const create = (p: Person, body: object) =>
  p.agent.post('/api/v1/projects').set('X-CSRF-Token', p.csrf).send(body);

const addEvidence = (p: Person, id: string) =>
  p.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', p.csrf)
    .send(pdf);

const act = (p: Person, id: string, action: 'submit' | 'withdraw') =>
  p.agent
    .post(`/api/v1/projects/${id}/${action}`)
    .set('X-CSRF-Token', p.csrf)
    .send(action === 'submit' ? { declaration: true } : {});

const makeOrg = async (p: Person, name: string) =>
  (await p.agent.post('/api/v1/organizations').set('X-CSRF-Token', p.csrf).send({ name })).body
    .organization.id as string;

async function readyToSubmit(p: Person, body: object = {}) {
  const res = await create(p, { title: 'Alignment project', sdgNumbers: [6], ...body });
  const id = res.body.project.id as string;
  await addEvidence(p, id);
  return id;
}

describe('submission type', () => {
  it('defaults to a project proposal and has no code or organization in draft', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const res = await create(ada, { title: 'Alignment project' });
    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({
      submissionType: 'PROJECT_PROPOSAL',
      code: null,
      organizationId: null,
    });
  });

  it('accepts all seven types and rejects anything else', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    expect(SUBMISSION_TYPES).toHaveLength(7);
    for (const submissionType of SUBMISSION_TYPES) {
      const res = await create(ada, { title: 'Alignment project', submissionType });
      expect(res.status).toBe(201);
      expect(res.body.project.submissionType).toBe(submissionType);
    }
    expect(
      (await create(ada, { title: 'Alignment project', submissionType: 'SPACESHIP' })).status,
    ).toBe(400);
  });
});

describe('IASDG code', () => {
  it('is issued at first submission, is unique, and survives withdraw and resubmit', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const first = await readyToSubmit(ada);
    const second = await readyToSubmit(ada);

    const submitted = await act(ada, first, 'submit');
    const code = submitted.body.project.code as string;
    expect(code).toMatch(SUBMISSION_CODE_PATTERN);
    expect((await act(ada, second, 'submit')).body.project.code).not.toBe(code);

    expect((await act(ada, first, 'withdraw')).body.project.code).toBe(code);
    expect((await act(ada, first, 'submit')).body.project.code).toBe(code);
  });

  it('is not issued when the submission is refused', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const id = (await create(ada, { title: 'No evidence yet', sdgNumbers: [6] })).body.project
      .id as string;
    expect((await act(ada, id, 'submit')).status).toBe(400);
    expect((await ada.agent.get(`/api/v1/projects/${id}`)).body.project.code).toBeNull();
  });
});

describe('organization link', () => {
  it('links a project to an organization the owner belongs to', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const orgId = await makeOrg(ada, 'Acme Research');
    const res = await create(ada, { title: 'Alignment project', organizationId: orgId });
    expect(res.status).toBe(201);
    expect(res.body.project.organizationId).toBe(orgId);
  });

  it('treats someone else’s organization like one that does not exist', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const orgId = await makeOrg(ada, 'Acme Research');
    expect((await create(bob, { title: 'Alignment project', organizationId: orgId })).status).toBe(
      404,
    );
    expect(
      (await create(bob, { title: 'Alignment project', organizationId: 'a'.repeat(24) })).status,
    ).toBe(404);
    expect(
      (await create(bob, { title: 'Alignment project', organizationId: 'not-an-id' })).status,
    ).toBe(400);
  });

  it('keeps type and organization when an update leaves them out, and unlinks on null', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const orgId = await makeOrg(ada, 'Acme Research');
    const created = await create(ada, {
      title: 'Alignment project',
      submissionType: 'STARTUP_INNOVATION',
      organizationId: orgId,
    });
    const url = `/api/v1/projects/${created.body.project.id}`;
    const put = (body: object) => ada.agent.put(url).set('X-CSRF-Token', ada.csrf).send(body);

    const renamed = await put({ title: 'Renamed project' });
    expect(renamed.body.project).toMatchObject({
      title: 'Renamed project',
      submissionType: 'STARTUP_INNOVATION',
      organizationId: orgId,
    });
    expect(
      (await put({ title: 'Renamed project', organizationId: null })).body.project.organizationId,
    ).toBeNull();
  });
});
