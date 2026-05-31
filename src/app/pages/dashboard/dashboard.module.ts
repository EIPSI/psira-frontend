import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ReportsComponent } from './reports/reports.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CalendarWidgetModule } from '../calendar/calendar-widget.module';

@NgModule({
  declarations: [DashboardComponent, ReportsComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    TranslateModule.forChild(),
    NzTabsModule,
    NzModalModule,
    MasterDataModule,
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
    NzTagModule,
    NzButtonModule,
    CalendarWidgetModule,
  ],
})
export class DashboardModule {}
