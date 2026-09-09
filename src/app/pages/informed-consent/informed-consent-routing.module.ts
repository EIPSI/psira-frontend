import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { InformedConsentManagementEditorComponent } from './management-editor/management-editor.component';
import { InformedConsentManagementListComponent } from './management-list/management-list.component';
import { InformedConsentModelEditorComponent } from './model-editor/model-editor.component';
import { InformedConsentModelsListComponent } from './models-list/models-list.component';
import { PendingInformedConsentsComponent } from './pending-consents/pending-consents.component';
import { InformedConsentResponsesListComponent } from './responses-list/responses-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'models', pathMatch: 'full' },
  {
    path: 'pending',
    component: PendingInformedConsentsComponent,
    data: { breadcrumbI18nKey: 'informedConsent.pendingConsents' },
  },
  {
    path: 'models',
    component: InformedConsentModelsListComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'menu.informedConsentModels',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MODELS_VIEW_DEPARTMENT] },
    },
  },
  {
    path: 'models/new',
    component: InformedConsentModelEditorComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'informedConsent.newModel',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MODELS_EDIT_DEPARTMENT] },
    },
  },
  {
    path: 'models/:id',
    component: InformedConsentModelEditorComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'informedConsent.editModel',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MODELS_EDIT_DEPARTMENT] },
    },
  },
  {
    path: 'management',
    component: InformedConsentManagementListComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'menu.informedConsentManagement',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MANAGEMENT_VIEW_DEPARTMENT] },
    },
  },
  {
    path: 'management/new',
    component: InformedConsentManagementEditorComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'informedConsent.newManagement',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MANAGEMENT_EDIT_DEPARTMENT] },
    },
  },
  {
    path: 'management/:id',
    component: InformedConsentManagementEditorComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'informedConsent.editManagement',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_MANAGEMENT_EDIT_DEPARTMENT] },
    },
  },
  {
    path: 'responses',
    component: InformedConsentResponsesListComponent,
    canActivate: [PermissionGuard],
    data: {
      breadcrumbI18nKey: 'menu.informedConsentResponses',
      permissions: { only: [PermissionKey.INFORMED_CONSENT_RESPONSES_VIEW_DEPARTMENT] },
    },
  },
  {
    path: 'my-responses',
    component: InformedConsentResponsesListComponent,
    data: { breadcrumbI18nKey: 'informedConsent.mySignedConsents', ownOnly: true },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformedConsentRoutingModule {}
