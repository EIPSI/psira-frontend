import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CalendarService } from './@services/calendar.service';

@Component({
  selector: 'app-google-calendar-callback',
  template: '<nz-spin [nzSpinning]="true"></nz-spin>',
})
export class GoogleCalendarCallbackComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private calendarService: CalendarService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const code = this.activatedRoute.snapshot.queryParamMap.get('code');
    if (!code) {
      this.message.error('Google Calendar authorization failed');
      this.router.navigate(['/psira/calendar']);
      return;
    }

    this.calendarService.connectGoogleCalendar(code).subscribe(
      () => {
        this.message.success('Google Calendar connected');
        this.router.navigate(['/psira/calendar']);
      },
      () => {
        this.message.error('Unable to connect Google Calendar');
        this.router.navigate(['/psira/calendar']);
      }
    );
  }
}
