import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reports } from '@app/pages/administration/@types/reports';
import { ReportsResourcesService } from '@app/pages/patients-management/@services/reports-resources.service';
import { User } from '@app/pages/user-management/@types/user';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { environment } from '@env/environment';
import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-user-profile-tabs',
  templateUrl: './user-profile-tabs.component.html',
  styleUrls: ['./user-profile-tabs.component.scss'],
})
export class UserProfileTabsComponent implements OnInit {
  public user: User;
  public roleCode: string;
  public reports: Reports[] = [];
  public supervisors: User[] = [];
  public availableSupervisors: User[] = [];
  public selectedSupervisorId: number;
  public reportsLoading = false;
  public supervisorsLoading = false;

  public reportColumns: TableColumn<Partial<Reports>>[] = [
    { title: 'Name', name: 'name', translationPath: 'tables.reports.name', sort: true },
    { title: 'Description', name: 'description', translationPath: 'tables.reports.description' },
    { title: 'Report Type', name: 'resources', translationPath: 'tables.reports.resources', sort: true },
    { title: 'Shiny App', name: 'appName', translationPath: 'tables.reports.appName', sort: true },
  ];

  public assessmentColumns: TableColumn<any>[] = [
    { title: 'Name', name: 'name', translationPath: 'tables.assessments.name' },
    { title: 'Status', name: 'status', translationPath: 'tables.assessments.status' },
  ];

  public assessments: any[] = [];

  get userTitle(): string {
    const name = [this.user?.firstName, this.user?.middleName, this.user?.lastName].filter((s) => !!s).join(' ');
    return [this.user?.workID, name].filter((s) => !!s).join(' - ');
  }

  get isTherapist(): boolean {
    return this.roleCode === 'THERAPIST' || this.user?.roles?.some((role) => role.code === 'THERAPIST');
  }

  get reportResource(): string {
    return this.isTherapist ? 'Therapists' : 'Supervisors';
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private errorService: ErrorHandlerService,
    private reportsResourcesService: ReportsResourcesService,
    private router: Router,
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
    });
  }

  public generateReport(report: Reports): void {
    const queryParams = this.isTherapist ? { therapist_id: this.user.id } : { supervisor_id: this.user.id };
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
          this.getSupervisors();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to assign supervisor' })
      );
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

  private getSupervisors(): void {
    if (!this.user || !this.isTherapist) return;

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

    this.usersService.getSupervisors({ first: 50 }).subscribe(
      ({ data }: any) => {
        this.availableSupervisors = data.supervisors.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load available supervisors' })
    );
  }
}
