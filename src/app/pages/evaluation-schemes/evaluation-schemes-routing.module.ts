import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { SchemeEditorComponent } from './scheme-editor/scheme-editor.component';
import { SchemesListComponent } from './schemes-list/schemes-list.component';

const routes: Routes = [
  {
    path: '',
    component: SchemesListComponent,
    data: {
      breadcrumbI18nKey: 'menu.evaluationSchemes',
      permissions: {
        only: [PermissionKey.VIEW_ASSESSMENTS],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'new',
    component: SchemeEditorComponent,
    data: {
      breadcrumbI18nKey: 'evaluationSchemes.create',
      permissions: {
        only: [PermissionKey.MANAGE_ASSESSMENTS],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: ':id',
    component: SchemeEditorComponent,
    data: {
      breadcrumbI18nKey: 'evaluationSchemes.edit',
      permissions: {
        only: [PermissionKey.MANAGE_ASSESSMENTS],
      },
    },
    canActivate: [PermissionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EvaluationSchemesRoutingModule {}
