import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

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

const hex = (char: string) => char.repeat(24);
const ID = {
  sdg6: hex('a'),
  sdg7: hex('b'),
  target61: hex('c'),
  target71: hex('d'),
  indicator611: hex('e'),
  indicator711: hex('f'),
};

function seedCatalogue(t: Ctx) {
  const now = new Date();
  const base = {
    title: null,
    description: null,
    officialUrl: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
  };
  t.repos.data.sdgs.push(
    { ...base, id: ID.sdg6, number: 6, code: 'SDG-06' },
    { ...base, id: ID.sdg7, number: 7, code: 'SDG-07' },
  );
  t.repos.data.sdgTargets.push(
    { ...base, id: ID.target61, sdgId: ID.sdg6, code: '6.1' },
    { ...base, id: ID.target71, sdgId: ID.sdg7, code: '7.1' },
  );
  t.repos.data.sdgIndicators.push(
    { ...base, id: ID.indicator611, sdgId: ID.sdg6, targetId: ID.target61, code: '6.1.1' },
    { ...base, id: ID.indicator711, sdgId: ID.sdg7, targetId: ID.target71, code: '7.1.1' },
  );
}

const pdf = Buffer.from('%PDF-1.4 test');

const createProject = async (p: Person, sdgNumbers: number[]) =>
  (
    await p.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', p.csrf)
      .send({ title: 'Mapped project', sdgNumbers })
  ).body.project.id as string;

const align = (p: Person, id: string, body: object) =>
  p.agent.put(`/api/v1/projects/${id}/alignment`).set('X-CSRF-Token', p.csrf).send(body);

const upload = async (p: Person, id: string) =>
  (
    await p.agent
      .post(`/api/v1/projects/${id}/evidence`)
      .set('Content-Type', 'application/octet-stream')
      .set('X-File-Name', 'proof.pdf')
      .set('X-CSRF-Token', p.csrf)
      .send(pdf)
  ).body.evidence.id as string;

const link = (p: Person, projectId: string, evidenceId: string, indicatorId: string | null) =>
  p.agent
    .put(`/api/v1/projects/${projectId}/evidence/${evidenceId}/indicator`)
    .set('X-CSRF-Token', p.csrf)
    .send({ indicatorId });

const setup = async () => {
  const t = buildTestContext();
  seedCatalogue(t);
  return { t, ada: await signIn(t, 'ada@example.org') };
};

describe('target and indicator mapping', () => {
  it('maps targets and indicators of the selected SDGs', async () => {
    const { ada } = await setup();
    const id = await createProject(ada, [6]);
    const res = await align(ada, id, { targetIds: [ID.target61], indicatorIds: [ID.indicator611] });
    expect(res.status).toBe(200);
    expect(res.body.project.targetIds).toEqual([ID.target61]);
    expect(res.body.project.indicatorIds).toEqual([ID.indicator611]);
  });

  it('refuses unknown ids, other SDGs and an indicator without its target', async () => {
    const { ada } = await setup();
    const id = await createProject(ada, [6]);
    const other = await align(ada, id, { targetIds: [ID.target71], indicatorIds: [] });
    expect(other.status).toBe(400);
    expect(other.body.error.code).toBe('INVALID_ALIGNMENT');
    expect((await align(ada, id, { targetIds: [hex('9')], indicatorIds: [] })).status).toBe(400);
    expect((await align(ada, id, { targetIds: [], indicatorIds: [ID.indicator611] })).status).toBe(
      400,
    );
    expect((await align(ada, id, { targetIds: ['nope'], indicatorIds: [] })).status).toBe(400);
  });

  it('keeps an SDG selected while its targets are mapped', async () => {
    const { ada } = await setup();
    const id = await createProject(ada, [6]);
    await align(ada, id, { targetIds: [ID.target61], indicatorIds: [] });
    const put = (sdgNumbers: number[]) =>
      ada.agent
        .put(`/api/v1/projects/${id}`)
        .set('X-CSRF-Token', ada.csrf)
        .send({ title: 'Mapped project', sdgNumbers });
    const refused = await put([7]);
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe('ALIGNMENT_IN_USE');
    await align(ada, id, { targetIds: [], indicatorIds: [] });
    expect((await put([7])).status).toBe(200);
  });

  it("hides another user's project and locks it after submission", async () => {
    const { t, ada } = await setup();
    const bob = await signIn(t, 'bob@example.org');
    const id = await createProject(ada, [6]);
    expect((await align(bob, id, { targetIds: [], indicatorIds: [] })).status).toBe(404);

    await upload(ada, id);
    await ada.agent
      .post(`/api/v1/projects/${id}/submit`)
      .set('X-CSRF-Token', ada.csrf)
      .send({ declaration: true });
    const locked = await align(ada, id, { targetIds: [ID.target61], indicatorIds: [] });
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe('PROJECT_LOCKED');
  });
});

describe('evidence linked to an indicator', () => {
  it('links only to a mapped indicator and unlinks on null', async () => {
    const { ada } = await setup();
    const id = await createProject(ada, [6]);
    const evidenceId = await upload(ada, id);

    const early = await link(ada, id, evidenceId, ID.indicator611);
    expect(early.status).toBe(400);
    expect(early.body.error.code).toBe('INDICATOR_NOT_MAPPED');

    await align(ada, id, { targetIds: [ID.target61], indicatorIds: [ID.indicator611] });
    const linked = await link(ada, id, evidenceId, ID.indicator611);
    expect(linked.status).toBe(200);
    expect(linked.body.evidence.indicatorId).toBe(ID.indicator611);
    expect((await link(ada, id, evidenceId, null)).body.evidence.indicatorId).toBeNull();
  });

  it('unlinks files when their indicator is removed from the mapping', async () => {
    const { ada } = await setup();
    const id = await createProject(ada, [6]);
    const evidenceId = await upload(ada, id);
    await align(ada, id, { targetIds: [ID.target61], indicatorIds: [ID.indicator611] });
    await link(ada, id, evidenceId, ID.indicator611);

    await align(ada, id, { targetIds: [ID.target61], indicatorIds: [] });
    const list = await ada.agent.get(`/api/v1/projects/${id}/evidence`);
    expect(list.body.evidence[0].indicatorId).toBeNull();
  });

  it("hides another user's evidence", async () => {
    const { t, ada } = await setup();
    const bob = await signIn(t, 'bob@example.org');
    const id = await createProject(ada, [6]);
    const evidenceId = await upload(ada, id);
    expect((await link(bob, id, evidenceId, null)).status).toBe(404);
  });
});
