import { NgModule } from '@angular/core';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarWidgetModule } from './calendar-widget.module';
import { GoogleCalendarCallbackComponent } from './google-calendar-callback.component';

@NgModule({
  declarations: [GoogleCalendarCallbackComponent],
  imports: [CalendarRoutingModule, CalendarWidgetModule, NzSpinModule],
})
export class CalendarModule {}
