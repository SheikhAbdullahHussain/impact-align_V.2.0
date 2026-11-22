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

const put = (p: Person, url: string, body: object) =>
  p.agent.put(url).set('X-CSRF-Token', p.csrf).send(body);

const FAQ = '/api/v1/admin/content/faq/accreditation';
const FAQ_DATA = {
  groups: [
    {
      id: 'general',
      title: 'General',
      items: [
        { number: 1, question: 'What is it?', answer: ['One paragraph.', ['first', 'second']] },
      ],
    },
  ],
};
const LEGAL = '/api/v1/admin/content/legal/privacy';
const LEGAL_DATA = { title: 'Privacy Policy', body: '## Data\n\nWe keep little.\n\n- one\n- two' };
const PLANS = '/api/v1/admin/content/plans/membership';
const PLANS_DATA = {
  title: 'Membership',
  intro: 'Join us.',
  plans: [
    {
      name: 'Individual',
      priceText: 'Contact us',
      description: 'For people.',
      features: ['Community access'],
      ctaLabel: 'Contact',
      ctaHref: '/contact',
    },
  ],
};
const SECTION_DATA = {
  title: 'About ImpactAlign',
  eyebrow: 'About',
  intro: 'Intro text.',
  topics: [{ title: 'Vision', description: 'Short.', body: ['Paragraph one.'] }],
};

describe('website content', () => {
  it('keeps drafts private and publishes on request (FAQ)', async () => {
    const t = buildTestContext();
    const admin = await signIn(t, 'admin@example.org', ['ADMIN']);

    expect((await admin.agent.get(FAQ)).body.entry).toBeNull();
    expect((await put(admin, FAQ, { status: 'DRAFT', data: FAQ_DATA })).status).toBe(200);
    expect((await request(t.app).get('/api/v1/content/faq/accreditation')).status).toBe(404);

    const published = await put(admin, FAQ, { status: 'PUBLISHED', data: FAQ_DATA });
    expect(published.body.entry.status).toBe('PUBLISHED');
    expect(published.body.entry.publishedAt).not.toBeNull();

    const pub = await request(t.app).get('/api/v1/content/faq/accreditation');
    expect(pub.status).toBe(200);
    expect(pub.body.entry.data.groups[0].items[0].answer[1]).toEqual(['first', 'second']);

    await put(admin, FAQ, { status: 'DRAFT', data: FAQ_DATA });
    expect((await request(t.app).get('/api/v1/content/faq/accreditation')).status).toBe(404);
    expect(t.repos.data.audit.map((e) => e.action)).toContain('CONTENT_UPDATED');
  });

  it('saves legal, section and plans content and lists it for admins', async () => {
    const t = buildTestContext();
    const admin = await signIn(t, 'admin@example.org', ['ADMIN']);
    expect((await put(admin, LEGAL, { status: 'PUBLISHED', data: LEGAL_DATA })).status).toBe(200);
    expect(
      (
        await put(admin, '/api/v1/admin/content/section/about', {
          status: 'DRAFT',
          data: SECTION_DATA,
        })
      ).status,
    ).toBe(200);
    expect((await put(admin, PLANS, { status: 'PUBLISHED', data: PLANS_DATA })).status).toBe(200);

    const legal = await request(t.app).get('/api/v1/content/legal/privacy');
    expect(legal.body.entry.data.body).toContain('## Data');
    expect((await request(t.app).get('/api/v1/content/section/about')).status).toBe(404);

    const items = (await admin.agent.get('/api/v1/admin/content')).body.items as {
      kind: string;
      key: string;
      status: string;
    }[];
    expect(items.map((i) => `${i.kind}:${i.key}:${i.status}`)).toEqual(
      expect.arrayContaining([
        'LEGAL:privacy:PUBLISHED',
        'SECTION:about:DRAFT',
        'PLANS:membership:PUBLISHED',
      ]),
    );
  });

  it('is closed to ordinary users and visitors', async () => {
    const t = buildTestContext();
    const ada = await signIn(t, 'ada@example.org');
    expect((await put(ada, LEGAL, { status: 'PUBLISHED', data: LEGAL_DATA })).status).toBe(403);
    expect((await ada.agent.get(LEGAL)).status).toBe(403);
    expect((await ada.agent.get('/api/v1/admin/content')).status).toBe(403);
    expect((await request(t.app).get(LEGAL)).status).toBe(401);
  });

  it('rejects malformed content', async () => {
    const t = buildTestContext();
    const admin = await signIn(t, 'admin@example.org', ['ADMIN']);
    const dup = { groups: [FAQ_DATA.groups[0], FAQ_DATA.groups[0]] };
    expect((await put(admin, FAQ, { status: 'DRAFT', data: dup })).status).toBe(400);
    expect((await put(admin, FAQ, { status: 'LIVE', data: FAQ_DATA })).status).toBe(400);
    expect((await put(admin, FAQ, { status: 'DRAFT', data: { groups: [] } })).status).toBe(400);
    expect(
      (await put(admin, LEGAL, { status: 'DRAFT', data: { title: 'x', body: ' ' } })).status,
    ).toBe(400);
    expect((await put(admin, LEGAL, { status: 'DRAFT', data: null })).status).toBe(400);
    const evil = {
      ...PLANS_DATA,
      plans: [{ ...PLANS_DATA.plans[0], ctaHref: 'javascript:alert(1)' }],
    };
    expect((await put(admin, PLANS, { status: 'DRAFT', data: evil })).status).toBe(400);
    const lonely = { ...PLANS_DATA, plans: [{ ...PLANS_DATA.plans[0], ctaLabel: '' }] };
    expect((await put(admin, PLANS, { status: 'DRAFT', data: lonely })).status).toBe(400);
  });

  it('answers unknown kinds and keys like missing content', async () => {
    const t = buildTestContext();
    const admin = await signIn(t, 'admin@example.org', ['ADMIN']);
    expect((await request(t.app).get('/api/v1/content/faq/Bad_Key!')).status).toBe(404);
    expect((await request(t.app).get('/api/v1/content/legal/not-a-page')).status).toBe(404);
    expect((await request(t.app).get('/api/v1/content/constructor/privacy')).status).toBe(404);
    expect(
      (
        await put(admin, '/api/v1/admin/content/legal/not-a-page', {
          status: 'DRAFT',
          data: LEGAL_DATA,
        })
      ).status,
    ).toBe(404);
  });
});
