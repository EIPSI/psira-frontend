import * as moment from 'moment-timezone';

export interface SystemDateSettings {
  systemLocale?: string;
  systemTimezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  dateTimeFormat?: string;
}

const fallbackSettings: Required<SystemDateSettings> = {
  systemLocale: '',
  systemTimezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'LT',
  dateTimeFormat: 'YYYY-MM-DD LT',
};

export function getSystemSettings(): Required<SystemDateSettings> {
  try {
    const stored = JSON.parse(localStorage.getItem('settings') || '{}') || {};
    return {
      ...fallbackSettings,
      ...stored,
      systemTimezone: userTimezone(),
    };
  } catch (_error) {
    return { ...fallbackSettings, systemTimezone: userTimezone() };
  }
}

export function configuredMoment(date: string | Date): moment.Moment {
  const settings = getSystemSettings();
  const locale = settings.systemLocale || localStorage.getItem('language') || 'en';
  const timezone = settings.systemTimezone || fallbackSettings.systemTimezone;
  const value = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? moment.tz(date, 'YYYY-MM-DD', timezone)
    : moment(date);
  return timezone && moment.tz.zone(timezone)
    ? value.tz(timezone).locale(locale)
    : value.locale(locale);
}

export function formatSystemDate(date: string | Date, format?: string): string {
  if (!date) return '';
  const settings = getSystemSettings();
  return configuredMoment(date).format(format || settings.dateFormat);
}

export function formatSystemTime(date: string | Date): string {
  const settings = getSystemSettings();
  return formatSystemDate(date, settings.timeFormat);
}

export function formatSystemDateTime(date: string | Date): string {
  const settings = getSystemSettings();
  return formatSystemDate(date, resolveDateTimeFormat(settings));
}

export function browserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return moment.tz.zone(timezone) ? timezone : 'UTC';
  } catch (_error) {
    return 'UTC';
  }
}

export function userTimezone(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.timezone && moment.tz.zone(user.timezone)) return user.timezone;
  } catch (_error) {}
  return browserTimezone();
}

export function systemTimezone(): string {
  return userTimezone();
}

// Date pickers represent wall-clock values in the browser zone. Translate only
// at their boundary; models, API requests and stored dates remain real instants.
export function toUserDateInput(value: Date | string): Date {
  if (!value) return null;
  const date = configuredMoment(value);
  return new Date(date.year(), date.month(), date.date(), date.hour(), date.minute(), date.second(), date.millisecond());
}

export function fromUserDateInput(value: Date): Date {
  if (!value) return null;
  return moment.tz([
    value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(),
    value.getMinutes(), value.getSeconds(), value.getMilliseconds(),
  ], userTimezone()).toDate();
}

export function calendarDateMoment(value: Date): moment.Moment {
  return configuredMoment(fromUserDateInput(value));
}

function resolveDateTimeFormat(settings: Required<SystemDateSettings>): string {
  const fallbackDateTime = fallbackSettings.dateTimeFormat;
  const dateFormat = settings.dateFormat || fallbackSettings.dateFormat;
  const timeFormat = settings.timeFormat || fallbackSettings.timeFormat;
  if (!settings.dateTimeFormat || settings.dateTimeFormat === fallbackDateTime) {
    return `${dateFormat} ${timeFormat}`;
  }
  return settings.dateTimeFormat;
}

export function toNzDateFormat(format?: string): string {
  const settings = getSystemSettings();
  return (format || settings.dateFormat)
    .replace(/Y/g, 'y')
    .replace(/D/g, 'd');
}
