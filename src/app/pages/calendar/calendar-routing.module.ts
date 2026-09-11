import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '@app/permission.guard';
import { CalendarComponent } from './calendar.component';
import { GoogleCalendarCallbackComponent } from './google-calendar-callback.component';

const routes: Routes = [
  {
    path: '',
    component: CalendarComponent,
    data: {
      breadcrumbI18nKey: 'menu.calendar',
      permissions: {
            only: [
              PermissionKey.CLINICAL_VIEW_ALL,
              PermissionKey.CLINICAL_VIEW_DEPARTMENT,
              PermissionKey.CLINICAL_VIEW_ASSIGNED,
            ],
      },
    },
    canActivate: [PermissionGuard],
  },
  {
    path: 'google-callback',
    component: GoogleCalendarCallbackComponent,
    data: {
      breadcrumbI18nKey: 'menu.calendar',
      permissions: {
            only: [
              PermissionKey.CLINICAL_VIEW_ALL,
              PermissionKey.CLINICAL_VIEW_DEPARTMENT,
              PermissionKey.CLINICAL_VIEW_ASSIGNED,
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
export class CalendarRoutingModule {}
