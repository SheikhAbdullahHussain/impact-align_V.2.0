/* eslint-disable @typescript-eslint/no-explicit-any */

export const authenticate =
  (..._args: any[]) =>
  (_req: any, _res: any, next: any) =>
    next?.();
export const csrfGuard = (_req?: any, _res?: any, next?: any) => next?.();
export const originGuard =
  (..._args: any[]) =>
  (_req: any, _res: any, next: any) =>
    next?.();
export const requireJson = (_req?: any, _res?: any, next?: any) => next?.();
export const requestContext = (req?: any, _res?: any, _next?: any): any => ({
  ipAddress: req?.ip,
  userAgent: req?.headers?.['user-agent'],
  userId: req?.user?.id,
  organizationId: req?.user?.organizationId,
  ...req?.context,
});
export const requireAuth = (_req?: any, _res?: any, next?: any) => next?.();
export const requirePermission =
  (..._args: any[]) =>
  (_req: any, _res: any, next: any) =>
    next?.();
