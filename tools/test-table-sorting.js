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
const { parse, print, buildSchema, validate, getOperationAST } = require('graphql');
const { getVariableValues } = require('graphql/execution/values');
// The isolated backend schema supplies the newly generated inputs and arguments.
// Retain the running schema's relation fields, which are supplied by generated resolvers.
const generated = parse(fs.readFileSync(process.env.PSIRA_SORT_SCHEMA_PATH, 'utf8'));
const complete = parse(fs.readFileSync(process.env.PSIRA_SCHEMA_PATH, 'utf8'));
const generatedQuery = generated.definitions.find(node => node.name && node.name.value === 'Query');
const completeQuery = complete.definitions.find(node => node.name && node.name.value === 'Query');
for (const field of generatedQuery.fields) {
  const existing = completeQuery.fields.find(node => node.name.value === field.name.value);
  const argument = field.arguments.find(node => node.name.value === 'tableSorting');
  if (argument) existing.arguments.push(argument);
}
complete.definitions.push(generated.definitions.find(node => node.name && node.name.value === 'TableSortInput'));
const departmentSort = complete.definitions.find(node => node.name && node.name.value === 'DepartmentSortFields');
const generatedDepartmentSort = generated.definitions.find(node => node.name && node.name.value === 'DepartmentSortFields');
for (const value of generatedDepartmentSort.values) {
  if (!departmentSort.values.some(node => node.name.value === value.name.value)) departmentSort.values.push(value);
}
const schema = buildSchema(print(complete));
const groups = [
  ['reports', 'ReportsQueries', 'reports', 'administration/@tables/reports.table.ts', 'ReportsColumns',
    'administration/@services/reports.service.ts', 'ReportsService', 'reports'],
  ['assessments', 'AssessmentsQueries', 'assessments', 'assessment/@tables/assessment.table.ts', 'AssessmentTable',
    'assessment/@services/assessment.service.ts', 'AssessmentService', 'getAssessments'],
  ['email-templates', 'EmailTemplatesQueries', 'getAllEmailTemplates', 'administration/@tables/email-templates.table.ts', 'EmailTemplatesColumns',
    'administration/@services/email-templates.service.ts', 'EmailTemplatesService', 'getAllEmailTemplates'],
];
let count = 0;
for (const [file, exported, key, tableFile, tableExport, serviceFile, serviceExport, method] of groups) {
  const query = require(path.join(root, '@graphql/queries', file + '.ts'))[exported][key];
  assert.deepStrictEqual(validate(schema, query).map(error => error.message), []);
  const columns = require(path.join(root, 'pages', tableFile))[tableExport];
  const Service = require(path.join(root, 'pages', serviceFile))[serviceExport];
  for (const column of columns.filter(item => item.sort)) {
    for (const direction of ['ASC', 'DESC']) {
      const sorting = [{ field: column.altName || column.name, direction }];
      let request;
      const apollo = { query: options => { request = options; return of({ data: { assessments: {} } }); } };
      const service = new Service(apollo, null);
      service[method]({ paging: { first: 10 }, sorting });
      assert.deepStrictEqual(request.variables.tableSorting, sorting);
      assert.deepStrictEqual((getVariableValues(schema, getOperationAST(query).variableDefinitions,
        request.variables).errors || []).map(error => error.message), []);
      count++;
    }
  }
  console.log('PASS all visible sort columns: ' + key);
}
const { DepartmentsQueries } = require(path.join(root, '@graphql/queries/departments.ts'));
const { DepartmentColumns } = require(path.join(root, 'pages/administration/@tables/departments.table.ts'));
for (const column of DepartmentColumns) {
  assert.strictEqual(column.sort, true);
  const result = getVariableValues(schema, getOperationAST(DepartmentsQueries.departments).variableDefinitions,
    { paging: { first: 10 }, sorting: [{ field: column.altName || column.name, direction: 'ASC' }] });
  assert.deepStrictEqual((result.errors || []).map(error => error.message), []);
  count++;
}
for (const locale of ['es', 'en', 'de', 'nl']) {
  const dictionary = require(path.resolve(root, '../translations', locale + '.ts')).default;
  for (const key of ['name', 'description', 'formattedCreatedAt', 'formattedUpdatedAt']) {
    assert.ok(dictionary.tables.patientStatuses[key]);
  }
}
console.log(count + ' column and direction combinations checked; patient status labels translated in four languages');
