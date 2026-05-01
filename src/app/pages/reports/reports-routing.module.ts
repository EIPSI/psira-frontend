import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportViewComponent } from './report-view/report-view.component';

const routes: Routes = [
  {
    path: ':id',
    component: ReportViewComponent,
    data: {
      breadcrumbI18nKey: 'menu.reports',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
