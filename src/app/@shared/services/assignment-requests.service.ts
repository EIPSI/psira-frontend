import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { FetchResult } from 'apollo-link';
import { AssignmentRequestsQueries } from '@app/@graphql/queries/assignment-requests';
import { AssignmentRequestsMutations } from '@app/@graphql/mutations/assignment-requests';

@Injectable({ providedIn: 'root' })
export class AssignmentRequestsService {
  constructor(private apollo: Apollo) {}

  pendingAssignmentRequests(): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: AssignmentRequestsQueries.pendingAssignmentRequests,
      fetchPolicy: 'no-cache',
    });
  }

  pendingPatientCaseManagerRequests(patientId: number): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: AssignmentRequestsQueries.pendingPatientCaseManagerRequests,
      variables: { patientId },
      fetchPolicy: 'no-cache',
    });
  }

  accept(id: number): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: AssignmentRequestsMutations.acceptAssignmentRequest,
      variables: { id },
      fetchPolicy: 'no-cache',
    });
  }

  reject(id: number): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: AssignmentRequestsMutations.rejectAssignmentRequest,
      variables: { id },
      fetchPolicy: 'no-cache',
    });
  }

  cancel(id: number): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: AssignmentRequestsMutations.cancelAssignmentRequest,
      variables: { id },
      fetchPolicy: 'no-cache',
    });
  }
}
