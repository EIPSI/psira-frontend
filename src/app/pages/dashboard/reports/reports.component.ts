import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import { Reports } from '@app/pages/administration/@types/reports';
import { finalize } from 'rxjs/operators';
import { ReportsResourcesService } from '@app/pages/patients-management/@services/reports-resources.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { ReportsDashboardService } from '../@services/reports.service';
import { TableColumn } from '@shared/@modules/master-data/@types/list';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  @Input() public patient: FormattedPatient;
  reports: Reports[] = [];
  public isLoading = false;
  public columns: TableColumn<Partial<Reports>>[] = [
    {
      title: 'Name',
      name: 'name',
      translationPath: 'tables.reports.name',
      sort: true,
    },
    {
      title: 'Description',
      name: 'description',
      translationPath: 'tables.reports.description',
      sort: true,
    },
    {
      title: 'Report Type',
      name: 'resources',
      translationPath: 'tables.reports.resources',
      sort: true,
    },
    {
      title: 'Shiny App',
      name: 'appName',
      translationPath: 'tables.reports.appName',
      sort: true,
    },
  ];

  constructor(
    private errorService: ErrorHandlerService,
    private reportsDashboardService: ReportsDashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getReportsByResources();
  }

  getReportsByResources() {
    this.isLoading = true;
    this.reportsDashboardService
      .getDashboardCaseManagers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data: { getReportsByResource } }: any) => {
          this.reports = getReportsByResource;
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load reports' })
      );
  }

  generateLink(report: Reports) {
    this.router.navigate(['/psira/reports', report.id]);
  }
}
