const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const root = path.resolve(__dirname, '../src/app');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request.startsWith('@shared/')) request = path.join(root, '@shared', request.slice(8));
  return resolve.call(this, request, parent, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018, experimentalDecorators: true },
  }).outputText;
  module._compile(output, filename);
};
const storage = {};
global.localStorage = { getItem: (key) => storage[key] || null, setItem: (key, value) => storage[key] = value };
process.env.TZ = process.env.PSIRA_TEST_TZ || 'UTC';
const dates = require(path.join(root, '@shared/utils/system-settings.util.ts'));
const { UserDateTimeDirective } = require(path.join(root, '@shared/directives/user-date-time/user-date-time.directive.ts'));
const { CalendarGridComponent } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.ts'));
const { CalendarRecurrenceService, RepeatUnit, RepeatEndMode } = require(path.join(root, 'pages/calendar/@services/calendar-recurrence.service.ts'));
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
function user(timezone) { storage.user = JSON.stringify({ id: 1, timezone }); }
user('America/Argentina/Buenos_Aires');
storage.settings = JSON.stringify({ systemTimezone: 'Africa/Dar_es_Salaam', timeFormat: 'HH:mm' });
test('personal zone overrides global settings throughout date formatting', () => {
  assert.strictEqual(dates.formatSystemTime('2026-10-21T17:45:00Z'), '14:45');
  assert.strictEqual(dates.systemTimezone(), 'America/Argentina/Buenos_Aires');
});
test('automatic mode uses the current browser, not another user or global zone', () => {
  user(null);
  assert.strictEqual(dates.systemTimezone(), process.env.TZ);
  assert.strictEqual(dates.formatSystemTime('2026-10-21T17:45:00Z'), process.env.TZ === 'UTC' ? '17:45' : '13:45');
  user('America/Argentina/Buenos_Aires');
});
test('date-only values retain their calendar date', () => {
  assert.strictEqual(dates.formatSystemDate('2026-10-21'), '2026-10-21');
});
test('datetime picker displays the personal zone and round-trips the same instant', () => {
  const original = new Date('2026-10-21T17:45:00Z');
  const input = dates.toUserDateInput(original);
  assert.strictEqual(input.getHours(), 14);
  assert.strictEqual(input.getMinutes(), 45);
  assert.strictEqual(dates.fromUserDateInput(input).toISOString(), original.toISOString());
});
test('form accessor converts both writes and user edits without changing the stored instant', () => {
  let displayed; let changed; let callback;
  const control = { valueAccessor: {
    writeValue: (value) => displayed = value,
    registerOnChange: (fn) => callback = fn,
    registerOnTouched: () => {},
  } };
  new UserDateTimeDirective(control);
  control.valueAccessor.writeValue(new Date('2026-10-21T17:45:00Z'));
  assert.strictEqual(displayed.getHours(), 14);
  control.valueAccessor.registerOnChange((value) => changed = value);
  callback(new Date(2026, 9, 21, 15, 45));
  assert.strictEqual(changed.toISOString(), '2026-10-21T18:45:00.000Z');
});
test('calendar day and hour buckets agree with the displayed time across midnight', () => {
  user('Asia/Tokyo');
  const calendar = Object.create(CalendarGridComponent.prototype);
  calendar.events = [{ startAt: '2026-10-21T17:45:00Z' }];
  assert.strictEqual(calendar.eventsForDate(new Date(2026, 9, 21)).length, 0);
  assert.strictEqual(calendar.eventsForHour(new Date(2026, 9, 22), 2).length, 1);
});
test('daily repetition retains UTC time across a daylight-saving change', () => {
  user('America/New_York');
  const recurrence = new CalendarRecurrenceService();
  const result = recurrence.buildOccurrences({
    startAt: new Date('2026-03-07T14:00:00Z'), endAt: new Date('2026-03-07T15:00:00Z'),
    enabled: true, every: 1, unit: RepeatUnit.DAY, repeatOnDays: [], endMode: RepeatEndMode.AFTER_COUNT, count: 2,
  });
  assert.strictEqual(result[1].startAt.toISOString(), '2026-03-08T14:00:00.000Z');
});
test('weekly repetition keeps UTC time and maps selected local weekdays across midnight', () => {
  user('America/New_York');
  const result = new CalendarRecurrenceService().buildOccurrences({
    startAt: new Date('2026-03-07T01:00:00Z'), endAt: new Date('2026-03-07T02:00:00Z'),
    enabled: true, every: 1, unit: RepeatUnit.WEEK, repeatOnDays: [5], endMode: RepeatEndMode.AFTER_COUNT, count: 2,
  });
  assert.strictEqual(result[0].startAt.toISOString(), '2026-03-07T01:00:00.000Z');
  assert.strictEqual(result[1].startAt.toISOString(), '2026-03-14T01:00:00.000Z');
});
console.log(count + ' timezone regression checks passed');
