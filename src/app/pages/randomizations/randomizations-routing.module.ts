import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { RandomizationEditorComponent } from './randomization-editor/randomization-editor.component';
import { RandomizationsListComponent } from './randomizations-list/randomizations-list.component';

const routes: Routes = [
  {
    path: '',
    component: RandomizationsListComponent,
    data: {
      breadcrumbI18nKey: 'menu.randomizations',
      permissions: {
            only: [PermissionKey.RANDOMIZATIONS_VIEW_ALL, PermissionKey.RANDOMIZATIONS_VIEW_DEPARTMENT],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'new',
    component: RandomizationEditorComponent,
    data: {
      breadcrumbI18nKey: 'randomizations.create',
      permissions: {
            only: [PermissionKey.RANDOMIZATIONS_CREATE_ALL, PermissionKey.RANDOMIZATIONS_CREATE_DEPARTMENT],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: ':id',
    component: RandomizationEditorComponent,
    data: {
      breadcrumbI18nKey: 'randomizations.edit',
      permissions: {
            only: [PermissionKey.RANDOMIZATIONS_EDIT_ALL, PermissionKey.RANDOMIZATIONS_EDIT_DEPARTMENT],
      },
    },
    canActivate: [PermissionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RandomizationsRoutingModule {}
