import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reports } from '@app/pages/administration/@types/reports';
import { ReportsResourcesService } from '@app/pages/patients-management/@services/reports-resources.service';
import { User } from '@app/pages/user-management/@types/user';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { AssessmentService } from '@app/pages/assessment/@services/assessment.service';
import { AssessmentTable } from '@app/pages/assessment/@tables/assessment.table';
import { FormattedAssessment } from '@app/pages/assessment/@types/assessment';
import { ClinicalSessionKind } from '@app/pages/calendar/@types/calendar';
import { environment } from '@env/environment';
import { PermissionKey } from '@shared/@types/permission';
import { Action, ActionArgs, TableColumn } from '@shared/@modules/master-data/@types/list';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { finalize } from 'rxjs/operators';
import { Convert } from '@shared/classes/convert';

const CryptoJS = require('crypto-js');

enum SupervisorActionKey {
  REMOVE_SUPERVISOR,
}

@Component({
  selector: 'app-user-profile-tabs',
  templateUrl: './user-profile-tabs.component.html',
  styleUrls: ['./user-profile-tabs.component.scss'],
})
export class UserProfileTabsComponent implements OnInit {
  public PK = PermissionKey;
  public CSK = ClinicalSessionKind;
  public user: User;
  public roleCode: string;
  public reports: Reports[] = [];
  public supervisors: User[] = [];
  public availableSupervisors: User[] = [];
  public selectedSupervisorId: number;
  public reportsLoading = false;
  public supervisorsLoading = false;
  public assessmentsLoading = false;
  public assessmentsLoaded = false;
  public showSupervisorAssignDrawer = false;
  public supervisorActions: Action<SupervisorActionKey>[] = [];
  public selectedTabIndex = 0;
  public profileDataTabIndex = 0;
  public moreTabIndex = 0;

  public reportColumns: TableColumn<Partial<Reports>>[] = [
    { title: 'Name', name: 'name', translationPath: 'tables.reports.name', sort: true },
    { title: 'Description', name: 'description', translationPath: 'tables.reports.description', sort: true },
    { title: 'Report Type', name: 'resources', translationPath: 'tables.reports.resources', sort: true },
    { title: 'Shiny App', name: 'appName', translationPath: 'tables.reports.appName', sort: true },
  ];

  public assessmentColumns: TableColumn<FormattedAssessment>[] = AssessmentTable;

  public supervisorColumns: TableColumn<Partial<User>>[] = [
    { title: 'First name', name: 'firstName', translationPath: 'tables.users.firstName', sort: true },
    { title: 'Last name', name: 'lastName', translationPath: 'tables.users.lastName', sort: true },
    { title: 'Email', name: 'email', translationPath: 'tables.users.email', sort: true },
    { title: 'Username', name: 'username', translationPath: 'tables.users.username', sort: true },
  ];

  public assessments: FormattedAssessment[] = [];

  get userTitle(): string {
    const name = [this.user?.firstName, this.user?.middleName, this.user?.lastName].filter((s) => !!s).join(' ');
    return [this.user?.workID, name].filter((s) => !!s).join(' - ');
  }

  get isTherapist(): boolean {
    return this.roleCode === 'THERAPIST' || this.user?.roles?.some((role) => role.code === 'THERAPIST');
  }

  get isSupervisor(): boolean {
    return this.roleCode === 'SUPERVISOR' || this.user?.roles?.some((role) => role.code === 'SUPERVISOR');
  }

  get hasReportsTab(): boolean {
    return this.reportsLoading || this.reports.length > 0;
  }

  get reportResource(): string {
    if (this.isTherapist) return 'Therapists';
    if (this.isSupervisor) return 'Supervisors';
    return 'Users';
  }

  get reportsTabIndex(): number {
    return this.isTherapist ? 2 : 0;
  }

  get profileTabIndex(): number {
    return (this.isTherapist ? 2 : 0) + (this.hasReportsTab ? 1 : 0);
  }

  get moreTopTabIndex(): number {
    return this.assessmentsTabIndex + 1;
  }

  get assessmentsTabIndex(): number {
    return this.profileTabIndex + 1;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private reportsResourcesService: ReportsResourcesService,
    private router: Router,
    private assessmentService: AssessmentService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.roleCode = params.roleCode;
      if (params.user) {
        const bytes = CryptoJS.AES.decrypt(params.user, environment.secretKey);
        this.user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      }
      this.getReports();
      this.getSupervisors();
      this.setSupervisorActions();
    });
  }

  public generateReport(report: Reports): void {
    const queryParams = this.isTherapist
      ? { therapist_id: this.user.id }
      : this.isSupervisor
      ? { supervisor_id: this.user.id }
      : { user_id: this.user.id };
    this.router.navigate(['/psira/reports', report.id], { queryParams });
  }

  public formatUserName(user: User): string {
    return [user?.firstName, user?.lastName].filter((part) => !!part).join(' ') || user?.email || user?.username || '';
  }

  public assignSupervisor(): void {
    if (!this.user?.id || !this.selectedSupervisorId) return;

    this.supervisorsLoading = true;
    this.usersService
      .assignTherapistSupervisor({ therapistId: this.user.id, supervisorId: this.selectedSupervisorId })
      .pipe(finalize(() => (this.supervisorsLoading = false)))
      .subscribe(
        () => {
          this.selectedSupervisorId = null;
          this.showSupervisorAssignDrawer = false;
          this.getSupervisors();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to assign supervisor' })
      );
  }

  public onSupervisorAction({ action, context: supervisor }: ActionArgs<User, SupervisorActionKey>): void {
    switch (action.key) {
      case SupervisorActionKey.REMOVE_SUPERVISOR:
        this.unassignSupervisor(supervisor);
        return;
    }
  }

  public toggleSupervisorAssignDrawer(): void {
    this.showSupervisorAssignDrawer = !this.showSupervisorAssignDrawer;
  }

  public unassignSupervisor(supervisor: User): void {
    if (!this.user?.id || !supervisor?.id) return;

    this.supervisorsLoading = true;
    this.usersService
      .unassignTherapistSupervisor({ therapistId: this.user.id, supervisorId: supervisor.id })
      .pipe(finalize(() => (this.supervisorsLoading = false)))
      .subscribe(
        () => this.getSupervisors(),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to remove supervisor' })
      );
  }

  private getReports(): void {
    if (!this.user) return;

    this.reportsLoading = true;
    this.reportsResourcesService
      .getReportsByResource(this.reportResource)
      .pipe(finalize(() => (this.reportsLoading = false)))
      .subscribe(
        ({ data: { getReportsByResource } }: any) => {
          this.reports = getReportsByResource;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load reports' })
      );
  }

  public getAssessments(): void {
    if (!this.user?.id || this.assessmentsLoaded) return;

    this.assessmentsLoading = true;
    this.assessmentService
      .getAssessments({
        paging: { first: 50 },
        filter: {
          and: [
            { deleted: { is: false } },
            { responderUserId: { eq: this.user.id } },
          ],
        },
        sorting: [{ field: 'createdAt', direction: 'DESC' }],
      })
      .pipe(finalize(() => (this.assessmentsLoading = false)))
      .subscribe(
        ({ edges }: any) => {
          this.assessments = edges.map((edge: any) => Convert.toFormattedAssessment(edge.node));
          this.assessmentsLoaded = true;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load assessments' })
      );
  }

  private setSupervisorActions(): void {
    this.supervisorActions = this.perms.permissionsOnly(PermissionKey.MANAGE_USERS)
      ? [
          {
            key: SupervisorActionKey.REMOVE_SUPERVISOR,
            title: 'Remove supervisor',
          },
        ]
      : [];
  }

  private getSupervisors(): void {
    if (!this.user || !this.isTherapist) return;
    if (!this.perms.permissionsOnly([PermissionKey.VIEW_USERS, PermissionKey.MANAGE_USERS])) return;

    this.supervisorsLoading = true;
    this.usersService
      .getSupervisors({ first: 50, therapistId: this.user.id })
      .pipe(finalize(() => (this.supervisorsLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.supervisors = data.supervisors.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load supervisors' })
      );

    if (!this.perms.permissionsOnly(PermissionKey.MANAGE_USERS)) return;
    this.usersService.getSupervisors({ first: 50 }).subscribe(
      ({ data }: any) => {
        this.availableSupervisors = data.supervisors.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load available supervisors' })
    );
  }
}
