import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { PlatformRole } from '@impactalign/types';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

type Ctx = ReturnType<typeof buildTestContext>;

async function signIn(t: Ctx, address: string, roles?: PlatformRole[]) {
  await t.signUp(address);
  if (roles) t.repos.data.users.find((u) => u.email === address)!.roles = roles;
  const agent = request.agent(t.app);
  const res = await agent.post('/api/v1/auth/login').send({ email: address, password: STRONG_PASSWORD });
  return { agent, csrf: res.body.csrfToken as string };
}
type Person = Awaited<ReturnType<typeof signIn>>;

const pdf = Buffer.from('%PDF-1.4 test content');
const post = (p: Person, url: string, body: object = {}) =>
  p.agent.post(url).set('X-CSRF-Token', p.csrf).send(body);
const upload = (p: Person, id: string) =>
  p.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', p.csrf)
    .send(pdf);

async function submitted(p: Person) {
  const created = await post(p, '/api/v1/projects', { title: 'Reviewed project', sdgNumbers: [6] });
  const id = created.body.project.id as string;
  await upload(p, id);
  await post(p, `/api/v1/projects/${id}/submit`);
  return id;
}

const CLARIFY = { message: 'Please add the water quality report.' };
const VERIFY = { decision: 'VERIFIED', rationale: 'Evidence matches the claimed indicators.' };

describe('assessment workflow', () => {
  it('keeps the queue away from ordinary users', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    expect((await ada.agent.get('/api/v1/assessments/queue')).status).toBe(403);
  });

  it('runs the whole loop: review, clarify, resubmit, decide', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const rita = await signIn(t, 'rita@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    const base = `/api/v1/assessments/${id}`;

    const queue = await root.agent.get('/api/v1/assessments/queue');
    expect(queue.body.queue.map((i: { project: { id: string } }) => i.project.id)).toContain(id);

    expect((await post(root, `${base}/start`)).body.project.status).toBe('UNDER_REVIEW');
    expect((await post(rita, `${base}/start`)).status).toBe(409);
    const notAssigned = await post(rita, `${base}/clarification`, CLARIFY);
    expect(notAssigned.status).toBe(403);
    expect(notAssigned.body.error.code).toBe('NOT_ASSIGNED');

    const detail = await root.agent.get(base);
    const file = await root.agent.get(`${base}/evidence/${detail.body.assessment.evidence[0].id}/file`);
    expect(file.status).toBe(200);
    expect(file.headers['content-disposition']).toMatch(/^attachment;/);

    expect((await post(root, `${base}/clarification`, CLARIFY)).body.project.status).toBe(
      'CLARIFICATION_REQUIRED',
    );
    const feedback = await ada.agent.get(`/api/v1/projects/${id}/feedback`);
    expect(feedback.body.notes).toHaveLength(1);
    expect(feedback.body.notes[0].kind).toBe('CLARIFICATION_REQUEST');

    expect((await upload(ada, id)).status).toBe(201); // owner may edit again
    expect((await post(ada, `/api/v1/projects/${id}/submit`)).body.project.status).toBe('SUBMITTED');

    await post(root, `${base}/start`);
    const decided = await post(root, `${base}/decision`, VERIFY);
    expect(decided.body.project.status).toBe('VERIFIED');

    expect((await upload(ada, id)).status).toBe(409); // locked after the decision
    expect((await post(ada, `/api/v1/projects/${id}/submit`)).status).toBe(409);
    const after = await ada.agent.get(`/api/v1/projects/${id}/feedback`);
    expect(after.body.notes.map((n: { kind: string }) => n.kind)).toEqual([
      'CLARIFICATION_REQUEST',
      'DECISION_VERIFIED',
    ]);
    expect(t.repos.data.audit.map((e) => e.action)).toEqual(
      expect.arrayContaining(['ASSESSMENT_STARTED', 'CLARIFICATION_REQUESTED', 'DECISION_MADE']),
    );
  });

  it('lets a REVIEWER review but not give the final decision', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const rev = await signIn(t, 'rev@example.org', ['REVIEWER']);
    const id = await submitted(ada);
    const base = `/api/v1/assessments/${id}`;
    expect((await post(rev, `${base}/start`)).status).toBe(200);
    expect((await post(rev, `${base}/decision`, VERIFY)).status).toBe(403);
    const detail = await rev.agent.get(base);
    expect(detail.body.assessment.canDecide).toBe(false);
    expect(detail.body.assessment.project.status).toBe('UNDER_REVIEW');
  });

  it('validates the decision and requires the project to be under review', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    const base = `/api/v1/assessments/${id}`;
    expect((await post(root, `${base}/decision`, VERIFY)).status).toBe(409); // not started yet
    await post(root, `${base}/start`);
    expect((await post(root, `${base}/decision`, { decision: 'VERIFIED', rationale: 'short' })).status).toBe(400);
    expect((await post(root, `${base}/decision`, { decision: 'MAYBE', rationale: VERIFY.rationale })).status).toBe(400);
  });

  it('blocks reviewing your own project', async () => {
    const t = buildTestContext();
    const dual = await signIn(t, 'dual@example.org', ['PROFESSIONAL', 'ASSESSOR']);
    const id = await submitted(dual);
    const queue = await dual.agent.get('/api/v1/assessments/queue');
    expect(queue.body.queue).toHaveLength(0);
    const res = await dual.agent.get(`/api/v1/assessments/${id}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CONFLICT_OF_INTEREST');
  });

  it("hides one user's feedback from another user and drafts from reviewers", async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    expect((await bob.agent.get(`/api/v1/projects/${id}/feedback`)).status).toBe(404);

    const draft = await post(ada, '/api/v1/projects', { title: 'Still a draft' });
    const draftId = draft.body.project.id as string;
    expect((await root.agent.get(`/api/v1/assessments/${draftId}`)).status).toBe(404);
  });
});