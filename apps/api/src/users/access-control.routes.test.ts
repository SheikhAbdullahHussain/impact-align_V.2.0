import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { PlatformRole } from '@impactalign/types';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

type Ctx = ReturnType<typeof buildTestContext>;

/** Creates a verified user with the given platform roles and returns a signed-in "browser". */
async function person(t: Ctx, name: string, roles: PlatformRole[] = ['PROFESSIONAL']) {
  const email = `${name}@example.org`;
  await t.signUp(email);
  const record = t.repos.data.users.find((u) => u.email === email)!;
  record.roles = roles; // set directly: the HTTP API (rightly) offers no way to pick staff roles at sign-up
  const agent = request.agent(t.app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password: STRONG_PASSWORD });
  return { id: record.id, email, agent, csrf: res.body.csrfToken as string };
}
type Person = Awaited<ReturnType<typeof person>>;
const put = (p: Person, url: string, body: unknown) =>
  p.agent
    .put(url)
    .set('X-CSRF-Token', p.csrf)
    .send(body as object);
const post = (p: Person, url: string, body: unknown) =>
  p.agent
    .post(url)
    .set('X-CSRF-Token', p.csrf)
    .send(body as object);
const patch = (p: Person, url: string, body: unknown) =>
  p.agent
    .patch(url)
    .set('X-CSRF-Token', p.csrf)
    .send(body as object);
const fakeId = () => randomBytes(12).toString('hex');

describe('unauthorized access', () => {
  it.each([
    ['get', `/api/v1/users/${'a'.repeat(24)}`],
    ['put', `/api/v1/users/${'a'.repeat(24)}/roles`],
    ['patch', '/api/v1/users/me'],
    ['get', '/api/v1/organizations'],
    ['post', '/api/v1/organizations'],
    ['get', `/api/v1/organizations/${'a'.repeat(24)}`],
  ] as const)('%s %s without a session is 401', async (method, url) => {
    const { app } = buildTestContext();
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });
});

describe('cross-user access', () => {
  it('lets you read yourself but not another user', async () => {
    const t = buildTestContext();
    const ada = await person(t, 'ada');
    const bob = await person(t, 'bob');
    expect((await ada.agent.get(`/api/v1/users/${ada.id}`)).status).toBe(200);
    const other = await ada.agent.get(`/api/v1/users/${bob.id}`);
    expect(other.status).toBe(403);
    expect(JSON.stringify(other.body)).not.toContain('bob@example.org');
  });

  it('answers 403 for real and unknown ids alike (no probing for accounts)', async () => {
    const t = buildTestContext();
    const ada = await person(t, 'ada');
    const bob = await person(t, 'bob');
    const real = await ada.agent.get(`/api/v1/users/${bob.id}`);
    const unknown = await ada.agent.get(`/api/v1/users/${fakeId()}`);
    expect(unknown.status).toBe(real.status);
  });

  it('lets staff with USER_READ read others, and a malformed id is a 404', async () => {
    const t = buildTestContext();
    const admin = await person(t, 'admin', ['ADMIN']);
    const bob = await person(t, 'bob');
    expect((await admin.agent.get(`/api/v1/users/${bob.id}`)).status).toBe(200);
    expect((await admin.agent.get('/api/v1/users/not-an-id')).status).toBe(404);
  });

  it('only changes your own display name — extra fields such as roles or id are rejected', async () => {
    const t = buildTestContext();
    const ada = await person(t, 'ada');
    const ok = await patch(ada, '/api/v1/users/me', { displayName: 'Ada L.' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.displayName).toBe('Ada L.');
    for (const extra of [
      { roles: ['SUPER_ADMIN'] },
      { id: fakeId() },
      { email: 'x@example.org' },
    ]) {
      expect((await patch(ada, '/api/v1/users/me', { displayName: 'Ada', ...extra })).status).toBe(
        400,
      );
    }
    expect(t.repos.data.users.find((u) => u.id === ada.id)!.roles).toEqual(['PROFESSIONAL']);
  });
});

describe('privilege escalation', () => {
  it('stops an ordinary user from assigning roles to anyone, including themselves', async () => {
    const t = buildTestContext();
    const eve = await person(t, 'eve');
    const bob = await person(t, 'bob');
    expect(
      (await put(eve, `/api/v1/users/${eve.id}/roles`, { roles: ['SUPER_ADMIN'] })).status,
    ).toBe(403);
    expect((await put(eve, `/api/v1/users/${bob.id}/roles`, { roles: ['ADMIN'] })).status).toBe(
      403,
    );
    expect(t.repos.data.users.find((u) => u.id === eve.id)!.roles).toEqual(['PROFESSIONAL']);
  });

  it('requires the CSRF token for role changes', async () => {
    const t = buildTestContext();
    const admin = await person(t, 'admin', ['ADMIN']);
    const bob = await person(t, 'bob');
    const res = await admin.agent
      .put(`/api/v1/users/${bob.id}/roles`)
      .send({ roles: ['ASSESSOR'] });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_FAILED');
  });

  it('lets an ADMIN assign ordinary roles, records before/after, and applies them at once', async () => {
    const t = buildTestContext();
    const admin = await person(t, 'admin', ['ADMIN']);
    const bob = await person(t, 'bob');
    const res = await put(admin, `/api/v1/users/${bob.id}/roles`, { roles: ['ASSESSOR'] });
    expect(res.status).toBe(200);
    expect(res.body.user.roles).toEqual(['ASSESSOR']);
    expect((await bob.agent.get('/api/v1/auth/me')).body.user.roles).toEqual(['ASSESSOR']); // live session sees it
    const entry = t.repos.data.audit.find(
      (e) => e.action === 'ROLE_CHANGED' && e.outcome === 'success',
    )!;
    expect(entry.actorId).toBe(admin.id);
    expect(entry.metadata).toMatchObject({ before: ['PROFESSIONAL'], after: ['ASSESSOR'] });
  });

  it('stops an ADMIN from creating staff, editing staff, or changing their own roles', async () => {
    const t = buildTestContext();
    const admin = await person(t, 'admin', ['ADMIN']);
    const root = await person(t, 'root', ['SUPER_ADMIN']);
    const bob = await person(t, 'bob');
    for (const roles of [['ADMIN'], ['SUPER_ADMIN'], ['ASSESSOR', 'ADMIN']]) {
      expect((await put(admin, `/api/v1/users/${bob.id}/roles`, { roles })).status).toBe(403);
    }
    expect(
      (await put(admin, `/api/v1/users/${root.id}/roles`, { roles: ['PUBLIC_USER'] })).status,
    ).toBe(403);
    expect(
      (await put(admin, `/api/v1/users/${admin.id}/roles`, { roles: ['SUPER_ADMIN'] })).status,
    ).toBe(403);
    expect(t.repos.data.users.find((u) => u.id === bob.id)!.roles).toEqual(['PROFESSIONAL']);
    expect(
      t.repos.data.audit.filter((e) => e.action === 'ROLE_CHANGED' && e.outcome === 'failure')
        .length,
    ).toBeGreaterThan(0);
  });

  it('lets a SUPER_ADMIN grant ADMIN, but nobody can change their own roles', async () => {
    const t = buildTestContext();
    const root = await person(t, 'root', ['SUPER_ADMIN']);
    const bob = await person(t, 'bob');
    expect((await put(root, `/api/v1/users/${bob.id}/roles`, { roles: ['ADMIN'] })).status).toBe(
      200,
    );
    expect(
      (await put(root, `/api/v1/users/${root.id}/roles`, { roles: ['PUBLIC_USER'] })).status,
    ).toBe(403);
  });

  it('rejects unknown roles and organization roles as platform roles', async () => {
    const t = buildTestContext();
    const root = await person(t, 'root', ['SUPER_ADMIN']);
    const bob = await person(t, 'bob');
    for (const roles of [['GOD_MODE'], ['ORGANIZATION_ADMIN'], []]) {
      expect((await put(root, `/api/v1/users/${bob.id}/roles`, { roles })).status).toBe(400);
    }
  });
});

describe('cross-organization access', () => {
  async function twoOrganizations() {
    const t = buildTestContext();
    const ada = await person(t, 'ada');
    const bob = await person(t, 'bob');
    const org1 = (await post(ada, '/api/v1/organizations', { name: 'Acme Research' })).body
      .organization;
    const org2 = (await post(bob, '/api/v1/organizations', { name: 'Beta Labs' })).body
      .organization;
    return { t, ada, bob, org1, org2 };
  }

  it('makes the creator an ORGANIZATION_ADMIN and lists only your own organizations', async () => {
    const { ada, org1 } = await twoOrganizations();
    expect(org1.role).toBe('ORGANIZATION_ADMIN');
    const mine = await ada.agent.get('/api/v1/organizations');
    expect(mine.body.organizations.map((o: { id: string }) => o.id)).toEqual([org1.id]);
  });

  it('hides another organization completely: read, members and rename are all 404', async () => {
    const { ada, org2 } = await twoOrganizations();
    expect((await ada.agent.get(`/api/v1/organizations/${org2.id}`)).status).toBe(404);
    expect((await ada.agent.get(`/api/v1/organizations/${org2.id}/members`)).status).toBe(404);
    expect(
      (await patch(ada, `/api/v1/organizations/${org2.id}`, { name: 'Hijacked' })).status,
    ).toBe(404);
  });

  it('gives a non-member the same response as for an organization that does not exist', async () => {
    const { ada, org2 } = await twoOrganizations();
    const foreign = await ada.agent.get(`/api/v1/organizations/${org2.id}`);
    const missing = await ada.agent.get(`/api/v1/organizations/${fakeId()}`);
    const malformed = await ada.agent.get('/api/v1/organizations/not-an-id');
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(foreign.body.error.code).toBe(missing.body.error.code);
  });

  it('gives platform staff, even a SUPER_ADMIN, no access to organization data', async () => {
    const { t, org1 } = await twoOrganizations();
    for (const [name, roles] of [
      ['admin', ['ADMIN']],
      ['root', ['SUPER_ADMIN']],
    ] as const) {
      const staff = await person(t, name, [...roles]);
      expect((await staff.agent.get(`/api/v1/organizations/${org1.id}`)).status).toBe(404);
      expect((await staff.agent.get(`/api/v1/organizations/${org1.id}/members`)).status).toBe(404);
    }
  });

  it('separates organization admins from members inside one organization', async () => {
    const { t, ada, org1 } = await twoOrganizations();
    const carol = await person(t, 'carol', ['PUBLIC_USER']);
    await t.repos.organizations.addMember(org1.id, carol.id, 'ORGANIZATION_MEMBER');

    const read = await carol.agent.get(`/api/v1/organizations/${org1.id}`);
    expect(read.status).toBe(200);
    expect(read.body.organization.role).toBe('ORGANIZATION_MEMBER');
    expect(
      (await patch(carol, `/api/v1/organizations/${org1.id}`, { name: 'Mine now' })).status,
    ).toBe(403);
    expect(
      (await patch(ada, `/api/v1/organizations/${org1.id}`, { name: 'Acme Labs' })).body
        .organization.name,
    ).toBe('Acme Labs');
  });

  it('lists members by name and role only, never email addresses', async () => {
    const { t, ada, org1 } = await twoOrganizations();
    const carol = await person(t, 'carol');
    await t.repos.organizations.addMember(org1.id, carol.id, 'ORGANIZATION_MEMBER');
    const res = await ada.agent.get(`/api/v1/organizations/${org1.id}/members`);
    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(2);
    expect(JSON.stringify(res.body)).not.toMatch(/@example\.org/);
  });

  it('stops users without ORG_CREATE (PUBLIC_USER) from creating organizations', async () => {
    const t = buildTestContext();
    const pat = await person(t, 'pat', ['PUBLIC_USER']);
    expect((await post(pat, '/api/v1/organizations', { name: 'Nope Inc' })).status).toBe(403);
    expect(t.repos.data.orgs).toHaveLength(0);
  });

  it('writes an audit event when an organization is created', async () => {
    const { t, ada, org1 } = await twoOrganizations();
    const entry = t.repos.data.audit.find(
      (e) => e.action === 'ORGANIZATION_CREATED' && e.organizationId === org1.id,
    )!;
    expect(entry.actorId).toBe(ada.id);
  });
});
