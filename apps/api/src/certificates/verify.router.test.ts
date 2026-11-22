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

async function verifiedProject(t: Ctx) {
  const ada = await signIn(t, 'ada@example.org');
  const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
  const created = await post(ada, '/api/v1/projects', { title: 'Public project', sdgNumbers: [6] });
  const id = created.body.project.id as string;
  await ada.agent
    .post(`/api/v1/projects/${id}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', 'proof.pdf')
    .set('X-CSRF-Token', ada.csrf)
    .send(Buffer.from('%PDF-1.4 test content'));
  await post(ada, `/api/v1/projects/${id}/submit`);
  await post(root, `/api/v1/assessments/${id}/start`);
  await post(root, `/api/v1/assessments/${id}/decision`, {
    decision: 'VERIFIED',
    rationale: 'Secret rationale for reviewers only.',
  });
  const cert = (await ada.agent.get(`/api/v1/certificates/${id}`)).body.certificate;
  return { id, root, code: cert.code as string };
}

describe('public verification', () => {
  it('works without login and shows only public fields', async () => {
    const t = buildTestContext();
    const { code } = await verifiedProject(t);

    const res = await request(t.app).get(`/api/v1/verify/${code}`);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(Object.keys(res.body.verification).sort()).toEqual([
      'certificateNumber',
      'code',
      'expiresAt',
      'issuedAt',
      'revokedAt',
      'sdgNumbers',
      'status',
      'submissionType',
      'title',
    ]);
    expect(res.body.verification.status).toBe('VALID');
    expect(res.body.verification.title).toBe('Public project');
    expect(JSON.stringify(res.body)).not.toContain('Secret rationale');

    const lower = await request(t.app).get(`/api/v1/verify/${code.toLowerCase()}`);
    expect(lower.status).toBe(200);
  });

  it('shows REVOKED with the date but never the reason', async () => {
    const t = buildTestContext();
    const { id, root, code } = await verifiedProject(t);
    await post(root, `/api/v1/certificates/${id}/revoke`, {
      reason: 'Internal reason: forged evidence.',
    });
    const res = await request(t.app).get(`/api/v1/verify/${code}`);
    expect(res.body.verification.status).toBe('REVOKED');
    expect(res.body.verification.revokedAt).not.toBeNull();
    expect(JSON.stringify(res.body)).not.toContain('forged');
  });

  it('answers unknown and malformed codes the same way', async () => {
    const t = buildTestContext();
    const unknown = await request(t.app).get('/api/v1/verify/IASDG-ZZZZZZ');
    const malformed = await request(t.app).get('/api/v1/verify/not-a-code');
    expect(unknown.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(unknown.body.error.message).toBe(malformed.body.error.message);
  });

  it('is rate limited per IP', async () => {
    const t = buildTestContext();
    const statuses: number[] = [];
    for (let i = 0; i < 35; i++) {
      statuses.push((await request(t.app).get('/api/v1/verify/IASDG-ZZZZZZ')).status);
    }
    expect(statuses[0]).toBe(404);
    expect(statuses).toContain(429);
  });
});
