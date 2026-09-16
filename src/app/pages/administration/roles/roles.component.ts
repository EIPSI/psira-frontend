import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Paging } from '@shared/@types/paging';
import { Role, UpdateOneRoleInput } from '@app/pages/administration/@types/role';
import { RolesTable } from '@app/pages/administration/@tables/roles.table';
import { Sorting } from '@shared/@types/sorting';
import { Filter } from '@shared/@types/filter';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { RoleForm } from '@app/pages/administration/@forms/role.form';
import { Convert } from '@shared/classes/convert';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PaginationService } from '@shared/services/pagination.service';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { FieldGroup } from '../../../@shared/components/form/@types/field.group';
import { Field } from '../../../@shared/components/form/@types/field';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  PK = PermissionKey;
  isLoading = false;
  modalLoading = false;
  populateForm = false;
  resetForm = false;
  roles: Role[] = [];
  paging: Paging = {
    first: 10,
  };
  pageInfo: any;
  rolesTable: { columns: any[]; rows: Role[] } = {
    columns: RolesTable.columns,
    rows: [],
  };
  actions = RolesTable.actions;

  showCreateRole = false;
  panelTitle = 'roles.createRole';
  loadingMessage = '';
  roleForms = JSON.parse(JSON.stringify(RoleForm));
  inputMode = true;
  showCancelButton = false;
  isCreateAction = false;
  role: Role = { id: undefined, name: '', hierarchy: null, code: undefined } as Role;
  roleFormGroup: FormGroup;

  constructor(
    private rolesService: RolesService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private paginationService: PaginationService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.roleFormGroup = this.fb.group({
      name: ['', Validators.required],
      hierarchy: [null, [Validators.required, Validators.min(1), Validators.max(999)]],
    });
  }

  ngOnInit(): void {
    this.getRoles();
  }

  getRoles(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    this.isLoading = true;
    this.roles = [];
    this.rolesTable.rows = [];
    this.rolesService
      .roles(params)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          data.roles.edges.map((role: any) => {
            this.roles.push(Convert.toRole(role.node));
          });
          this.rolesTable.rows = this.roles;
          this.paging.after = data.roles.pageInfo.endCursor;
          this.paging.before = data.roles.pageInfo.startCursor;
          this.pageInfo = data.roles.pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableLoadRoles') })
      );
  }

  navigatePages(direction: 'next' | 'previous', pageSize: number = 10) {
    const paging = this.paginationService.navigatePages(this.paging, direction, pageSize);
    this.getRoles({ paging });
  }

  deleteRole(role: Role, index: number) {
    this.modalLoading = true;
    this.rolesService
      .deleteRole(role)
      .pipe(finalize(() => (this.modalLoading = false)))
      .subscribe(
        () => {
          this.roles = this.roles.filter((currentRole: Role) => currentRole.id !== role.id);
          this.rolesTable.rows = [...this.roles];
          this.message.success(this.translate.instant('roles.roleDeleted'));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableRemoveRole', { name: role.name }) })
      );
  }

  handleActionClick(event: any): void {
    const role = event?.data || this.roles[event?.index];
    const index = Number.isFinite(event?.index) ? event.index : this.roles.indexOf(role);
    if (!role) return;

    this.role = role;
    this.populateForm = false;
    switch (event.action.name) {
      case 'roles.deleteRole':
        this.modalService.confirm({
          nzTitle: this.translate.instant('core.confirm'),
          nzContent: `${this.translate.instant('roles.deleteRoleConfirm', { name: role.name })} ${
            role.users && role.users.length > 0
              ? this.translate.instant('roles.deleteRoleUsersWarning')
              : this.translate.instant('roles.deleteRoleNoUsers')
          }`,
          nzOkText: this.translate.instant('core.delete'),
          nzOnOk: () => this.deleteRole(role, index),
          nzOkDisabled: this.modalLoading,
          nzCancelText: this.translate.instant('core.cancel'),
        });
        break;
      case 'roles.editRole':
        this.populateForm = true;
        this.toggleCreatePanel(false);
        break;
      case 'roles.duplicateRole':
        this.duplicateRole(role);
        break;
    }
  }

  handleRowClick(event: any) {
    if (!this.perms.permissionsOnly([PermissionKey.ROLES_EDIT_ALL])) return;

    this.role = this.roles[event.index];
    this.populateForm = true;
    this.toggleCreatePanel(false);
  }

  disableEnableFields() {
    this.roleForms.groups.forEach((group: FieldGroup) =>
      group.fields.forEach((field: Field) => {
        field.name === 'hierarchy' && this.perms.isSuperAdmin ? (field.disabled = true) : (field.disabled = false);
      })
    );
  }

  closeCreatePanel() {
    this.populateForm = false;
    this.resetForm = false;
    this.showCreateRole = false;
    this.role = { id: undefined, name: '', hierarchy: null, code: undefined } as Role;
    this.roleFormGroup.reset({ name: '', hierarchy: null });
  }

  toggleCreatePanel(create: boolean = true) {
    this.disableEnableFields();
    this.showCreateRole = !this.showCreateRole;
    this.isCreateAction = create;
    if (create) {
      this.role = { id: undefined, name: '', hierarchy: null, code: undefined } as Role;
      this.roleFormGroup.reset({ name: '', hierarchy: null });
      this.resetForm = true;
    } else {
      this.roleFormGroup.reset({
        name: this.role?.name || '',
        hierarchy: this.role?.hierarchy ?? null,
      });
    }
    this.panelTitle = !this.isCreateAction ? 'roles.updateRole' : 'roles.createRole';
  }

  createRole(role: Role) {
    const normalizedRole = this.normalizeRole(role);
    if (!normalizedRole) return;

    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.loadingMessage = this.translate.instant('roles.creatingRole', { name: normalizedRole.name });
    this.rolesService
      .createRole(normalizedRole)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        ({ data }) => {
          this.roles.push(Convert.toRole(data.createOneRole));
          this.rolesTable.rows = this.roles;
          this.resetForm = true;
          this.populateForm = false;
          this.closeCreatePanel();
          this.getRoles();
          this.message.success(this.translate.instant('roles.roleCreated'));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableCreateRole') })
      );
  }

  submitForm(roleData: any) {
    this.saveRole(roleData);
  }

  submitRoleDraft(): void {
    if (this.roleFormGroup.invalid) {
      Object.values(this.roleFormGroup.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formValue = this.roleFormGroup.getRawValue();
    this.saveRole({
      ...this.role,
      name: formValue.name,
      hierarchy: formValue.hierarchy,
    } as Role);
  }

  private saveRole(roleData: any): void {
    const normalizedRole = this.normalizeRole(this.extractRolePayload(roleData));
    if (!normalizedRole) return;

    if (this.isCreateAction) {
      this.createRole(normalizedRole);
    } else {
      normalizedRole.id = this.role.id;
      this.updateRole(normalizedRole);
    }
  }


  private duplicateRole(role: Role): void {
    const copy = this.normalizeRole({
      ...role,
      id: undefined,
      name: this.copyName(role.name),
      code: undefined,
      users: [],
      permissions: [],
    } as Role);

    if (copy) this.createRole(copy);
  }

  private extractRolePayload(payload: any): Role {
    return payload?.role || payload?.data || payload;
  }

  private copyName(name: string): string {
    return `${name || ''} ${this.translate.instant('core.copySuffix')}`.trim();
  }

  private normalizeRole(role: Role): Role | null {
    const name = role?.name?.trim();
    const hierarchy = Number(role?.hierarchy);

    if (!name) {
      this.errorService.handleError(new Error('Role name is required'), {
        prefix: this.translate.instant('roles.nameValidation'),
      });
      return null;
    }

    if (!Number.isFinite(hierarchy)) {
      this.errorService.handleError(new Error('Role hierarchy is required'), {
        prefix: this.translate.instant('roles.hierarchyValidation'),
      });
      return null;
    }

    return {
      id: role.id,
      name,
      hierarchy,
      code: role.code,
    } as Role;
  }

  private updateRole(role: Role) {
    const updateOneRoleInput: UpdateOneRoleInput = {
      id: role.id,
      update: {
        name: role.name,
        hierarchy: role.hierarchy,
      },
    };
    this.isLoading = true;
    this.loadingMessage = this.translate.instant('roles.updatingRole', { name: role.name });
    this.rolesService
      .updateRole(updateOneRoleInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        ({ data }) => {
          const updatedRole: Role = Convert.toRole(data.updateOneRole);
          this.roles = this.roles.map((dep: Role) => {
            if (dep.id === updatedRole.id) {
              dep = updatedRole;
            }
            return dep;
          });
          this.rolesTable.rows = this.roles;
          this.resetForm = true;
          this.populateForm = false;
          this.closeCreatePanel();
          this.message.success(this.translate.instant('roles.roleUpdated'));
          this.role = { id: undefined, name: '', hierarchy: null, code: undefined } as Role;
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableUpdateRole', { name: role.name }) })
      );
  }
}
