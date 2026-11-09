import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

type Ctx = ReturnType<typeof buildTestContext>;

async function signIn(t: Ctx, address: string) {
  await t.signUp(address);
  const agent = request.agent(t.app);
  const res = await agent.post('/api/v1/auth/login').send({ email: address, password: STRONG_PASSWORD });
  return { agent, csrf: res.body.csrfToken as string };
}
type Person = Awaited<ReturnType<typeof signIn>>;

const pdf = Buffer.from('%PDF-1.4 test');

const draft = async (p: Person, sdgNumbers: number[]) =>
  (
    await p.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', p.csrf)
      .send({ title: 'Submission project', sdgNumbers })
  ).body.project.id as string;

const addEvidence = (p: Person, id: string) =>
  p.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', p.csrf)
    .send(pdf);

const act = (p: Person, id: string, action: 'submit' | 'withdraw') =>
  p.agent.post(`/api/v1/projects/${id}/${action}`).set('X-CSRF-Token', p.csrf).send({});

describe('project submission', () => {
  it('refuses to submit without an SDG or without evidence', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const noSdg = await draft(ada, []);
    await addEvidence(ada, noSdg);
    expect((await act(ada, noSdg, 'submit')).status).toBe(400);

    const noEvidence = await draft(ada, [6]);
    const res = await act(ada, noEvidence, 'submit');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SUBMISSION_INCOMPLETE');
  });

  it('submits, locks the project, and records an audit event', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const id = await draft(ada, [6]);
    await addEvidence(ada, id);

    const res = await act(ada, id, 'submit');
    expect(res.status).toBe(200);
    expect(res.body.project.status).toBe('SUBMITTED');
    expect(res.body.project.submittedAt).not.toBeNull();

    expect((await addEvidence(ada, id)).status).toBe(409);
    expect(
      (await ada.agent.put(`/api/v1/projects/${id}`).set('X-CSRF-Token', ada.csrf).send({ title: 'Changed title' })).status,
    ).toBe(409);
    expect(
      (await ada.agent.delete(`/api/v1/projects/${id}`).set('X-CSRF-Token', ada.csrf)).status,
    ).toBe(409);
    expect((await act(ada, id, 'submit')).status).toBe(409);
    expect(t.repos.data.audit.map((e) => e.action)).toContain('PROJECT_SUBMITTED');
  });

  it('withdraws back to draft and unlocks editing', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const id = await draft(ada, [6]);
    await addEvidence(ada, id);
    await act(ada, id, 'submit');

    const res = await act(ada, id, 'withdraw');
    expect(res.body.project.status).toBe('DRAFT');
    expect(res.body.project.submittedAt).toBeNull();
    expect((await addEvidence(ada, id)).status).toBe(201);
    expect((await act(ada, id, 'withdraw')).status).toBe(409);
  });

  it("does not let another user submit or withdraw someone's project", async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const id = await draft(ada, [6]);
    await addEvidence(ada, id);
    expect((await act(bob, id, 'submit')).status).toBe(404);
    await act(ada, id, 'submit');
    expect((await act(bob, id, 'withdraw')).status).toBe(404);
  });
});