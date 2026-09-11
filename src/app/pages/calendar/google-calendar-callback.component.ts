import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CalendarService } from './@services/calendar.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-google-calendar-callback',
  template: '<nz-spin [nzSpinning]="true"></nz-spin>',
})
export class GoogleCalendarCallbackComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private calendarService: CalendarService,
    private message: NzMessageService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const code = this.activatedRoute.snapshot.queryParamMap.get('code');
    if (!code) {
      this.message.error(this.translate.instant('calendar.googleAuthorizationFailed'));
      this.router.navigate(['/psira/calendar']);
      return;
    }

    this.calendarService.connectGoogleCalendar(code).subscribe(
      () => {
        this.message.success(this.translate.instant('calendar.googleConnected'));
        this.router.navigate(['/psira/calendar']);
      },
      () => {
        this.message.error(this.translate.instant('calendar.unableConnectGoogle'));
        this.router.navigate(['/psira/calendar']);
      }
    );
  }
}
