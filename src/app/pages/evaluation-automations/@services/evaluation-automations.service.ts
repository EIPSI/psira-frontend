import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paging } from '@shared/@types/paging';
import { Sorting } from '@shared/@types/sorting';
import { EvaluationAutomationMutations } from '../@graphql/evaluation-automation-mutations';
import { EvaluationAutomationQueries } from '../@graphql/evaluation-automations';
import { EvaluationAutomation } from '../@types/evaluation-automation';

@Injectable({
  providedIn: 'root',
})
export class EvaluationAutomationsService {
  constructor(private apollo: Apollo) {}

  getAutomations(params?: {
    paging?: Paging;
    filter?: any;
    sorting?: Sorting[];
  }): Observable<{ edges: any[]; pageInfo: any }> {
    return this.apollo
      .query({
        query: EvaluationAutomationQueries.evaluationAutomations,
        variables: {
          paging: params?.paging,
          filter: params?.filter,
          sorting: params?.sorting,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.evaluationAutomations));
  }

  getAutomation(id: number): Observable<EvaluationAutomation> {
    return this.apollo
      .query({
        query: EvaluationAutomationQueries.evaluationAutomation,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.evaluationAutomation));
  }

  getLookupDepartments(params?: {
    paging?: Paging;
    filter?: any;
    sorting?: Sorting[];
  }): Observable<{ edges: any[]; pageInfo: any }> {
    return this.apollo
      .query({
        query: EvaluationAutomationQueries.evaluationAutomationLookupDepartments,
        variables: {
          paging: params?.paging,
          filter: params?.filter,
          sorting: params?.sorting,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.departments));
  }

  getLookupRoles(params?: {
    paging?: Paging;
    filter?: any;
    sorting?: Sorting[];
  }): Observable<{ edges: any[]; pageInfo: any }> {
    return this.apollo
      .query({
        query: EvaluationAutomationQueries.evaluationAutomationLookupRoles,
        variables: {
          paging: params?.paging,
          filter: params?.filter,
          sorting: params?.sorting,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.roles));
  }

  previewAutomations(input: {
    roleIds?: number[];
    roleCodes?: string[];
    departmentIds?: number[];
    triggerPoint?: string;
  }): Observable<any[]> {
    return this.apollo
      .query({
        query: EvaluationAutomationQueries.evaluationAutomationPreview,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.evaluationAutomationPreview || []));
  }

  createAutomation(automation: Partial<EvaluationAutomation>): Observable<EvaluationAutomation> {
    return this.apollo
      .mutate({
        mutation: EvaluationAutomationMutations.createEvaluationAutomation,
        variables: { automation },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createEvaluationAutomation));
  }

  updateAutomation(automation: Partial<EvaluationAutomation>): Observable<EvaluationAutomation> {
    return this.apollo
      .mutate({
        mutation: EvaluationAutomationMutations.updateEvaluationAutomation,
        variables: { automation },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateEvaluationAutomation));
  }

  duplicateAutomation(id: number): Observable<EvaluationAutomation> {
    return this.apollo
      .mutate({
        mutation: EvaluationAutomationMutations.duplicateEvaluationAutomation,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.duplicateEvaluationAutomation));
  }

  setActive(id: number, active: boolean): Observable<EvaluationAutomation> {
    return this.apollo
      .mutate({
        mutation: EvaluationAutomationMutations.setEvaluationAutomationActive,
        variables: { id, active },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.setEvaluationAutomationActive));
  }

  deleteAutomation(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: EvaluationAutomationMutations.deleteEvaluationAutomation,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteEvaluationAutomation));
  }
}
