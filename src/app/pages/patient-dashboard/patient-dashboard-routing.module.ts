import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PatientDashboardComponent } from './patient-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: PatientDashboardComponent,
    data: {
      title: 'Patient Dashboard',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PatientDashboardRoutingModule {}
