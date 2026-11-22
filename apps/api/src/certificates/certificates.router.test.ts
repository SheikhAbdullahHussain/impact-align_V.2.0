import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { PlatformRole } from '@impactalign/types';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';
import { CertificatesService } from './certificates.service';

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
  const created = await post(p, '/api/v1/projects', {
    title: 'Certified project',
    sdgNumbers: [6],
  });
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

const decide = (root: Person, id: string, decision: 'VERIFIED' | 'REJECTED') =>
  post(root, `/api/v1/assessments/${id}/decision`, {
    decision,
    rationale: 'Evidence matches the claimed indicators.',
  });

describe('certificates', () => {
  it('issues on VERIFIED, shows only to the owner, and ASSESSOR can revoke', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);

    expect((await ada.agent.get(`/api/v1/certificates/${id}`)).status).toBe(404);
    await post(root, `/api/v1/assessments/${id}/start`);
    await decide(root, id, 'VERIFIED');

    const one = await ada.agent.get(`/api/v1/certificates/${id}`);
    expect(one.status).toBe(200);
    expect(one.body.certificate.status).toBe('VALID');
    expect(one.body.certificate.certificateNumber).toMatch(/^CERT-\d{4}-[0-9A-F]{8}$/);
    expect(one.body.certificate.code).toMatch(/^IASDG-/);
    expect((await ada.agent.get('/api/v1/certificates')).body.certificates).toHaveLength(1);
    expect((await bob.agent.get(`/api/v1/certificates/${id}`)).status).toBe(404);

    const url = `/api/v1/certificates/${id}/revoke`;
    expect((await post(ada, url, { reason: 'I want to revoke my own.' })).status).toBe(403);
    expect((await post(root, url, { reason: 'short' })).status).toBe(400);
    const revoked = await post(root, url, { reason: 'Evidence was found to be forged.' });
    expect(revoked.status).toBe(200);
    expect(revoked.body.certificate.status).toBe('REVOKED');
    expect(JSON.stringify(revoked.body)).not.toContain('forged');
    expect((await post(root, url, { reason: 'Evidence was found to be forged.' })).status).toBe(
      409,
    );

    const project = await ada.agent.get(`/api/v1/projects/${id}`);
    expect(project.body.project.status).toBe('VERIFIED');
    expect(t.repos.data.audit.map((e) => e.action)).toEqual(
      expect.arrayContaining(['CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED']),
    );
  });

  it('issues nothing for a rejected project', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    await post(root, `/api/v1/assessments/${id}/start`);
    await decide(root, id, 'REJECTED');
    expect((await ada.agent.get(`/api/v1/certificates/${id}`)).status).toBe(404);
    expect((await ada.agent.get('/api/v1/certificates')).body.certificates).toHaveLength(0);
  });

  it('marks an expired certificate and moves the project to EXPIRED', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    await post(root, `/api/v1/assessments/${id}/start`);
    await decide(root, id, 'VERIFIED');

    const later = new Date(Date.now() + 400 * 24 * 3_600_000);
    const service = new CertificatesService({ repos: t.repos, audit: t.audit, clock: () => later });
    const owner = t.repos.data.projects.find((p) => p.id === id)!.ownerId;
    const cert = await service.getMine(owner, id);
    expect(cert.status).toBe('EXPIRED');
    expect(t.repos.data.projects.find((p) => p.id === id)!.status).toBe('EXPIRED');
  });

  it('lets only an assessor look a certificate up by code', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const root = await signIn(t, 'root@example.org', ['ASSESSOR']);
    const id = await submitted(ada);
    await post(root, `/api/v1/assessments/${id}/start`);
    await decide(root, id, 'VERIFIED');
    const code = (await ada.agent.get(`/api/v1/certificates/${id}`)).body.certificate
      .code as string;

    const found = await root.agent.get(`/api/v1/certificates/lookup/${code}`);
    expect(found.status).toBe(200);
    expect(found.body.certificate.projectId).toBe(id);
    expect((await ada.agent.get(`/api/v1/certificates/lookup/${code}`)).status).toBe(403);
    expect((await root.agent.get('/api/v1/certificates/lookup/IASDG-ZZZZZZ')).status).toBe(404);
  });

  it('requires login', async () => {
    const t = buildTestContext();
    expect((await request(t.app).get('/api/v1/certificates')).status).toBe(401);
  });
});
