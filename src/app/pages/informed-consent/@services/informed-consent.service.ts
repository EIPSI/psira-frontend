import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InformedConsentGraphql } from '../@graphql/informed-consent';
import {
  InformedConsentManagement,
  InformedConsentModel,
  InformedConsentResponse,
  InformedConsentShortcut,
  PendingInformedConsent,
} from '../@types/informed-consent';

@Injectable({ providedIn: 'root' })
export class InformedConsentService {
  constructor(private apollo: Apollo) {}

  getModels(): Observable<InformedConsentModel[]> {
    return this.apollo.query({ query: InformedConsentGraphql.models, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentModels));
  }

  getModel(id: number): Observable<InformedConsentModel> {
    return this.apollo.query({ query: InformedConsentGraphql.model, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentModel));
  }

  getPendingModel(id: number): Observable<InformedConsentModel> {
    return this.apollo.query({ query: InformedConsentGraphql.pendingModel, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.pendingInformedConsentModel));
  }

  getPublicPendingModel(token: string, id: number): Observable<InformedConsentModel> {
    return this.apollo.query({ query: InformedConsentGraphql.publicPendingModel, variables: { token, id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.publicPendingInformedConsentModel));
  }

  getShortcuts(): Observable<InformedConsentShortcut[]> {
    return this.apollo.query({ query: InformedConsentGraphql.shortcuts, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentShortcuts));
  }

  createModel(input: any): Observable<InformedConsentModel> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.createModel, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.createInformedConsentModel));
  }

  updateModel(input: any): Observable<InformedConsentModel> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.updateModel, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.updateInformedConsentModel));
  }

  deleteModel(id: number): Observable<boolean> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.deleteModel, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.deleteInformedConsentModel));
  }

  duplicateModel(id: number): Observable<InformedConsentModel> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.duplicateModel, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.duplicateInformedConsentModel));
  }

  getManagements(): Observable<InformedConsentManagement[]> {
    return this.apollo.query({ query: InformedConsentGraphql.managements, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentManagements));
  }

  getManagement(id: number): Observable<InformedConsentManagement> {
    return this.apollo.query({ query: InformedConsentGraphql.management, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentManagement));
  }

  createManagement(input: any): Observable<InformedConsentManagement> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.createManagement, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.createInformedConsentManagement));
  }

  updateManagement(input: any): Observable<InformedConsentManagement> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.updateManagement, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.updateInformedConsentManagement));
  }

  duplicateManagement(id: number): Observable<InformedConsentManagement> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.duplicateManagement, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.duplicateInformedConsentManagement));
  }

  deleteManagement(id: number): Observable<boolean> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.deleteManagement, variables: { id }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.deleteInformedConsentManagement));
  }

  getResponses(): Observable<InformedConsentResponse[]> {
    return this.apollo.query({ query: InformedConsentGraphql.responses, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.informedConsentResponses));
  }

  getMyResponses(): Observable<InformedConsentResponse[]> {
    return this.apollo.query({ query: InformedConsentGraphql.myResponses, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.myInformedConsentResponses));
  }

  getPending(): Observable<PendingInformedConsent[]> {
    return this.apollo.query({ query: InformedConsentGraphql.pending, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.pendingInformedConsents));
  }

  getPublicPending(token: string): Observable<PendingInformedConsent[]> {
    return this.apollo.query({ query: InformedConsentGraphql.publicPending, variables: { token }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.publicPendingInformedConsents));
  }

  submitResponse(input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.submitResponse, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.submitInformedConsentResponse));
  }

  submitPublicResponse(token: string, input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.submitPublicResponse, variables: { token, input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.submitPublicInformedConsentResponse));
  }

  reactivateResponse(input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.reactivateResponse, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.reactivateInformedConsentResponse));
  }

  reactivateMyResponse(input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.reactivateMyResponse, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.reactivateMyInformedConsentResponse));
  }

  cancelMyReactivation(input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.cancelMyReactivation, variables: { input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.cancelMyInformedConsentReactivation));
  }

  cancelPublicReactivation(token: string, input: any): Observable<InformedConsentResponse> {
    return this.apollo.mutate({ mutation: InformedConsentGraphql.cancelPublicReactivation, variables: { token, input }, fetchPolicy: 'no-cache' })
      .pipe(map((result: any) => result.data.cancelPublicInformedConsentReactivation));
  }
}
