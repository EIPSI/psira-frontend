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
  private readonly contextParamNames = ['patient_id', 'therapist_id', 'supervisor_id', 'user_id'];

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
          this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.appendContextParams(reportEmbed.embedUrl));
          this.startReportSession(this.report.id);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load report' })
      );
  }

  private startReportSession(reportId: number) {
    this.reportsService
      .startReportSession(reportId, this.patientId, this.getContextType(), this.getContextParams())
      .subscribe(
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

  private appendContextParams(url: string): string {
    const params = new URLSearchParams();
    for (const paramName of this.contextParamNames) {
      const value = this.activatedRoute.snapshot.queryParamMap.get(paramName);
      if (value && !url.includes(`${paramName}=`)) {
        params.set(paramName, value);
      }
    }

    const serializedParams = params.toString();
    if (!serializedParams) return url;

    return `${url}${url.includes('?') ? '&' : '?'}${serializedParams}`;
  }

  private getContextType(): string {
    if (this.patientId) return 'PATIENT';
    const params = this.activatedRoute.snapshot.queryParamMap;
    if (params.get('therapist_id')) return 'THERAPIST';
    if (params.get('supervisor_id')) return 'SUPERVISOR';
    if (params.get('user_id')) return 'USER';
    return 'GENERAL';
  }

  private getContextParams(): string {
    const context: Record<string, string> = {};
    for (const paramName of this.contextParamNames) {
      const value = this.activatedRoute.snapshot.queryParamMap.get(paramName);
      if (value) context[paramName] = value;
    }

    return Object.keys(context).length ? JSON.stringify(context) : null;
  }
}
