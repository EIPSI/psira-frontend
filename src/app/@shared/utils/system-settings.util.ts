import * as moment from 'moment-timezone';

export interface SystemDateSettings {
  systemLocale?: string;
  systemTimezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  dateTimeFormat?: string;
}

const fallbackSettings: Required<SystemDateSettings> = {
  systemLocale: 'en',
  systemTimezone: 'Africa/Dar_es_Salaam',
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
    };
  } catch (_error) {
    return fallbackSettings;
  }
}

export function configuredMoment(date: string | Date): moment.Moment {
  const settings = getSystemSettings();
  const locale = settings.systemLocale || fallbackSettings.systemLocale;
  const timezone = settings.systemTimezone || fallbackSettings.systemTimezone;
  const value = moment(date);
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

export function systemTimezone(): string {
  const settings = getSystemSettings();
  return settings.systemTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
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
