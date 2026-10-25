import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './profile-form';
const { me, updateProfile } = vi.hoisted(() => ({ me: vi.fn(), updateProfile: vi.fn() }));
vi.mock('@impactalign/api-client', () => ({ authApi: { me, updateProfile }, ApiError: class ApiError extends Error {}, describeError: () => 'Request failed' }));
const user = { id: 'u1', displayName: 'A User', email: 'user@example.com', roles: ['PUBLIC_USER'], emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z' };
beforeEach(() => { me.mockReset().mockResolvedValue({ user, csrfToken: 'csrf' }); updateProfile.mockReset().mockResolvedValue({ user: { ...user, displayName: 'New Name' } }); });
describe('ProfileForm', () => {
  it('shows account details and saves display name through the API client', async () => {
    render(<ProfileForm />);
    expect(await screen.findByText('user@example.com')).toBeTruthy();
    expect(screen.getByText('PUBLIC_USER')).toBeTruthy();
    expect(screen.getByText('Yes')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith('New Name'));
    expect((await screen.findByRole('status')).textContent).toContain('Display name updated.');
  });
});
