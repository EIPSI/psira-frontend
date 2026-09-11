import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EvaluationSchemesMutations } from '@app/@graphql/mutations/evaluation-schemes';
import { EvaluationSchemesQueries } from '@app/@graphql/queries/evaluation-schemes';
import { Paging } from '@shared/@types/paging';
import { Sorting } from '@shared/@types/sorting';
import { ApplyEvaluationSchemeInput, EvaluationScheme } from '../@types/evaluation-scheme';

@Injectable({
  providedIn: 'root',
})
export class EvaluationSchemesService {
  constructor(private apollo: Apollo) {}

  getSchemes(params?: {
    paging?: Paging;
    filter?: any;
    sorting?: Sorting[];
    departmentIds?: number[];
  }): Observable<{ edges: any[]; pageInfo: any }> {
    return this.apollo
      .query({
        query: EvaluationSchemesQueries.evaluationSchemes,
        variables: {
          paging: params?.paging,
          filter: params?.filter,
          sorting: params?.sorting,
          departmentIds: params?.departmentIds?.length ? params.departmentIds : undefined,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.evaluationSchemes));
  }

  createScheme(scheme: Partial<EvaluationScheme>): Observable<EvaluationScheme> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.createEvaluationScheme,
        variables: { scheme },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createEvaluationScheme));
  }

  updateScheme(scheme: Partial<EvaluationScheme>): Observable<EvaluationScheme> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.updateEvaluationScheme,
        variables: { scheme },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateEvaluationScheme));
  }

  deleteScheme(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.deleteEvaluationScheme,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteEvaluationScheme));
  }

  applyScheme(assignment: ApplyEvaluationSchemeInput): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.applyEvaluationScheme,
        variables: {
          assignment: {
            ...assignment,
            startDate: assignment.startDate.toISOString(),
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.applyEvaluationScheme));
  }

  regenerateFutureOccurrences(assignmentId: number, from?: Date): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.regenerateFutureSchemeOccurrences,
        variables: {
          generation: {
            assignmentId,
            from: from ? from.toISOString() : undefined,
          },
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.regenerateFutureSchemeOccurrences));
  }

  addSessionTemplate(sessionTemplate: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.addSchemeSessionTemplate,
        variables: { sessionTemplate },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.addSchemeSessionTemplate));
  }

  addResourceTemplate(resourceTemplate: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.addSchemeResourceTemplate,
        variables: { resourceTemplate },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.addSchemeResourceTemplate));
  }

  updateResourceTemplate(resourceTemplate: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.updateSchemeResourceTemplate,
        variables: { resourceTemplate },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateSchemeResourceTemplate));
  }

  deleteResourceTemplate(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.deleteSchemeResourceTemplate,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteSchemeResourceTemplate));
  }

  addIndependentEvaluationTemplate(evaluationTemplate: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.addIndependentEvaluationTemplate,
        variables: { evaluationTemplate },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.addIndependentEvaluationTemplate));
  }

  updateIndependentEvaluationTemplate(evaluationTemplate: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.updateIndependentEvaluationTemplate,
        variables: { evaluationTemplate },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateIndependentEvaluationTemplate));
  }

  deleteIndependentEvaluationTemplate(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.deleteIndependentEvaluationTemplate,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteIndependentEvaluationTemplate));
  }

  clearIndependentEvaluationTemplates(schemeId: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: EvaluationSchemesMutations.clearIndependentEvaluationTemplates,
        variables: { schemeId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.clearIndependentEvaluationTemplates));
  }
}
