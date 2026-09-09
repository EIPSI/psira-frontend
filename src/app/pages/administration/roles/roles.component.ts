import { Component, OnInit } from '@angular/core';
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
  roleForms = RoleForm;
  inputMode = true;
  showCancelButton = false;
  isCreateAction = false;
  role: Role;

  constructor(
    private rolesService: RolesService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private paginationService: PaginationService,
    private translate: TranslateService
  ) {}

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
          this.rolesTable.rows.splice(index, 1);
          this.message.success(this.translate.instant('roles.roleDeleted'));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableRemoveRole', { name: role.name }) })
      );
  }

  handleActionClick(event: any): void {
    this.role = this.roles[event.index];
    this.populateForm = false;
    switch (event.action.name) {
      case 'roles.deleteRole':
        this.modalService.confirm({
          nzTitle: this.translate.instant('core.confirm'),
          nzContent: `${this.translate.instant('roles.deleteRoleConfirm', { name: this.roles[event.index].name })} ${
            this.role.users && this.role.users.length > 0
              ? this.translate.instant('roles.deleteRoleUsersWarning')
              : this.translate.instant('roles.deleteRoleNoUsers')
          }`,
          nzOkText: this.translate.instant('core.delete'),
          nzOnOk: () => this.deleteRole(this.roles[event.index], event.index),
          nzOkDisabled: this.modalLoading,
          nzCancelText: this.translate.instant('core.cancel'),
        });
        break;
      case 'roles.editRole':
        this.populateForm = true;
        this.toggleCreatePanel(false);
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
    this.roleForms.groups.forEach((group) =>
      group.fields.forEach((field) => {
        field.name === 'hierarchy' && this.perms.isSuperAdmin ? (field.disabled = true) : (field.disabled = false);
      })
    );
  }

  closeCreatePanel() {
    this.populateForm = false;
    this.resetForm = false;
    this.showCreateRole = false;
  }

  toggleCreatePanel(create: boolean = true) {
    this.disableEnableFields();
    this.showCreateRole = !this.showCreateRole;
    this.isCreateAction = create;
    if (create) {
      this.role = null;
      this.resetForm = true;
    }
    this.panelTitle = !this.isCreateAction ? 'roles.updateRole' : 'roles.createRole';
  }

  createRole(role: Role) {
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.loadingMessage = this.translate.instant('roles.creatingRole', { name: role.name });
    this.rolesService
      .createRole(role)
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
          this.toggleCreatePanel();
          this.getRoles();
          this.message.success(this.translate.instant('roles.roleCreated'));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableCreateRole') })
      );
  }

  submitForm(roleData: any) {
    if (this.isCreateAction) {
      this.createRole(roleData);
    } else {
      roleData.id = this.role.id;
      this.updateRole(roleData);
    }
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
          this.toggleCreatePanel();
          this.message.success(this.translate.instant('roles.roleUpdated'));
          this.role = null;
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableUpdateRole', { name: role.name }) })
      );
  }
}
