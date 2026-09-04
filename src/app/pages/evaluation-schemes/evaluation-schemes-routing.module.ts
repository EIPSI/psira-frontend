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
            only: [PermissionKey.EVALUATION_SCHEMES_VIEW_ALL, PermissionKey.EVALUATION_SCHEMES_VIEW_DEPARTMENT],
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
            only: [PermissionKey.EVALUATION_SCHEMES_CREATE_ALL, PermissionKey.EVALUATION_SCHEMES_CREATE_DEPARTMENT],
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
            only: [PermissionKey.EVALUATION_SCHEMES_EDIT_ALL, PermissionKey.EVALUATION_SCHEMES_EDIT_DEPARTMENT],
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
