import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestContext } from '../test-utils';
import { STRONG_PASSWORD } from '../testing/auth-context';

const API = '/api/v1/auth';
const json = { 'Content-Type': 'application/json' };
const body = (email: string, extra: Record<string, unknown> = {}) => ({
  email,
  password: STRONG_PASSWORD,
  displayName: 'Ada Lovelace',
  accountType: 'RESEARCHER',
  ...extra,
});

/** A signed-in browser: cookie jar + CSRF token. */
async function signIn(address = 'ada@example.org') {
  const t = buildTestContext();
  await t.signUp(address); // creates + verifies the account
  const agent = request.agent(t.app);
  const res = await agent.post(`${API}/login`).send({ email: address, password: STRONG_PASSWORD });
  return { ...t, agent, csrf: res.body.csrfToken as string, loginRes: res };
}

describe('registration over HTTP', () => {
  it('answers 202 with the same body for new and existing addresses', async () => {
    const { app } = buildTestContext();
    const first = await request(app).post(`${API}/register`).send(body('ada@example.org'));
    const again = await request(app).post(`${API}/register`).send(body('ada@example.org'));
    expect(first.status).toBe(202);
    expect(again.status).toBe(202);
    expect(again.body).toEqual(first.body);
  });

  it('rejects a client-supplied role (no privilege escalation at sign-up)', async () => {
    const { app, repos } = buildTestContext();
    for (const extra of [
      { roles: ['SUPER_ADMIN'] },
      { role: 'ADMIN' },
      { accountType: 'SUPER_ADMIN' },
    ]) {
      const res = await request(app).post(`${API}/register`).send(body('eve@example.org', extra));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(repos.data.users).toHaveLength(0);
  });

  it('returns field errors without echoing the submitted password', async () => {
    const { app } = buildTestContext();
    const res = await request(app)
      .post(`${API}/register`)
      .send(body('bad', { password: 'short' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    expect(JSON.stringify(res.body)).not.toContain('short');
  });
});

describe('login, session cookie and /me', () => {
  it('sets an HttpOnly SameSite cookie and never returns the password hash', async () => {
    const { loginRes, agent } = await signIn();
    expect(loginRes.status).toBe(200);
    const cookie = String(loginRes.headers['set-cookie']);
    expect(cookie).toMatch(/ia_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(JSON.stringify(loginRes.body)).not.toMatch(/passwordHash|scrypt\$/);
    const me = await agent.get(`${API}/me`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('ada@example.org');
    expect(me.body.csrfToken).toBe(loginRes.body.csrfToken);
  });

  it('uses a Secure __Host- cookie in production', async () => {
    const prod = {
      NODE_ENV: 'production',
      API_CORS_ORIGINS: 'https://app.example.org',
      MONGODB_URI: 'mongodb://u:p@db.internal/d',
      REDIS_URL: 'rediss://:p@cache.internal:6379',
      APP_WEB_URL: 'https://app.example.org',
      EMAIL_TRANSPORT: 'disabled',
    };
    const t = buildTestContext({}, prod);
    await t.signUp('ada@example.org');
    const res = await request(t.app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: STRONG_PASSWORD });
    expect(String(res.headers['set-cookie'])).toMatch(/^__Host-ia_session=.*Secure/i);
  });

  it('gives a generic 401 for a wrong password and an unknown address', async () => {
    const { app, signUp } = buildTestContext();
    await signUp('ada@example.org');
    const wrong = await request(app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: 'wrong-password-123' });
    const ghost = await request(app)
      .post(`${API}/login`)
      .send({ email: 'ghost@example.org', password: 'wrong-password-123' });
    expect(wrong.status).toBe(401);
    expect(ghost.status).toBe(401);
    expect(wrong.body.error.message).toBe(ghost.body.error.message);
  });

  it('locks out after repeated failures (429)', async () => {
    const { app, signUp } = buildTestContext();
    await signUp('ada@example.org');
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post(`${API}/login`)
        .send({ email: 'ada@example.org', password: 'wrong-password-123' });
    }
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: STRONG_PASSWORD });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });

  it('rate limits credential endpoints per IP', async () => {
    const { app } = buildTestContext({}, { AUTH_RATE_LIMIT_MAX: '2' });
    const codes: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      codes.push(
        (await request(app).post(`${API}/login`).send({ email: 'a@example.org', password: 'x' }))
          .status,
      );
    }
    expect(codes).toEqual([401, 401, 429, 429]);
  });
});

describe('unauthorized access', () => {
  it.each([
    ['GET', '/me'],
    ['POST', '/logout'],
    ['POST', '/change-password'],
  ])('%s %s without a session is 401', async (method, path) => {
    const { app } = buildTestContext();
    const res = await request(app)[method === 'GET' ? 'get' : 'post'](`${API}${path}`).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('a forged or garbage cookie is 401', async () => {
    const { app } = buildTestContext();
    const res = await request(app).get(`${API}/me`).set('Cookie', 'ia_session=forged-token-value');
    expect(res.status).toBe(401);
  });

  it('an expired session is 401 and cannot be revived', async () => {
    const { agent, advance } = await signIn();
    expect((await agent.get(`${API}/me`)).status).toBe(200);
    advance(61 * 60_000); // idle timeout in the test setup is 60 minutes
    expect((await agent.get(`${API}/me`)).status).toBe(401);
  });
});

describe('CSRF, origin and content-type guards', () => {
  it('rejects state-changing requests without the CSRF token, accepts them with it', async () => {
    const { agent, csrf } = await signIn();
    const missing = await agent.post(`${API}/logout`).send({});
    expect(missing.status).toBe(403);
    expect(missing.body.error.code).toBe('CSRF_FAILED');
    expect((await agent.post(`${API}/logout`).set('X-CSRF-Token', 'wrong').send({})).status).toBe(
      403,
    );

    const ok = await agent.post(`${API}/logout`).set('X-CSRF-Token', csrf).send({});
    expect(ok.status).toBe(204);
    expect((await agent.get(`${API}/me`)).status).toBe(401); // session revoked server-side
  });

  it('rejects browser requests from a foreign origin', async () => {
    const { app } = buildTestContext();
    const res = await request(app)
      .post(`${API}/login`)
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@example.org', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('requires JSON bodies (415 for form posts)', async () => {
    const { app } = buildTestContext();
    const res = await request(app)
      .post(`${API}/login`)
      .type('form')
      .send('email=a@example.org&password=x');
    expect(res.status).toBe(415);
  });
});

describe('verification and password reset over HTTP', () => {
  it('blocks sign-in until the emailed link is used', async () => {
    const t = buildTestContext();
    await request(t.app).post(`${API}/register`).send(body('ada@example.org'));
    const before = await request(t.app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: STRONG_PASSWORD });
    expect(before.status).toBe(403);
    const token = t.email.tokenFor('verify', 'ada@example.org');
    expect((await request(t.app).post(`${API}/verify-email`).send({ token })).status).toBe(200);
    expect((await request(t.app).post(`${API}/verify-email`).send({ token })).status).toBe(400); // one-time
    const after = await request(t.app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: STRONG_PASSWORD });
    expect(after.status).toBe(200);
  });

  it('forgot-password answers identically for known and unknown addresses', async () => {
    const t = buildTestContext();
    await t.signUp('ada@example.org');
    const known = await request(t.app)
      .post(`${API}/forgot-password`)
      .send({ email: 'ada@example.org' });
    const unknown = await request(t.app)
      .post(`${API}/forgot-password`)
      .send({ email: 'ghost@example.org' });
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(unknown.body).toEqual(known.body);
  });

  it('rejects an invalid reset token', async () => {
    const { app } = buildTestContext();
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({ token: 'x'.repeat(43), password: 'brand-new-password-1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');
  });

  it('resets once, ends the old session and lets the new password in', async () => {
    const t = await signIn();
    await request(t.app).post(`${API}/forgot-password`).send({ email: 'ada@example.org' });
    const token = t.email.tokenFor('reset', 'ada@example.org');
    const reset = await request(t.app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'brand-new-password-1' });
    expect(reset.status).toBe(200);
    expect((await t.agent.get(`${API}/me`)).status).toBe(401);
    expect(
      (
        await request(t.app)
          .post(`${API}/reset-password`)
          .send({ token, password: 'another-password-12' })
      ).status,
    ).toBe(400);
    const login = await request(t.app)
      .post(`${API}/login`)
      .send({ email: 'ada@example.org', password: 'brand-new-password-1' });
    expect(login.status).toBe(200);
  });

  it('change-password needs the CSRF token and keeps only the current session', async () => {
    const t = await signIn();
    const payload = { currentPassword: STRONG_PASSWORD, newPassword: 'brand-new-password-1' };
    expect((await t.agent.post(`${API}/change-password`).send(payload)).status).toBe(403);
    expect(
      (await t.agent.post(`${API}/change-password`).set('X-CSRF-Token', t.csrf).send(payload))
        .status,
    ).toBe(204);
    expect((await t.agent.get(`${API}/me`)).status).toBe(200);
  });
});

describe('error responses', () => {
  it('never include a stack trace or internal detail', async () => {
    const { app } = buildTestContext();
    const res = await request(app).post(`${API}/login`).set(json).send('{"email": ');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(|node_modules|stack/i);
  });
});
