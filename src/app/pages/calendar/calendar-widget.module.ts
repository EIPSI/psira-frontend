import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared';
import { TranslateModule } from '@ngx-translate/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AppliedAutomationsListComponent } from './applied-automations-list/applied-automations-list.component';
import { CalendarGridComponent } from './calendar-grid/calendar-grid.component';
import { CalendarComponent } from './calendar.component';
import { ClinicalFollowUpListComponent } from './clinical-follow-up-list/clinical-follow-up-list.component';
import { CyclesListComponent } from './cycles-list/cycles-list.component';
import { EventEditModalComponent } from './event-edit-modal/event-edit-modal.component';
import { RecurrenceFormComponent } from './recurrence-form/recurrence-form.component';
import { SessionsListComponent } from './sessions-list/sessions-list.component';
import { UserCalendarComponent } from './user-calendar/user-calendar.component';

@NgModule({
  declarations: [
    CalendarComponent,
    CalendarGridComponent,
    AppliedAutomationsListComponent,
    ClinicalFollowUpListComponent,
    CyclesListComponent,
    EventEditModalComponent,
    RecurrenceFormComponent,
    SessionsListComponent,
    UserCalendarComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    TranslateModule.forChild(),
    NzButtonModule,
    NzCalendarModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzEmptyModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzMenuModule,
    NzModalModule,
    NzSelectModule,
    NzSpinModule,
    NzTagModule,
    NzTableModule,
  ],
  exports: [
    CalendarComponent,
    CalendarGridComponent,
    AppliedAutomationsListComponent,
    ClinicalFollowUpListComponent,
    CyclesListComponent,
    EventEditModalComponent,
    RecurrenceFormComponent,
    SessionsListComponent,
    UserCalendarComponent,
  ],
})
export class CalendarWidgetModule {}
