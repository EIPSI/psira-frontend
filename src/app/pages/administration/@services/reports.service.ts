import { Injectable } from '@angular/core';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { Observable } from 'rxjs';
import { FetchResult } from 'apollo-link';
import { Apollo } from 'apollo-angular';
import { ReportsQueries } from '@app/@graphql/queries/reports';
import {
  Reports,
  UpdateOneReportInput,
  CreateOneReportInput,
} from '@app/pages/administration/@types/reports';
import { ReportsMutations } from '@app/@graphql/mutations/reports';
import { NestJsQueriesService } from '@shared/services/nestjs-queries.service';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private apollo: Apollo, private nestJsQueriesService: NestJsQueriesService) {}

  reports(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting[] }): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: ReportsQueries.reports,
      variables: {
        paging: params && params.paging ? params.paging : undefined,
        filter: params && params.filter ? params.filter : undefined,
        sorting: params && params.sorting ? params.sorting : undefined,
      },
      fetchPolicy: 'no-cache',
    });
  }

  availableShinyApps(): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: ReportsQueries.availableShinyApps,
      fetchPolicy: 'no-cache',
    });
  }

  getReportForCurrentUser(id: number): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: ReportsQueries.getReportForCurrentUser,
      variables: { id },
      fetchPolicy: 'no-cache',
    });
  }

  getReportEmbed(id: number, patientId?: number): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: ReportsQueries.getReportEmbed,
      variables: { id, patientId },
      fetchPolicy: 'no-cache',
    });
  }

  reportSessions(filters: {
    reportId?: number;
    userId?: number;
    patientId?: number;
    contextType?: string;
    active?: boolean;
    from?: string;
    to?: string;
  } = {}): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: ReportsQueries.reportSessions,
      variables: filters,
      fetchPolicy: 'no-cache',
    });
  }

  startReportSession(
    reportId: number,
    patientId?: number,
    contextType?: string,
    contextParams?: string
  ): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.startReportSession,
      variables: { reportId, patientId, contextType, contextParams },
      fetchPolicy: 'no-cache',
    });
  }

  heartbeatReportSession(sessionId: number): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.heartbeatReportSession,
      variables: { sessionId },
      fetchPolicy: 'no-cache',
    });
  }

  endReportSession(sessionId: number): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.endReportSession,
      variables: { sessionId },
      fetchPolicy: 'no-cache',
    });
  }

  createReport(createOneReportInput: CreateOneReportInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.createOneReport,
      variables: { input: createOneReportInput },
      fetchPolicy: 'no-cache',
    });
  }

  updateReport(updateOneReportInput: UpdateOneReportInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.updateOneReport,
      variables: { input: updateOneReportInput },
      fetchPolicy: 'no-cache',
    });
  }

  deleteReport(report: Reports): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: ReportsMutations.deleteOneReport,
      variables: {
        input: { id: report.id },
      },
      fetchPolicy: 'no-cache',
    });
  }
}
