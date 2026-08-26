import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared';
import { FormsModule } from '@angular/forms';
import { AppFormModule } from '../../../@shared/components/form/app-form.module';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';
import { PatientStatusesComponent } from '../patient-statuses/patient-statuses.component';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { PatientStatusesService } from '../../patients-management/@services/patient-statuses.service';
import { SettingsRoutingModule } from './settings-routing.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FollowUpSettingsComponent } from './follow-up-settings/follow-up-settings.component';
import { SessionCancellationReasonsComponent } from './session-cancellation-reasons/session-cancellation-reasons.component';

const antModules = [
  NzAlertModule,
  NzButtonModule,
  NzCardModule,
  NzDrawerModule,
  NzFormModule,
  NzIconModule,
  NzInputModule,
  NzMessageModule,
  NzModalModule,
  NzSelectModule,
  NzSwitchModule,
  NzTableModule,
  NzTagModule,
];

@NgModule({
  imports: [
    ...antModules,
    FormsModule,
    CommonModule,
    AppFormModule,
    MasterDataModule,
    TranslateModule,
    SharedModule,
    DragDropModule,
    SettingsRoutingModule,
  ],
  declarations: [
    PatientStatusesComponent,
    SystemConfigurationComponent,
    FollowUpSettingsComponent,
    SessionCancellationReasonsComponent,
  ],
  providers: [PatientStatusesService],
})
export class SettingsModule {}
