import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { TranslateModule } from '@ngx-translate/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CreateEmailTemplateComponent } from '../administration/create-email-template/create-email-template.component';
import { EmailTemplatesComponent } from '../administration/email-templates/email-templates.component';
import { NotificationConfigurationsComponent } from './notification-configurations/notification-configurations.component';
import { NotificationConfigurationEditorComponent } from './notification-configuration-editor/notification-configuration-editor.component';
import { NotificationPreferencesModule } from './notification-preferences/notification-preferences.module';
import { NotificationsRoutingModule } from './notifications-routing.module';

@NgModule({
  declarations: [
    NotificationConfigurationsComponent,
    NotificationConfigurationEditorComponent,
    EmailTemplatesComponent,
    CreateEmailTemplateComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MasterDataModule,
    AngularEditorModule,
    NotificationPreferencesModule,
    NotificationsRoutingModule,
    NzButtonModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzMessageModule,
    NzModalModule,
    NzRadioModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
  ],
})
export class NotificationsModule {}
