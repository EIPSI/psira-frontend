import { Component, OnInit } from '@angular/core';
import { Permission } from '@app/pages/administration/@types/permission';
import { Role } from '@app/pages/administration/@types/role';
import { PermissionsService } from '@app/pages/administration/@services/permissions.service';
import { Sorting } from '@shared/@types/sorting';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@app/@shared/@types/permission';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

interface PermissionDetail {
  title: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  enabled: string[];
  limits: string[];
  examples: string[];
}

@Component({
  selector: 'app-roles-and-permissions',
  templateUrl: './roles-and-permissions.component.html',
  styleUrls: ['./roles-and-permissions.component.scss'],
})
export class RolesAndPermissionsComponent implements OnInit {
  PK = PermissionKey;
  loading = false;
  rolesPaging: Paging = {
    first: 50,
  };
  rolesPageInfo: any;
  permissionsPaging: Paging = {
    first: 50,
  };
  permissionsPageInfo: any;
  matrix: { roles: Role[]; permissions: Permission[] } = {
    roles: [],
    permissions: [],
  };
  permissionGroups: PermissionGroup[] = [];
  selectedPermissionDetail: PermissionDetail | null = null;
  permissionDetailVisible = false;

  private readonly groupOrder = [
    'User Management',
    'Patient Management',
    'Therapists',
    'Supervisors',
    'Caregiver Management',
    'Clinical Work',
    'Assessments',
    'Questionnaires',
    'Questionnaire Bundles',
    'Evaluation Schemes',
    'Randomizations',
    'Evaluation Automations',
    'Notifications',
    'Mail Templates',
    'Informed Consent',
    'Reports',
    'Departments',
    'Roles and Permissions',
    'System Configuration',
  ];

  private readonly resourceDescriptionKeys: Record<string, string> = {
    users: 'rolesPermissions.resources.users',
    patients: 'rolesPermissions.resources.patients',
    therapists: 'rolesPermissions.resources.therapists',
    supervisors: 'rolesPermissions.resources.supervisors',
    caregivers: 'rolesPermissions.resources.caregivers',
    clinical: 'rolesPermissions.resources.clinical',
    assessments: 'rolesPermissions.resources.assessments',
    questionnaires: 'rolesPermissions.resources.questionnaires',
    'questionnaire-bundles': 'rolesPermissions.resources.questionnaireBundles',
    'evaluation-schemes': 'rolesPermissions.resources.evaluationSchemes',
    randomizations: 'rolesPermissions.resources.randomizations',
    automations: 'rolesPermissions.resources.automations',
    notifications: 'rolesPermissions.resources.notifications',
    'notification-logs': 'rolesPermissions.resources.notificationLogs',
    'mail-templates': 'rolesPermissions.resources.mailTemplates',
    'informed-consent-models': 'rolesPermissions.resources.informedConsentModels',
    'informed-consent-management': 'rolesPermissions.resources.informedConsentManagement',
    'informed-consent-responses': 'rolesPermissions.resources.informedConsentResponses',
    reports: 'rolesPermissions.resources.reports',
    departments: 'rolesPermissions.resources.departments',
    roles: 'rolesPermissions.resources.roles',
    permissions: 'rolesPermissions.resources.permissions',
    settings: 'rolesPermissions.resources.settings',
    system: 'rolesPermissions.resources.system',
  };

  private readonly actionDescriptionKeys: Record<string, string> = {
    view: 'rolesPermissions.actions.view',
    create: 'rolesPermissions.actions.create',
    edit: 'rolesPermissions.actions.edit',
    delete: 'rolesPermissions.actions.delete',
    archive: 'rolesPermissions.actions.archive',
    restore: 'rolesPermissions.actions.restore',
    assign: 'rolesPermissions.actions.assign',
    review: 'rolesPermissions.actions.review',
    test: 'rolesPermissions.actions.test',
  };

  private readonly scopeDescriptionKeys: Record<string, string> = {
    all: 'rolesPermissions.scopes.all',
    department: 'rolesPermissions.scopes.department',
    'department-hierarchy': 'rolesPermissions.scopes.departmentHierarchy',
    assigned: 'rolesPermissions.scopes.assigned',
  };

  constructor(
    private rolesService: RolesService,
    private permissionService: PermissionsService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getPermissions();
    this.getRoles({ paging: this.rolesPaging });
  }

  getPermissions(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting | Sorting[] }) {
    this.loading = true;
    this.loadPermissionPage(params ?? { paging: this.permissionsPaging }, []);
  }

  getRoles(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    this.loading = true;
    const roles: Role[] = [];
    this.rolesService
      .roles(params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ data }: any) => {
          data.roles.edges.map((role: any) => {
            roles.push(role.node);
          });
          this.matrix.roles = roles;
          this.rolesPaging.after = data.roles.pageInfo.endCursor;
          this.rolesPaging.before = data.roles.pageInfo.startCursor;
          this.rolesPageInfo = data.roles.pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableLoadRoles') })
      );
  }

  permissionInRole(permission: Permission, role: Role): boolean {
    const permIds: number[] = (role.permissions ?? []).map((perm) => perm.id);
    return permIds.includes(permission.id);
  }

  getUserPermissions(permission: PermissionKey): boolean {
    return this.perms.permissionsOnly(permission);
  }

  assignPermissionToRole(permission: Permission, role: Role, checked: boolean) {
    this.loading = true;
    if (checked) {
      this.rolesService
        .addPermissionsToRole(role.id, [permission.id])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          () => {
            role.permissions = [...(role.permissions ?? []), permission];
          },
          (error: any) =>
            this.errorService.handleError(error, {
              prefix: this.translate.instant('rolesPermissions.unableAssignPermission', {
                permission: permission.name,
                role: role.name,
              }),
            })
        );
    } else {
      this.rolesService
        .removePermissionsFromRole(role.id, [permission.id])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          () => {
            role.permissions = role.permissions?.filter((rolePermission) => rolePermission.id !== permission.id) ?? [];
          },
          (error: any) =>
            this.errorService.handleError(error, {
              prefix: this.translate.instant('rolesPermissions.unableRemovePermission', {
                permission: permission.name,
                role: role.name,
              }),
            })
        );
    }
  }

  openPermissionDetail(permission: Permission): void {
    this.selectedPermissionDetail = this.buildPermissionDetail(permission);
    this.permissionDetailVisible = true;
  }

  private loadPermissionPage(params: { paging?: Paging; filter?: Filter; sorting?: Sorting | Sorting[] }, collected: Permission[]): void {
    const paging = params.paging ?? { first: 50 };
    this.permissionService
      .permissions({
        ...params,
        paging: { ...paging, first: 50 },
        sorting: params.sorting ?? [{ field: 'group', direction: 'ASC' }, { field: 'name', direction: 'ASC' }],
      })
      .subscribe(
        ({ data }) => {
          const nextPermissions = [
            ...collected,
            ...data.permissions.edges.map((permission: any) => permission.node as Permission),
          ];
          const pageInfo = data.permissions.pageInfo;
          if (pageInfo.hasNextPage) {
            this.loadPermissionPage(
              {
                ...params,
                paging: { first: 50, after: pageInfo.endCursor },
              },
              nextPermissions,
            );
            return;
          }

          this.matrix.permissions = nextPermissions;
          this.permissionGroups = this.groupPermissions(nextPermissions);
          this.permissionsPaging.after = pageInfo.endCursor;
          this.permissionsPaging.before = pageInfo.startCursor;
          this.permissionsPageInfo = pageInfo;
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          this.errorService.handleError(error, { prefix: this.translate.instant('rolesPermissions.unableLoadPermissions') });
        },
      );
  }

  private groupPermissions(permissions: Permission[]): PermissionGroup[] {
    const groups = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      const group = permission.group || 'Other';
      groups.set(group, [...(groups.get(group) ?? []), permission]);
    });

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const aIndex = this.groupOrder.indexOf(a);
        const bIndex = this.groupOrder.indexOf(b);
        if (aIndex >= 0 || bIndex >= 0) return (aIndex >= 0 ? aIndex : 999) - (bIndex >= 0 ? bIndex : 999);
        return a.localeCompare(b);
      })
      .map(([name, groupPermissions]) => ({
        name,
        permissions: groupPermissions.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }

  private buildPermissionDetail(permission: Permission): PermissionDetail {
    const [resource, action, scope] = String(permission.name).split('.');
    const resourceDescription = this.resourceDescriptionKeys[resource]
      ? this.translate.instant(this.resourceDescriptionKeys[resource])
      : this.translate.instant('rolesPermissions.technicalResourceDescription', { resource });
    const actionDescription = this.actionDescriptionKeys[action]
      ? this.translate.instant(this.actionDescriptionKeys[action])
      : this.translate.instant('rolesPermissions.technicalActionDescription', { action });
    const scopeDescription = this.scopeDescriptionKeys[scope]
      ? this.translate.instant(this.scopeDescriptionKeys[scope])
      : this.translate.instant('rolesPermissions.technicalScopeDescription', { scope });

    return {
      title: String(permission.name),
      resource,
      action,
      scope,
      description: this.translate.instant('rolesPermissions.permissionDescription', {
        resourceDescription,
        actionDescription,
        scopeDescription,
      }),
      enabled: [
        this.translate.instant('rolesPermissions.enabledAction', { action, resourceDescription }),
        this.translate.instant('rolesPermissions.enabledUiAndResolvers'),
        this.translate.instant('rolesPermissions.enabledAllScope'),
      ],
      limits: [
        this.translate.instant('rolesPermissions.limitBusinessRules'),
        this.translate.instant('rolesPermissions.limitRelatedResources'),
        this.translate.instant('rolesPermissions.limitScopedRecords'),
      ],
      examples: [
        this.translate.instant('rolesPermissions.exampleAll', { resource, action }),
        this.translate.instant('rolesPermissions.exampleDepartment', { resource, action }),
        this.translate.instant('rolesPermissions.exampleAssigned', { resource, action }),
      ].filter((example) => !example.includes('undefined')),
    };
  }
}
