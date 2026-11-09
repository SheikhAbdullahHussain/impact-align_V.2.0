import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

type Ctx = ReturnType<typeof buildTestContext>;

async function signIn(t: Ctx, address: string) {
  await t.signUp(address); // PROFESSIONAL: may create projects
  const agent = request.agent(t.app);
  const res = await agent.post('/api/v1/auth/login').send({ email: address, password: STRONG_PASSWORD });
  return { agent, csrf: res.body.csrfToken as string };
}

describe('projects', () => {
  it('requires a session', async () => {
    const { app } = buildTestContext();
    expect((await request(app).get('/api/v1/projects')).status).toBe(401);
  });

  it('creates, lists and deletes your own project', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const created = await ada.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', ada.csrf)
      .send({ title: 'Clean water pilot', sdgNumbers: [6, 3, 6] });
    expect(created.status).toBe(201);
    expect(created.body.project.sdgNumbers).toEqual([3, 6]);

    const list = await ada.agent.get('/api/v1/projects');
    expect(list.body.projects).toHaveLength(1);

    const del = await ada.agent
      .delete(`/api/v1/projects/${created.body.project.id}`)
      .set('X-CSRF-Token', ada.csrf);
    expect(del.status).toBe(204);
    expect((await ada.agent.get('/api/v1/projects')).body.projects).toHaveLength(0);
  });

  it("hides another user's project (404) and blocks edits and deletes", async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    const bob = await signIn(t, 'bob@example.org');
    const { body } = await ada.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', ada.csrf)
      .send({ title: 'Ada only' });
    const url = `/api/v1/projects/${body.project.id}`;
    expect((await bob.agent.get(url)).status).toBe(404);
    expect(
      (await bob.agent.put(url).set('X-CSRF-Token', bob.csrf).send({ title: 'Hijacked' })).status,
    ).toBe(404);
    expect((await bob.agent.delete(url).set('X-CSRF-Token', bob.csrf)).status).toBe(404);
  });

  it('rejects invalid input and a user without PROJECT_CREATE', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    for (const payload of [{ title: 'x' }, { title: 'Valid title', sdgNumbers: [18] }, { title: 'Valid title', ownerId: 'x' }]) {
      const res = await ada.agent.post('/api/v1/projects').set('X-CSRF-Token', ada.csrf).send(payload);
      expect(res.status).toBe(400);
    }
    t.repos.data.users[0]!.roles = ['PUBLIC_USER'];
    const denied = await ada.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', ada.csrf)
      .send({ title: 'Valid title' });
    expect(denied.status).toBe(403);
  });
});