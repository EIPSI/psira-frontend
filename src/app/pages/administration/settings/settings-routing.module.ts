import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { PatientStatusesComponent } from '../patient-statuses/patient-statuses.component';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '../../../permission.guard';
import { FollowUpSettingsComponent } from './follow-up-settings/follow-up-settings.component';
import { SessionCancellationReasonsComponent } from './session-cancellation-reasons/session-cancellation-reasons.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'system-configuration',
        component: SystemConfigurationComponent,
        data: {
          breadcrumbI18nKey: 'menu.systemConfiguration',
          permissions: {
            only: [PermissionKey.SYSTEM_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'patient-statuses',
        component: PatientStatusesComponent,
        data: {
          breadcrumbI18nKey: 'menu.patientStatuses',
          permissions: {
            only: [PermissionKey.SETTINGS_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'follow-up-settings',
        component: FollowUpSettingsComponent,
        data: {
          breadcrumbI18nKey: 'Ajustes clinicos',
          permissions: {
            only: [PermissionKey.SETTINGS_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'session-cancellation-reasons',
        component: SessionCancellationReasonsComponent,
        data: {
          breadcrumbI18nKey: 'Configuración Motivos',
          permissions: {
            only: [PermissionKey.SETTINGS_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'system-configuration',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
