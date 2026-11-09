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

const createProject = async (p: Person) =>
  (
    await p.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', p.csrf)
      .send({ title: 'Evidence project' })
  ).body.project.id as string;

const upload = (p: Person, projectId: string, name: string, body: Buffer, csrf = p.csrf) =>
  p.agent
    .post(`/api/v1/projects/${projectId}/evidence`)
    .set('Content-Type', 'application/octet-stream')
    .set('X-File-Name', encodeURIComponent(name))
    .set('X-CSRF-Token', csrf)
    .send(body);

const pdf = Buffer.from('%PDF-1.4 test content');

describe('evidence upload', () => {
  it('stores a valid file, lists it and never exposes the storage key', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const projectId = await createProject(ada);

    const res = await upload(ada, projectId, 'Annual report.pdf', pdf);
    expect(res.status).toBe(201);
    expect(res.body.evidence).toMatchObject({
      fileName: 'Annual report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdf.length,
    });
    expect(JSON.stringify(res.body)).not.toContain('storageKey');

    const list = await ada.agent.get(`/api/v1/projects/${projectId}/evidence`);
    expect(list.body.evidence).toHaveLength(1);

    const file = await ada.agent.get(
      `/api/v1/projects/${projectId}/evidence/${res.body.evidence.id}/file`,
    );
    expect(file.status).toBe(200);
    expect(file.headers['content-disposition']).toMatch(/^attachment;/);
    expect(file.headers['content-type']).toContain('application/pdf');
  });

  it('rejects wrong types, fake content and empty bodies', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const projectId = await createProject(ada);
    expect((await upload(ada, projectId, 'tool.exe', pdf)).status).toBe(400);
    expect((await upload(ada, projectId, 'fake.pdf', Buffer.from('MZ\x90\x00'))).status).toBe(400);
    expect((await upload(ada, projectId, 'empty.pdf', Buffer.alloc(0))).status).toBe(400);
  });

  it('needs the CSRF token and the EVIDENCE_UPLOAD permission', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const projectId = await createProject(ada);
    expect((await upload(ada, projectId, 'a.pdf', pdf, 'wrong')).status).toBe(403);
    t.repos.data.users[0]!.roles = ['PUBLIC_USER'];
    expect((await upload(ada, projectId, 'a.pdf', pdf)).status).toBe(403);
  });

  it("hides another user's project evidence (404)", async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const projectId = await createProject(ada);
    const up = await upload(ada, projectId, 'a.pdf', pdf);
    const base = `/api/v1/projects/${projectId}/evidence`;
    expect((await bob.agent.get(base)).status).toBe(404);
    expect((await upload(bob, projectId, 'b.pdf', pdf)).status).toBe(404);
    expect((await bob.agent.get(`${base}/${up.body.evidence.id}/file`)).status).toBe(404);
    expect(
      (await bob.agent.delete(`${base}/${up.body.evidence.id}`).set('X-CSRF-Token', bob.csrf)).status,
    ).toBe(404);
  });

  it('deletes evidence and its file', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const projectId = await createProject(ada);
    const up = await upload(ada, projectId, 'a.pdf', pdf);
    const url = `/api/v1/projects/${projectId}/evidence/${up.body.evidence.id}`;
    expect((await ada.agent.delete(url).set('X-CSRF-Token', ada.csrf)).status).toBe(204);
    expect((await ada.agent.get(`${url}/file`)).status).toBe(404);
    expect((await ada.agent.get(`/api/v1/projects/${projectId}/evidence`)).body.evidence).toHaveLength(0);
  });
});