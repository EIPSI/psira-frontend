import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RolesAndPermissionsComponent } from './roles-and-permissions/roles-and-permissions.component';
import { RolesComponent } from './roles/roles.component';
import { DepartmentsComponent } from './departments/departments.component';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '../../permission.guard';
import { ReportsComponent } from './reports/reports.component';
import { CreateReportComponent } from './create-report/create-report.component';
import { DisclaimersComponent } from './disclaimers/disclaimers.component';
import { PatientStatusesComponent } from './patient-statuses/patient-statuses.component';
import { AssessmentAdministrationComponent } from './assessment-administration/assessment-administration.component';
import { VersionComponent } from './version/version.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'reports',
        component: ReportsComponent,
        data: {
          breadcrumbI18nKey: 'menu.reports',
          permissions: {
            only: [PermissionKey.REPORTS_VIEW_DEPARTMENT],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'create-report',
        component: CreateReportComponent,
        data: {
          breadcrumbI18nKey: 'menu.createReport',
          permissions: {
            only: [PermissionKey.REPORTS_VIEW_DEPARTMENT],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'permission-matrix',
        component: RolesAndPermissionsComponent,
        data: {
          breadcrumbI18nKey: 'menu.permissionMatrix',
          permissions: {
            only: [PermissionKey.ROLES_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'roles',
        component: RolesComponent,
        data: {
          breadcrumbI18nKey: 'menu.roles',
          permissions: {
            only: [PermissionKey.ROLES_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'disclaimers',
        component: DisclaimersComponent,
        data: {
          breadcrumbI18nKey: 'menu.disclaimers',
          permissions: {
            only: [PermissionKey.ROLES_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'assessments',
        component: AssessmentAdministrationComponent,
        data: {
          breadcrumbI18nKey: 'menu.assessments',
          permissions: {
            only: [PermissionKey.ROLES_VIEW_ALL],
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
        path: 'settings',
        data: {
          breadcrumbI18nKey: 'menu.settings',
        },
        loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: 'departments',
        component: DepartmentsComponent,
        data: {
          breadcrumbI18nKey: 'menu.departments',
          permissions: {
            only: [PermissionKey.SETTINGS_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'email-templates',
        redirectTo: '/psira/notifications/email-templates',
      },
      {
        path: 'create-template',
        redirectTo: '/psira/notifications/email-templates/new',
      },
      {
        path: 'create-template/:id',
        redirectTo: '/psira/notifications/email-templates/:id',
      },
      {
        path: 'version',
        component: VersionComponent,
        data: {
          breadcrumbI18nKey: 'menu.version',
          permissions: {
            only: [PermissionKey.SETTINGS_VIEW_ALL],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'roles',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
