import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { FetchResult } from 'apollo-link';
import { UsersMutations } from '../../../@graphql/mutations/users';
import { UsersQueries } from '../../../@graphql/queries/users';
import { CreateOneUserInput, UpdateOneUserInput, User } from '../@types/user';
import { UserChangePasswordInput, UserUpdatePasswordInput } from '../user-form/user-update-password.type';
import { Paging } from '@shared/@types/paging';
import { DeleteOneInput } from '../../../@shared/@types/delete-one-input';
import { Sorting } from '../../../@shared/@types/sorting';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private apollo: Apollo) {}

  getUsers(options?: { filter?: any; paging?: Paging; sorting?: Sorting[] }): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: UsersQueries.getUsers,
      variables: {
        paging: options && options.paging ? options.paging : undefined,
        filter: options && options.filter ? options.filter : undefined,
        sorting: options && options.sorting ? options.sorting : undefined,
      },
      fetchPolicy: 'no-cache',
    });
  }

  getTherapists(filter?: any): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: UsersQueries.therapists,
      variables: filter,
      fetchPolicy: 'no-cache',
    });
  }

  getSupervisors(filter?: any): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: UsersQueries.supervisors,
      variables: filter,
      fetchPolicy: 'no-cache',
    });
  }

  getSupervisorVisiblePatients(filter: { therapistId: number; supervisorId: number }): Observable<FetchResult<any>> {
    return this.apollo.query({
      query: UsersQueries.supervisorVisiblePatients,
      variables: filter,
      fetchPolicy: 'no-cache',
    });
  }

  createUser(createOneUserInput: CreateOneUserInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.createOneUser,
      variables: { createOneUserInput },
      fetchPolicy: 'no-cache',
    });
  }

  updateUser(updateOneUserInput: UpdateOneUserInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.updateOneUser,
      variables: { updateOneUserInput },
      fetchPolicy: 'no-cache',
    });
  }

  updateUserAcceptedTerm(updateOneUserInput: UpdateOneUserInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.userAcceptedTerm,
      variables: { updateOneUserInput },
      fetchPolicy: 'no-cache',
    });
  }

  changeUserPassword(inputs: UserChangePasswordInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.changeUserPassword,
      variables: inputs,
      fetchPolicy: 'no-cache',
    });
  }

  updateUserPassword(inputs: UserUpdatePasswordInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.updateUserPassword,
      variables: inputs,
      fetchPolicy: 'no-cache',
    });
  }

  deleteOneUser(input: DeleteOneInput): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.deleteOneUser,
      variables: { input },
      fetchPolicy: 'no-cache',
    });
  }

  softDeleteUser(user: User): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.softDeleteUser,
      variables: { id: user.id },
      fetchPolicy: 'no-cache',
    });
  }

  assignTherapistSupervisor(relationship: { therapistId: number; supervisorId: number }): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.assignTherapistSupervisor,
      variables: relationship,
      fetchPolicy: 'no-cache',
    });
  }

  unassignTherapistSupervisor(relationship: { therapistId: number; supervisorId: number }): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.unassignTherapistSupervisor,
      variables: relationship,
      fetchPolicy: 'no-cache',
    });
  }

  assignSupervisorPatientVisibility(relationship: {
    therapistId: number;
    supervisorId: number;
    patientId: number;
  }): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.assignSupervisorPatientVisibility,
      variables: relationship,
      fetchPolicy: 'no-cache',
    });
  }

  unassignSupervisorPatientVisibility(relationship: {
    therapistId: number;
    supervisorId: number;
    patientId: number;
  }): Observable<FetchResult<any>> {
    return this.apollo.mutate({
      mutation: UsersMutations.unassignSupervisorPatientVisibility,
      variables: relationship,
      fetchPolicy: 'no-cache',
    });
  }
}
