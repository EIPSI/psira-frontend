import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TranslateModule } from '@ngx-translate/core';
import { ReportViewComponent } from './report-view/report-view.component';
import { ReportsRoutingModule } from './reports-routing.module';

@NgModule({
  declarations: [ReportViewComponent],
  imports: [CommonModule, ReportsRoutingModule, TranslateModule, NzButtonModule, NzIconModule, NzSpinModule],
})
export class ReportsModule {}
