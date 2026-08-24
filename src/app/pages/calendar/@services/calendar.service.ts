import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalendarMutations } from '@app/@graphql/mutations/calendar';
import { CalendarQueries } from '@app/@graphql/queries/calendar';
import { AssessmentsMutations } from '@app/@graphql/mutations/assessments';
import {
  AddClinicalSessionSchemesApplicationMode,
  AssessmentOrigin,
  CalendarEvent,
  CalendarEventType,
  CalendarEventFilter,
  CalendarOccurrence,
  CalendarOccurrenceFilter,
  CaseEventReason,
  CaseEventReasonContext,
  CaseEventReasonTree,
  CaseHistoryEntry,
  ClinicalSession,
  ClinicalSessionCancellationReason,
  ClinicalSessionCancellationType,
  ClinicalSessionKind,
  ClinicalSessionFollowUpSettings,
  ClinicalSessionFollowUpVersion,
  ClinicalSessionListFilter,
  ClinicalSessionSchemeApplication,
  RestructureClinicalSessionsInput,
  TreatmentCycle,
} from '../@types/calendar';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private apollo: Apollo) {}

  getOccurrences(filter: CalendarOccurrenceFilter): Observable<CalendarOccurrence[]> {
    return this.apollo
      .query({
        query: CalendarQueries.calendarOccurrences,
        variables: {
          ...filter,
          from: filter.from.toISOString(),
          to: filter.to.toISOString(),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.calendarOccurrences));
  }

  getCalendarEvents(filter: CalendarEventFilter): Observable<CalendarEvent[]> {
    return this.apollo
      .query({
        query: CalendarQueries.calendarEvents,
        variables: {
          filter: {
            ...filter,
            from: filter.from.toISOString(),
            to: filter.to.toISOString(),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.calendarEvents));
  }

  moveOccurrence(id: number, startAt: Date, endAt: Date): Observable<CalendarOccurrence> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.moveCalendarOccurrence,
        variables: {
          id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.moveCalendarOccurrence));
  }

  moveClinicalSession(clinicalSessionId: number, startAt: Date, endAt: Date): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.moveClinicalSession,
        variables: {
          session: {
            clinicalSessionId,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.moveClinicalSession));
  }

  getClinicalSessions(filter: ClinicalSessionListFilter): Observable<ClinicalSession[]> {
    return this.apollo
      .query({
        query: CalendarQueries.clinicalSessions,
        variables: { filter },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.clinicalSessions));
  }

  getCaseEventReasons(
    context: CaseEventReasonContext,
    parentId?: number | null,
    departmentId?: number | null,
    includeInactive = false,
    exactDepartment = false
  ): Observable<CaseEventReason[]> {
    return this.apollo
      .query({
        query: CalendarQueries.caseEventReasons,
        variables: { context, parentId, departmentId, includeInactive, exactDepartment },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.caseEventReasons));
  }

  getCaseEventReasonTrees(includeInactive = false): Observable<CaseEventReasonTree[]> {
    return this.apollo
      .query({
        query: CalendarQueries.caseEventReasonTrees,
        variables: { includeInactive },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.caseEventReasonTrees));
  }

  createCaseEventReasonTree(tree: {
    context: CaseEventReasonContext;
    departmentId?: number | null;
    levelLabels?: string[];
  }): Observable<CaseEventReasonTree> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.createCaseEventReasonTree,
        variables: { tree },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createCaseEventReasonTree));
  }

  updateCaseEventReasonTree(tree: {
    id: number;
    context: CaseEventReasonContext;
    departmentId?: number | null;
    levelLabels?: string[];
  }): Observable<CaseEventReasonTree> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.updateCaseEventReasonTree,
        variables: { tree },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateCaseEventReasonTree));
  }

  deactivateCaseEventReasonTree(id: number): Observable<CaseEventReasonTree> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.deactivateCaseEventReasonTree,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deactivateCaseEventReasonTree));
  }

  createCaseEventReason(reason: {
    context: CaseEventReasonContext;
    label: string;
    nextLevelLabel?: string;
    parentId?: number | null;
    departmentId?: number | null;
    active?: boolean;
    isOther?: boolean;
    sortOrder?: number;
  }): Observable<CaseEventReason> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.createCaseEventReason,
        variables: { reason },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createCaseEventReason));
  }

  updateCaseEventReason(reason: {
    id: number;
    context?: CaseEventReasonContext;
    label?: string;
    nextLevelLabel?: string;
    parentId?: number | null;
    departmentId?: number | null;
    active?: boolean;
    isOther?: boolean;
    sortOrder?: number;
  }): Observable<CaseEventReason> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.updateCaseEventReason,
        variables: { reason },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateCaseEventReason));
  }

  deactivateCaseEventReason(id: number): Observable<CaseEventReason> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.deactivateCaseEventReason,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deactivateCaseEventReason));
  }

  deleteCaseEventReason(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.deleteCaseEventReason,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteCaseEventReason));
  }

  getClinicalSessionCancellationReasons(
    parentId?: number,
    sessionKind: ClinicalSessionKind = ClinicalSessionKind.CLINICAL
  ): Observable<ClinicalSessionCancellationReason[]> {
    const context = sessionKind === ClinicalSessionKind.SUPERVISION
      ? CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION
      : CaseEventReasonContext.SESSION_CANCELLATION;
    return this.getCaseEventReasons(context, parentId)
      .pipe(map((reasons) => reasons as ClinicalSessionCancellationReason[]));
  }

  createClinicalSessionCancellationReason(reason: {
    label: string;
    parentId?: number;
    active?: boolean;
    sortOrder?: number;
  }): Observable<ClinicalSessionCancellationReason> {
    return this.createCaseEventReason({
      ...reason,
      context: CaseEventReasonContext.SESSION_CANCELLATION,
    }).pipe(map((result) => result as ClinicalSessionCancellationReason));
  }

  updateClinicalSessionCancellationReason(reason: {
    id: number;
    label?: string;
    parentId?: number;
    active?: boolean;
    sortOrder?: number;
  }): Observable<ClinicalSessionCancellationReason> {
    return this.updateCaseEventReason({
      ...reason,
      context: CaseEventReasonContext.SESSION_CANCELLATION,
    }).pipe(map((result) => result as ClinicalSessionCancellationReason));
  }

  deactivateClinicalSessionCancellationReason(id: number): Observable<ClinicalSessionCancellationReason> {
    return this.deactivateCaseEventReason(id).pipe(map((result) => result as ClinicalSessionCancellationReason));
  }

  updateClinicalSession(session: {
    clinicalSessionId: number;
    sessionNumber?: number;
    startAt?: Date;
    endAt?: Date;
    clinicalHistory?: string;
    responsibleUserIds?: number[];
    modality?: string;
  }): Observable<ClinicalSession> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.updateClinicalSession,
        variables: {
          session: this.serializeClinicalSessionUpdate(session),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateClinicalSession));
  }

  updateClinicalSessionResource(resource: {
    resourceId: number;
    resourceKind?: string;
    status?: string;
    activationAnchor?: string;
    activationOffsetMinutes?: number;
    availabilityDurationMinutes?: number;
    reminderMinutes?: number[];
    activationAt?: Date;
    expirationAt?: Date;
  }): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.updateClinicalSessionResource,
        variables: {
          resource: this.serializeClinicalSessionResourceUpdate(resource),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateClinicalSessionResource));
  }

  addClinicalSessionSchemes(input: {
    clinicalSessionId: number;
    schemeIds: number[];
    propagateFuture?: boolean;
    applicationMode?: AddClinicalSessionSchemesApplicationMode;
    overwriteExisting?: boolean;
  }): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.addClinicalSessionSchemes,
        variables: { schemes: input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.addClinicalSessionSchemes));
  }

  getClinicalSessionSchemeApplications(clinicalSessionId: number): Observable<ClinicalSessionSchemeApplication[]> {
    return this.apollo
      .query({
        query: CalendarQueries.clinicalSessionSchemeApplications,
        variables: { clinicalSessionId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.clinicalSessionSchemeApplications));
  }

  getClinicalSessionFollowUpVersions(clinicalSessionId: number): Observable<ClinicalSessionFollowUpVersion[]> {
    return this.apollo
      .query({
        query: CalendarQueries.clinicalSessionFollowUpVersions,
        variables: { clinicalSessionId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.clinicalSessionFollowUpVersions));
  }

  getClinicalSessionFollowUpSettings(): Observable<ClinicalSessionFollowUpSettings> {
    return this.apollo
      .query({
        query: CalendarQueries.clinicalSessionFollowUpSettings,
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.clinicalSessionFollowUpSettings));
  }

  getCaseHistoryEntries(filter: {
    patientId?: number;
    therapistId?: number;
    cycleKind?: string;
    from?: Date;
    to?: Date;
    sortDirection?: 'ASC' | 'DESC';
  }): Observable<CaseHistoryEntry[]> {
    const input: any = { ...filter };
    if (filter.from) input.from = filter.from.toISOString();
    if (filter.to) input.to = filter.to.toISOString();
    return this.apollo
      .query({
        query: CalendarQueries.caseHistoryEntries,
        variables: { filter: input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.caseHistoryEntries));
  }

  getActiveTreatmentCycle(filter: {
    patientId?: number;
    therapistId?: number;
    cycleKind?: string;
  }): Observable<TreatmentCycle> {
    return this.apollo
      .query({
        query: CalendarQueries.activeTreatmentCycle,
        variables: { filter },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.activeTreatmentCycle));
  }

  getTreatmentCycles(filter: {
    patientId?: number;
    therapistId?: number;
    cycleKind?: string;
    activeOnly?: boolean;
  }): Observable<TreatmentCycle[]> {
    return this.apollo
      .query({
        query: CalendarQueries.treatmentCycles,
        variables: { filter },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.treatmentCycles || []));
  }

  finalizeTreatmentCycle(input: {
    treatmentCycleId?: number;
    cycleKind?: string;
    patientId?: number;
    therapistId?: number;
    finalizedAt?: Date;
    finalizationReasonId?: number;
    finalizationOtherReason?: string;
    finalizationNote?: string;
    lastSessionNumber?: number;
    excludedAutomationIds?: number[];
  }): Observable<TreatmentCycle> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.finalizeTreatmentCycle,
        variables: { input: this.serializeCycleInput(input) },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.finalizeTreatmentCycle));
  }

  cancelTreatmentCycleFinalization(treatmentCycleId: number, note?: string): Observable<TreatmentCycle> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.cancelTreatmentCycleFinalization,
        variables: { input: { treatmentCycleId, note } },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.cancelTreatmentCycleFinalization));
  }

  startNewTreatmentCycle(input: {
    previousTreatmentCycleId?: number;
    cycleKind?: string;
    patientId?: number;
    therapistId?: number;
    startedAt?: Date;
    newTreatmentReasonId?: number;
    newTreatmentOtherReason?: string;
    newTreatmentNote?: string;
    excludedAutomationIds?: number[];
  }): Observable<TreatmentCycle> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.startNewTreatmentCycle,
        variables: { input: this.serializeCycleInput(input) },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.startNewTreatmentCycle));
  }

  createCaseHistoryNote(input: {
    cycleKind: string;
    patientId?: number;
    therapistId?: number;
    treatmentCycleId?: number;
    occurredAt?: Date;
    title: string;
    content?: string;
  }): Observable<CaseHistoryEntry> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.createCaseHistoryNote,
        variables: { input: this.serializeCycleInput(input) },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createCaseHistoryNote));
  }

  getQuestionnaireAssessment(questionnaireAssessmentId: string): Observable<any> {
    return this.apollo
      .query({
        query: CalendarQueries.questionnaireAssessment,
        variables: { id: questionnaireAssessmentId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.getAssessment));
  }

  updateClinicalSessionFollowUpSettings(editWindowDays: number): Observable<ClinicalSessionFollowUpSettings> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.updateClinicalSessionFollowUpSettings,
        variables: { settings: { editWindowDays } },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateClinicalSessionFollowUpSettings));
  }

  stopClinicalSessionScheme(clinicalSessionId: number, schemeId: number): Observable<ClinicalSessionSchemeApplication> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.stopClinicalSessionScheme,
        variables: { scheme: { clinicalSessionId, schemeId } },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.stopClinicalSessionScheme));
  }

  discardClinicalSessionAssessment(assessmentId: number): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.discardClinicalSessionAssessment,
        variables: { assessment: { assessmentId } },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.discardClinicalSessionAssessment));
  }

  private serializeClinicalSessionUpdate(session: {
    clinicalSessionId: number;
    sessionNumber?: number;
    startAt?: Date;
    endAt?: Date;
    clinicalHistory?: string;
    responsibleUserIds?: number[];
    modality?: string;
  }): any {
    const input: any = {
      clinicalSessionId: session.clinicalSessionId,
      sessionNumber: session.sessionNumber,
      clinicalHistory: session.clinicalHistory,
      responsibleUserIds: session.responsibleUserIds,
      modality: session.modality,
    };
    if (session.startAt) input.startAt = session.startAt.toISOString();
    if (session.endAt) input.endAt = session.endAt.toISOString();
    return input;
  }

  private serializeCycleInput(input: any): any {
    const value = { ...input };
    ['finalizedAt', 'startedAt', 'occurredAt'].forEach((key) => {
      if (value[key] instanceof Date) value[key] = value[key].toISOString();
    });
    return value;
  }

  restructureClinicalSessions(input: RestructureClinicalSessionsInput): Observable<ClinicalSession[]> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.restructureClinicalSessions,
        variables: {
          restructure: {
            ...input,
            startAt: input.startAt.toISOString(),
            endAt: input.endAt.toISOString(),
            endDate: input.endDate?.toISOString(),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.restructureClinicalSessions));
  }

  private serializeClinicalSessionResourceUpdate(resource: {
    resourceId: number;
    resourceKind?: string;
    status?: string;
    activationAnchor?: string;
    activationOffsetMinutes?: number;
    availabilityDurationMinutes?: number;
    reminderMinutes?: number[];
    activationAt?: Date;
    expirationAt?: Date;
  }): any {
    const input: any = {
      resourceId: resource.resourceId,
      resourceKind: resource.resourceKind,
      status: resource.status,
      activationAnchor: resource.activationAnchor,
      activationOffsetMinutes: resource.activationOffsetMinutes,
      availabilityDurationMinutes: resource.availabilityDurationMinutes,
      reminderMinutes: resource.reminderMinutes,
    };
    if (resource.activationAt) input.activationAt = resource.activationAt.toISOString();
    if (resource.expirationAt) input.expirationAt = resource.expirationAt.toISOString();
    return input;
  }

  cancelClinicalSession(
    clinicalSessionId: number,
    renumberFutureSessions = false,
    cancellationReason?: string,
    cancellationType: ClinicalSessionCancellationType = ClinicalSessionCancellationType.RESCHEDULED,
    cancellationReasonId?: number,
    cancellationOtherReason?: string,
    cancellationComment?: string,
    excludedAutomationIds?: number[]
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.cancelClinicalSession,
        variables: {
          session: {
            clinicalSessionId,
            renumberFutureSessions,
            cancellationReason,
            cancellationType,
            cancellationReasonId,
            cancellationOtherReason,
            cancellationComment,
            excludedAutomationIds,
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.cancelClinicalSession));
  }

  deleteAssessmentEvent(assessmentId: number, statusCancel = true): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: AssessmentsMutations.deleteAssessment,
        variables: { id: assessmentId, statusCancel },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result?.data?.deleteAssessment));
  }

  moveCalendarEvent(event: CalendarEvent, startAt: Date, endAt: Date): Observable<any> {
    if (event.clinicalSessionId) {
      return this.moveClinicalSession(event.clinicalSessionId, startAt, endAt);
    }
    if (event.occurrenceId) {
      return this.moveOccurrence(event.occurrenceId, startAt, endAt);
    }
    throw new Error('Calendar event cannot be moved without a clinicalSessionId or occurrenceId');
  }

  discardCalendarEvent(
    event: CalendarEvent,
    options: {
      renumberFutureSessions?: boolean;
      cancellationReason?: string;
      cancellationType?: ClinicalSessionCancellationType;
      cancellationReasonId?: number;
      cancellationOtherReason?: string;
      cancellationComment?: string;
      excludedAutomationIds?: number[];
      statusCancel?: boolean;
    } = {}
  ): Observable<any> {
    if (event.type === CalendarEventType.SESSION && event.clinicalSessionId) {
      return this.cancelClinicalSession(
        event.clinicalSessionId,
        options.renumberFutureSessions || false,
        options.cancellationReason,
        options.cancellationType || ClinicalSessionCancellationType.RESCHEDULED,
        options.cancellationReasonId,
        options.cancellationOtherReason,
        options.cancellationComment,
        options.excludedAutomationIds
      );
    }
    if (event.type === CalendarEventType.ASSESSMENT && event.assessmentId && event.deletable) {
      if (event.assessmentOrigin === AssessmentOrigin.SESSION_BASED) {
        return this.discardClinicalSessionAssessment(event.assessmentId);
      }
      return this.deleteAssessmentEvent(event.assessmentId, options.statusCancel !== false);
    }
    throw new Error('Calendar event cannot be discarded');
  }

  createClinicalSession(session: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.createClinicalSession,
        variables: {
          session: {
            ...session,
            startAt: session.startAt.toISOString(),
            endAt: session.endAt.toISOString(),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createClinicalSession));
  }

  createAssessmentOccurrence(assessment: any): Observable<CalendarOccurrence> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.createAssessmentOccurrence,
        variables: {
          assessment: {
            ...assessment,
            dates: (assessment.dates || []).map((date: any) => ({
              ...date,
              deliveryDate: date.deliveryDate?.toISOString?.() || date.deliveryDate,
              expirationDate: date.expirationDate?.toISOString?.() || date.expirationDate,
            })),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createAssessmentOccurrence));
  }

  getGoogleCalendarAuthorizationUrl(): Observable<string> {
    return this.apollo
      .query({
        query: CalendarQueries.googleCalendarAuthorizationUrl,
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.googleCalendarAuthorizationUrl));
  }

  getGoogleCalendarIntegrationStatus(): Observable<{ configured: boolean }> {
    return this.apollo
      .query({
        query: CalendarQueries.googleCalendarIntegrationStatus,
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.googleCalendarIntegrationStatus));
  }

  connectGoogleCalendar(code: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.connectGoogleCalendar,
        variables: { code },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.connectGoogleCalendar));
  }

  pullGoogleCalendarDateChange(externalEventId: string): Observable<CalendarOccurrence> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.pullGoogleCalendarDateChange,
        variables: { externalEventId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.pullGoogleCalendarDateChange));
  }
}
