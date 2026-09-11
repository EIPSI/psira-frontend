import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationsGraphql } from '../@graphql/notifications';
import { NotificationConfiguration, NotificationPreference, NotificationTemplateShortcut } from '../@types/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private apollo: Apollo) {}

  getConfigurations(): Observable<NotificationConfiguration[]> {
    return this.apollo
      .query({
        query: NotificationsGraphql.notificationConfigurations,
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.notificationConfigurations));
  }

  getConfiguration(id: number): Observable<NotificationConfiguration> {
    return this.apollo
      .query({
        query: NotificationsGraphql.notificationConfiguration,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.notificationConfiguration));
  }

  createConfiguration(input: Partial<NotificationConfiguration>): Observable<NotificationConfiguration> {
    return this.apollo
      .mutate({
        mutation: NotificationsGraphql.createNotificationConfiguration,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.createNotificationConfiguration));
  }

  updateConfiguration(input: Partial<NotificationConfiguration>): Observable<NotificationConfiguration> {
    return this.apollo
      .mutate({
        mutation: NotificationsGraphql.updateNotificationConfiguration,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateNotificationConfiguration));
  }

  deleteConfiguration(id: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: NotificationsGraphql.deleteNotificationConfiguration,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.deleteNotificationConfiguration));
  }

  getTemplateShortcuts(): Observable<NotificationTemplateShortcut[]> {
    return this.apollo
      .query({
        query: NotificationsGraphql.notificationTemplateShortcuts,
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.notificationTemplateShortcuts));
  }

  getPreference(input: { patientId?: number; therapistId?: number }): Observable<NotificationPreference> {
    return this.apollo
      .query({
        query: NotificationsGraphql.notificationPreference,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.notificationPreference));
  }

  updatePreference(input: Partial<NotificationPreference>): Observable<NotificationPreference> {
    return this.apollo
      .mutate({
        mutation: NotificationsGraphql.updateNotificationPreference,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result: any) => result.data.updateNotificationPreference));
  }
}
