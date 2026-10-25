import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminLoginForm } from './login-form';
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
describe('AdminLoginForm', () => {
  it('does not offer account creation and explains non-staff sign-out', () => {
    render(<AdminLoginForm reauth reason="staff" />);
    expect(screen.getByRole('alert').textContent).toContain('does not have admin access');
    expect(screen.queryByRole('link', { name: /create account|sign up|register/i })).toBeNull();
  });
});
