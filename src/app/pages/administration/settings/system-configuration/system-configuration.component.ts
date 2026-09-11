import { Component, OnInit } from '@angular/core';
import { Setting } from '../../@types/setting';
import { Form } from '../../../../@shared/components/form/@types/form';
import { settingsForms } from '../@forms/form';
import { SettingsService } from '../../@services/settings.service';
import { AppPermissionsService } from '../../../../@shared/services/app-permissions.service';
import { PermissionKey } from '../../../../@shared/@types/permission';

@Component({
  selector: 'app-system-configuration',
  templateUrl: './system-configuration.component.html',
  styleUrls: ['./system-configuration.component.scss'],
})
export class SystemConfigurationComponent implements OnInit {
  PK = PermissionKey;
  settingsForm: Form = settingsForms.general;
  isLoading = false;
  googleCalendarSaving = false;
  featureSaving = false;
  settings: Setting;
  featureSettings: Partial<Setting> = {
    notificationsEnabled: true,
    informedConsentEnabled: true,
  };
  googleCalendarSettings: Partial<Setting> = {
    googleCalendarEnabled: false,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarRedirectUri: '',
  };
  loadingMessage = '';

  constructor(private settingsService: SettingsService, public perms: AppPermissionsService) {}

  ngOnInit(): void {
    this.getFormat();
    this.getTimeFormarts();
    this.getDateTimeFormats();
    this.getLocales();
    this.getZones();
    this.getSettings();
  }

  getSettings() {
    this.isLoading = true;
    this.settingsService.settings().subscribe(
      async ({ data }) => {
        this.settings = Object.assign({}, data.settings);
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.featureSettings = {
          notificationsEnabled: this.settings.notificationsEnabled !== false,
          informedConsentEnabled: this.settings.informedConsentEnabled !== false,
        };
        this.googleCalendarSettings = {
          googleCalendarEnabled: !!this.settings.googleCalendarEnabled,
          googleCalendarClientId: this.settings.googleCalendarClientId || '',
          googleCalendarClientSecret: '',
          googleCalendarRedirectUri: this.settings.googleCalendarRedirectUri || '',
        };

        this.settingsForm.groups.map((group) => {
          group.fields.map((field) => {
            field.value = this.settings[field.name];
          });
        });
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
      }
    );
  }

  saveSettings($event: any) {
    this.isLoading = true;
    this.settingsService.updateSetting($event).subscribe(
      async ({ data }) => {
        if (data) {
          this.settings = { ...this.settings, ...$event };
          localStorage.setItem('settings', JSON.stringify(this.settings));
        }

        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
      }
    );
  }

  saveGoogleCalendarSettings(): void {
    this.googleCalendarSaving = true;
    const input: Partial<Setting> = {
      googleCalendarEnabled: !!this.googleCalendarSettings.googleCalendarEnabled,
      googleCalendarClientId: this.googleCalendarSettings.googleCalendarClientId || '',
      googleCalendarRedirectUri: this.googleCalendarSettings.googleCalendarRedirectUri || '',
    };

    if (this.googleCalendarSettings.googleCalendarClientSecret) {
      input.googleCalendarClientSecret = this.googleCalendarSettings.googleCalendarClientSecret;
    }

    this.settingsService.updateSetting(input as Setting).subscribe(
      () => {
        this.googleCalendarSaving = false;
        this.getSettings();
      },
      () => {
        this.googleCalendarSaving = false;
      }
    );
  }

  saveFeatureSettings(): void {
    this.featureSaving = true;
    this.settingsService
      .updateSetting({
        notificationsEnabled: this.featureSettings.notificationsEnabled !== false,
        informedConsentEnabled: this.featureSettings.informedConsentEnabled !== false,
      } as Setting)
      .subscribe(
        () => {
          this.featureSaving = false;
          this.getSettings();
        },
        () => {
          this.featureSaving = false;
        }
      );
  }

  private getLocales() {
    const moment = require('moment/min/moment-with-locales');
    const locales = moment.locales();
    this.settingsForm.groups.map((group) => {
      group.fields.map((field) => {
        if (field.name === 'systemLocale') {
          field.options = locales.map((locale: string) => {
            return { value: locale, label: locale };
          });
        }
      });
    });
  }

  private getZones() {
    const momentTimeZone = require('moment-timezone');
    const zones = momentTimeZone.tz.names();
    this.settingsForm.groups.map((group) => {
      group.fields.map((field) => {
        if (field.name === 'systemTimezone') {
          field.options = zones.map((zone: string) => {
            return { value: zone, label: zone };
          });
        }
      });
    });
  }

  private getFormat() {
    const dateFormarts = [
      'YYYY-MM-DD',
      'YYYY-DD-MM',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY.MM.DD',
      'YYYY.DD.MM',
      'DD.MM.YYYY',
      'MM.DD.YYYY',
      'YYYY/MM/DD',
      'YYYY/DD/MM',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
    ];
    this.settingsForm.groups.map((group) => {
      group.fields.map((field) => {
        if (field.name === 'dateFormat') {
          field.options = dateFormarts.map((zone: string) => {
            return { value: zone, label: zone };
          });
        }
      });
    });
  }

  private getTimeFormarts() {
    const dateFormarts = ['LT', 'LTS', 'HH:mm', 'HH:mm:ss', 'h:mm A', 'h:mm:ss A'];
    this.settingsForm.groups.map((group) => {
      group.fields.map((field) => {
        if (field.name === 'timeFormat') {
          field.options = dateFormarts.map((zone: string) => {
            return { value: zone, label: zone };
          });
        }
      });
    });
  }

  private getDateTimeFormats() {
    const dateTimeFormats = [
      'YYYY-MM-DD LT',
      'YYYY-MM-DD HH:mm',
      'DD/MM/YYYY LT',
      'DD/MM/YYYY HH:mm',
      'MM/DD/YYYY LT',
      'LLL',
      'LLLL',
    ];
    this.settingsForm.groups.map((group) => {
      group.fields.map((field) => {
        if (field.name === 'dateTimeFormat') {
          field.options = dateTimeFormats.map((format: string) => {
            return { value: format, label: format };
          });
        }
      });
    });
  }
}
