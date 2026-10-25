import { Router } from 'express';
import { assignRolesSchema, objectIdSchema, updateProfileSchema } from '@impactalign/validation';
import { Permission } from '@impactalign/types';
import { requestContext, requirePermission, requireAuth } from '../auth/middleware';
import { toPublicUser } from '../auth/public-user';
import { validateBody, validateIdParam } from '../common/validate';
import type { UsersService } from './users.service';

const isId = (value: string) => objectIdSchema.safeParse(value).success;

export function createUsersRouter(users: UsersService): Router {
  const router = Router();

  router.patch('/me', requireAuth, validateBody(updateProfileSchema), async (req, res) => {
    const updated = await users.updateOwnProfile(req.auth!.user, req.body.displayName);
    res.json({ user: toPublicUser(updated) });
  });

  router.get('/:id', requireAuth, validateIdParam('id', isId), async (req, res) => {
    const user = await users.getUser(req.auth!.user, String(req.params['id']));
    res.json({ user: toPublicUser(user) });
  });

  router.put(
    '/:id/roles',
    requirePermission(Permission.USER_ROLE_ASSIGN),
    validateIdParam('id', isId),
    validateBody(assignRolesSchema),
    async (req, res) => {
      const updated = await users.assignRoles(
        req.auth!.user,
        String(req.params['id']),
        req.body.roles,
        requestContext(req),
      );
      res.json({ user: toPublicUser(updated) });
    },
  );

  return router;
}
