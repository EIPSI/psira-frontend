import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { AutomationEditorComponent } from './automation-editor/automation-editor.component';
import { AutomationsListComponent } from './automations-list/automations-list.component';
import { EvaluationAutomationsRoutingModule } from './evaluation-automations-routing.module';

@NgModule({
  declarations: [AutomationsListComponent, AutomationEditorComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EvaluationAutomationsRoutingModule,
    MasterDataModule,
    NzAlertModule,
    NzButtonModule,
    NzCheckboxModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzMessageModule,
    NzModalModule,
    NzRadioModule,
    NzSelectModule,
    NzSwitchModule,
  ],
})
export class EvaluationAutomationsModule {}
