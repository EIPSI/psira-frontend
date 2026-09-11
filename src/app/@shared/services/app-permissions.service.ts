import { Permission } from '../../pages/administration/@types/permission';
import { Injectable } from '@angular/core';
import { PermissionKey, isPermissionKey, isPermissionKeyArray } from '../@types/permission';
import { User } from '@app/pages/user-management/@types/user';
import { Role } from '@app/pages/administration/@types/role';

@Injectable({
  providedIn: 'root',
})
export class AppPermissionsService {
  constructor() {}

  hasAccessLevelToRole(role: Role): boolean {
    if (this.isSuperAdmin()) return true;
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return !!user?.roles?.some?.((r) => r.hierarchy < role.hierarchy);
  }

  hasAccessLevelToUser(accessingUser: User): boolean {
    if (this.isSuperAdmin()) return true;
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return !!user?.roles?.some?.((r) => accessingUser?.roles?.every?.((ar) => r.hierarchy < ar.hierarchy));
  }

  permissionsOnly(action: PermissionKey | PermissionKey[]): boolean {
    if (this.isSuperAdmin()) return true;

    const permissions: Permission[] = JSON.parse(sessionStorage.getItem('permissions'));
    const keys = permissions?.map((permission) => permission?.name);
    if (!permissions || !keys) return false;

    if (isPermissionKey(action)) {
      return this.hasPermission(keys, action);
    }
    if (isPermissionKeyArray(action)) {
      return action.some((permission) => this.hasPermission(keys, permission));
    }

    return false;
  }

  permissionsExcept(action: PermissionKey | PermissionKey[]): boolean {
    const permissions: Permission[] = JSON.parse(sessionStorage.getItem('permissions'));
    const keys = permissions?.map((permission) => permission?.name);
    if (!permissions || !keys) return false;

    if (isPermissionKey(action)) {
      return !keys.includes(action);
    }
    if (isPermissionKeyArray(action)) {
      return !keys.some((permissionName) => action.indexOf(permissionName) >= 0);
    }

    return false;
  }

  isSuperAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return !!(
      user?.isSuperUser ||
      user?.roles?.some?.((role) => role.isSuperAdmin || role.code === 'SUPER_ADMIN')
    );
  }

  isPatient(): boolean {
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return !!user?.roles?.some?.((role) => role.code === 'PATIENT');
  }

  getUserHierarchy(): number {
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return user.roles[0].hierarchy;
  }

  private hasPermission(grants: string[], requiredPermission: PermissionKey): boolean {
    if (grants.includes(requiredPermission)) return true;

    const required = this.parsePermission(requiredPermission);
    if (!required) return false;

    return grants.some((grantName) => {
      const grant = this.parsePermission(grantName);
      return !!grant &&
        grant.resource === required.resource &&
        grant.action === required.action &&
        grant.scope === 'all';
    });
  }

  private parsePermission(permission: string): { resource: string; action: string; scope: string } | null {
    const [resource, action, scope] = permission.split('.');
    if (!resource || !action || !scope) return null;
    return { resource, action, scope };
  }
}
