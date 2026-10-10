/**
 * The dashboard is a UI preview only: there is no authentication yet. Outside production it is always
 * visible for development; in production it returns 404 unless explicitly enabled. Real access control
 * (server-side, role- and organization-aware) replaces this gate in the authentication phase.
 */
export function isDashboardPreviewEnabled(env: {
  readonly NODE_ENV?: string | undefined;
  readonly DASHBOARD_PREVIEW_ENABLED?: string | undefined;
}): boolean {
  return env.NODE_ENV !== 'production' || env.DASHBOARD_PREVIEW_ENABLED === 'true';
}
