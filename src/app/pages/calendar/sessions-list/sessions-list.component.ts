import { Component, Input, OnChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { CalendarService } from '../@services/calendar.service';
import { ClinicalSession, ClinicalSessionKind, ClinicalSessionListFilter } from '../@types/calendar';

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
  editStartAt?: Date;
  editEndAt?: Date;
  editHistory = '';
  editModalVisible = false;
  contextSession?: ClinicalSession;

  constructor(
    private calendarService: CalendarService,
    private contextMenuService: NzContextMenuService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService
  ) {}

  ngOnChanges(): void {
    this.loadSessions();
  }

  toggleCancelled(): void {
    this.includeCancelled = !this.includeCancelled;
    this.loadSessions();
  }

  personName(person?: { firstName?: string; middleName?: string; lastName?: string; workID?: string }): string {
    const name = [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ');
    return [person?.workID, name].filter(Boolean).join(' - ');
  }

  sessionTitle(session: ClinicalSession): string {
    return session.sessionKind === ClinicalSessionKind.SUPERVISION ? 'Supervisión' : 'Sesión clínica';
  }

  openEdit(session: ClinicalSession): void {
    this.editingSession = session;
    this.editStartAt = new Date(session.calendarOccurrence.startAt);
    this.editEndAt = new Date(session.calendarOccurrence.endAt);
    this.editHistory = session.clinicalHistory || '';
    this.editModalVisible = true;
  }

  openContextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, session: ClinicalSession): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextSession = session;
    this.contextMenuService.create(event, menu);
  }

  discardContextSession(): void {
    if (!this.contextSession) return;
    this.confirmDiscard(this.contextSession);
  }

  confirmDiscard(session: ClinicalSession): void {
    this.modalService.confirm({
      nzTitle: 'Descartar sesión',
      nzContent: 'La sesión quedará cancelada y se ocultará por defecto del listado.',
      nzOkText: 'Descartar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
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
      nzTitle: 'Renumerar sesiones futuras',
      nzContent: '¿Querés que las sesiones posteriores ocupen el número de sesión descartado?',
      nzOkText: 'Sí, renumerar',
      nzCancelText: 'No renumerar',
      nzOnOk: () => this.discardSession(session, true),
      nzOnCancel: () => this.discardSession(session, false),
    });
  }

  saveEdit(): void {
    if (!this.editingSession) return;
    this.saving = true;
    this.calendarService
      .updateClinicalSession({
        clinicalSessionId: this.editingSession.id,
        startAt: this.editStartAt,
        endAt: this.editEndAt,
        clinicalHistory: this.editHistory,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.editModalVisible = false;
          this.loadSessions();
        },
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to update session' })
      );
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
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load sessions' })
      );
  }

  private discardSession(session: ClinicalSession, renumberFutureSessions: boolean): void {
    this.loading = true;
    this.calendarService
      .cancelClinicalSession(session.id, renumberFutureSessions, 'Discarded from sessions list')
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.loadSessions(),
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to discard session' })
      );
  }
}
