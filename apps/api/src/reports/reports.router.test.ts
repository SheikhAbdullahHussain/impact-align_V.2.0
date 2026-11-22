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
  const res = await agent
    .post('/api/v1/auth/login')
    .send({ email: address, password: STRONG_PASSWORD });
  return { agent, csrf: res.body.csrfToken as string };
}
type Person = Awaited<ReturnType<typeof signIn>>;

const post = (p: Person, url: string, body: object = {}) =>
  p.agent
    .post(url)
    .set('X-CSRF-Token', p.csrf)
    .send(url.endsWith('/submit') ? { declaration: true, ...body } : body);

async function submitted(p: Person) {
  const created = await post(p, '/api/v1/projects', { title: 'Report project', sdgNumbers: [6] });
  const id = created.body.project.id as string;
  await p.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', p.csrf)
    .send(Buffer.from('%PDF-1.4 test content'));
  await post(p, `/api/v1/projects/${id}/submit`);
  return id;
}

const DECIDE = { decision: 'VERIFIED', rationale: 'Evidence matches the claimed indicators.' };

describe('reports', () => {
  it('creates a report at the final decision and lets only the owner read it', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);

    expect((await ada.agent.get('/api/v1/reports')).body.reports).toHaveLength(0);
    expect((await ada.agent.get(`/api/v1/reports/${id}`)).status).toBe(404);

    await post(root, `/api/v1/assessments/${id}/start`);
    await post(root, `/api/v1/assessments/${id}/decision`, DECIDE);

    const list = await ada.agent.get('/api/v1/reports');
    expect(list.body.reports).toHaveLength(1);

    const one = await ada.agent.get(`/api/v1/reports/${id}`);
    expect(one.status).toBe(200);
    expect(one.body.report.decision).toBe('VERIFIED');
    expect(one.body.report.rationale).toBe(DECIDE.rationale);
    expect(one.body.report.evidence).toHaveLength(1);
    expect(one.body.report.evidence[0].fileName).toBe('proof.pdf');
    expect(one.body.report.code).toMatch(/^IASDG-/);

    const file = await ada.agent.get(`/api/v1/reports/${id}/download`);
    expect(file.status).toBe(200);
    expect(file.headers['content-disposition']).toMatch(
      /^attachment; filename="IASDG-.+-report\.json"$/,
    );

    expect((await bob.agent.get(`/api/v1/reports/${id}`)).status).toBe(404);
    expect((await bob.agent.get('/api/v1/reports')).body.reports).toHaveLength(0);
    expect(t.repos.data.audit.map((e) => e.action)).toContain('REPORT_GENERATED');
  });

  it('requires login', async () => {
    const t = buildTestContext();
    expect((await request(t.app).get('/api/v1/reports')).status).toBe(401);
  });
});
