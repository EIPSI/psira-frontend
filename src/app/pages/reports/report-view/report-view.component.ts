import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Reports } from '@app/pages/administration/@types/reports';
import { ReportsService } from '@app/pages/administration/@services/reports.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss'],
})
export class ReportViewComponent implements OnInit, OnDestroy {
  public report: Reports;
  public reportUrl: SafeResourceUrl;
  public isLoading = false;
  public notFound = false;
  private reportSessionId: number;
  private heartbeatTimer: any;
  private patientId: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private reportsService: ReportsService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound = true;
      return;
    }

    this.loadReport(id);
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
    this.endReportSession();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.endReportSession();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) {
      this.sendHeartbeat();
    }
  }

  goBack() {
    history.back();
  }

  private loadReport(id: number) {
    this.isLoading = true;
    this.patientId = Number(this.activatedRoute.snapshot.queryParamMap.get('patient_id')) || undefined;

    this.reportsService
      .getReportEmbed(id, this.patientId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          const reportEmbed = data.getReportEmbed;
          this.report = reportEmbed?.report;
          if (!this.report) {
            this.notFound = true;
            return;
          }
          this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(reportEmbed.embedUrl);
          this.startReportSession(this.report.id);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load report' })
      );
  }

  private startReportSession(reportId: number) {
    this.reportsService.startReportSession(reportId, this.patientId).subscribe(
      ({ data }: any) => {
        this.reportSessionId = data.startReportSession?.id;
        if (this.reportSessionId) this.startHeartbeat();
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to start report session' })
    );
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private endReportSession() {
    if (!this.reportSessionId) return;

    const sessionId = this.reportSessionId;
    this.reportSessionId = null;
    this.reportsService.endReportSession(sessionId).subscribe();
  }

  private sendHeartbeat() {
    if (!this.reportSessionId) return;

    this.reportsService.heartbeatReportSession(this.reportSessionId).subscribe();
  }
}
