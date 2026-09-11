import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { TranslateModule } from '@ngx-translate/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { InformedConsentManagementEditorComponent } from './management-editor/management-editor.component';
import { InformedConsentManagementListComponent } from './management-list/management-list.component';
import { InformedConsentModelEditorComponent } from './model-editor/model-editor.component';
import { InformedConsentModelsListComponent } from './models-list/models-list.component';
import { PendingInformedConsentsComponent } from './pending-consents/pending-consents.component';
import { InformedConsentResponsesListComponent } from './responses-list/responses-list.component';

@NgModule({
  declarations: [
    InformedConsentModelsListComponent,
    InformedConsentModelEditorComponent,
    InformedConsentManagementListComponent,
    InformedConsentManagementEditorComponent,
    InformedConsentResponsesListComponent,
    PendingInformedConsentsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MasterDataModule,
    AngularEditorModule,
    TranslateModule,
    NzButtonModule,
    NzDrawerModule,
    NzDropDownModule,
    NzEmptyModule,
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
    NzTabsModule,
    NzTagModule,
  ],
  exports: [
    InformedConsentResponsesListComponent,
    PendingInformedConsentsComponent,
  ],
})
export class InformedConsentSharedModule {}
