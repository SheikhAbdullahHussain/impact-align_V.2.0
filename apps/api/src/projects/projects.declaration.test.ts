import request from 'supertest';
import { describe, expect, it } from 'vitest';
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

async function readyDraft(p: Person) {
  const created = await p.agent
    .post('/api/v1/projects')
    .set('X-CSRF-Token', p.csrf)
    .send({ title: 'Declaration project', sdgNumbers: [6] });
  const id = created.body.project.id as string;
  await p.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', p.csrf)
    .send(Buffer.from('%PDF-1.4 test'));
  return id;
}

const submit = (p: Person, id: string, body: object) =>
  p.agent.post(`/api/v1/projects/${id}/submit`).set('X-CSRF-Token', p.csrf).send(body);

describe('submission declaration', () => {
  it('refuses to submit without an explicit declaration', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const id = await readyDraft(ada);
    for (const body of [{}, { declaration: false }, { declaration: 'true' }]) {
      const res = await submit(ada, id, body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    const project = await ada.agent.get(`/api/v1/projects/${id}`);
    expect(project.body.project.status).toBe('DRAFT');
    expect(project.body.project.code).toBeNull();
  });

  it('rejects unknown fields next to the declaration', async () => {
    const ada = await signIn(buildTestContext(), 'ada@example.org');
    const id = await readyDraft(ada);
    expect((await submit(ada, id, { declaration: true, ownerId: 'x' })).status).toBe(400);
  });

  it('records the declaration and the code in the audit trail', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const id = await readyDraft(ada);
    expect((await submit(ada, id, { declaration: true })).status).toBe(200);
    const entry = t.repos.data.audit.find((e) => e.action === 'PROJECT_SUBMITTED');
    expect(entry?.resourceId).toBe(id);
    expect(entry?.metadata).toMatchObject({ declaration: true });
    expect(String(entry?.metadata?.['code'])).toMatch(SUBMISSION_CODE_PATTERN);
  });
});
