import { Component, Input, OnChanges } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { CalendarService } from '../@services/calendar.service';
import {
  CalendarAssessment,
  CaseHistoryEntry,
  CaseHistoryEntryKind,
  ClinicalSession,
  ClinicalSessionCancellationType,
  ClinicalSessionFollowUpSettings,
  ClinicalSessionFollowUpVersion,
  ClinicalSessionKind,
  ClinicalSessionResource,
} from '../@types/calendar';
import { formatSystemDateTime } from '@shared/utils/system-settings.util';

@Component({
  selector: 'app-clinical-follow-up-list',
  templateUrl: './clinical-follow-up-list.component.html',
  styleUrls: ['./clinical-follow-up-list.component.scss'],
})
export class ClinicalFollowUpListComponent implements OnChanges {
  @Input() patientId?: number;
  @Input() therapistId?: number;
  @Input() supervisorId?: number;
  @Input() sessionKind?: ClinicalSessionKind;
  @Input() title = 'Historia clinica';

  loading = false;
  saving = false;
  sessions: ClinicalSession[] = [];
  filteredSessions: ClinicalSession[] = [];
  editingSession?: ClinicalSession;
  editHistory = '';
  versions: ClinicalSessionFollowUpVersion[] = [];
  settings?: ClinicalSessionFollowUpSettings;
  editModalVisible = false;
  rawAssessmentModalVisible = false;
  rawAssessmentLoading = false;
  rawAssessmentTitle = '';
  rawAssessmentData = '';
  renderedAssessmentQuestions: any[] = [];
  dateRange: Date[] = [];
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  showFutureSessions = false;
  historyEntries: CaseHistoryEntry[] = [];
  documentItems: Array<
    { type: 'SESSION'; date: string; session: ClinicalSession } |
    { type: 'ENTRY'; date: string; entry: CaseHistoryEntry }
  > = [];
  noteModalVisible = false;
  noteOccurredAt = new Date();
  noteTitle = '';
  noteContent = '';

  constructor(
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnChanges(): void {
    this.loadSettings();
    this.loadDocument();
  }

  openEdit(session: ClinicalSession): void {
    this.editingSession = session;
    this.editHistory = session.clinicalHistory || '';
    this.versions = [];
    this.editModalVisible = true;
    this.calendarService.getClinicalSessionFollowUpVersions(session.id).subscribe(
      (versions: ClinicalSessionFollowUpVersion[]) => (this.versions = versions),
      (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load follow-up versions' })
    );
  }

  saveFollowUp(): void {
    if (!this.editingSession) return;
    this.saving = true;
    this.calendarService
      .updateClinicalSession({
        clinicalSessionId: this.editingSession.id,
        clinicalHistory: this.editHistory,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.editModalVisible = false;
          this.loadDocument();
        },
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to update follow-up' })
      );
  }

  openNoteModal(): void {
    this.noteOccurredAt = new Date();
    this.noteTitle = 'Nota';
    this.noteContent = '';
    this.noteModalVisible = true;
  }

  saveNote(): void {
    if (!this.noteTitle?.trim()) return;
    this.saving = true;
    this.calendarService
      .createCaseHistoryNote({
        cycleKind: this.sessionKind || ClinicalSessionKind.CLINICAL,
        patientId: this.patientId,
        therapistId: this.therapistId,
        occurredAt: this.noteOccurredAt,
        title: this.noteTitle,
        content: this.noteContent,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.noteModalVisible = false;
          this.loadDocument();
        },
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to create history note' })
      );
  }

  applyFilters(): void {
    const from = this.dateRange?.[0] ? this.startOfDay(this.dateRange[0]) : undefined;
    const to = this.dateRange?.[1] ? this.endOfDay(this.dateRange[1]) : undefined;
    this.filteredSessions = this.sessions
      .filter((session: ClinicalSession) => this.shouldShowSession(session))
      .filter((session: ClinicalSession) => {
        const date = new Date(session.calendarOccurrence.startAt);
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      })
      .sort((a: ClinicalSession, b: ClinicalSession) => {
        const left = new Date(a.calendarOccurrence.startAt).getTime();
        const right = new Date(b.calendarOccurrence.startAt).getTime();
        return this.sortDirection === 'ASC' ? left - right : right - left;
      });
    const sessionItems = this.filteredSessions.map((session: ClinicalSession) => ({
      type: 'SESSION' as const,
      date: this.sessionDate(session),
      session,
    }));
    const entryItems = this.historyEntries
      .filter((entry: CaseHistoryEntry) => {
        const date = new Date(entry.occurredAt);
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      })
      .map((entry: CaseHistoryEntry) => ({
        type: 'ENTRY' as const,
        date: entry.occurredAt,
        entry,
      }));
    this.documentItems = [...sessionItems, ...entryItems].sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return this.sortDirection === 'ASC' ? left - right : right - left;
    });
  }

  canEdit(session: ClinicalSession): boolean {
    if (session.clinicalStatus === 'CANCELLED') return false;
    if (!this.settings) return true;
    const editUntil = new Date(session.calendarOccurrence.startAt);
    editUntil.setDate(editUntil.getDate() + this.settings.editWindowDays);
    return new Date() <= editUntil;
  }

  sessionTitle(session: ClinicalSession): string {
    const number = this.displaySessionNumber(session) ? `Sesion ${this.displaySessionNumber(session)}` : 'Sesion';
    return `${number} - ${formatSystemDateTime(session.calendarOccurrence.startAt)}`;
  }

  displaySessionNumber(session: ClinicalSession): number | undefined {
    return session.cancelledSessionNumber || session.sessionNumber;
  }

  sessionDate(session: ClinicalSession): string {
    return session.cancelledStartAt || session.calendarOccurrence.startAt;
  }

  isNoShowCancelled(session: ClinicalSession): boolean {
    return (
      session.clinicalStatus === 'CANCELLED' &&
      session.cancellationType === ClinicalSessionCancellationType.NO_SHOW
    );
  }

  isFutureSession(session: ClinicalSession): boolean {
    return new Date(this.sessionDate(session)).getTime() > Date.now();
  }

  cancellationDetail(session: ClinicalSession): string {
    return session.cancellationReasonSnapshot || '';
  }

  cancellationNoteLabel(session: ClinicalSession): string {
    return session.sessionKind === 'SUPERVISION' ? 'Nota de supervisión' : 'Nota clínica';
  }

  entryColor(entry: CaseHistoryEntry): string {
    if (entry.entryKind === CaseHistoryEntryKind.NEW_TREATMENT) return 'success';
    if (entry.entryKind === CaseHistoryEntryKind.TREATMENT_FINALIZATION) return 'warning';
    if (entry.entryKind === CaseHistoryEntryKind.FINALIZATION_CANCELLED) return 'default';
    return 'processing';
  }

  assessmentResources(session: ClinicalSession): ClinicalSessionResource[] {
    return (session.resources || []).filter((resource: ClinicalSessionResource) => !!resource.assessment);
  }

  assessmentName(resource: ClinicalSessionResource): string {
    const assessment = resource.assessment;
    const base = assessment?.assessmentType?.name || `Evaluacion ${assessment?.id || resource.id}`;
    const relative = assessment?.schemeRelativeSessionNumber || resource.schemeRelativeSessionNumber;
    return relative ? `${base} (rel. ${relative})` : base;
  }

  assessmentIsAnswered(assessment?: CalendarAssessment): boolean {
    const status = (assessment?.status || '').toUpperCase();
    return ['COMPLETED', 'PARTIALLY_COMPLETED', 'ANSWERED', 'SUBMITTED'].includes(status);
  }

  openRawAssessment(resource: ClinicalSessionResource): void {
    const assessment = resource.assessment;
    if (!assessment || !this.assessmentIsAnswered(assessment) || !assessment.questionnaireAssessmentId) return;

    this.rawAssessmentTitle = this.assessmentName(resource);
    this.rawAssessmentData = '';
    this.renderedAssessmentQuestions = [];
    this.rawAssessmentLoading = true;
    this.rawAssessmentModalVisible = true;
    this.calendarService.getQuestionnaireAssessment(assessment.questionnaireAssessmentId).subscribe(
      (data: any) => {
        this.rawAssessmentData = JSON.stringify(data?.answers || [], null, 2);
        this.renderedAssessmentQuestions = this.renderAssessment(data);
        this.rawAssessmentLoading = false;
      },
      (error: any) => {
        this.rawAssessmentLoading = false;
        this.errorService.handleError(error, { prefix: 'Unable to load assessment answers' });
      }
    );
  }

  entryIsAssessmentNote(entry: CaseHistoryEntry): boolean {
    return !!entry.assessmentId;
  }

  openRawAssessmentEntry(entry: CaseHistoryEntry): void {
    if (!entry.questionnaireAssessmentId) return;
    this.rawAssessmentTitle = this.entryAssessmentLabel(entry);
    this.rawAssessmentData = '';
    this.renderedAssessmentQuestions = [];
    this.rawAssessmentLoading = true;
    this.rawAssessmentModalVisible = true;
    this.calendarService.getQuestionnaireAssessment(entry.questionnaireAssessmentId).subscribe(
      (data: any) => {
        this.rawAssessmentData = JSON.stringify(data?.answers || [], null, 2);
        this.renderedAssessmentQuestions = this.renderAssessment(data);
        this.rawAssessmentLoading = false;
      },
      (error: any) => {
        this.rawAssessmentLoading = false;
        this.errorService.handleError(error, { prefix: 'Unable to load assessment answers' });
      }
    );
  }

  entryAssessmentLabel(entry: CaseHistoryEntry): string {
    return entry.assessmentName || entry.assessmentTypeName || entry.title || `Evaluacion ${entry.assessmentId}`;
  }

  formatPerson(person: any): string {
    if (!person) return '';
    return [person.firstName, person.middleName, person.lastName].filter((part: string) => !!part).join(' ');
  }

  private loadSettings(): void {
    this.calendarService.getClinicalSessionFollowUpSettings().subscribe(
      (settings: ClinicalSessionFollowUpSettings) => (this.settings = settings),
      (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load follow-up settings' })
    );
  }

  private loadDocument(): void {
    if (!this.patientId && !this.therapistId && !this.supervisorId) return;
    this.loading = true;
    forkJoin({
      sessions: this.calendarService.getClinicalSessions({
        patientId: this.patientId,
        therapistId: this.therapistId,
        supervisorId: this.supervisorId,
        sessionKind: this.sessionKind,
        includeCancelled: true,
      }),
      entries: this.calendarService.getCaseHistoryEntries({
        patientId: this.patientId,
        therapistId: this.therapistId,
        cycleKind: this.sessionKind,
        sortDirection: this.sortDirection,
      }),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ sessions, entries }: { sessions: ClinicalSession[]; entries: CaseHistoryEntry[] }) => {
          this.sessions = sessions;
          this.historyEntries = entries;
          this.applyFilters();
        },
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load follow-ups' })
      );
  }

  private shouldShowSession(session: ClinicalSession): boolean {
    const isVisibleCancellation = session.clinicalStatus !== 'CANCELLED' || this.isNoShowCancelled(session);
    if (!isVisibleCancellation) return false;
    if (!this.showFutureSessions && this.isFutureSession(session)) return false;
    return true;
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private renderAssessment(data: any): any[] {
    const answers = data?.answers || [];
    return (data?.questionnaires || [])
      .map((questionnaire: any) =>
        (questionnaire.questionGroups || []).map((group: any) =>
          (group.questions || []).map((question: any) => {
            const answer = answers.find((candidate: any) => candidate.question === question._id);
            return {
              questionnaireName: questionnaire.name,
              groupLabel: group.label,
              question,
              answer,
            };
          })
        )
      )
      .flat(2)
      .filter((item: any) => !!item.answer);
  }
}
