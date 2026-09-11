import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { AutomationEditorComponent } from './automation-editor/automation-editor.component';
import { AutomationsListComponent } from './automations-list/automations-list.component';

const routes: Routes = [
  {
    path: '',
    component: AutomationsListComponent,
    data: {
      breadcrumbI18nKey: 'menu.evaluationAutomations',
      permissions: {
        only: [
          PermissionKey.AUTOMATIONS_VIEW_DEPARTMENT,
          PermissionKey.AUTOMATIONS_VIEW_ALL,
        ],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'new',
    component: AutomationEditorComponent,
    data: {
      breadcrumbI18nKey: 'evaluationAutomations.create',
      permissions: {
        only: [
          PermissionKey.AUTOMATIONS_EDIT_DEPARTMENT,
          PermissionKey.AUTOMATIONS_EDIT_ALL,
        ],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: ':id',
    component: AutomationEditorComponent,
    data: {
      breadcrumbI18nKey: 'evaluationAutomations.edit',
      permissions: {
        only: [
          PermissionKey.AUTOMATIONS_EDIT_DEPARTMENT,
          PermissionKey.AUTOMATIONS_EDIT_ALL,
        ],
      },
    },
    canActivate: [PermissionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EvaluationAutomationsRoutingModule {}
