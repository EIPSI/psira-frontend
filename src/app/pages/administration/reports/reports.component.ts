import { Component, OnInit } from '@angular/core';
import { PermissionKey } from '@shared/@types/permission';
import { FormattedReport, ReportSession, Reports } from '@app/pages/administration/@types/reports';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { ReportsColumns } from '@app/pages/administration/@tables/reports.table';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { ReportsService } from '@app/pages/administration/@services/reports.service';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { ReportsModel } from '@app/pages/administration/@models/reports.model';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { TranslateService } from '@ngx-translate/core';

enum ActionKey {
  EDIT_REPORT,
  DELETE_REPORT,
}

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  public PK = PermissionKey;

  public data: Partial<FormattedReport>[];
  public columns: TableColumn<Partial<Reports>>[] = ReportsColumns;
  public isLoading = false;

  public reportsRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };
  public pageInfo: PageInfo;
  public actions: Action<ActionKey>[] = [];
  public reportSessions: ReportSession[] = [];
  public reportSessionsLoading = false;
  public reportSessionsLoaded = false;

  constructor(
    private reportsService: ReportsService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService,
    public perms: AppPermissionsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getReports();
    this.actions = [
      { key: ActionKey.DELETE_REPORT, title: this.translate.instant('reports.deleteReport') },
    ];
  }

  public handleRowClick(event: any) {
    this.onReportSelect(event);
  }

  public onPageChange(paging: Paging): void {
    this.reportsRequestOptions.paging = paging;
    this.getReports();
  }

  public onSort(sorting: SortField<FormattedReport>[]): void {
    this.reportsRequestOptions.sorting = sorting;
    this.getReports();
  }

  public onFilter(filter: Filter): void {
    this.reportsRequestOptions.filter = filter;
    this.getReports();
  }

  public onSearch(searchString: string): void {
    this.reportsRequestOptions.filter = { or: this.createSearchFilter(searchString) };
    this.getReports();
  }

  public onReportSelect(report: FormattedReport): void {
    const dataString = CryptoJS.AES.encrypt(JSON.stringify(report), environment.secretKey).toString();
    this.router.navigate(['/psira/administration/create-report'], {
      queryParams: {
        report: dataString,
      },
    });
  }

  public onAction({ action, context: report }: ActionArgs<FormattedReport, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT_REPORT:
        if (this.perms.permissionsOnly(PermissionKey.REPORTS_EDIT_DEPARTMENT)) {
          this.onReportSelect(report);
        }
        return;
      case ActionKey.DELETE_REPORT:
        if (this.perms.permissionsOnly(PermissionKey.REPORTS_DELETE_DEPARTMENT)) {
          this.deleteReport(report);
        }
        return;
    }
  }

  navigate() {
    this.router.navigate(['/psira/administration/create-report']);
  }

  public onTabChange(index: number): void {
    if (index === 1 && !this.reportSessionsLoaded) {
      this.getReportSessions();
    }
  }

  public refreshReportSessions(): void {
    this.getReportSessions();
  }

  public getSessionReportName(session: ReportSession): string {
    return session.report?.name || `#${session.reportId}`;
  }

  public getSessionUserName(session: ReportSession): string {
    const user = session.user;
    if (!user) return `#${session.userId}`;
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.username || `#${user.id}`;
  }

  public getSessionPatientName(session: ReportSession): string {
    const patient = session.patient;
    if (!patient) return session.patientId ? `#${session.patientId}` : '-';
    const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
    return patient.medicalRecordNo ? `${name} (${patient.medicalRecordNo})` : name;
  }

  public getContextLabel(contextType: string): string {
    const normalized = (contextType || 'GENERAL').toLowerCase();
    const labels: Record<string, string> = {
      general: 'reports.contextGeneral',
      patient: 'reports.contextPatient',
      therapist: 'reports.contextTherapist',
      supervisor: 'reports.contextSupervisor',
      user: 'reports.contextUser',
    };

    return labels[normalized] || contextType || 'reports.contextGeneral';
  }

  public formatDuration(seconds: number): string {
    const total = Math.max(0, seconds || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;

    if (hours) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  }

  private createSearchFilter(searchString: string): Array<{ [K in keyof Partial<Reports>]: {} }> {
    if (!searchString) return [];
    return [{ name: { iLike: `%${searchString}%` } }, { description: { iLike: `%${searchString}%` } }];
  }

  private getReports(): void {
    this.isLoading = true;
    this.reportsService
      .reports(this.reportsRequestOptions)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.data = data.reports.edges.map((report: any) => ReportsModel.fromJson(report.node));
          console.log('this.data', this.data);
          this.pageInfo = data.reports.pageInfo;
        },
        (err) => this.errorService.handleError(err, { prefix: this.translate.instant('reports.unableLoadReports') })
      );
  }

  private getReportSessions(): void {
    this.reportSessionsLoading = true;
    this.reportsService
      .reportSessions()
      .pipe(finalize(() => (this.reportSessionsLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.reportSessions = data.reportSessions || [];
          this.reportSessionsLoaded = true;
        },
        (err) => this.errorService.handleError(err, { prefix: this.translate.instant('reports.unableLoadReportSessions') })
      );
  }

  private async deleteReport(report: FormattedReport): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('reports.deleteReport'),
      nzContent: this.translate.instant('reports.deleteReportConfirm', { name: report.name }),
    });

    if (!(await modal.afterClose.toPromise())) return;

    this.isLoading = true;
    this.reportsService
      .deleteReport(report)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          const data = [...this.data];
          data.splice(this.data.indexOf(report), 1);
          this.data = data; // mutate reference to trigger change detection
        },
        (err) => this.errorService.handleError(err, { prefix: this.translate.instant('reports.unableDeleteReport', { name: report.name }) })
      );
  }
}
