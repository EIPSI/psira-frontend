import { finalize } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Department, FormattedDepartment, UpdateOneDepartmentInput } from '../@types/department';
import { DepartmentColumns } from '../@tables/departments.table';
import { DepartmentsService } from '../@services/departments.service';
import { DepartmentForm } from '../@forms/department.form';
import { Convert } from '@shared/classes/convert';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import {
  DEFAULT_PAGE_SIZE,
  TableColumn,
  SortField,
  Action,
  ActionArgs,
} from '../../../@shared/@modules/master-data/@types/list';
import { PageInfo } from '../../../@shared/@types/paging';
import { AppPermissionsService } from '@app/@shared/services/app-permissions.service';
import { PermissionKey } from '@app/@shared/@types/permission';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RolesService } from '../@services/roles.service';
import { Role } from '../@types/role';
import { FieldGroup } from '../../../@shared/components/form/@types/field.group';
import { Field } from '../../../@shared/components/form/@types/field';
import { TranslateService } from '@ngx-translate/core';

enum ActionKey {
  EDIT_DEPARTMENT,
  DELETE_DEPARTMENT,
}

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit {
  public PK = PermissionKey;

  public data: Partial<FormattedDepartment>[];

  public columns: TableColumn<Partial<FormattedDepartment>>[] = DepartmentColumns;

  public isLoading = false;

  public departmentsRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public pageInfo: PageInfo;

  public actions: Action<ActionKey>[] = [];

  // form properties
  public showCreateDepartment = false;
  public populateForm = false;
  public resetForm = false;
  public department: Department;
  public departmentForms = JSON.parse(JSON.stringify(DepartmentForm));
  public roles: Role[] = [];

  constructor(
    private departmentsService: DepartmentsService,
    private rolesService: RolesService,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService
  ) {}

  public ngOnInit(): void {
    this.getRoles();
    this.getDepartments();

    if (this.perms.permissionsOnly(PermissionKey.SETTINGS_EDIT_ALL)) {
      this.actions = [
        { key: ActionKey.EDIT_DEPARTMENT, title: this.translate.instant('departments.editDepartment') },
        { key: ActionKey.DELETE_DEPARTMENT, title: this.translate.instant('departments.deleteDepartment') },
      ];
    }
  }

  public onPageChange(paging: Paging): void {
    this.departmentsRequestOptions.paging = paging;
    this.getDepartments();
  }

  public onSort(sorting: SortField<FormattedDepartment>[]): void {
    this.departmentsRequestOptions.sorting = sorting;
    this.getDepartments();
  }

  public onFilter(filter: Filter): void {
    this.departmentsRequestOptions.filter = filter;
    this.getDepartments();
  }

  public onSearch(searchString: string): void {
    this.departmentsRequestOptions.filter = { or: this.createSearchFilter(searchString) };
    this.getDepartments();
  }

  public onAction({ action, context: department }: ActionArgs<FormattedDepartment, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT_DEPARTMENT:
        this.openCreatePanel(department);
        return;

      case ActionKey.DELETE_DEPARTMENT:
        this.deleteDepartment(department);
        return;
    }
  }

  public openCreatePanel(department?: Department): void {
    this.departmentForms.submitButtonText = department ? 'departments.editDepartment' : 'departments.createDepartment';
    if (department) {
      this.department = {
        ...department,
        appliedRoleCodes: department.appliedRoleCodes?.length
          ? department.appliedRoleCodes
          : this.roles.map((role) => role.code),
        defaultRoleCodes: department.defaultRoleCodes || [],
      };
    } else {
      this.department = {
        id: undefined,
        name: '',
        description: '',
        active: true,
        appliedRoleCodes: this.roles.map((role) => role.code),
        defaultRoleCodes: [],
        users: [],
      };
    }
    this.setRoleFieldOptions();
    this.showCreateDepartment = true;
    this.populateForm = true;
    this.resetForm = false;
  }

  public closeCreatePanel(): void {
    this.department = null;
    this.showCreateDepartment = false;
    this.populateForm = false;
    this.resetForm = false;
  }

  public onSubmitForm(department: Department): void {
    if (this.department?.id) {
      department.id = this.department.id;
      this.updateDepartment(department);
    } else {
      this.createDepartment(department);
    }
  }

  private getDepartments(): void {
    this.isLoading = true;
    this.departmentsService
      .departments(this.departmentsRequestOptions)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.data = data.departments.edges.map((department: any) => Convert.toDepartment(department.node));
          this.pageInfo = data.departments.pageInfo;
        },
        (err) =>
          this.errorService.handleError(err, { prefix: this.translate.instant('departments.unableLoadDepartments') })
      );
  }

  private createSearchFilter(searchString: string): Array<{ [K in keyof Partial<FormattedDepartment>]: {} }> {
    if (!searchString) return [];
    return [{ name: { iLike: `%${searchString}%` } }, { description: { iLike: `%${searchString}%` } }];
  }

  private async deleteDepartment(department: FormattedDepartment): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('departments.deleteDepartment'),
      nzContent: this.translate.instant('departments.deleteDepartmentConfirm', { name: department.name }),
    });

    if (!(await modal.afterClose.toPromise())) return;

    this.isLoading = true;
    this.departmentsService
      .deleteDepartment(department)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          const data = [...this.data];
          data.splice(this.data.indexOf(department), 1);
          this.data = data; // mutate reference to trigger change detection
        },
        (err) =>
          this.errorService.handleError(err, {
            prefix: this.translate.instant('departments.unableDeleteDepartment', { name: department.name }),
          })
      );
  }

  private createDepartment(department: Department): void {
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.departmentsService
      .createDepartment(department)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          // mutate reference to trigger change detection
          this.data = [...this.data, Convert.toDepartment(data.createOneDepartment)];
          this.closeCreatePanel();
        },
        (err) =>
          this.errorService.handleError(err, { prefix: this.translate.instant('departments.unableCreateDepartment') })
      );
  }

  private updateDepartment(department: Department): void {
    const updateOneDepartmentInput: UpdateOneDepartmentInput = {
      id: department.id as number,
      update: {
        name: department.name,
        description: department.description,
        active: department.active,
        appliedRoleCodes: department.appliedRoleCodes,
        defaultRoleCodes: department.defaultRoleCodes,
      },
    };
    this.isLoading = true;
    this.departmentsService
      .updateDepartment(updateOneDepartmentInput)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          const list = [...this.data];
          const updatedDepartment: Department = Convert.toDepartment(data.updateOneDepartment);
          const idx = list.findIndex((dep) => dep.id === updatedDepartment.id);
          list.splice(idx, 1, updatedDepartment);
          this.data = list; // mutate reference to trigger change detection
          this.closeCreatePanel();
        },
        (err) =>
          this.errorService.handleError(err, { prefix: this.translate.instant('departments.unableUpdateDepartment') })
      );
  }

  private getRoles(): void {
    this.rolesService.roles({ paging: { first: 50 } }).subscribe(
      ({ data }: any) => {
        this.roles = data.roles.edges.map((edge: any) => edge.node);
        this.setRoleFieldOptions();
      },
      (err) => this.errorService.handleError(err, { prefix: this.translate.instant('roles.unableLoadRoles') })
    );
  }

  private setRoleFieldOptions(): void {
    const options = this.roles.map((role) => ({ label: role.name, value: role.code }));
    if (this.department && !this.department.appliedRoleCodes?.length) {
      this.department.appliedRoleCodes = options.map((option) => option.value);
    }
    this.departmentForms.groups.forEach((group: FieldGroup) =>
      group.fields.forEach((field: Field) => {
        if (field.name === 'appliedRoleCodes' || field.name === 'defaultRoleCodes') {
          field.options = options;
          const value = Array.isArray(field.value) ? field.value : [];
          if (field.name === 'appliedRoleCodes' && !this.department?.id && !value.length) {
            field.value = options.map((option) => option.value);
          }
        }
      })
    );
  }
}
