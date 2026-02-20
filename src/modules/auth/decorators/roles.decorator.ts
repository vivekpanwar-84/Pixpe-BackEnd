import { SetMetadata } from '@nestjs/common';
import { RoleSlug } from '../../../common/constants/roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleSlug[]) => SetMetadata(ROLES_KEY, roles);
