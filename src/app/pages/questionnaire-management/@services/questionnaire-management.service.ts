import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { QuestionnaireMutations } from '../../../@graphql/mutations/questionnaire';
import { QuestionnaireQueries } from '../../../@graphql/queries/questionnaire';
import { QuestionnaireVersion, CreateQuestionnaireInput, UpdateQuestionnaireInput } from '../@types/questionnaire';
import { map } from 'rxjs/operators';
import { Paging } from '../../../@shared/@types/paging';
import { Sorting } from '../../../@shared/@types/sorting';
import { ConnectionResult } from '../../../@shared/@types/connection-cursor';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireManagementService {
  constructor(private apollo: Apollo) {}

  public createQuestionnaire(xlsForm: CreateQuestionnaireInput): Observable<QuestionnaireVersion> {
    const { excelFile, ...questionnaireInput } = xlsForm;
    return this.apollo
      .mutate<{ createQuestionnaire: QuestionnaireVersion }>({
        mutation: QuestionnaireMutations.createQuestionnaire,
        variables: { xlsForm: questionnaireInput, excelFile },
        fetchPolicy: 'no-cache',
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((result) => result.data.createQuestionnaire));
  }

  public updateQuestionnaire(_id: string, xlsForm: UpdateQuestionnaireInput): Observable<QuestionnaireVersion> {
    const { excelFile, ...questionnaireInput } = xlsForm;
    return this.apollo
      .mutate<{ updateQuestionnaire: QuestionnaireVersion }>({
        mutation: QuestionnaireMutations.updateQuestionnaire,
        variables: { _id, xlsForm: questionnaireInput, excelFile: excelFile || undefined },
        fetchPolicy: 'no-cache',
        context: excelFile ? { useMultipart: true } : undefined,
      })
      .pipe(map((result) => result.data.updateQuestionnaire));
  }

  public getQuestionnaires(
    options: { paging?: Paging; filter?: any; sorting?: Sorting[]; departmentIds?: number[] }
  ): Observable<ConnectionResult<QuestionnaireVersion>> {
    return this.apollo
      .query<{ questionnaires: ConnectionResult<QuestionnaireVersion> }>({
        query: QuestionnaireQueries.getQuestionnaires,
        variables: {
          ...options,
          paging: options?.paging || { first: 20 },
          departmentIds: options?.departmentIds?.length ? options.departmentIds : undefined,
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(({ data }) => data.questionnaires));
  }

  public getQuestionnairesVersion(
    options: { paging?: Paging; filter?: any; sorting?: Sorting[] }
  ): Observable<ConnectionResult<QuestionnaireVersion>> {
    return this.apollo
      .query<{ getQuestionnaireVersions: ConnectionResult<QuestionnaireVersion> }>({
        query: QuestionnaireQueries.getQuestionnairesVersion,
        variables: { ...options },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(({ data }) => data.getQuestionnaireVersions));
  }

  public deleteQuestionnaire(_id: string) {
    return this.apollo.mutate({
      mutation: QuestionnaireMutations.deleteQuestionnaire,
      variables: { _id },
      fetchPolicy: 'no-cache',
    });
  }

  public getQuestionnairesBundles() {
    return EMPTY;
  }

  public getOneQuestionnaireBundle(id: number){
    return EMPTY;
  }

  public updateQuestionnaireBundle(){
    return EMPTY;
  }

  public deleteQuestionnaireBundle(){
    return EMPTY;
  }
}
