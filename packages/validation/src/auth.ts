import { z } from 'zod';
import { ORGANIZATION_ROLES, PLATFORM_ROLES, SELF_REGISTRATION_ROLES } from '@impactalign/types';

/** Normalised (trimmed, lower-cased) email address. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Enter a valid email address' }).max(254));

const COMMON_PASSWORDS = new Set([
  'password1234',
  'passwordpassword',
  '123456789012',
  'qwertyuiop12',
  'iloveyou1234',
  'administrator',
  'welcome12345',
]);

/** New-password policy: length over complexity rules (NIST SP 800-63B style). */
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128, 'Use at most 128 characters')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: 'This password is too common',
  });

const tokenSchema = z.string().min(20).max(200);

/** Strict objects: unknown keys (e.g. a client-supplied "roles") are rejected, never ignored. */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(2).max(80),
    accountType: z.enum(SELF_REGISTRATION_ROLES).default('PUBLIC_USER'),
  })
  .strict()
  .refine(
    (value) => {
      const local = value.email.split('@')[0] ?? '';
      return local.length < 4 || !value.password.toLowerCase().includes(local);
    },
    { path: ['password'], message: 'Password must not contain your email name' },
  );

export const loginSchema = z
  .object({ email: emailSchema, password: z.string().min(1).max(128) })
  .strict();

export const verifyEmailSchema = z.object({ token: tokenSchema }).strict();
export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();
export const resetPasswordSchema = z
  .object({ token: tokenSchema, password: passwordSchema })
  .strict();
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema })
  .strict();

export const updateProfileSchema = z
  .object({ displayName: z.string().trim().min(2).max(80) })
  .strict();

export const assignRolesSchema = z
  .object({ roles: z.array(z.enum(PLATFORM_ROLES)).min(1).max(PLATFORM_ROLES.length) })
  .strict();

export const createOrganizationSchema = z
  .object({ name: z.string().trim().min(2).max(120) })
  .strict();

export const organizationRoleSchema = z.enum(ORGANIZATION_ROLES);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
