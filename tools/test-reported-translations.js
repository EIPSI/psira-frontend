const path = require('path');
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = process.env.PSIRA_TEST_BACKEND_ROOT || path.resolve(frontendRoot, '../psira-backend');
require(path.join(backendRoot, 'node_modules/reflect-metadata'));
require(path.join(frontendRoot, 'node_modules/zone.js/dist/zone-node'));
const assert = require('assert');
const { JSDOM } = require(path.join(backendRoot, 'node_modules/jsdom'));
const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (!(key in global)) Object.defineProperty(global, key, Object.getOwnPropertyDescriptor(dom.window, key));
}
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
window.Zone = global.Zone;
require(path.join(frontendRoot, 'node_modules/@angular/compiler'));
const fs = require('fs'); const ts = require(path.join(frontendRoot, 'node_modules/typescript'));
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018, experimentalDecorators: true, emitDecoratorMetadata: true },
}).outputText, filename);
const Module = require('module');
const appRoot = path.join(frontendRoot, 'src/app');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  if(request.startsWith('@shared/')) request=path.join(appRoot,'@shared',request.slice(8));
  if(request.startsWith('@app/')) request=path.join(appRoot,request.slice(5));
  if(request.startsWith('@env/')) request=path.join(frontendRoot,'src/environments',request.slice(5));
  return originalResolve.call(this,request,parent,...args);
};
const { Component, Input, Pipe, NO_ERRORS_SCHEMA } = require('@angular/core');
const { TestBed } = require('@angular/core/testing');
const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = require('@angular/platform-browser-dynamic/testing');
const { FormsModule } = require('@angular/forms');
const { TranslateModule, TranslateService, TranslateLoader } = require('@ngx-translate/core');
const { of } = require('rxjs');
const { DynamicTranslationLoader } = require(path.join(appRoot,'@core/dynamic-translation-loader.ts'));
const { NzContextMenuService } = require('ng-zorro-antd/dropdown');
const { MasterDataTableComponent } = require(path.join(appRoot,'@shared/@modules/master-data/master-data-table/master-data-table.component.ts'));
const { FormComponent } = require(path.join(appRoot,'@shared/components/form/form.component.ts'));
const { settingsForms } = require(path.join(appRoot,'pages/administration/settings/@forms/form.ts'));
const { EvaluationSchemeType, EvaluationSchemeTypeLabel } = require(path.join(appRoot,'pages/evaluation-schemes/@types/evaluation-scheme.ts'));
const live = process.env.PSIRA_LIVE_BUNDLES ? JSON.parse(fs.readFileSync(process.env.PSIRA_LIVE_BUNDLES,'utf8')) : null;
const keys = [
 'tables.casemanagers.departments','evaluationSchemes.sessionBased','evaluationSchemes.fixedScheme',
 'roles.patient','roles.caregiver','roles.therapist','roles.supervisor','core.draft','core.paused','core.archived',
 'tables.roles.createdAt','systemSettings.dateFormatDescription','systemSettings.timeFormatDescription',
 'systemSettings.dateTimeFormatDescription','systemSettings.passwordLifeTimeDescription',
 'systemSettings.passwordReuseCutoffDescription','systemSettings.notificationLogRetentionDescription',
 'systemSettings.accessTokenRetentionDescription','systemSettings.maxLoginAttemptsDescription',
 'form.system.evaluationAutomationRunRetentionDays','systemSettings.evaluationAutomationRunRetentionDescription',
 'form.system.treatmentFinalizationUndoWindowDays','systemSettings.treatmentFinalizationUndoWindowDescription',
 'form.system.patientCaseManagerAssignableHierarchyRank','systemSettings.patientCaseManagerAssignableHierarchyRankDescription',
];
const get = (value,key)=>key.split('.').reduce((object,part)=>object&&object[part],value);
const editorFile=path.join(appRoot,'pages/evaluation-schemes/scheme-editor/scheme-editor.component.html');
const editor=fs.readFileSync(editorFile,'utf8');
const options=(editor.match(/<nz-option\b[\s\S]*?<\/nz-option>/g)||[])
 .filter(option=>option.includes('responderRoleOptions')||option.includes('schemeTypeLabel'));
assert.strictEqual(options.length,4,'check all three role selectors and the scheme-type selector');
class Option {}
Input()(Option.prototype,'nzLabel'); Input()(Option.prototype,'nzValue');
Component({selector:'nz-option',template:'<span class="option-label">{{nzLabel}}</span>'})(Option);
class TableStub { set nzData(value) {this.data=value;} }
Input()(TableStub.prototype,'nzData');
Component({selector:'nz-table',template:'<ng-content></ng-content>'})(TableStub);
class DisplayPipe { transform(value){return value;} }
class DatePipe { transform(value){return value;} }
class CountryPipe { transform(value){return value;} }
Pipe({name:'noSanitize'})(DisplayPipe);Pipe({name:'formatDate'})(DatePipe);Pipe({name:'country'})(CountryPipe);
class Host {
 constructor(){
  this.keys=keys;
  this.columns=keys.map((key,index)=>({name:'field'+index,title:key,translationPath:key,render:'tag'}));
  this.rows=[Object.fromEntries(keys.map((key,index)=>['field'+index,{title:key,translationPath:key}]))];
  this.form=settingsForms.general;
  this.schemeTypes=Object.values(EvaluationSchemeType);
  this.schemeTypeLabel=EvaluationSchemeTypeLabel;
  this.responderRoleOptions=['PATIENT','CAREGIVER','THERAPIST','SUPERVISOR'].map(value=>({value,label:'roles.'+value.toLowerCase()}));
 }
}
Component({template:'<span class="reported" *ngFor="let key of keys">{{key | translate}}</span>'+options.join('\n')+
 '<app-form [form]="form" [inputMode]="false"></app-form><app-master-data-table [columns]="columns" [data]="rows"></app-master-data-table>'})(Host);
(async()=>{
 TestBed.initTestEnvironment(BrowserDynamicTestingModule,platformBrowserDynamicTesting());
 const loader=new DynamicTranslationLoader({post:(_,request)=>of({data:{languageBundle:{
   translationsJson:JSON.stringify(live ? live[request.variables.languageCode] : {}),
 }}})});
 TestBed.configureTestingModule({imports:[FormsModule,TranslateModule.forRoot({loader:{provide:TranslateLoader,useValue:loader}})],
  declarations:[Host,Option,FormComponent,MasterDataTableComponent,TableStub,DisplayPipe,DatePipe,CountryPipe],
  providers:[{provide:NzContextMenuService,useValue:{create(){}}}],schemas:[NO_ERRORS_SCHEMA]});
 TestBed.overrideComponent(FormComponent,{set:{templateUrl:undefined,styleUrls:[],
  template:fs.readFileSync(path.join(appRoot,'@shared/components/form/form.component.html'),'utf8')}});
 TestBed.overrideComponent(MasterDataTableComponent,{set:{templateUrl:undefined,styleUrls:[],
  template:fs.readFileSync(path.join(appRoot,'@shared/@modules/master-data/master-data-table/master-data-table.component.html'),'utf8')}});
 await TestBed.compileComponents();
 const fixture=TestBed.createComponent(Host);
 const translate=TestBed.inject(TranslateService);
 for(const locale of ['es','en','de','nl']){
  const dictionary=require(path.join(frontendRoot,'src/translations',locale+'.ts')).default;
  await translate.use(locale).toPromise();fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
  for(const [index,key]of keys.entries()){
   const expected=get(dictionary,key);
   assert.ok(expected&&expected!==key,locale+': missing source '+key);
   assert.strictEqual(translate.instant(key),expected,locale+': merged translation '+key);
   assert.strictEqual(fixture.nativeElement.querySelectorAll('.reported')[index].textContent,expected);
   if(live)assert.strictEqual(get(live[locale],key),expected,locale+': backend '+key);
  }
  const table=fixture.nativeElement.querySelector('app-master-data-table');
  assert.deepStrictEqual(Array.from(table.querySelectorAll('th')).map(node=>node.textContent.trim()),keys.map(key=>get(dictionary,key)));
  assert.deepStrictEqual(Array.from(table.querySelectorAll('nz-tag')).map(node=>node.textContent.trim()),keys.map(key=>get(dictionary,key)));
  const labels=Array.from(fixture.nativeElement.querySelectorAll('.option-label')).map(node=>node.textContent);
  assert.strictEqual(labels.length,14);
  assert.deepStrictEqual(labels.slice(0,2),Object.values(EvaluationSchemeTypeLabel).map(key=>get(dictionary,key)));
  for(let index=2;index<labels.length;index+=4)
   assert.deepStrictEqual(labels.slice(index,index+4),['patient','caregiver','therapist','supervisor'].map(role=>dictionary.roles[role]));
  const form=fixture.nativeElement.querySelector('app-form');
  for(const field of settingsForms.general.groups.flatMap(group=>group.fields)){
   if(keys.includes(field.title))assert.ok(form.textContent.includes(get(dictionary,field.title)),locale+': field '+field.title);
   if(keys.includes(field.description))assert.ok(form.textContent.includes(get(dictionary,field.description)),locale+': description '+field.description);
  }
  console.log('PASS '+locale+': all 25 keys, 14 selector options and system-settings labels/descriptions'+(live?' with live backend translations':''));
 }
 fixture.destroy();TestBed.resetTestingModule();process.exit(0);
})().catch(error=>{console.error(error.stack);process.exit(1)});
