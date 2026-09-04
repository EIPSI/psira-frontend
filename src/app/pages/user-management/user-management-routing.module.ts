import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { UserProfileTabsComponent } from './user-profile-tabs/user-profile-tabs.component';
import { PermissionKey } from '@app/@shared/@types/permission';
import { PermissionGuard } from '../../permission.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        component: UsersListComponent,
        data: {
          breadcrumbI18nKey: 'menu.userManagement',
          permissions: {
            only: [
              PermissionKey.USERS_VIEW_ALL,
              PermissionKey.USERS_VIEW_DEPARTMENT,
              PermissionKey.USERS_VIEW_DEPARTMENT_HIERARCHY,
            ],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'therapists',
        component: UsersListComponent,
        data: {
          breadcrumbI18nKey: 'menu.therapistsList',
          roleCode: 'THERAPIST',
          permissions: {
            only: [
              PermissionKey.THERAPISTS_VIEW_ALL,
              PermissionKey.THERAPISTS_VIEW_DEPARTMENT,
              PermissionKey.THERAPISTS_VIEW_ASSIGNED,
            ],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'supervisors',
        component: UsersListComponent,
        data: {
          breadcrumbI18nKey: 'menu.supervisorsList',
          roleCode: 'SUPERVISOR',
          permissions: {
            only: [PermissionKey.SUPERVISORS_VIEW_ALL, PermissionKey.SUPERVISORS_VIEW_DEPARTMENT],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'user-form',
        component: UserFormComponent,
        data: {
          breadcrumbI18nKey: 'menu.newUser',
          permissions: {
            only: [
              PermissionKey.USERS_CREATE_ALL,
              PermissionKey.USERS_CREATE_DEPARTMENT,
              PermissionKey.USERS_CREATE_DEPARTMENT_HIERARCHY,
            ],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'my-profile',
        component: UserFormComponent,
        data: {
          breadcrumbI18nKey: 'card.profile',
          ownProfile: true,
        },
      },
      {
        path: 'therapist-form',
        component: UserFormComponent,
        data: {
          breadcrumbI18nKey: 'menu.newTherapist',
          roleCode: 'THERAPIST',
          permissions: {
            only: [
              PermissionKey.THERAPISTS_CREATE_ALL,
              PermissionKey.THERAPISTS_CREATE_DEPARTMENT,
              PermissionKey.THERAPISTS_CREATE_ASSIGNED,
            ],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'supervisor-form',
        component: UserFormComponent,
        data: {
          breadcrumbI18nKey: 'menu.newSupervisor',
          roleCode: 'SUPERVISOR',
          permissions: {
            only: [PermissionKey.SUPERVISORS_CREATE_ALL, PermissionKey.SUPERVISORS_CREATE_DEPARTMENT],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: 'profile',
        component: UserProfileTabsComponent,
        data: {
          breadcrumbI18nKey: 'menu.userManagement',
          permissions: {
            only: [
              PermissionKey.USERS_VIEW_ALL,
              PermissionKey.USERS_VIEW_DEPARTMENT,
              PermissionKey.USERS_VIEW_DEPARTMENT_HIERARCHY,
            ],
          },
        },
        canActivate: [PermissionGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserManagementRoutingModule {}
