// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCsrfToken } from '@/lib/api/client';
import { ForgotPasswordForm } from './forgot-password-form';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { ResetPasswordForm } from './reset-password-form';
import { VerifyEmailForm } from './verify-email-form';

const router = { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const fetchMock = vi.fn();
const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: () => Promise.resolve(body) });
const apiError = (code: string, message = 'server message') => ({
  error: { code, message, requestId: 'r' },
});
const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call]![1].body as string);

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  Object.values(router).forEach((fn) => fn.mockReset());
  vi.unstubAllGlobals();
  setCsrfToken(null);
});

describe('RegisterForm', () => {
  it('validates on the client first: no request, accessible errors tied to the fields', async () => {
    render(<RegisterForm />);
    type('Email', 'not-an-email');
    type('Password', 'short');
    submit(/create account/i);
    expect(
      await screen.findByText(/at least 12 characters/i, { selector: 'p[id$="-error"]' }),
    ).toBeTruthy();
    const password = screen.getByLabelText('Password');
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(
      document.getElementById(password.getAttribute('aria-describedby')!.split(' ').pop()!),
    ).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits only the allowed fields, defaults to the lowest-privilege account type, then asks to check email', async () => {
    reply(202, { message: 'If this address can be used, a verification email has been sent.' });
    render(<RegisterForm />);
    type('Full name', 'Ada Lovelace');
    type('Email', 'Ada@Example.org');
    type('Password', 'correct-horse-battery-9');
    submit(/create account/i);
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/v1/auth/register');
    expect(sentBody()).toEqual({
      email: 'ada@example.org',
      password: 'correct-horse-battery-9',
      displayName: 'Ada Lovelace',
      accountType: 'PUBLIC_USER',
    });
  });

  it('offers only self-registration account types (no staff roles)', () => {
    render(<RegisterForm />);
    const options = [...(screen.getByLabelText(/joining as/i) as HTMLSelectElement).options].map(
      (o) => o.value,
    );
    expect(options).toEqual(['PROFESSIONAL', 'RESEARCHER', 'ACADEMIC', 'PARTNER', 'PUBLIC_USER']);
  });
});

describe('LoginForm', () => {
  it('signs in and goes to a safe next page', async () => {
    reply(200, { user: { id: '1' }, csrfToken: 'csrf-1' });
    render(<LoginForm next="/dashboard/projects" />);
    type('Email', 'ada@example.org');
    type('Password', 'correct-horse-battery-9');
    submit(/sign in/i);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard/projects'));
    expect(router.refresh).toHaveBeenCalled();
  });

  it('ignores an off-site next link', async () => {
    reply(200, { user: { id: '1' }, csrfToken: 'csrf-1' });
    render(<LoginForm next="https://evil.example" />);
    type('Email', 'ada@example.org');
    type('Password', 'x');
    submit(/sign in/i);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
  });

  it.each([
    ['INVALID_CREDENTIALS', 401, /invalid email or password/i],
    ['EMAIL_NOT_VERIFIED', 403, /verify your email/i],
    ['TOO_MANY_ATTEMPTS', 429, /too many attempts/i],
  ])('shows a friendly alert for %s and does not navigate', async (code, status, text) => {
    reply(status, apiError(code));
    render(<LoginForm />);
    type('Email', 'ada@example.org');
    type('Password', 'whatever-password-1');
    submit(/sign in/i);
    expect((await screen.findByRole('alert')).textContent).toMatch(text);
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.queryByText('server message')).toBeNull();
  });
});

describe('ForgotPasswordForm', () => {
  it('shows the same neutral confirmation the API returns', async () => {
    reply(202, { message: 'If an account exists for this address, a reset link has been sent.' });
    render(<ForgotPasswordForm />);
    type('Email', 'ghost@example.org');
    submit(/send reset link/i);
    expect((await screen.findByRole('status')).textContent).toMatch(/if an account exists/i);
  });
});

describe('ResetPasswordForm', () => {
  const token = 'x'.repeat(43);
  it('checks the two passwords match before calling the API', async () => {
    render(<ResetPasswordForm token={token} />);
    type('New password', 'brand-new-password-1');
    type('Confirm new password', 'different-password-22');
    submit(/set new password/i);
    expect(await screen.findByText(/do not match/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the token and new password, then links to sign in', async () => {
    reply(200, { message: 'Password updated. Sign in with your new password.' });
    render(<ResetPasswordForm token={token} />);
    type('New password', 'brand-new-password-1');
    type('Confirm new password', 'brand-new-password-1');
    submit(/set new password/i);
    expect(await screen.findByRole('link', { name: /go to sign in/i })).toBeTruthy();
    expect(sentBody()).toEqual({ token, password: 'brand-new-password-1' });
  });

  it('explains an expired link', async () => {
    reply(400, apiError('INVALID_OR_EXPIRED_TOKEN'));
    render(<ResetPasswordForm token={token} />);
    type('New password', 'brand-new-password-1');
    type('Confirm new password', 'brand-new-password-1');
    submit(/set new password/i);
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid or has expired/i);
  });
});

describe('VerifyEmailForm', () => {
  const token = 'y'.repeat(43);
  it('does nothing on load and verifies only when the button is pressed', async () => {
    reply(200, { message: 'Email verified. You can now sign in.' });
    render(<VerifyEmailForm token={token} />);
    expect(fetchMock).not.toHaveBeenCalled();
    submit(/verify my email/i);
    expect(await screen.findByRole('link', { name: /go to sign in/i })).toBeTruthy();
    expect(sentBody()).toEqual({ token });
  });
});
