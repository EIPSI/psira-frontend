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
const { Component } = require(path.join(frontendRoot, 'node_modules/@angular/core'));
const { TestBed } = require(path.join(frontendRoot, 'node_modules/@angular/core/testing'));
const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = require(path.join(frontendRoot, 'node_modules/@angular/platform-browser-dynamic/testing'));
const { FormsModule } = require(path.join(frontendRoot, 'node_modules/@angular/forms'));
const { NoopAnimationsModule } = require(path.join(frontendRoot, 'node_modules/@angular/platform-browser/animations'));
const { NzDatePickerModule, NzDatePickerComponent } = require(path.join(frontendRoot, 'node_modules/ng-zorro-antd/date-picker'));
const { NZ_I18N, en_US } = require(path.join(frontendRoot, 'node_modules/ng-zorro-antd/i18n'));
const { By } = require(path.join(frontendRoot, 'node_modules/@angular/platform-browser'));
const { UserDateTimeModule } = require(path.join(frontendRoot, 'src/app/@shared/directives/user-date-time/user-date-time.module.ts'));
process.env.TZ='UTC';
localStorage.setItem('user',JSON.stringify({timezone:'America/Argentina/Buenos_Aires'}));
class Host { constructor(){this.value=new Date('2026-10-21T17:45:00Z');} }
Component({template:'<nz-date-picker [(ngModel)]="value" nzShowTime nzFormat="yyyy-MM-dd HH:mm"></nz-date-picker>'})(Host);
(async()=>{
 TestBed.initTestEnvironment(BrowserDynamicTestingModule,platformBrowserDynamicTesting());
 await TestBed.configureTestingModule({ imports:[FormsModule,NoopAnimationsModule,NzDatePickerModule,UserDateTimeModule], declarations:[Host], providers:[{provide:NZ_I18N,useValue:en_US}] }).compileComponents();
 const fixture=TestBed.createComponent(Host);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
 await fixture.whenStable();fixture.detectChanges();
 const input=fixture.nativeElement.querySelector('input');
 assert.strictEqual(input.value,'2026-10-21 14:45');
 const picker=fixture.debugElement.query(By.directive(NzDatePickerComponent)).componentInstance;
 picker.onChangeFn(new Date(2026,9,21,15,45));fixture.detectChanges();await fixture.whenStable();
 assert.strictEqual(fixture.componentInstance.value.toISOString(),'2026-10-21T18:45:00.000Z');
 fixture.destroy();TestBed.resetTestingModule();console.log('PASS real Angular date picker display and edit integration');process.exit(0);
})().catch(error=>{console.error(error.stack);process.exit(1)});
