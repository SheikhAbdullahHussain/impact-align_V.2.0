import { createScryptHasher, type PasswordHasher } from '@impactalign/auth';
import type { ApiEnv } from '@impactalign/config';
import { AuditService } from './auth/audit.service';
import { AuthService, type AuthServiceOptions } from './auth/auth.service';
import { cookieSettings, type CookieSettings } from './auth/cookies';
import type { EmailSender } from './auth/email';
import type { AppLogger } from './common/logger';
import type { Repositories } from './data/repositories';
import { OrganizationsService } from './organizations/organizations.service';
import { UsersService } from './users/users.service';

export interface Services {
  auth: AuthService;
  audit: AuditService;
  cookie: CookieSettings;
  users: UsersService;
  organizations: OrganizationsService;
}

export function authOptionsFromEnv(env: ApiEnv): AuthServiceOptions {
  return {
    sessionIdleMs: env.SESSION_IDLE_MINUTES * 60_000,
    sessionAbsoluteMs: env.SESSION_ABSOLUTE_HOURS * 3_600_000,
    verificationTtlMs: 24 * 3_600_000,
    resetTtlMs: 60 * 60_000,
    maxFailedAttempts: env.AUTH_MAX_FAILED_ATTEMPTS,
    lockoutWindowMs: env.AUTH_LOCKOUT_MINUTES * 60_000,
    webUrl: env.APP_WEB_URL.replace(/\/$/, ''),
  };
}

export interface ServiceDeps {
  env: ApiEnv;
  logger: AppLogger;
  repos: Repositories;
  email: EmailSender;
  hasher?: PasswordHasher;
  clock?: () => Date;
}

/** Wires repositories, email and policy into the application services. */
export function createServices(deps: ServiceDeps): Services {
  const audit = new AuditService(deps.repos.audit, deps.logger);
  const auth = new AuthService({
    repos: deps.repos,
    hasher: deps.hasher ?? createScryptHasher(),
    email: deps.email,
    audit,
    clock: deps.clock ?? (() => new Date()),
    options: authOptionsFromEnv(deps.env),
  });
  return {
    auth,
    audit,
    cookie: cookieSettings(deps.env),
    users: new UsersService({ repos: deps.repos, audit }),
    organizations: new OrganizationsService({ repos: deps.repos, audit }),
  };
}
