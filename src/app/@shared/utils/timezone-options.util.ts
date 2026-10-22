import * as moment from 'moment-timezone';

export interface TimezoneOption {
  value: string;
  label: string;
  offset: number;
}

// One reference zone per standard UTC offset. IANA rules still handle seasonal changes.
const references: Array<[number, string, Array<[string, string]>]> = [
  [-720, 'Etc/GMT+12', [['Baker / Howland', 'UM']]],
  [-660, 'Pacific/Pago_Pago', [['Pago Pago', 'AS']]],
  [-600, 'Pacific/Honolulu', [['Honolulu', 'US']]],
  [-570, 'Pacific/Marquesas', [['Marquesas', 'PF']]],
  [-540, 'America/Anchorage', [['Anchorage, Alaska', 'US']]],
  [-480, 'America/Los_Angeles', [['Los Angeles', 'US'], ['Vancouver', 'CA']]],
  [-420, 'America/Denver', [['Denver', 'US'], ['Calgary', 'CA']]],
  [-360, 'America/Chicago', [['Chicago', 'US'], ['Winnipeg', 'CA']]],
  [-300, 'America/New_York', [['New York', 'US'], ['Toronto', 'CA']]],
  [-240, 'America/Halifax', [['Halifax', 'CA']]],
  [-210, 'America/St_Johns', [['St. John’s', 'CA']]],
  [-180, 'America/Argentina/Buenos_Aires', [['Buenos Aires', 'AR'], ['Montevideo', 'UY']]],
  [-120, 'Atlantic/South_Georgia', [['Grytviken', 'GS']]],
  [-60, 'Atlantic/Cape_Verde', [['Praia', 'CV']]],
  [0, 'UTC', [['Reykjavík', 'IS'], ['Accra', 'GH']]],
  [60, 'Europe/Madrid', [['Madrid', 'ES'], ['Berlin', 'DE']]],
  [120, 'Africa/Johannesburg', [['Johannesburg', 'ZA'], ['Gaborone', 'BW']]],
  [180, 'Asia/Riyadh', [['Riyadh', 'SA'], ['Istanbul', 'TR']]],
  [210, 'Asia/Tehran', [['Tehran', 'IR']]],
  [240, 'Asia/Dubai', [['Dubai', 'AE'], ['Muscat', 'OM']]],
  [270, 'Asia/Kabul', [['Kabul', 'AF']]],
  [300, 'Asia/Karachi', [['Karachi', 'PK']]],
  [330, 'Asia/Kolkata', [['Kolkata', 'IN'], ['Colombo', 'LK']]],
  [345, 'Asia/Kathmandu', [['Kathmandu', 'NP']]],
  [360, 'Asia/Dhaka', [['Dhaka', 'BD']]],
  [390, 'Asia/Yangon', [['Yangon', 'MM']]],
  [420, 'Asia/Bangkok', [['Bangkok', 'TH'], ['Ho Chi Minh', 'VN']]],
  [480, 'Asia/Singapore', [['Singapore', 'SG'], ['Beijing', 'CN']]],
  [525, 'Australia/Eucla', [['Eucla', 'AU']]],
  [540, 'Asia/Tokyo', [['Tokyo', 'JP'], ['Seoul', 'KR']]],
  [570, 'Australia/Adelaide', [['Adelaide', 'AU']]],
  [600, 'Australia/Sydney', [['Sydney', 'AU']]],
  [630, 'Australia/Lord_Howe', [['Lord Howe', 'AU']]],
  [660, 'Pacific/Guadalcanal', [['Honiara', 'SB']]],
  [720, 'Pacific/Auckland', [['Auckland', 'NZ']]],
  [765, 'Pacific/Chatham', [['Chatham', 'NZ']]],
  [780, 'Pacific/Apia', [['Apia', 'WS'], ['Nuku’alofa', 'TO']]],
  [840, 'Pacific/Kiritimati', [['Kiritimati', 'KI']]],
];

export function timezoneOffsetLabel(offset: number): string {
  const minutes = Math.abs(offset);
  return `UTC${offset < 0 ? '-' : '+'}${Math.floor(minutes / 60).toString().padStart(2, '0')}:${
    (minutes % 60).toString().padStart(2, '0')}`;
}

export function timezoneReferenceOptions(locale: string = 'es'): TimezoneOption[] {
  const DisplayNames = (Intl as any).DisplayNames;
  const countries = DisplayNames ? new DisplayNames([locale || 'es'], { type: 'region' }) : undefined;
  return references.map(([offset, value, examples]) => ({
    offset, value,
    label: `${timezoneOffsetLabel(offset)} · ${examples.map(([place, code]) => `${place} (${countries ? countries.of(code) : code})`).join(', ')}`,
  }));
}

export function timezoneReference(zone: string, at: Date = new Date()): string {
  if (references.some((reference) => reference[1] === zone)) return zone;
  if (!moment.tz.zone(zone)) return 'UTC';
  const year = at.getUTCFullYear();
  const standardOffset = Math.min(
    moment.tz([year, 0, 15], zone).utcOffset(), moment.tz([year, 6, 15], zone).utcOffset(),
  );
  return references.find((reference) => reference[0] === standardOffset)?.[1] || 'UTC';
}
