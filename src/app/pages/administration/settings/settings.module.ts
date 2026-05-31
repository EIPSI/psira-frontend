import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared';
import { FormsModule } from '@angular/forms';
import { AppFormModule } from '../../../@shared/components/form/app-form.module';
import { PatientStatusesComponent } from '../patient-statuses/patient-statuses.component';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { PatientStatusesService } from '../../patients-management/@services/patient-statuses.service';
import { SettingsRoutingModule } from './settings-routing.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AutomaticEmailSettingsComponent } from './automatic-email-settings/automatic-email-settings.component';

const antModules = [NzAlertModule, NzButtonModule, NzCardModule, NzDrawerModule, NzInputModule, NzSwitchModule, NzTagModule];

@NgModule({
  imports: [
    ...antModules,
    FormsModule,
    CommonModule,
    AppFormModule,
    TranslateModule,
    SharedModule,
    SettingsRoutingModule,
  ],
  declarations: [PatientStatusesComponent, SystemConfigurationComponent, AutomaticEmailSettingsComponent],
  providers: [PatientStatusesService],
})
export class SettingsModule {}
