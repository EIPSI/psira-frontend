import { Component, OnInit, Input } from '@angular/core';
import { CaseManagerColumns } from '../@tables/case-managers.table';
import { CaseManager } from '@app/pages/patients-management/@types/case-manager';
import { CaseManagersService } from '@app/pages/patients-management/@services/case-managers.service';
import { PageInfo, Paging } from '@shared/@types/paging';
import { CaseManagerModel } from '@app/pages/patients-management/@models/case-manager.model';
import { CaseManagersFilterForm } from '@app/pages/patients-management/@forms/case-managers-filter.form';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { CaseManagerFilter } from '@app/pages/patients-management/@types/case-manager-filter';
import { Patient } from '@app/pages/patients-management/@types/patient';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PermissionKey } from '@app/@shared/@types/permission';
import { Permission } from '@app/pages/administration/@types/permission';
import { Department } from '../../administration/@types/department';
import { DepartmentsService } from '../@services/departments.service';
import { Filter } from '@app/@shared/@types/filter';
import { Sorting } from '@app/@shared/@types/sorting';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@app/@shared/@modules/master-data/@types/list';
import { FormattedUser } from '@app/pages/user-management/@types/formatted-user';
import { AppPermissionsService } from '@app/@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { TranslateService } from '@ngx-translate/core';
enum ActionKey {
  UNASSIGN_CASEMANAGER,
}

@Component({
  selector: 'app-case-managers',
  templateUrl: './case-managers.component.html',
  styleUrls: ['./case-managers.component.scss'],
})
export class CaseManagersComponent implements OnInit {
  public PK = PermissionKey;

  public data: Array<Partial<FormattedUser> & { assignmentRequestId?: number; assignmentRequestStatus?: string }>;

  public columns: TableColumn<FormattedUser>[] = CaseManagerColumns as TableColumn<FormattedUser>[];

  public caseManagersRequestOptions: {
    paging: Paging;
    filter: Filter;
    sorting: Sorting[];
  } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public loading = false;

  public pageInfo: PageInfo;

  public actions: Action<ActionKey>[] = [];
  public currentUserId?: number;

  @Input() managerType = 'caseManager';
  @Input() filter: CaseManagerFilter = {};
  @Input() patient: Patient;
  @Input() patientDepartments: Department[];
  @Input() showAssignButton = false;
  paging: Paging = {
    first: 10,
  };
  caseManagers: CaseManager[] = [];
  users: CaseManager[] = [];
  caseManagerFilter: CaseManagerFilter;
  caseManagersFilterForm = CaseManagersFilterForm;
  selectedIndex = -1;
  showFilter = false;
  showAssignModal = false;
  drawerTitle = '';
  caseManagerNiceName = '';
  manager: CaseManager = null;
  public departmentRequestOptions: {
    paging: Paging;
    filter: CaseManagerFilter;
    sorting: Sorting[];
  } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public userRequestOptions: {
    paging: Paging;
    filter: Filter;
    sorting: Sorting[];
  } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public searchKeyword = new Subject<string>();

  constructor(
    private caseManagersService: CaseManagersService,
    private patientService: PatientsService,
    public perms: AppPermissionsService,
    private message: NzMessageService,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    private departmentsService: DepartmentsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUserId = (JSON.parse(localStorage.getItem('user')) || {}).id;
    this.caseManagersRequestOptions.filter = this.filter;
    this.getCaseManagers();
    this.drawerTitle = this.managerType === 'caseManager' ? 'patientsManagement.filterCaseManagers' : 'patientsManagement.filterInformants';
    this.caseManagerNiceName = this.managerType === 'caseManager' ? 'patientsManagement.caseManager' : 'patientsManagement.informant';
    this.getDepartments();
    if (this.perms.permissionsOnly([PermissionKey.PATIENTS_EDIT_DEPARTMENT, PermissionKey.PATIENTS_EDIT_ASSIGNED])) {
      this.actions = [{ key: ActionKey.UNASSIGN_CASEMANAGER, title: 'patientsManagement.unassignCaseManager' }];
    }
  }

  public onPageChange(paging: Paging): void {
    this.caseManagersRequestOptions.paging = paging;
    this.getCaseManagers();
  }

  public onSort(sorting: SortField<FormattedUser>[]): void {
    this.caseManagersRequestOptions.sorting = sorting;
    this.getCaseManagers();
  }

  public onFilter(filter: Filter): void {
    this.caseManagersRequestOptions.filter = filter;
    this.getCaseManagers();
  }

  public onSearch(searchString: string): void {
    this.caseManagersRequestOptions.filter = {
      or: this.createSearchFilter(searchString),
    };
    this.getCaseManagers();
  }

  public checkIfManagerHasPermission(permissions: Permission[]): boolean {
    return permissions.some((p: Permission) => [this.PK.PATIENTS_EDIT_DEPARTMENT, this.PK.PATIENTS_EDIT_ASSIGNED].includes(p.name as any));
  }

  public canRemoveCaseManager(manager: CaseManager): boolean {
    if (manager?.id !== this.currentUserId) return true;
    return this.perms.permissionsOnly(PermissionKey.PATIENTS_EDIT_ASSIGNED);
  }

  public getCaseManagerServiceProperty(property: any, params?: any) {
    return this.caseManagersService[property](params);
  }


  public toggleFilterDrawer() {
    this.showFilter = !this.showFilter;
  }

  public toggleAssignModal(): void {
    this.showAssignModal = !this.showAssignModal;
  }


  public handleSearchOptions(search: { field: { name: string }; keyword: string }) {
    switch (search.field.name) {
      case 'patientId':
        this.searchPatients(search.keyword);
        break;
      case 'caseManagerId':
        this.searchCaseManagers(search.keyword);
        break;
    }
  }
  public onAction({ action, context: casemanager }: ActionArgs<CaseManager, ActionKey>): void {
    switch (action.key) {
      case ActionKey.UNASSIGN_CASEMANAGER:
        this.unAssignCaseManager(casemanager);
        return;
    }
  }

  public handleActionClick(event: { index: number; action: { name: string } }): void {
    this.selectedIndex = event.index;
    switch (event.action.name) {
      case 'Remove':
        this.modalService.confirm({
          nzTitle: this.translate.instant('patientsManagement.confirm'),
          nzContent: this.translate.instant('patientsManagement.removeCaseManagerConfirm', {
            name: `${this.caseManagers[this.selectedIndex].firstName} ${this.caseManagers[this.selectedIndex].lastName}`,
          }),
          nzOkText: this.translate.instant('core.remove'),
          nzOnOk: () => this.unAssignCaseManager(this.caseManagers[this.selectedIndex]),
          nzOkDisabled: this.loading,
          nzCancelText: this.translate.instant('core.cancel'),
        });
        break;
    }
  }

  public searchManagers(searchString: string) {
    this.filter.or = this.createSearchFilter(searchString);
    this.getCaseManagers();
  }

  public filterCaseManagers(filter: CaseManagerFilter) {
    this.filter = filter;
    this.getCaseManagers();
  }
  public searchCaseManagers(searchString: string): void {
    this.getSearchedCaseManagers(searchString);
  }

  private createSearchFilter(searchString: string): Array<{ [K in keyof FormattedUser]: {} }> {
    if (!searchString) return [];
    return [
      { firstName: { iLike: `%${searchString}%` } },
      { middleName: { iLike: `%${searchString}%` } },
      { lastName: { iLike: `%${searchString}%` } },
      { workID: { iLike: `%${searchString}%` } },
      { phone: { iLike: `%${searchString}%` } },
      { username: { iLike: `%${searchString}%` } },
      {
        roles: {
          or: [{ name: { iLike: `%${searchString}%` } }],
        },
      },
      {
        departments: {
          or: [{ name: { iLike: `%${searchString}%` } }],
        },
      },
    ];
  }

  private getCaseManagers(): void {
    this.loading = true;
    this.caseManagersService
      .getPatientCaseManagers({
        first: this.caseManagersRequestOptions.paging?.first,
        after: this.caseManagersRequestOptions.paging?.after,
        last: this.caseManagersRequestOptions.paging?.last,
        before: this.caseManagersRequestOptions.paging?.before,
        patientId: this.patient ? this.patient?.id : -1,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ data }) => {
        const assigned = data.getPatientCaseManagers.edges.map((caseManager: any) =>
          CaseManagerModel.fromJson(caseManager.node)
        );
        this.pageInfo = data.getPatientCaseManagers.pageInfo;
        this.loadPendingCaseManagerRequests(assigned);
      });
  }

  private getDepartments(): void {
    this.loading = true;
    const options = { ...this.departmentRequestOptions };
    options.filter = {
      and: [{ patients: { id: { eq: this.patient?.id } } }, ...(options.filter.and ?? [])],
    };
    this.departmentsService
      .departments(options)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response) => {
        if (this.patient) {
          this.patient.departments = response.data.departments.edges.map((e: any) => e.node);
        }
      });
  }

  public assignCaseManager(manager: CaseManager) {
    this.loading = true;
    this.caseManagersService
      .assignPatientCaseManager({
        userId: manager.id,
        patientId: this.patient.id,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => {
          this.getCaseManagers();
          this.users = this.users.filter((user) => Number(user.id) !== Number(manager.id));
          this.message.create(
            'success',
            this.translate.instant(
              manager.id === this.currentUserId ? 'patientsManagement.managerAssigned' : 'assignmentRequests.requestSent',
              {
                manager: manager.firstName,
                patient: this.patient.firstName,
              }
            )
          );
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableAssignManager', {
              manager: manager.firstName,
              patient: this.patient.firstName,
            }),
          })
      );
  }

  private async unAssignCaseManager(manager: CaseManager) {
    if ((manager as any).assignmentRequestStatus === 'PENDING') {
      await this.cancelPendingCaseManagerRequest(manager);
      return;
    }
    if (!this.canRemoveCaseManager(manager)) {
      this.errorService.handleError(
        new Error(this.translate.instant('patientsManagement.specialPermissionRemoveSelf'))
      );
      return;
    }

    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('patientsManagement.unassignCaseManager'),
      nzContent: this.translate.instant('patientsManagement.unassignCaseManagerConfirm', {
        name: `${manager.firstName} ${manager.lastName}`,
      }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.loading = true;
    this.caseManagersService
      .unassignPatientCaseManager({
        userId: manager.id,
        patientId: this.patient.id,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => {
          // modify reference to trigger change detection
          const list = [...this.data];
          list.splice(list.indexOf(manager), 1);
          this.data = list;
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: 'Unable to remove case manager',
          })
      );
  }


  private loadPendingCaseManagerRequests(assigned: any[]): void {
    if (!this.patient?.id) {
      this.data = assigned;
      return;
    }

    this.caseManagersService.pendingPatientCaseManagerRequests(this.patient.id).subscribe(
      ({ data }) => {
        const pending = (data.pendingPatientCaseManagerRequests || [])
          .map((request: any) => {
            const assignee = CaseManagerModel.fromJson({
              ...request.assignee,
              assignmentRequestId: request.id,
              assignmentRequestStatus: request.status,
            });
            return assignee;
          })
          .filter((candidate: any) => !assigned.some((manager: any) => Number(manager.id) === Number(candidate.id)));
        this.data = [...pending, ...assigned];
      },
      () => {
        this.data = assigned;
      }
    );
  }

  private async cancelPendingCaseManagerRequest(manager: CaseManager): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('assignmentRequests.cancelTitle'),
      nzContent: this.translate.instant('assignmentRequests.cancelConfirm', {
        name: `${manager.firstName} ${manager.lastName}`,
      }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.loading = true;
    this.caseManagersService
      .cancelAssignmentRequest((manager as any).assignmentRequestId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.getCaseManagers(),
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('assignmentRequests.unableCancel'),
          })
      );
  }

  private searchPatients(keyword: string) {
    const options: { label: string; value: number }[] = [];
    this.patientService.patients({ filter: { firstName: { iLike: keyword } } }).subscribe(
      async ({ data }) => {
        data.patients.edges.map((patient: any) => {
          const option = {
            value: patient.node.id,
            label: [patient.node.firstName, patient.node.lastName].filter(Boolean).join(' '),
          };
          if (options.indexOf(option) === -1) {
            options.push(option);
          }
        });
        this.caseManagersFilterForm.groups[0].fields[1].options = options;
      },
      () => {
        this.loading = false;
      }
    );
  }

  private getSearchedCaseManagers(searchKeyword?: string): void {
    this.loading = true;
    const departmentIds = (this.patient?.departments || [])
      .map((department: any) => Number(department.id))
      .filter((id: number) => Number.isFinite(id));
    this.caseManagersService
      .getPatientCaseManagers({ first: 50, searchKeyword, departmentIds })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ data }) => {
        this.users = (data.getPatientCaseManagers.edges || [])
          .map((caseManager: any) => CaseManagerModel.fromJson(caseManager.node))
          .filter((candidate: any) => !this.data?.some((assigned: any) => Number(assigned.id) === Number(candidate.id)));
        this.caseManagersFilterForm.groups[0].fields[2].options = this.users.map((user) => ({
          value: user.id,
          label: [user.firstName, user.lastName].filter(Boolean).join(' '),
        }));
      });
  }

  private checkPationHasDepartment(department: Department): boolean {
    return this.patient?.departments.some((r) => r.id === department.id);
  }
}
