import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { EvaluationSchemesService } from '@app/pages/evaluation-schemes/@services/evaluation-schemes.service';
import {
  EvaluationScheme,
  EvaluationSchemeType,
} from '@app/pages/evaluation-schemes/@types/evaluation-scheme';
import { CalendarService } from '../@services/calendar.service';
import {
  AddClinicalSessionSchemesApplicationMode,
  ClinicalSession,
  ClinicalSessionKind,
  ClinicalSessionListFilter,
  ClinicalSessionResource,
  ClinicalSessionSchemeApplication,
} from '../@types/calendar';
import {
  ClinicalSessionResourceKind,
  ResourceActivationAnchor,
} from '../../evaluation-schemes/@types/evaluation-scheme';
import { User } from '@app/pages/user-management/@types/user';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sessions-list',
  templateUrl: './sessions-list.component.html',
  styleUrls: ['./sessions-list.component.scss'],
})
export class SessionsListComponent implements OnChanges {
  @Input() patientId?: number;
  @Input() therapistId?: number;
  @Input() supervisorId?: number;
  @Input() sessionKind?: ClinicalSessionKind;

  loading = false;
  saving = false;
  includeCancelled = false;
  sessions: ClinicalSession[] = [];
  editingSession?: ClinicalSession;
  editingResource?: ClinicalSessionResource;
  editSessionNumber?: number;
  editStartAt?: Date;
  editEndAt?: Date;
  editHistory = '';
  editAddSchemeIds: number[] = [];
  editAddSchemesPropagate = false;
  editAddSchemesApplicationMode = AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION;
  editOverwriteExistingSchemes = false;
  editStopExistingSchemesFromSession = false;
  activeSchemeApplications: ClinicalSessionSchemeApplication[] = [];
  sessionSchemes: EvaluationScheme[] = [];
  editModalVisible = false;
  resourceModalVisible = false;
  resourceSaving = false;
  editResourceKind?: string;
  editResourceStatus?: string;
  editActivationAnchor?: string;
  editActivationOffsetMinutes?: number;
  editAvailabilityDurationMinutes?: number;
  editReminderMinutes = '';
  editActivationAt?: Date;
  editExpirationAt?: Date;
  originalActivationAt?: string;
  originalExpirationAt?: string;
  contextSession?: ClinicalSession;
  resourceKinds = [
    ClinicalSessionResourceKind.PRE_ASSESSMENT,
    ClinicalSessionResourceKind.POST_ASSESSMENT,
    ClinicalSessionResourceKind.CLINICAL_NOTES,
    ClinicalSessionResourceKind.FOLLOW_UP,
  ];
  activationAnchors = [
    ResourceActivationAnchor.SESSION_START,
    ResourceActivationAnchor.SESSION_END,
  ];
  resourceStatuses = ['PENDING', 'OPEN', 'COMPLETED', 'DETACHED', 'CANCELLED'];
  addSchemeApplicationModeOptions = [
    { label: 'patientsManagement.fromThisSession', value: AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION },
    { label: 'patientsManagement.originalStructure', value: AddClinicalSessionSchemesApplicationMode.ORIGINAL_SESSION_NUMBER },
  ];
  private currentUser?: User;

  constructor(
    private calendarService: CalendarService,
    private contextMenuService: NzContextMenuService,
    private errorService: ErrorHandlerService,
    private schemesService: EvaluationSchemesService,
    private modalService: NzModalService,
    private translate: TranslateService
  ) {}

  ngOnChanges(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
    this.loadSessions();
    this.loadSchemes();
  }

  toggleCancelled(): void {
    this.includeCancelled = !this.includeCancelled;
    this.loadSessions();
  }

  personName(person?: { firstName?: string; middleName?: string; lastName?: string; workID?: string }): string {
    const name = [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ');
    return [person?.workID, name].filter(Boolean).join(' - ');
  }

  stringSort(field: keyof ClinicalSession): (a: ClinicalSession, b: ClinicalSession) => number {
    return (a, b) => this.compareText(a[field], b[field]);
  }

  numberSort(field: keyof ClinicalSession): (a: ClinicalSession, b: ClinicalSession) => number {
    return (a, b) => Number(a[field] || 0) - Number(b[field] || 0);
  }

  sessionDateSort(field: 'startAt' | 'endAt'): (a: ClinicalSession, b: ClinicalSession) => number {
    return (a, b) => this.timeValue(a.calendarOccurrence?.[field]) - this.timeValue(b.calendarOccurrence?.[field]);
  }

  personSort(field: 'patient' | 'therapist' | 'supervisor'): (a: ClinicalSession, b: ClinicalSession) => number {
    return (a, b) => this.compareText(this.personName(a[field]), this.personName(b[field]));
  }

  resourceCountSort = (a: ClinicalSession, b: ClinicalSession): number =>
    Number(a.resources?.length || 0) - Number(b.resources?.length || 0);

  resourceStringSort(field: keyof ClinicalSessionResource): (a: ClinicalSessionResource, b: ClinicalSessionResource) => number {
    return (a, b) => this.compareText(a[field], b[field]);
  }

  resourceDateSort(field: keyof ClinicalSessionResource): (a: ClinicalSessionResource, b: ClinicalSessionResource) => number {
    return (a, b) => this.timeValue(a[field]) - this.timeValue(b[field]);
  }

  resourceAssessmentSort = (a: ClinicalSessionResource, b: ClinicalSessionResource): number =>
    this.compareText(a.assessment?.assessmentType?.name, b.assessment?.assessmentType?.name);

  private compareText(a: any, b: any): number {
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  private timeValue(value: any): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  sessionTitle(session: ClinicalSession): string {
    return this.translate.instant(session.sessionKind === ClinicalSessionKind.SUPERVISION ? 'dashboard.supervision' : 'dashboard.clinicalSession');
  }

  openEdit(session: ClinicalSession): void {
    this.editingSession = session;
    this.editSessionNumber = session.sessionNumber;
    this.editStartAt = new Date(session.calendarOccurrence.startAt);
    this.editEndAt = new Date(session.calendarOccurrence.endAt);
    this.editHistory = session.clinicalHistory || '';
    this.editAddSchemeIds = [];
    this.editAddSchemesPropagate = false;
    this.editAddSchemesApplicationMode = AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION;
    this.editOverwriteExistingSchemes = false;
    this.editStopExistingSchemesFromSession = false;
    this.activeSchemeApplications = [];
    this.loadActiveSchemeApplications(session.id);
    this.editModalVisible = true;
  }

  openResourceEdit(resource: ClinicalSessionResource, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.canEditSession(this.editingSession)) return;

    this.editingResource = resource;
    this.editResourceKind = resource.resourceKind;
    this.editResourceStatus = resource.status;
    this.editActivationAnchor = resource.activationAnchor;
    this.editActivationOffsetMinutes = resource.activationOffsetMinutes;
    this.editAvailabilityDurationMinutes = resource.availabilityDurationMinutes;
    this.editReminderMinutes = (resource.reminderMinutes || []).join(', ');
    this.editActivationAt = resource.activationAt ? new Date(resource.activationAt) : undefined;
    this.editExpirationAt = resource.expirationAt ? new Date(resource.expirationAt) : undefined;
    this.originalActivationAt = resource.activationAt;
    this.originalExpirationAt = resource.expirationAt;
    this.resourceModalVisible = true;
  }

  openContextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, session: ClinicalSession): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextSession = session;
    this.contextMenuService.create(event, menu);
  }

  discardContextSession(): void {
    if (!this.contextSession || !this.canEditSession(this.contextSession)) return;
    this.confirmDiscard(this.contextSession);
  }

  confirmDiscard(session: ClinicalSession): void {
    if (!this.canEditSession(session)) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.cancellation'),
      nzContent: this.translate.instant('calendar.sessionWillBeCancelled'),
      nzOkText: this.translate.instant('patientsManagement.cancellation'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('core.cancel'),
      nzOnOk: () => {
        if (session.sessionNumber) {
          this.confirmRenumber(session);
          return;
        }
        this.discardSession(session, false);
      },
    });
  }

  private confirmRenumber(session: ClinicalSession): void {
    this.modalService.confirm({
      nzTitle: this.translate.instant('calendar.renumberFutureSessions'),
      nzContent: this.translate.instant('calendar.renumberFutureSessionsConfirm'),
      nzOkText: this.translate.instant('calendar.yesRenumber'),
      nzCancelText: this.translate.instant('calendar.doNotRenumber'),
      nzOnOk: () => this.discardSession(session, true),
      nzOnCancel: () => this.discardSession(session, false),
    });
  }

  saveEdit(): void {
    if (!this.editingSession) return;
    if (!this.canEditSession(this.editingSession)) return;
    this.saving = true;
    const clinicalSessionId = this.editingSession.id;
    const save$: Observable<any> = this.calendarService
      .updateClinicalSession({
        clinicalSessionId,
        sessionNumber: this.editSessionNumber ? Number(this.editSessionNumber) : undefined,
        startAt: this.editStartAt,
        endAt: this.editEndAt,
        clinicalHistory: this.editHistory,
      });
    const saveWithSchemes$: Observable<any> = this.editAddSchemeIds.length
      ? save$.pipe(
          switchMap(() =>
            this.calendarService.addClinicalSessionSchemes({
              clinicalSessionId,
              propagateFuture: this.editAddSchemesPropagate,
              schemeIds: this.editAddSchemeIds,
              applicationMode: this.editAddSchemesApplicationMode,
              overwriteExisting: this.editOverwriteExistingSchemes,
            })
          )
        )
      : save$;
    saveWithSchemes$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.editModalVisible = false;
          this.loadSessions();
        },
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableUpdateSession') })
      );
  }

  saveResourceEdit(): void {
    if (!this.editingResource || !this.canEditSession(this.editingSession)) return;

    this.resourceSaving = true;
    const resourceUpdate: any = {
      resourceId: this.editingResource.id,
      resourceKind: this.editResourceKind,
      status: this.editResourceStatus,
      activationAnchor: this.editActivationAnchor,
      activationOffsetMinutes: this.editActivationOffsetMinutes,
      availabilityDurationMinutes: this.editAvailabilityDurationMinutes,
      reminderMinutes: this.parseReminderMinutes(this.editReminderMinutes),
    };

    if (this.dateChanged(this.originalActivationAt, this.editActivationAt)) {
      resourceUpdate.activationAt = this.editActivationAt;
    }
    if (this.dateChanged(this.originalExpirationAt, this.editExpirationAt)) {
      resourceUpdate.expirationAt = this.editExpirationAt;
    }

    this.calendarService
      .updateClinicalSessionResource(resourceUpdate)
      .pipe(finalize(() => (this.resourceSaving = false)))
      .subscribe(
        () => {
          this.resourceModalVisible = false;
          this.editModalVisible = false;
          this.loadSessions();
        },
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableUpdateSessionResource') })
      );
  }

  resourceAssessmentName(resource?: ClinicalSessionResource): string {
    return resource?.assessment?.assessmentType?.name || '-';
  }

  private loadSessions(): void {
    if (!this.patientId && !this.therapistId && !this.supervisorId) return;

    const filter: ClinicalSessionListFilter = {
      patientId: this.patientId,
      therapistId: this.therapistId,
      supervisorId: this.supervisorId,
      sessionKind: this.sessionKind,
      includeCancelled: this.includeCancelled,
    };

    this.loading = true;
    this.calendarService
      .getClinicalSessions(filter)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (sessions: ClinicalSession[]) => (this.sessions = sessions),
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadSessions') })
      );
  }

  private loadSchemes(): void {
    this.schemesService.getSchemes().subscribe(
      ({ edges }) => {
        this.sessionSchemes = edges
          .map((edge: any) => edge.node)
          .filter((scheme: EvaluationScheme) =>
            scheme.active && scheme.schemeType === EvaluationSchemeType.SESSION_BASED
          );
      },
      (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadSessionSchemes') })
    );
  }

  private discardSession(session: ClinicalSession, renumberFutureSessions: boolean): void {
    if (!this.canEditSession(session)) return;
    this.loading = true;
    this.calendarService
      .cancelClinicalSession(session.id, renumberFutureSessions, this.translate.instant('calendar.discardedFromSessionsList'))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.loadSessions(),
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableDiscardSession') })
      );
  }

  private parseReminderMinutes(value: string): number[] {
    return (value || '')
      .split(',')
      .map(item => Number(item.trim()))
      .filter(item => Number.isFinite(item) && item >= 0);
  }

  private dateChanged(original?: string, current?: Date): boolean {
    if (!original && !current) return false;
    if (!original || !current) return true;
    return new Date(original).getTime() !== current.getTime();
  }

  canEditSession(session?: ClinicalSession): boolean {
    if (!session || !this.currentUser?.id) return false;
    const responsibleUserIds = (session.responsibleUsers || []).map((user) => user.id);
    const legacyResponsibleId = session.sessionKind === ClinicalSessionKind.SUPERVISION
      ? session.supervisorId
      : session.therapistId;
    return responsibleUserIds.includes(this.currentUser.id) || legacyResponsibleId === this.currentUser.id;
  }

  stopActiveScheme(application: ClinicalSessionSchemeApplication): void {
    if (!this.editingSession?.id) return;
    const clinicalSessionId = this.editingSession.id;
    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.stopScheme'),
      nzContent: this.translate.instant('calendar.stopSchemeConfirmLong'),
      nzOkText: this.translate.instant('patientsManagement.stop'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('core.back'),
      nzOnOk: () => {
        this.saving = true;
        this.calendarService
          .stopClinicalSessionScheme(clinicalSessionId, application.schemeId)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => {
              this.loadActiveSchemeApplications(clinicalSessionId);
              this.loadSessions();
            },
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableStopEvaluationScheme') })
          );
      },
    });
  }

  private loadActiveSchemeApplications(clinicalSessionId: number): void {
    this.calendarService.getClinicalSessionSchemeApplications(clinicalSessionId).subscribe(
      (applications) => (this.activeSchemeApplications = applications || []),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadActiveEvaluationSchemes') })
    );
  }
}
