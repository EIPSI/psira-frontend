const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const root = path.resolve(__dirname, '../src/app');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request.startsWith('@shared/')) request = path.join(root, '@shared', request.slice(8));
  if (request.startsWith('@env/')) request = path.resolve(root, '../environments', request.slice(5));
  if (request.startsWith('@app/')) request = path.join(root, request.slice(5));
  return originalResolve.call(this, request, parent, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018, experimentalDecorators: true },
}).outputText, filename);
global.localStorage = { getItem: () => null };
const { of } = require('rxjs');
let count = 0;
function test(name, run) { run(); count += 1; console.log('PASS ' + name); }
const { timezoneReferenceOptions, timezoneReference } = require(path.join(root, '@shared/utils/timezone-options.util.ts'));
test('timezone choices contain one reference per UTC offset, ordered from -12 to +14', () => {
  const options = timezoneReferenceOptions('es');
  assert.strictEqual(options[0].offset, -720);
  assert.strictEqual(options[options.length - 1].offset, 840);
  assert.strictEqual(new Set(options.map(option => option.offset)).size, options.length);
  assert.ok(options.length < 40);
  assert.ok(options.some(option => option.offset === 345 && option.label.startsWith('UTC+05:45')));
  assert.ok(options.find(option => option.offset === -180).label.includes('Argentina'));
  const moment = require('moment-timezone');
  const madrid = options.find(option => option.offset === 60).value;
  assert.strictEqual(moment.tz('2026-01-15', madrid).utcOffset(), 60);
  assert.strictEqual(moment.tz('2026-07-15', madrid).utcOffset(), 120);
  assert.strictEqual(timezoneReference('UTC'), 'UTC');
  assert.ok(options.find(option => option.offset === -480).label.includes('Los Angeles'));
  assert.ok(options.find(option => option.offset === -420).label.includes('Denver'));
  assert.ok(options.find(option => option.offset === 570).label.includes('Adelaide'));
  assert.ok(options.find(option => option.offset === 600).label.includes('Sydney'));
});
test('workbook downloads follow the current language, including regional variants and live changes', () => {
  const { questionnaireWorkbookFile } = require(path.join(root, '@shared/utils/questionnaire-workbook.util.ts'));
  const { QuestionnaireFormComponent } = require(path.join(root,
    'pages/questionnaire-management/questionnaire-profile/questionnaire-form/questionnaire-form.component.ts'));
  const component = Object.create(QuestionnaireFormComponent.prototype);
  component.translate = { currentLang: 'es-AR', defaultLang: 'en' };
  for (const [language, code] of [['es-AR', 'es'], ['EN-gb', 'en'], ['de-DE', 'de'], ['nl_NL', 'nl'], ['fr', 'en']]) {
    component.translate.currentLang = language;
    assert.strictEqual(component.guideWorkbookFile, 'PSIRA-cuestionarios-guia-' + code + '.xlsx');
    assert.strictEqual(component.exampleWorkbookFile, 'PSIRA-cuestionario-ejemplo-completo-' + code + '.xlsx');
    for (const kind of ['guide', 'example']) {
      const filename = questionnaireWorkbookFile(kind, language);
      assert.ok(fs.existsSync(path.resolve(root, '../assets/templates', filename)), filename);
    }
  }
  component.translate.currentLang = '';
  component.translate.defaultLang = 'de';
  assert.strictEqual(component.guideWorkbookFile, 'PSIRA-cuestionarios-guia-de.xlsx');
});
const translationKeys = [
  'tables.casemanagers.departments',
  'evaluationSchemes.sessionBased',
  'evaluationSchemes.fixedScheme',
  'roles.patient',
  'roles.caregiver',
  'roles.therapist',
  'roles.supervisor',
  'core.draft',
  'core.paused',
  'core.archived',
  'tables.roles.createdAt',
  'systemSettings.dateFormatDescription',
  'systemSettings.timeFormatDescription',
  'systemSettings.dateTimeFormatDescription',
  'systemSettings.passwordLifeTimeDescription',
  'systemSettings.passwordReuseCutoffDescription',
  'systemSettings.notificationLogRetentionDescription',
  'systemSettings.accessTokenRetentionDescription',
  'systemSettings.maxLoginAttemptsDescription',
  'form.system.evaluationAutomationRunRetentionDays',
  'systemSettings.evaluationAutomationRunRetentionDescription',
  'form.system.treatmentFinalizationUndoWindowDays',
  'systemSettings.treatmentFinalizationUndoWindowDescription',
  'form.system.patientCaseManagerAssignableHierarchyRank',
  'systemSettings.patientCaseManagerAssignableHierarchyRankDescription',

  'systemSettings.systemLocaleDescription', 'departments.appliesToRoles', 'roles.createRole',
  'tables.roles.name', 'tables.roles.hierarchy', 'forms.patients.createCaregiver', 'forms.patients.emergencyContacts',
  'evaluationSchemes.sessionBased', 'evaluationSchemes.fixedScheme', 'evaluationSchemes.active',
  'patientsManagement.fromThisSession', 'patientsManagement.originalStructure',
  'tables.assessmentsPatients.origin', 'tables.assessmentsPatients.linkedSession', 'tables.assessmentsPatients.questionnaires',
];
const getTranslation = (object, key) => key.split('.').reduce((value, part) => value && value[part], object);
test('all reported keys have translations in every supported language', () => {
  for (const locale of ['es', 'en', 'de', 'nl']) {
    const dictionary = require(path.resolve(root, '../translations', locale + '.ts')).default;
    for (const key of translationKeys) {
      const value = getTranslation(dictionary, key);
      assert.ok(typeof value === 'string' && value.trim() && value !== key, locale + ': ' + key);
    }
  }
});
test('remote placeholders do not hide valid local translations, while custom wording is preserved', () => {
  const { DynamicTranslationLoader } = require(path.join(root, '@core/dynamic-translation-loader.ts'));
  const loader = new DynamicTranslationLoader({});
  const local = { roles: { createRole: 'Crear rol', updateRole: 'Editar rol' } };
  const result = loader.deepMerge(local, { roles: { createRole: 'roles.createRole', updateRole: 'Texto personalizado' } });
  assert.strictEqual(result.roles.createRole, 'Crear rol');
  assert.strictEqual(result.roles.updateRole, 'Texto personalizado');
  assert.strictEqual(local.roles.updateRole, 'Editar rol');
});
if (process.env.PSIRA_TEST_BACKEND_ROOT) test('backend seed includes all reported keys and their localized defaults', () => {
  const { defaultTranslationSeed } = require(path.join(process.env.PSIRA_TEST_BACKEND_ROOT,
    'src/modules/language/seed/default-translation-seed.ts'));
  for (const locale of ['es', 'en', 'de', 'nl']) {
    for (const key of translationKeys) {
      assert.ok(defaultTranslationSeed.keys.some(item => item.key === key), key);
      assert.ok(getTranslation(defaultTranslationSeed.values[locale], key), locale + ': ' + key);
    }
  }
});
const { combineFilters } = require(path.join(root, '@shared/utils/query-filter.util.ts'));
test('combined filters never add empty AND branches and retain NULL comparisons', () => {
  assert.deepStrictEqual(combineFilters({ active: { is: true } }, {}), { active: { is: true } });
  assert.deepStrictEqual(combineFilters({ active: { is: true } }, { and: [{}] }), { active: { is: true } });
  assert.deepStrictEqual(combineFilters({ deleted: { is: null } }), { deleted: { is: null } });
});
const { PendingInformedConsentsComponent } = require(path.join(root, 'pages/informed-consent/pending-consents/pending-consents.component.ts'));
global.window = { btoa: value => Buffer.from(value, 'binary').toString('base64'),
  addEventListener: () => {}, removeEventListener: () => {} };
function consentFixture(params = {}, pending = []) {
  const navigations = [];
  const model = { currentPublishedVersion: { questions: [], thankYouHtml: '<p>OK</p>' } };
  const service = {
    submitResponse: () => of({}), submitPublicResponse: () => of({}),
    getPending: () => of(pending), getPublicPending: () => of(pending),
    getPendingModel: () => of(model), getPublicPendingModel: () => of(model),
  };
  const component = new PendingInformedConsentsComponent(service,
    { snapshot: { queryParamMap: { get: key => params[key] || null } } },
    { navigate: (...args) => navigations.push(args) },
    { success: () => {}, warning: () => {} }, { handleError: error => { throw error; } }, { instant: key => key });
  component.models[1] = model;
  component.pending = [{ managementId: 1, modelId: 1 }, ...pending];
  return { component, navigations, service };
}
test('authenticated consent submission retains remaining documents and their answers', () => {
  const { component, navigations } = consentFixture({}, [{ managementId: 2, modelId: 2 }]);
  component.answers[2] = { 20: 21 };
  component.selectedManagementId = 1;
  component.submit({ managementId: 1, modelId: 1 });
  assert.strictEqual(navigations.length, 0);
  assert.strictEqual(component.submittedThankYouHtml, undefined);
  assert.deepStrictEqual(component.visiblePendingItems.map(item => item.managementId), [2]);
  assert.strictEqual(component.answers[2][20], 21);
});
test('public consent submission retains remaining optional documents before returning to an assessment', () => {
  const { component, navigations } = consentFixture({ assessment: 'example' }, [{ managementId: 2, modelId: 2, mandatory: false }]);
  component.publicToken = 'example-token';
  component.submit({ managementId: 1, modelId: 1 });
  assert.strictEqual(navigations.length, 0);
  assert.strictEqual(component.visiblePendingItems.length, 1);
});
test('authenticated consent flow exits only after the last pending document', () => {
  const { component, navigations } = consentFixture();
  component.submit({ managementId: 1, modelId: 1 });
  assert.deepStrictEqual(navigations[0][0], ['/psira/dashboard']);
});
test('public consent flow shows thanks after the last pending document', () => {
  const { component, navigations } = consentFixture();
  component.publicToken = 'example-token';
  component.submit({ managementId: 1, modelId: 1 });
  assert.strictEqual(navigations.length, 0);
  assert.strictEqual(component.submittedThankYouHtml, '<p>OK</p>');
});
test('only one consent is displayed at a time', () => {
  const { component } = consentFixture({}, [{ managementId: 2, modelId: 2 }, { managementId: 3, modelId: 3 }]);
  component.load();
  assert.deepStrictEqual(component.visiblePendingItems.map(item => item.managementId), [2]);
  component.submit({ managementId: 1, modelId: 1 });
  assert.strictEqual(component.visiblePendingItems.length, 1);
});
test('two sequential registrations exit after the second one only', () => {
  const { component, navigations, service } = consentFixture({}, [{ managementId: 2, modelId: 2 }]);
  component.submit({ managementId: 1, modelId: 1 });
  assert.strictEqual(navigations.length, 0);
  service.getPending = () => of([]);
  component.submit({ managementId: 2, modelId: 2 });
  assert.strictEqual(navigations.length, 1);
  assert.deepStrictEqual(navigations[0][0], ['/psira/dashboard']);
});
test('assessment redirect happens only after all pending consents are answered', () => {
  const { component, navigations } = consentFixture({ assessment: 'example' });
  component.publicToken = 'example-token';
  component.submit({ managementId: 1, modelId: 1 });
  assert.deepStrictEqual(navigations[0][0], ['/assessment']);
});
const { CreateQuestionnaireBundleComponent } = require(path.join(root,
  'pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts'));
const { FormBuilder } = require('@angular/forms');
function bundleFixture() {
  const component = new CreateQuestionnaireBundleComponent(new FormBuilder(), {}, {}, {}, {}, {},
    { instant: key => key }, {}, {});
  component.structure = component.normalizeRootStructure([]);
  return component;
}
test('bundle minimum is a non-removable page and group, with questionnaires inside the group', () => {
  const component = bundleFixture();
  assert.deepStrictEqual(component.structure.map(node => node.type), ['SCREEN', 'FIXED_GROUP']);
  component.removeNode(component.structure, 0);
  component.removeNode(component.structure, 1);
  component.addQuestionnaire();
  assert.deepStrictEqual(component.structure.map(node => node.type), ['SCREEN', 'FIXED_GROUP']);
  assert.strictEqual(component.structure[1].children[0].type, 'QUESTIONNAIRE');
  component.moveNode(component.structure, 0, 1);
  assert.strictEqual(component.structure[0].type, 'SCREEN');
  component.setGroupType(component.structure[1], 'RANDOM_GROUP');
  assert.strictEqual(component.structure[1].children.length, 1);
});
test('legacy bundle content and first-page rich text survive normalization', () => {
  const component = bundleFixture();
  const legacy = [{ id: 'old', type: 'RANDOM_GROUP', headerHtml: '<p>Header</p>', footerHtml: '<p>Footer</p>',
    children: [{ id: 'q', type: 'QUESTIONNAIRE', questionnaireId: 'example' }] }];
  component.structure = component.normalizeRootStructure(legacy);
  assert.strictEqual(component.structure[0].headerHtml, '<p>Header</p>');
  assert.strictEqual(component.structure[0].footerHtml, '<p>Footer</p>');
  assert.strictEqual(component.structure[1].type, 'RANDOM_GROUP');
  assert.strictEqual(component.structure[1].children[0].questionnaireId, 'example');
});
test('questionnaire cannot be dragged outside a group and mandatory nodes cannot be dragged away', () => {
  const component = bundleFixture();
  component.addQuestionnaire();
  const group = component.structure[1];
  component.dropNode({ previousContainer: { data: group.children }, container: { data: component.structure },
    previousIndex: 0, currentIndex: 2 });
  assert.strictEqual(group.children.length, 1);
  component.dropNode({ previousContainer: { data: component.structure }, container: { data: group.children },
    previousIndex: 0, currentIndex: 0 });
  assert.strictEqual(component.structure[0].type, 'SCREEN');
});
if (process.env.PSIRA_SCHEMA_PATH) {
  const backend = process.env.PSIRA_TEST_BACKEND_ROOT || path.resolve(__dirname, '../../psira-backend');
  const { buildSchema, validate } = require(path.join(backend, 'node_modules/graphql'));
  const { getVariableValues } = require(path.join(backend, 'node_modules/graphql/execution/values'));
  const schema = buildSchema(fs.readFileSync(process.env.PSIRA_SCHEMA_PATH, 'utf8'));
  const { NestJsQueriesService } = require(path.join(root, '@shared/services/nestjs-queries.service.ts'));
  const queryFactory = new NestJsQueriesService();
  const services = [
    ['clinical departments', 'pages/patients-management/@services/departments.service.ts', 'DepartmentsService', 'departments',
      { paging: { first: 50 }, filter: {}, sorting: [] }],
    ['administration departments', 'pages/administration/@services/departments.service.ts', 'DepartmentsService', 'departments',
      { paging: { first: 50 }, filter: {}, sorting: [] }],
    ['automation list', 'pages/evaluation-automations/@services/evaluation-automations.service.ts', 'EvaluationAutomationsService', 'getAutomations',
      { paging: { first: 50 } }],
  ];
  const capturedRequests = [];
  for (const [name, file, type, method, params] of services) test(name + ' query and boolean filter match the running GraphQL schema', () => {
    let request;
    const apollo = { query: options => { request = options; return of({ data: {} }); } };
    const Service = require(path.join(root, file))[type];
    const service = new Service(apollo, queryFactory);
    service[method](params);
    assert.deepStrictEqual(validate(schema, request.query).map(error => error.message), []);
    const definitions = request.query.definitions.find(def => def.kind === 'OperationDefinition').variableDefinitions;
    const result = getVariableValues(schema, definitions, request.variables);
    assert.deepStrictEqual((result.errors || []).map(error => error.message), []);
    capturedRequests.push({ name, variables: request.variables });
    assert.strictEqual(request.variables.filter.active.is, true);
    assert.ok(!JSON.stringify(request.variables.filter).includes('{}'));
  });
  test('new-user initialization generates schema-valid role and department requests', () => {
    const requests = [];
    const apollo = { query: request => {
      requests.push(request);
      return of({ data: { roles: { edges: [] }, departments: { edges: [], pageInfo: {} } } });
    } };
    const { RolesService } = require(path.join(root, 'pages/administration/@services/roles.service.ts'));
    const { DepartmentsService } = require(path.join(root, 'pages/administration/@services/departments.service.ts'));
    const { UserFormComponent } = require(path.join(root, 'pages/user-management/user-form/user-form.component.ts'));
    const component = new UserFormComponent({}, { queryParams: of({}), snapshot: { data: {} } }, {}, {}, {}, {},
      { handleError: error => { throw error; } }, new RolesService(apollo), { permissionsOnly: () => true },
      new DepartmentsService(apollo), { previewAutomations: () => of([]) }, {}, { instant: key => key });
    component.ngOnInit();
    assert.strictEqual(requests.length, 3);
    for (const request of requests) {
      assert.deepStrictEqual(validate(schema, request.query).map(error => error.message), []);
      const operation = request.query.definitions.find(def => def.kind === 'OperationDefinition');
      const result = getVariableValues(schema, operation.variableDefinitions, request.variables);
      assert.deepStrictEqual((result.errors || []).map(error => error.message), []);
      capturedRequests.push({ name: 'new user ' + operation.selectionSet.selections[0].name.value, variables: request.variables });
    }
  });
  if (process.env.PSIRA_REQUEST_CAPTURE) fs.writeFileSync(process.env.PSIRA_REQUEST_CAPTURE, JSON.stringify(capturedRequests));
}

const { compareTableRows } = require(path.join(root, '@shared/utils/table-sort.util.ts'));
test('local table ordering handles numeric values, dates and translated tags', () => {
  assert.ok(compareTableRows({ value: 2 }, { value: 10 }, { name: 'value' }) < 0);
  assert.ok(compareTableRows({ value: '2026-02-01' }, { value: '2025-12-01' }, { name: 'value', render: 'date' }) > 0);
  const translate = key => ({ pending: 'Pendiente', active: 'Activo' }[key] || key);
  assert.ok(compareTableRows({ value: [{ translationPath: 'pending' }] },
    { value: [{ translationPath: 'active' }] }, { name: 'value' }, translate) > 0);
});
const { AppPermissionsService } = require(path.join(root, '@shared/services/app-permissions.service.ts'));
const { SessionsListComponent } = require(path.join(root, 'pages/calendar/sessions-list/sessions-list.component.ts'));
const { ClinicalFollowUpListComponent } = require(path.join(root, 'pages/calendar/clinical-follow-up-list/clinical-follow-up-list.component.ts'));
const { PatientCalendarComponent } = require(path.join(root, 'pages/patients-management/calendar/patient-calendar.component.ts'));
test('superadmin can manage patient calendars and sessions without being assigned', () => {
  const originalStorage = global.localStorage;
  try {
    global.localStorage = { getItem: key => key === 'user' ? JSON.stringify({ id: 1, isSuperUser: true }) : null };
    const perms = new AppPermissionsService();
    assert.strictEqual(perms.permissionsOnly('patients.edit.all'), true);
    const sessions = Object.create(SessionsListComponent.prototype);
    Object.assign(sessions, { perms, currentUser: { id: 1 } });
    assert.strictEqual(sessions.canEditSession({ therapistId: 99, responsibleUsers: [] }), true);
    const followUp = Object.create(ClinicalFollowUpListComponent.prototype);
    Object.assign(followUp, { perms, settings: { editWindowDays: 1 } });
    assert.strictEqual(followUp.canEdit({ calendarOccurrence: { startAt: '2020-01-01' } }), true);
    const calendar = Object.create(PatientCalendarComponent.prototype);
    Object.assign(calendar, { perms, currentUser: { id: 1 }, caseAdministrators: [] });
    assert.strictEqual(calendar.canManagePatientCalendar(), true);
    global.localStorage = { getItem: () => JSON.stringify({ id: 2, roles: [{ code: 'THERAPIST' }] }) };
    assert.strictEqual(sessions.canEditSession({ therapistId: 99, responsibleUsers: [] }), false);
  } finally { global.localStorage = originalStorage; }
});
test('table sorting delegates to the server only when a handler exists', () => {
  const { MasterDataTableComponent } = require(path.join(root,
    '@shared/@modules/master-data/master-data-table/master-data-table.component.ts'));
  const table = new MasterDataTableComponent(null);
  const column = { name: 'name', title: 'Name', sort: true };
  const local = table.sortFunction(column);
  assert.strictEqual(typeof local, 'function');
  assert.strictEqual(table.sortFunction(column), local);
  const subscription = table.sort.subscribe(() => {});
  assert.strictEqual(table.sortFunction(column), true);
  table.remoteSort = false;
  assert.strictEqual(table.sortFunction(column), local);
  subscription.unsubscribe();
});
test('role and patient-status sorting resets cursors and persists across pages', () => {
  const { RolesComponent } = require(path.join(root, 'pages/administration/roles/roles.component.ts'));
  const { PatientStatusesComponent } = require(path.join(root, 'pages/administration/patient-statuses/patient-statuses.component.ts'));
  for (const [Component, method, key, field] of [
    [RolesComponent, 'getRoles', 'roles', 'name'],
    [PatientStatusesComponent, 'getPatientStatuses', 'patientStatuses', 'formattedCreatedAt'],
  ]) {
    const component = Object.create(Component.prototype);
    Object.assign(component, { sorting: [], paging: { first: 10, after: 'oldCursor' } });
    const requests = [];
    component[method] = request => requests.push({ ...request, sorting: component.sorting });
    component.handleTableParams({ sort: [{ key: field, value: 'descend' }] });
    assert.deepStrictEqual(requests[0], { paging: { first: 10 }, sorting: [{
      field: field === 'name' ? 'name' : 'createdAt', direction: 'DESC',
    }] });
    if (key === 'patientStatuses') {
      component.paging = { first: 10, after: 'newCursor' };
      component.navigatePages('next');
      assert.deepStrictEqual(requests[1].sorting, requests[0].sorting);
    }
  }
});
test('sorted rows retain their original identity for edit and delete actions', () => {
  const { TableComponent } = require(path.join(root, '@shared/components/table/table.component.ts'));
  const table = new TableComponent(null, { create: () => {} });
  const first = { id: 1, name: 'Z' };
  const second = { id: 2, name: 'A' };
  table.listOfData = [first, second];
  table.listOfDisplayData = [second, first];
  assert.strictEqual(table.sourceRowIndex(second), 1);
  const actions = [];
  table.onCustomAction.subscribe(event => actions.push(event.data));
  table.contextMenuIndex = table.sourceRowIndex(second);
  table.emitContextAction({ name: 'delete' });
  assert.strictEqual(actions[0], second);
});
if (process.env.PSIRA_SCHEMA_PATH) test('role and status sort requests match GraphQL input types', () => {
  const { buildSchema, validate, getOperationAST } = require('graphql');
  const { getVariableValues } = require('graphql/execution/values');
  const schema = buildSchema(fs.readFileSync(process.env.PSIRA_SCHEMA_PATH, 'utf8'));
  for (const [file, exported, key, field] of [
    ['roles', 'RolesQueries', 'roles', 'hierarchy'],
    ['patient-statuses', 'PatientStatusesQueries', 'patientStatuses', 'createdAt'],
  ]) {
    const query = require(path.join(root, '@graphql/queries/' + file + '.ts'))[exported][key];
    assert.deepStrictEqual(validate(schema, query).map(error => error.message), []);
    const result = getVariableValues(schema, getOperationAST(query).variableDefinitions, {
      paging: { first: 10 }, sorting: [{ field, direction: 'DESC' }],
    });
    assert.deepStrictEqual((result.errors || []).map(error => error.message), []);
  }
});
test('all calendar editors reset the end to one hour after a changed start and support 45 minutes', () => {
  const { CalendarEventUiService } = require(path.join(root, 'pages/calendar/@services/calendar-event-ui.service.ts'));
  for (const [file, exported] of [
    ['pages/calendar/calendar.component.ts', 'CalendarComponent'],
    ['pages/calendar/user-calendar/user-calendar.component.ts', 'UserCalendarComponent'],
    ['pages/patients-management/calendar/patient-calendar.component.ts', 'PatientCalendarComponent'],
  ]) {
    const Component = require(path.join(root, file))[exported];
    const editor = Object.create(Component.prototype);
    editor.eventUiService = new CalendarEventUiService();
    const start = new Date('2026-10-25T01:30:00Z');
    editor.onEditStartChange(start);
    assert.strictEqual(editor.editEndAt.toISOString(), '2026-10-25T02:30:00.000Z');
    editor.setEditDurationMinutes(45);
    assert.strictEqual(editor.editEndAt.toISOString(), '2026-10-25T02:15:00.000Z');
    if (editor.onCreateStartChange) {
      editor.onCreateStartChange(start);
      assert.strictEqual(editor.createEndAt.toISOString(), '2026-10-25T02:30:00.000Z');
    }
  }
});
test('emergency contacts retain an editable row but never save an empty contact', () => {
  const { ArrayInputComponent } = require(path.join(root, '@shared/components/form/input-types/array-input/array-input.component.ts'));
  const { FormComponent } = require(path.join(root, '@shared/components/form/form.component.ts'));
  const editor = new ArrayInputComponent();
  editor.field = { name: 'emergencyContacts', minRows: 1, rows: [[{ name: 'name', value: '' }]] };
  let removals = 0;
  editor.rowRemoved.subscribe(() => removals++);
  editor.removeRow(0);
  assert.strictEqual(editor.field.rows.length, 1);
  assert.strictEqual(removals, 0);
  editor.field.rows.push([{ name: 'name', value: 'Contact' }]);
  editor.removeRow(0);
  assert.strictEqual(removals, 1);
  const form = Object.create(FormComponent.prototype);
  assert.deepStrictEqual(form.parseArrays(editor.field), [{ name: 'Contact' }]);
  editor.field.rows = [[{ name: 'name', value: '  ' }, { name: 'phone', value: '' }]];
  assert.deepStrictEqual(form.parseArrays(editor.field), []);
});
test('profile names remain available when administrative options arrive after the profile', () => {
  const { UserFormComponent } = require(path.join(root, 'pages/user-management/user-form/user-form.component.ts'));
  const profile = Object.create(UserFormComponent.prototype);
  profile.user = { id: 1, roles: [{ id: 8, name: 'Therapist' }], departments: [{ id: 9, name: 'Clinical' }] };
  profile.currentUser = { id: 1 };
  profile.newMode = false;
  profile.previewRoleIds = [];
  profile.roles = [];
  profile.departments = [];
  profile.profileFields = { groups: [{ fields: [{ name: 'roleId', options: [] }, { name: 'departmentId', options: [] }] }] };
  profile.populateProfileRelationLabels();
  profile.updateDepartmentFieldForSelectedRoles();
  assert.strictEqual(profile.profileFields.groups[0].fields[0].options[0].label, 'Therapist');
  assert.strictEqual(profile.profileFields.groups[0].fields[1].options[0].label, 'Clinical');
});
test('both assignment request events have labels and descriptions in every language', () => {
  const { NotificationEvent, NotificationEventLabel, NotificationEventDescription } = require(path.join(root,
    'pages/notifications/@types/notification.ts'));
  for (const event of [NotificationEvent.CASE_MANAGER_ASSIGNMENT_REQUEST, NotificationEvent.CASE_SUPERVISOR_ASSIGNMENT_REQUEST]) {
    assert.ok(event);
    for (const locale of ['es', 'en', 'de', 'nl']) {
      const dictionary = require(path.resolve(root, '../translations', locale + '.ts')).default;
      assert.ok(getTranslation(dictionary, NotificationEventLabel[event]));
      assert.ok(getTranslation(dictionary, NotificationEventDescription[event]));
    }
  }
});

test('the dashboard opens authenticated consent without generating a public token', () => {
  const { DashboardComponent } = require(path.join(root, 'pages/dashboard/dashboard.component.ts'));
  const dashboard = Object.create(DashboardComponent.prototype);
  let navigation;
  dashboard.router = { createUrlTree: (route, options) => { navigation = { route, options }; return navigation; }, serializeUrl: () => '/pending' };
  dashboard.locationStrategy = { prepareExternalUrl: url => url };
  const previousOpen = window.open;
  window.open = () => {};
  try { dashboard.openPendingConsent({ managementId: 42 }); } finally { window.open = previousOpen; }
  assert.deepStrictEqual(navigation.route, ['/psira/informed-consent/pending']);
  assert.deepStrictEqual(navigation.options.queryParams, { managementId: 42 });
});
test('saving notification scopes sends one request and permits an inactive configuration without an email template', () => {
  const { FormBuilder } = require('@angular/forms');
  const { NotificationConfigurationEditorComponent } = require(path.join(root,
    'pages/notifications/notification-configuration-editor/notification-configuration-editor.component.ts'));
  const { NotificationChannel, NotificationEvent } = require(path.join(root, 'pages/notifications/@types/notification.ts'));
  const editor = Object.create(NotificationConfigurationEditorComponent.prototype);
  editor.form = new FormBuilder().group({ departmentIds: [[]], channel: [NotificationChannel.EMAIL], active: [false],
    event: [NotificationEvent.CASE_MANAGER_ASSIGNMENT_REQUEST], recipientRoleId: [2], mailTemplateId: [null], notes: [''] });
  const requests = [];
  editor.notificationsService = { saveConfigurations: value => { requests.push(value); return of({}); } };
  editor.message = { success: () => {}, warning: () => { throw new Error('Unexpected invalid form'); } };
  editor.router = { navigate: () => {} };
  editor.translate = { instant: key => key };
  editor.save();
  assert.strictEqual(requests.length, 1);
  assert.deepStrictEqual(requests[0].departmentIds, []);
  assert.strictEqual(requests[0].mailTemplateId, null);
});
test('particular calendar templates invoke the start-time recalculation handler', () => {
  const { parseTemplate } = require('@angular/compiler');
  for (const file of ['pages/patients-management/calendar/patient-calendar.component.html',
    'pages/calendar/user-calendar/user-calendar.component.html', 'pages/calendar/calendar.component.html']) {
    const template = parseTemplate(fs.readFileSync(path.join(root, file), 'utf8'), file);
    const editors = [];
    const visit = nodes => nodes.forEach(node => {
      if (node.name === 'app-event-edit-modal') editors.push(node);
      if (node.children) visit(node.children);
      if (node.templateAttrs && node.children) return;
    });
    visit(template.nodes);
    assert.strictEqual(editors.length, 1);
    assert.strictEqual(editors[0].outputs.find(output => output.name === 'startAtChange').handler.source, 'onEditStartChange($event)');
  }
});
test('the general editor loads active applications and every page of schemes, then saves additions', () => {
  const { CalendarComponent } = require(path.join(root, 'pages/calendar/calendar.component.ts'));
  const component = Object.create(CalendarComponent.prototype);
  const requests = [];
  const operations = [];
  component.schemesService = { getSchemes: request => {
    requests.push(request);
    return of({ edges: [{ node: { id: request.paging.after ? 12 : 11, name: 'Scheme' } }],
      pageInfo: request.paging.after ? { hasNextPage: false } : { hasNextPage: true, endCursor: 'next' } });
  } };
  component.calendarService = {
    getClinicalSessionSchemeApplications: () => of([{ id: 1, schemeId: 10 }]),
    updateClinicalSession: input => { operations.push(['update', input]); return of({}); },
    addClinicalSessionSchemes: input => { operations.push(['add', input]); return of([]); },
  };
  component.loadEditResponsibleUserOptions = () => {};
  component.loadEvents = () => {};
  component.modalService = { confirm: options => options.nzOnOk() };
  component.calendarService.stopClinicalSessionScheme = (sessionId, schemeId) => {
    operations.push(['stop', { sessionId, schemeId }]);
    component.calendarService.getClinicalSessionSchemeApplications = () => of([]);
    return of({});
  };
  component.errorService = { handleError: error => { throw error; } };
  component.translate = { instant: key => key };
  component.openEdit({ id: 'session:3', type: 'SESSION', editable: true, clinicalSessionId: 3,
    startAt: '2026-10-01T12:00:00Z', endAt: '2026-10-01T13:00:00Z',
    responsibleUserIds: [20], departments: [{ id: 2 }] });
  assert.deepStrictEqual(component.activeSchemeApplications.map(item => item.schemeId), [10]);
  assert.deepStrictEqual(component.sessionSchemes.map(item => item.id), [11, 12]);
  assert.deepStrictEqual(requests[0].departmentIds, [2]);
  component.editAddSchemeIds = [11];
  component.editAddSchemesPropagate = true;
  component.saveEdit();
  assert.deepStrictEqual(operations.map(item => item[0]), ['update', 'add']);
  assert.deepStrictEqual(operations[1][1].schemeIds, [11]);
  assert.strictEqual(operations[1][1].clinicalSessionId, 3);
  assert.strictEqual(operations[1][1].propagateFuture, true);
  component.stopActiveScheme({ schemeId: 10 });
  assert.deepStrictEqual(operations[2], ['stop', { sessionId: 3, schemeId: 10 }]);
  assert.deepStrictEqual(component.activeSchemeApplications, []);
});
test('history renders independent automated evaluations without duplicating assessment notes', () => {
  const { ClinicalFollowUpListComponent } = require(path.join(root, 'pages/calendar/clinical-follow-up-list/clinical-follow-up-list.component.ts'));
  const requests = [];
  const component = new ClinicalFollowUpListComponent({
    getClinicalSessions: () => of([]),
    getCaseHistoryEntries: () => of([{ id: 1, assessmentId: 10, occurredAt: '2026-01-01T12:00:00Z' }]),
    getCaseHistoryAssessments: (patient, therapist) => { requests.push([patient, therapist]); return of([
      { id: 10, status: 'COMPLETED', deliveryDate: '2026-01-01T12:00:00Z' },
      { id: 11, name: 'Automatic', status: 'OPEN_FOR_COMPLETION', deliveryDate: '2026-01-02T12:00:00Z' },
      { id: 12, name: 'Fixed', status: 'COMPLETED', deliveryDate: '2026-01-03T12:00:00Z' },
    ]); },
  }, { handleError: error => { throw error; } }, { instant: key => key }, {});
  component.patientId = 20;
  component.loadDocument();
  assert.deepStrictEqual(requests, [[20, undefined]]);
  assert.strictEqual(component.documentItems.length, 3);
  assert.deepStrictEqual(component.documentItems.filter(item => item.type === 'ASSESSMENT').map(item => item.assessment.id), [12, 11]);
  assert.strictEqual(component.entryAssessmentIsAnswered(component.historyEntries[0]), true);
  component.dateRange = [new Date('2026-01-02'), new Date('2026-01-02')];
  component.applyFilters();
  assert.deepStrictEqual(component.documentItems.map(item => item.assessment.id), [11]);
});

if (process.env.PSIRA_CLINICAL_SCHEMA_PATH) test('calendar, consent and notification requests match the backend schema', () => {
  const { buildSchema, validate } = require('graphql');
  const schema = buildSchema(fs.readFileSync(process.env.PSIRA_CLINICAL_SCHEMA_PATH, 'utf8'));
  const { CalendarQueries } = require(path.join(root, '@graphql/queries/calendar.ts'));
  const { CalendarMutations } = require(path.join(root, '@graphql/mutations/calendar.ts'));
  const { ReportsQueries } = require(path.join(root, '@graphql/queries/reports.ts'));
  const { ReportsMutations } = require(path.join(root, '@graphql/mutations/reports.ts'));
  const { DepartmentsMutations } = require(path.join(root, '@graphql/mutations/departments.ts'));
  const { DisclaimersQueries } = require(path.join(root, '@graphql/queries/disclaimers.ts'));
  const { DisclaimersMutation } = require(path.join(root, '@graphql/mutations/disclaimers.ts'));
  const { RolesQueries } = require(path.join(root, '@graphql/queries/roles.ts'));
  const { AssessmentsQueries } = require(path.join(root, '@graphql/queries/assessments.ts'));
  const { AssessmentsMutations } = require(path.join(root, '@graphql/mutations/assessments.ts'));
  const { BundleQueries } = require(path.join(root, '@graphql/queries/bundles.ts'));
  const { BundleMutations } = require(path.join(root, '@graphql/mutations/bundles.ts'));
  const { NotificationsGraphql } = require(path.join(root, 'pages/notifications/@graphql/notifications.ts'));
  const { InformedConsentGraphql } = require(path.join(root, 'pages/informed-consent/@graphql/informed-consent.ts'));
  for (const query of [CalendarQueries.calendarTargets, CalendarQueries.clinicalSessions, CalendarQueries.calendarEvents, CalendarQueries.caseHistoryAssessments,
    NotificationsGraphql.saveNotificationConfigurations, InformedConsentGraphql.responses,
    CalendarQueries.clinicalSessionFollowUpSettings, CalendarMutations.updateClinicalSessionFollowUpSettings,
    ReportsQueries.reports, ReportsMutations.createOneReport, ReportsMutations.updateOneReport,
    DepartmentsMutations.updateOneDepartment, DepartmentsMutations.deleteOneDepartment,
    DisclaimersQueries.departmentDisclaimers, DisclaimersMutation.updateDisclaimer, RolesQueries.roles,
    AssessmentsQueries.getFullAssessment, AssessmentsQueries.getFullPublicAssessment, AssessmentsMutations.addAnswer,
    BundleQueries.getQuestionnaireBundle, BundleQueries.getQuestionnaireBundles,
    BundleMutations.createQuestionnaireBundle, BundleMutations.updateQuestionnaireBundle]) {
    assert.deepStrictEqual(validate(schema, query).map(error => error.message), []);
  }
});
test('calendar rendering stabilizes without destroying day views on subsequent Angular checks', () => {
  const { DefaultIterableDiffer } = require('@angular/core');
  const { CalendarGridComponent } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.ts'));
  const grid = new CalendarGridComponent();
  grid.selectedDate = new Date(2026, 9, 15);
  const month = new DefaultIterableDiffer();
  const week = new DefaultIterableDiffer();
  assert.ok(month.diff(grid.monthDays));
  assert.ok(week.diff(grid.weekDays));
  for (let check = 0; check < 100; check++) {
    assert.strictEqual(month.diff(grid.monthDays), null);
    assert.strictEqual(week.diff(grid.weekDays), null);
  }
  grid.selectedDate = new Date(2026, 10, 15);
  assert.ok(month.diff(grid.monthDays));
  assert.ok(week.diff(grid.weekDays));
  assert.strictEqual(month.diff(grid.monthDays), null);
  const key = grid.trackDay(0, grid.monthDays[0]);
  assert.strictEqual(grid.trackDay(0, new Date(grid.monthDays[0])), key);
});
test('calendar event indexing preserves lists and refreshes after a move or timezone change', () => {
  const { CalendarGridComponent } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.ts'));
  const grid = new CalendarGridComponent();
  const storage = global.localStorage;
  let timezone = 'UTC';
  global.localStorage = { getItem: key => key === 'user' ? JSON.stringify({ timezone }) : null };
  try {
    grid.events = [{ id: 'session:1', startAt: '2026-10-31T01:00:00Z' }];
    const day = new Date(2026, 9, 31);
    const list = grid.eventsForDate(day);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(grid.eventsForDate(day), list);
    assert.strictEqual(grid.eventsForHour(day, 1)[0], list[0]);
    assert.strictEqual(grid.eventsForDate(new Date(2026, 9, 29)).length, 0);
    grid.events = [{ ...grid.events[0], startAt: '2026-10-31T03:00:00Z' }];
    assert.strictEqual(grid.eventsForHour(day, 1).length, 0);
    assert.strictEqual(grid.eventsForHour(day, 3).length, 1);
    timezone = 'America/Argentina/Buenos_Aires';
    grid.events = [{ ...grid.events[0], startAt: '2026-10-31T01:00:00Z' }];
    assert.strictEqual(grid.eventsForDate(day).length, 0);
    assert.strictEqual(grid.eventsForHour(new Date(2026, 9, 30), 22).length, 1);
  } finally { global.localStorage = storage; }
});
test('event blocks show each person and session label only once', () => {
  const { CalendarGridComponent } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.ts'));
  const { CalendarComponent } = require(path.join(root, 'pages/calendar/calendar.component.ts'));
  const grid = new CalendarGridComponent();
  const patient = { id: 5, firstName: 'Ana', lastName: 'Pérez' };
  const therapist = { id: 8, firstName: 'Luis', lastName: 'Díaz' };
  const event = { id: 'session:1', title: 'Consulta', patient, therapist, responsibleUsers: [therapist] };
  assert.strictEqual(grid.eventPeople(event), 'Ana Pérez · Luis Díaz');
  assert.strictEqual(grid.eventPeople({ ...event, title: 'Consulta · ANA PEREZ' }), 'Luis Díaz');
  assert.strictEqual(grid.eventPeople({ ...event, title: 'Ana Perez · Luis Diaz' }), '');
  const calendar = Object.create(CalendarComponent.prototype);
  calendar.translate = { instant: (_, values) => 'Sesión ' + values.number };
  assert.strictEqual(calendar.displayTitle({ ...event, sessionNumber: 1 }), 'Consulta · Sesión 1');
  assert.strictEqual(calendar.displayTitle({ ...event, title: 'Sesión 1', sessionNumber: 1 }), 'Sesión 1');
});
test('calendar overflow indicator follows scrolling, content updates and resizing', () => {
  const { CalendarOverflowDirective } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-overflow.directive.ts'));
  const classes = new Set();
  const listeners = {};
  const element = { scrollHeight: 400, clientHeight: 180, scrollTop: 0, firstElementChild: {},
    addEventListener: (event, callback) => listeners[event] = callback,
    removeEventListener: event => delete listeners[event] };
  const previousObserver = window.ResizeObserver;
  const previousMutation = global.MutationObserver;
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  window.ResizeObserver = Observer;
  global.MutationObserver = Observer;
  const directive = new CalendarOverflowDirective({ nativeElement: element }, {
    addClass: (_, name) => classes.add(name), removeClass: (_, name) => classes.delete(name),
  }, { runOutsideAngular: work => work() });
  try {
    directive.ngAfterViewInit();
    assert.strictEqual(classes.has('has-more-events'), true);
    element.scrollTop = 220;
    listeners.scroll();
    assert.strictEqual(classes.has('has-more-events'), false);
    element.scrollHeight = 500;
    observers[1].callback();
    assert.strictEqual(classes.has('has-more-events'), true);
    element.clientHeight = 500;
    observers[0].callback();
    assert.strictEqual(classes.has('has-more-events'), false);
    directive.ngOnDestroy();
    assert.strictEqual(listeners.scroll, undefined);
    assert.ok(observers.every(observer => observer.disconnected));
  } finally { window.ResizeObserver = previousObserver; global.MutationObserver = previousMutation; }
});
test('scrolling the event list does not create a calendar event and pointer drops still work', () => {
  const { CalendarGridComponent } = require(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.ts'));
  const grid = new CalendarGridComponent();
  const date = new Date();
  const event = { button: 0, target: { closest: selector => selector === '.month-events-scroll' ? {} : null },
    preventDefault: () => {}, stopPropagation: () => {} };
  let creates = 0;
  let drops = 0;
  grid.createEvent.subscribe(() => creates++);
  grid.eventDrop.subscribe(() => drops++);
  grid.onCellMouseUp(event, date);
  assert.strictEqual(creates, 0);
  grid.pointerDraggedEvent = { id: 'session:1' };
  grid.onCellMouseUp(event, date);
  assert.strictEqual(drops, 1);
  assert.strictEqual(creates, 0);
  const template = fs.readFileSync(path.join(root, 'pages/calendar/calendar-grid/calendar-grid.component.html'), 'utf8');
  assert.ok(!template.includes('slice:0:4'));
});
test('bundle questionnaires share a page until an authored page break, while each questionnaire can have internal pages', () => {
  const { buildQuestionnairePages } = require(path.join(root, 'assessment-form/assessment-pages.ts'));
  const first = { _id: 'q1', occurrenceId: 'one', sourceBundleId: 'package', screenId: 'page1',
    questionGroups: [{ questions: [{ _id: 'a' }] }] };
  const second = { _id: 'q2', occurrenceId: 'two', sourceBundleId: 'package', screenId: 'page1',
    questionGroups: [{ questions: [{ _id: 'b' }] }] };
  assert.strictEqual(buildQuestionnairePages([first, second]).length, 1);
  assert.strictEqual(buildQuestionnairePages([first, { ...second, screenId: 'page2' }]).length, 2);
  const internal = { ...first, sourceBundleId: undefined, screenId: undefined,
    questionGroups: [...first.questionGroups, { pageBreakBefore: true, questions: [{ _id: 'c' }] }] };
  assert.strictEqual(buildQuestionnairePages([internal]).length, 2);
  assert.strictEqual(buildQuestionnairePages([{ ...internal, sourceBundleId: 'package', screenId: 'page1' },
    { ...second, screenId: 'page2' }]).length, 3);
});
test('internal questionnaire pages compose with bundle pages, preserving occurrence IDs and matrix rows', () => {
  const { buildQuestionnairePages } = require(path.join(root, 'assessment-form/assessment-pages.ts'));
  const matrix = { label: 'Matrix', pageBreakBefore: true, uniqueQuestions: [{ subQuestions: [{ _id: 'm1' }, { _id: 'm2' }] }] };
  const first = { _id: 'q1', occurrenceId: 'repeat1', sourceBundleId: 'bundle1', screenId: 'first', progressMode: 'PAGES',
    questionGroups: [{ questions: [{ _id: 'a' }] }, matrix] };
  const second = { _id: 'q2', occurrenceId: 'repeat2', sourceBundleId: 'bundle1', screenId: 'first',
    questionGroups: [{ questions: [{ _id: 'b' }] }] };
  const third = { ...second, occurrenceId: 'repeat3', screenId: 'second' };
  const pages = buildQuestionnairePages([first, second, third]);
  assert.strictEqual(pages.length, 3);
  assert.strictEqual(pages[0].questionnaires[0].questionGroups[0].questions[0]._id, 'a');
  assert.strictEqual(pages[1].questionnaires[0].questionGroups[0], matrix);
  assert.deepStrictEqual(pages[1].questionnaires.map(q => q.occurrenceId), ['repeat1', 'repeat2']);
  assert.strictEqual(pages[2].questionnaires[0].occurrenceId, 'repeat3');
  assert.strictEqual(first.questionGroups.length, 2);
  const standalone = buildQuestionnairePages([{ ...first, sourceBundleId: undefined, screenId: undefined,
    questionGroups: [{ ...matrix, pageBreakBefore: true }] }]);
  assert.strictEqual(standalone.length, 1, 'a break at the beginning must not create an empty page');
  const repeated = buildQuestionnairePages([first, { ...first, occurrenceId: 'repeat2', screenId: 'other' }, first]);
  assert.strictEqual(repeated.length, 6, 'noncontiguous bundle pages must never be merged');
});
test('read-only progress counts the actual pages of each bundle, including internal questionnaire breaks', () => {
  const { QuestionnaireFormComponent } = require(path.join(root, 'assessment-form/questionnaire-form/questionnaire-form.component.ts'));
  const component = Object.create(QuestionnaireFormComponent.prototype);
  component.screens = [{ sourceBundleId: 'a' }, { sourceBundleId: 'a' }, { sourceBundleId: 'b' }];
  component.currentScreen = component.screens[1];
  assert.strictEqual(component.progressPage(), 2);
  assert.strictEqual(component.progressTotal(), 2);
  component.currentScreen = component.screens[2];
  assert.strictEqual(component.progressPage(), 1);
  assert.strictEqual(component.progressTotal(), 1);
  const template = fs.readFileSync(path.join(root, 'assessment-form/questionnaire-form/questionnaire-form.component.html'), 'utf8');
  assert.ok(!template.includes('nav-pills'));
  assert.ok(!template.includes('nzShape="circle"'));
});
test('responsive VAS layout reserves the measured label space, preserving exact endpoints across screen widths', () => {
  const { rangeLabelLayout } = require(path.join(root, 'assessment-form/question/question-type/range-question/range-layout.ts'));
  for (const width of [240, 286, 320, 375, 768, 900]) {
    for (const natural of [[38, 52], [180, 220], [38, 42, 60, 32, 58]]) {
      const labels = natural.map((value, index) => ({ position: index / (natural.length - 1), row: 'above', width: value }));
      const layout = rangeLabelLayout(width, labels);
      const track = width - layout.left - layout.right;
      assert.ok(track > width * 0.76, 'track should exceed the old fixed 76% width');
      labels.forEach((label, index) => {
        const center = layout.left + label.position * track;
        assert.ok(center - layout.widths[index] / 2 >= -1);
        assert.ok(center + layout.widths[index] / 2 <= width + 1);
      });
      assert.strictEqual(layout.left + track, width - layout.right);
    }
  }
  const readable = rangeLabelLayout(288, [
    { position: 0, row: 'above', width: 38, minWidth: 38 },
    { position: 0.5, row: 'above', width: 80, minWidth: 80 },
    { position: 1, row: 'above', width: 58, minWidth: 58 },
  ]);
  assert.strictEqual(readable.widths[1], 80, 'ordinary words should remain intact instead of breaking into narrow fragments');
  const single = rangeLabelLayout(320, [{ position: 0.5, row: 'above', width: 200 }]);
  assert.strictEqual(single.left, 16);
  assert.strictEqual(single.right, 16);
});
test('VAS endpoint label centers use the same exact anchors as the scale endpoints', () => {
  const { RangeQuestionComponent } = require(path.join(root, 'assessment-form/question/question-type/range-question/range-question.component.ts'));
  const component = new RangeQuestionComponent({ nativeElement: {} });
  component.question = { presentation: { min: 0, max: 100, labels: [
    { value: 0, position: 'above', align: 'auto' }, { value: 50, position: 'above', align: 'center' },
    { value: 100, position: 'above', align: 'auto' }] } };
  assert.deepStrictEqual(component.config.labels.map(label => component.position(label)), [0, 50, 100]);
  assert.deepStrictEqual(component.config.labels.map(label => component.alignment(label)), ['center', 'center', 'center']);

});
test('VAS opening and previewing do not store an implicit answer; zero and a deliberately chosen midpoint are saved', () => {
  const { RangeQuestionComponent } = require(path.join(root, 'assessment-form/question/question-type/range-question/range-question.component.ts'));
  const component = new RangeQuestionComponent({ nativeElement: {} });
  component.question = { name: 'vas', label: 'VAS', presentation: { min: 0, max: 100, labels: [], gradient: 'none' } };
  component.answer = { question: 'question-id', occurrenceId: 'repeat-id' };
  const saved = [];
  component.answerChange.subscribe(answer => saved.push({ ...answer }));
  assert.strictEqual(component.value, 50);
  assert.strictEqual(component.answered, false);
  assert.strictEqual(saved.length, 0);
  component.input('37.125');
  assert.strictEqual(component.value, 37.125);
  assert.strictEqual(component.answer.numberValue, undefined);
  component.commit('50');
  component.commit('50'); // native change and pointer-up must not double-submit
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].numberValue, 50);
  component.commit('0');
  assert.strictEqual(component.answered, true);
  assert.strictEqual(component.value, 0);
  assert.strictEqual(saved[1].question, 'question-id');
  assert.strictEqual(saved[1].occurrenceId, 'repeat-id');
});
test('documented spreadsheet conditions preserve text codes, numeric comparisons and words containing or', () => {
  const { SkipLogic } = require(path.join(root, 'assessment-form/skip-logic.ts'));
  const questions = [{ _id: 'a', name: 'actividad', type: 'select_one' }, { _id: 'b', name: 'sintomas', type: 'select_multiple' },
    { _id: 'c', name: 'dias', type: 'integer' }];
  const answers = [{ question: 'a', textValue: 'si' }, { question: 'b', multipleChoiceValue: ['dolor'] }, { question: 'c', numberValue: 4 }];
  for (const relevant of ["${actividad} = 'si'", "selected(${sintomas}, 'dolor')", '${dias} > 3', '${dias} < 5',
    "${actividad} = 'no' or ${dias} > 3 and selected(${sintomas}, 'dolor')"]) {
    assert.strictEqual(SkipLogic.create({ relevant }, questions, answers), true, relevant);
  }
  assert.strictEqual(SkipLogic.create({ relevant: "${actividad} = 'no'" }, questions, answers), false);
});
test('Likert matrices never merge lists with different answer codes just because their labels match', () => {
  const previousClone = global.structuredClone;
  global.structuredClone = value => JSON.parse(JSON.stringify(value));
  try {
    const { AssessmentFormComponent } = require(path.join(root, 'assessment-form/assessment-form.component.ts'));
    let result;
    const original = { questionnaireAssessment: { questionnaires: [{ _id: 'q', questionnaire: { language: 'es' }, questionGroups: [{
      appearance: 'likert-matrix', questions: [{ _id: 'one', type: 'select_one', choices: [{ name: 'a', label: 'Same label' }] },
        { _id: 'two', type: 'select_one', choices: [{ name: 'b', label: 'Same label' }] }],
    }] }] } };
    const component = new AssessmentFormComponent({ setAssessment: assessment => result = assessment }, { data: of({ assessment: original }) },
      { setSupportedLanguages: () => {} });
    const matrices = result.questionnaireAssessment.questionnaires[0].questionGroups[0].uniqueQuestions;
    assert.strictEqual(matrices.length, 2);
    assert.strictEqual(matrices[0].choices[0].name, 'a');
    assert.strictEqual(matrices[1].choices[0].name, 'b');
    assert.strictEqual(original.questionnaireAssessment.questionnaires[0].questionGroups[0].questions.length, 2);
    if (component.ngOnDestroy) component.ngOnDestroy();
  } finally { global.structuredClone = previousClone; }
});
test('reusing a VAS for another occurrence resets the preview instead of borrowing the previous response', () => {
  const { RangeQuestionComponent } = require(path.join(root, 'assessment-form/question/question-type/range-question/range-question.component.ts'));
  const component = new RangeQuestionComponent({ nativeElement: {} });
  component.question = { _id: 'same-question', presentation: { min: 0, max: 100, labels: [] } };
  component.answer = { question: 'same-question', occurrenceId: 'first', numberValue: 20 };
  component.ngOnChanges();
  component.input('75');
  component.answer = { question: 'same-question', occurrenceId: 'second' };
  component.ngOnChanges();
  assert.strictEqual(component.answered, false);
  assert.strictEqual(component.value, 50);
  assert.strictEqual(component.answer.numberValue, undefined);
});
test('question inputs load the matching occurrence regardless of Angular input assignment order', () => {
  const { QuestionComponent } = require(path.join(root, 'assessment-form/question/question.component.ts'));
  const service = { questionnaireSnapshot: { occurrenceId: 'first' }, assessmentSnapshot: { questionnaireAssessment: { answers: [
    { question: 'same-question', occurrenceId: 'first', numberValue: 20 },
    { question: 'same-question', occurrenceId: 'second', numberValue: 80 },
  ] } } };
  const component = new QuestionComponent(service, {});
  component.question = { _id: 'same-question', type: 'decimal' };
  component.questionnaire = { _id: 'q', occurrenceId: 'second' };
  assert.strictEqual(component.answer.numberValue, 80);
  assert.strictEqual(component.answer.occurrenceId, 'second');
  component.answerGiven.complete();
});
console.log(count + ' local regression checks passed');
