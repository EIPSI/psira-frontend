import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { CreateEmailTemplateComponent } from '../administration/create-email-template/create-email-template.component';
import { EmailTemplatesComponent } from '../administration/email-templates/email-templates.component';
import { NotificationConfigurationEditorComponent } from './notification-configuration-editor/notification-configuration-editor.component';
import { NotificationConfigurationsComponent } from './notification-configurations/notification-configurations.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'administration',
    pathMatch: 'full',
  },
  {
    path: 'administration',
    component: NotificationConfigurationsComponent,
    data: {
      breadcrumbI18nKey: 'Administración de Notificaciones',
      permissions: {
        only: [PermissionKey.VIEW_NOTIFICATIONS, PermissionKey.MANAGE_NOTIFICATIONS, PermissionKey.VIEW_TEMPLATES],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'administration/new',
    component: NotificationConfigurationEditorComponent,
    data: {
      breadcrumbI18nKey: 'Crear configuración',
      permissions: {
        only: [PermissionKey.MANAGE_NOTIFICATIONS],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'administration/:id',
    component: NotificationConfigurationEditorComponent,
    data: {
      breadcrumbI18nKey: 'Editar configuración',
      permissions: {
        only: [PermissionKey.MANAGE_NOTIFICATIONS],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'email-templates',
    component: EmailTemplatesComponent,
    data: {
      breadcrumbI18nKey: 'menu.emailTemplates',
      permissions: {
        only: [PermissionKey.VIEW_TEMPLATES],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'email-templates/new',
    component: CreateEmailTemplateComponent,
    data: {
      breadcrumbI18nKey: 'emailTemplates.createTemplate',
      permissions: {
        only: [PermissionKey.MANAGE_TEMPLATES],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'email-templates/:id',
    component: CreateEmailTemplateComponent,
    data: {
      breadcrumbI18nKey: 'emailTemplates.createTemplate',
      permissions: {
        only: [PermissionKey.MANAGE_TEMPLATES],
      },
    },
    canActivate: [PermissionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {}
