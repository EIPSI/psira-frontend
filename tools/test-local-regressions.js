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
console.log(count + ' local regression checks passed');
