import { describe, expect, it } from 'vitest';
import type { AuthResponse } from '@impactalign/types';
import { hasAdminAccess } from './session';
const session = (roles: string[]) => ({ user: { roles } }) as AuthResponse;
describe('hasAdminAccess', () => {
  it('allows platform admins and super admins', () => {
    expect(hasAdminAccess(session(['ADMIN']))).toBe(true);
    expect(hasAdminAccess(session(['SUPER_ADMIN']))).toBe(true);
  });
  it('denies non-staff roles even if they have other roles', () => {
    expect(hasAdminAccess(session(['PUBLIC_USER']))).toBe(false);
    expect(hasAdminAccess(session(['ASSESSOR', 'ORGANIZATION_ADMIN']))).toBe(false);
  });
});
