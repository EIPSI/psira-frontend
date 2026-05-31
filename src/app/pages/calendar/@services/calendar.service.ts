import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalendarMutations } from '@app/@graphql/mutations/calendar';
import { CalendarQueries } from '@app/@graphql/queries/calendar';
import { AssessmentsMutations } from '@app/@graphql/mutations/assessments';
import {
  CalendarEvent,
  CalendarEventFilter,
  CalendarOccurrence,
  CalendarOccurrenceFilter,
  ClinicalSession,
  ClinicalSessionListFilter,
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

  updateClinicalSession(session: {
    clinicalSessionId: number;
    startAt?: Date;
    endAt?: Date;
    clinicalHistory?: string;
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

  private serializeClinicalSessionUpdate(session: {
    clinicalSessionId: number;
    startAt?: Date;
    endAt?: Date;
    clinicalHistory?: string;
  }): any {
    const input: any = {
      clinicalSessionId: session.clinicalSessionId,
      clinicalHistory: session.clinicalHistory,
    };
    if (session.startAt) input.startAt = session.startAt.toISOString();
    if (session.endAt) input.endAt = session.endAt.toISOString();
    return input;
  }

  cancelClinicalSession(
    clinicalSessionId: number,
    renumberFutureSessions = false,
    cancellationReason?: string
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CalendarMutations.cancelClinicalSession,
        variables: {
          session: {
            clinicalSessionId,
            renumberFutureSessions,
            cancellationReason,
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
    options: { renumberFutureSessions?: boolean; cancellationReason?: string; statusCancel?: boolean } = {}
  ): Observable<any> {
    if (event.clinicalSessionId) {
      return this.cancelClinicalSession(
        event.clinicalSessionId,
        options.renumberFutureSessions || false,
        options.cancellationReason
      );
    }
    if (event.assessmentId && event.editable) {
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
