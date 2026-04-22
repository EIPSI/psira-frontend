import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDashboardComponent } from './patient-dashboard.component';
import { PatientDashboardRoutingModule } from './patient-dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';

@NgModule({
  declarations: [PatientDashboardComponent],
  imports: [
    CommonModule,
    PatientDashboardRoutingModule,
    TranslateModule.forChild(),
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
    NzTagModule,
    NzButtonModule
  ]
})
export class PatientDashboardModule { }
