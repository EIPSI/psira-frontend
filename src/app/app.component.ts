import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { merge, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { environment } from '@env/environment';
import { Logger } from '@core';
import { TranslationCode } from './@shared/@types/translation';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { I18nService } from './i18n/i18n.service';

const log = new Logger('App');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
@UntilDestroy()
export class AppComponent implements OnInit {
  readonly storageNoticeKey = 'psira_storage_notice_v1';
  readonly storageNoticeVersion = 1;
  readonly storageNoticeFeatures = ['browserStorage'];
  i18nReady$: Observable<boolean>;
  showStorageNotice = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private i18nService: I18nService
  ) {
    this.i18nReady$ = this.i18nService.ready$.asObservable();
  }

  ngOnInit() {
    // Setup logger
    if (environment.production) {
      Logger.enableProductionMode();
    }

    log.debug('init');

    // Setup translations
    this.i18nService.init(TranslationCode.EN, [
      TranslationCode.EN,
      TranslationCode.ES,
      TranslationCode.DE,
      TranslationCode.NL,
      ...(environment.supportedLanguages || []),
    ]);
    this.i18nService.loadActiveLanguages().subscribe((languages) => {
      if (!languages.length) return;
      this.i18nService.setSupportedLanguages(languages.map((language) => language.code));
      this.i18nService.language = '';
    });

    // Change page title on navigation or language change, based on route data
    merge(
      this.translateService.onLangChange,
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    )
      .pipe(
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        switchMap((route) => route.data),
        map((event) => event?.breadcrumbI18nKey),
        filter((key) => !!key),
        untilDestroyed(this)
      )
      .subscribe((key) => this.titleService.setTitle(this.translateService.instant(key) + ' | PSIRA'));

    this.showStorageNotice = this.readStorageNoticeValue() !== this.storageNoticeValue;
  }

  acknowledgeStorageNotice() {
    this.writeStorageNoticeValue();
    this.showStorageNotice = false;
  }

  private get storageNoticeValue() {
    return `acknowledged:${this.storageNoticeVersion}:${this.storageNoticeFeatures.join(',')}`;
  }

  private readStorageNoticeValue() {
    try {
      return localStorage.getItem(this.storageNoticeKey);
    } catch {
      return null;
    }
  }

  private writeStorageNoticeValue() {
    try {
      localStorage.setItem(this.storageNoticeKey, this.storageNoticeValue);
    } catch {
      return;
    }
  }
}
