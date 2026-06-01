import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paging } from '@shared/@types/paging';
import { Sorting } from '@shared/@types/sorting';
import { RandomizationMutations } from '../@graphql/randomization-mutations';
import { RandomizationQueries } from '../@graphql/randomizations';
import { RandomizationRule } from '../@types/randomization';

@Injectable({
  providedIn: 'root',
})
export class RandomizationsService {
  constructor(private apollo: Apollo) {}

  getRandomizations(params?: {
    paging?: Paging;
    filter?: any;
    sorting?: Sorting[];
    departmentIds?: number[];
  }): Observable<{ edges: any[]; pageInfo: any }> {
    return this.apollo
      .query({
        query: RandomizationQueries.randomizationRules,
        variables: {
          paging: params?.paging,
          filter: params?.filter,
          sorting: params?.sorting,
          departmentIds: params?.departmentIds?.length ? params.departmentIds : undefined,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.randomizationRules));
  }

  getRandomization(id: number): Observable<RandomizationRule> {
    return this.apollo
      .query({
        query: RandomizationQueries.getRandomizationRule,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.getRandomizationRule));
  }

  createRandomization(rule: any): Observable<RandomizationRule> {
    return this.apollo
      .mutate({
        mutation: RandomizationMutations.createRandomizationRule,
        variables: { rule },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createRandomizationRule));
  }

  updateRandomization(rule: Partial<RandomizationRule>): Observable<RandomizationRule> {
    return this.apollo
      .mutate({
        mutation: RandomizationMutations.updateRandomizationRule,
        variables: { rule },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateRandomizationRule));
  }

  duplicateRandomization(id: number): Observable<RandomizationRule> {
    return this.apollo
      .mutate({
        mutation: RandomizationMutations.duplicateRandomizationRule,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.duplicateRandomizationRule));
  }

  setActive(id: number, active: boolean): Observable<RandomizationRule> {
    return this.apollo
      .mutate({
        mutation: RandomizationMutations.setRandomizationRuleActive,
        variables: { id, active },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.setRandomizationRuleActive));
  }

  deleteRandomization(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: RandomizationMutations.deleteRandomizationRule,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteRandomizationRule));
  }
}
