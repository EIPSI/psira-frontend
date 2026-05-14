import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { PatientStatusesComponent } from '../patient-statuses/patient-statuses.component';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '../../../permission.guard';
import { AutomaticEmailSettingsComponent } from './automatic-email-settings/automatic-email-settings.component';

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
            only: [PermissionKey.VIEW_SYSCONF],
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
            only: [PermissionKey.VIEW_SETTINGS],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'automatic-emails',
        component: AutomaticEmailSettingsComponent,
        data: {
          breadcrumbI18nKey: 'menu.automaticEmails',
          permissions: {
            only: [PermissionKey.VIEW_SYSCONF],
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
