import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ReportsComponent } from './reports/reports.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { MasterDataModule } from '@shared/@modules/master-data/master-data.module';

@NgModule({
  declarations: [DashboardComponent, ReportsComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    TranslateModule.forChild(),
    NzTabsModule,
    NzModalModule,
    MasterDataModule,
  ],
})
export class DashboardModule {}
