import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { InformedConsentService } from '../@services/informed-consent.service';
import {
  InformedConsentAnswerResolution,
  InformedConsentKind,
  InformedConsentKindLabel,
  InformedConsentModel,
  InformedConsentQuestionType,
  InformedConsentShortcut,
  InformedConsentVersion,
} from '../@types/informed-consent';

type ConsentBlockType = 'TEXT' | 'QUESTION';

@Component({
  selector: 'app-informed-consent-model-editor',
  templateUrl: './model-editor.component.html',
  styleUrls: ['./model-editor.component.scss'],
})
export class InformedConsentModelEditorComponent implements OnInit {
  modelId?: number;
  loading = false;
  saving = false;
  departments: any[] = [];
  kinds = Object.values(InformedConsentKind);
  kindLabel = InformedConsentKindLabel;
  questionTypes = Object.values(InformedConsentQuestionType);
  resolutions = Object.values(InformedConsentAnswerResolution);
  shortcuts: InformedConsentShortcut[] = [];
  shortcutGroups: Array<{ group: string; items: InformedConsentShortcut[] }> = [];
  model?: InformedConsentModel;
  shortcutsVisible = false;
  versionsVisible = false;
  previewVisible = false;
  selectedVersion?: InformedConsentVersion;
  previewBlocks: any[] = [];
  previewTitle = '';
  activeShortcutBlockIndex?: number;
  versionTitleTouched = false;
  blockTypes: Array<{ value: ConsentBlockType; label: string }> = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'QUESTION', label: 'Pregunta' },
  ];
  editorConfig: AngularEditorConfig = {
    minHeight: '180px',
    editable: true,
    sanitize: false,
  };

  form = this.fb.group({
    name: ['', Validators.required],
    kind: [InformedConsentKind.TERMS_OF_USE],
    description: [''],
    active: [true],
    systemDefault: [false],
    departmentIds: [[]],
    versionTitle: ['', Validators.required],
    submitButtonLabel: ['Registrar respuesta', Validators.required],
    thankYouHtml: ['<p>Gracias. Tu respuesta fue registrada correctamente.</p>'],
    versionNotes: [''],
    blocks: this.fb.array([]),
  });

  get blocks(): FormArray {
    return this.form.get('blocks') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: InformedConsentService,
    private departmentsService: DepartmentsService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.modelId = Number(id);
    this.form.get('name').valueChanges.subscribe(() => this.syncDefaultVersionTitle());
    this.addBlock('TEXT');
    this.loadReferences();
    this.loadShortcuts();
    if (this.modelId) this.loadModel(this.modelId);
  }

  loadReferences(): void {
    this.departmentsService.departments({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }).subscribe(
      (result: any) => (this.departments = result.data.departments.edges.map((edge: any) => edge.node)),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load departments' })
    );
  }

  loadShortcuts(): void {
    this.service.getShortcuts().subscribe(
      (shortcuts) => {
        this.shortcuts = shortcuts || [];
        this.shortcutGroups = this.buildShortcutGroups(this.shortcuts);
      },
      () => {
        this.shortcuts = [];
        this.shortcutGroups = [];
      }
    );
  }

  loadModel(id: number): void {
    this.loading = true;
    this.service.getModel(id).pipe(finalize(() => (this.loading = false))).subscribe(
      (model) => {
        this.model = model;
        this.blocks.clear();
        this.versionTitleTouched = false;
        this.form.patchValue({
          name: model.name,
          kind: model.kind,
          description: model.description || '',
          active: model.active,
          systemDefault: false,
          departmentIds: model.departments?.map((department) => department.id) || [],
          versionTitle: this.defaultVersionTitle(model.name, (model.versions?.length || 0) + 1),
          submitButtonLabel: model.currentPublishedVersion?.submitButtonLabel || 'Registrar respuesta',
          thankYouHtml: model.currentPublishedVersion?.thankYouHtml || '<p>Gracias. Tu respuesta fue registrada correctamente.</p>',
          versionNotes: '',
        }, { emitEvent: false });
        this.hydrateBlocks(model.currentPublishedVersion);
        if (!this.blocks.length) this.addBlock('TEXT');
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load informed consent model' })
    );
  }

  addBlock(blockType: ConsentBlockType = 'TEXT', block: any = {}): void {
    this.blocks.push(this.blockGroup(blockType, block));
  }

  removeBlock(index: number): void {
    if (this.blocks.length > 1) this.blocks.removeAt(index);
  }

  changeBlockType(index: number, blockType: ConsentBlockType): void {
    const current = this.blocks.at(index).value;
    this.blocks.setControl(index, this.blockGroup(blockType, { orderIndex: current.orderIndex }));
  }

  private blockGroup(blockType: ConsentBlockType, block: any = {}): any {
    const base = {
      blockType: [blockType, Validators.required],
      orderIndex: [block.orderIndex || this.blocks.length + 1, Validators.required],
    };
    if (blockType === 'TEXT') {
      return this.fb.group({
        ...base,
        title: [block.title || ''],
        content: [block.content || '', Validators.required],
      });
    }
    return this.fb.group({
      ...base,
      kind: [block.kind || block.kinds?.[0] || null],
      kinds: [block.kinds?.length ? block.kinds : (block.kind ? [block.kind] : [])],
      questionType: [block.questionType || InformedConsentQuestionType.SINGLE_CHOICE, Validators.required],
      label: [block.label || '', Validators.required],
      helpText: [block.helpText || ''],
      required: [block.required !== false],
      answerOptions: this.fb.array((block.answerOptions?.length ? block.answerOptions : [
        { orderIndex: 1, label: 'Acepto', resolution: InformedConsentAnswerResolution.ACCEPTS },
        { orderIndex: 2, label: 'No acepto', resolution: InformedConsentAnswerResolution.REJECTS },
      ]).map((option: any) => this.optionGroup(option))),
    });
  }

  private hydrateBlocks(version?: InformedConsentVersion): void {
    const textBlocks = (version?.textBlocks || []).map((block) => ({ ...block, blockType: 'TEXT' as ConsentBlockType }));
    const questions = (version?.questions || []).map((question) => ({ ...question, blockType: 'QUESTION' as ConsentBlockType }));
    [...textBlocks, ...questions]
      .sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0))
      .forEach((block) => this.addBlock(block.blockType, block));
  }

  options(questionIndex: number): FormArray {
    return this.blocks.at(questionIndex).get('answerOptions') as FormArray;
  }

  addOption(questionIndex: number): void {
    const options = this.options(questionIndex);
    options.push(this.optionGroup({ orderIndex: options.length + 1, value: '', label: '', resolution: InformedConsentAnswerResolution.NOT_APPLICABLE }));
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.options(questionIndex).removeAt(optionIndex);
  }

  selectAllDepartments(): void {
    this.form.patchValue({ departmentIds: this.departments.map((department) => department.id) });
  }

  removeDepartments(): void {
    this.form.patchValue({ departmentIds: [] });
  }

  previewCurrent(): void {
    this.previewTitle = this.form.get('versionTitle').value || this.form.get('name').value || 'Consentimiento informado';
    this.previewBlocks = this.blocks.value.map((block: any, index: number) => ({
      ...block,
      orderIndex: index + 1,
    }));
    this.previewVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Completá los campos obligatorios.');
      return;
    }
    if (!this.validChoiceQuestions()) {
      this.message.warning('Las preguntas de selección necesitan respuestas con texto y resolución.');
      return;
    }
    const value = this.form.value;
    const blocks = this.normalizedBlocks(value.blocks || []);
    const payload = {
      ...value,
      kind: this.primaryModelKind(blocks.questions),
      systemDefault: false,
      departmentIds: (value.departmentIds || []).map((id: any) => Number(id)),
      textBlocks: blocks.textBlocks,
      questions: blocks.questions.map((question: any) => ({
        ...question,
        kind: question.kinds?.[0] || question.kind || InformedConsentKind.TERMS_OF_USE,
        answerOptions: (question.answerOptions || []).map((option: any) => ({
          ...option,
          value: option.value || this.optionValue(option.label, option.orderIndex),
          blocksUsageOnSelection: !!option.blocksUsageOnSelection,
        })),
      })),
    };
    delete (payload as any).blocks;
    this.saving = true;
    const request = this.modelId
      ? this.service.updateModel({ id: this.modelId, ...payload })
      : this.service.createModel(payload);
    request.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.message.success('Modelo guardado');
        this.router.navigate(['/psira/informed-consent/models']);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to save informed consent model' })
    );
  }

  private optionGroup(option: any) {
    return this.fb.group({
      orderIndex: [option.orderIndex, Validators.required],
      value: [option.value || ''],
      label: [option.label, Validators.required],
      resolution: [option.resolution, Validators.required],
      blocksUsageOnSelection: [!!option.blocksUsageOnSelection],
    });
  }

  cancel(): void {
    this.router.navigate(['/psira/informed-consent/models']);
  }

  showShortcuts(): void {
    this.activeShortcutBlockIndex = undefined;
    this.shortcutsVisible = true;
  }

  showBlockShortcuts(index: number): void {
    this.activeShortcutBlockIndex = index;
    this.shortcutsVisible = true;
  }

  showVersions(): void {
    this.selectedVersion = this.sortedVersions()[0];
    this.versionsVisible = true;
  }

  sortedVersions(): InformedConsentVersion[] {
    return [...(this.model?.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  selectVersion(version: InformedConsentVersion): void {
    this.selectedVersion = version;
  }

  versionBlocks(version?: InformedConsentVersion): any[] {
    const textBlocks = (version?.textBlocks || []).map((block) => ({
      ...block,
      blockType: 'TEXT' as ConsentBlockType,
    }));
    const questions = (version?.questions || []).map((question) => ({
      ...question,
      blockType: 'QUESTION' as ConsentBlockType,
    }));
    return [...textBlocks, ...questions].sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
  }

  consentKindNames(kinds?: InformedConsentKind[], kind?: InformedConsentKind): string {
    const values = kinds?.length ? kinds : (kind ? [kind] : []);
    return values.length ? values.map((value) => this.kindLabel[value] || value).join(', ') : 'Sin tipo asociado';
  }

  resolutionLabel(resolution?: InformedConsentAnswerResolution): string {
    const labels: Record<string, string> = {
      [InformedConsentAnswerResolution.ACCEPTS]: 'Acepta',
      [InformedConsentAnswerResolution.REJECTS]: 'Rechaza',
      [InformedConsentAnswerResolution.REQUIRES_REVIEW]: 'Requiere revisión',
      [InformedConsentAnswerResolution.NOT_APPLICABLE]: 'No aplica',
    };
    return resolution ? labels[resolution] || resolution : '-';
  }

  private buildShortcutGroups(shortcuts: InformedConsentShortcut[]): Array<{ group: string; items: InformedConsentShortcut[] }> {
    const groups = new Map<string, InformedConsentShortcut[]>();
    for (const shortcut of shortcuts) {
      groups.set(shortcut.group, [...(groups.get(shortcut.group) || []), shortcut]);
    }
    return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
  }

  trackShortcutGroup(_: number, group: { group: string }): string {
    return group.group;
  }

  trackShortcut(_: number, shortcut: InformedConsentShortcut): string {
    return shortcut.token;
  }

  shortcutGroupTitle(group: string): string {
    const labels: Record<string, string> = {
      user: 'Usuario',
      patient: 'Paciente',
      therapist: 'Terapeuta',
      supervisor: 'Supervisor',
      case: 'Caso',
      assessment: 'Evaluación',
      session: 'Sesión',
      consent: 'Consentimiento informado',
      system: 'Sistema',
      notification: 'Notificación',
    };
    const normalized = String(group || '').trim();
    const key = normalized.toLowerCase();
    return labels[key] || normalized
      .replace(/[_-]+/g, ' ')
      .replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
  }

  copyShortcut(token: string, event?: Event): void {
    event?.stopPropagation();
    const copied = this.clipboard.copy(token);
    copied ? this.message.success('Variable copiada') : this.message.error('No se pudo copiar la variable');
  }

  private validChoiceQuestions(): boolean {
    return this.normalizedBlocks(this.form.value.blocks || []).questions.every((question: any) => {
      const choice = [
        InformedConsentQuestionType.CHECKBOX,
        InformedConsentQuestionType.SINGLE_CHOICE,
        InformedConsentQuestionType.MULTIPLE_CHOICE,
      ].includes(question.questionType);
      if (!choice) return true;
      return (question.answerOptions || []).length
        && question.answerOptions.every((option: any) => option.label && option.resolution);
    });
  }

  private primaryModelKind(questions: any[] = []): InformedConsentKind {
    return questions.find((question) => question.kinds?.length)?.kinds[0]
      || InformedConsentKind.TERMS_OF_USE;
  }

  private normalizedBlocks(blocks: any[]): { textBlocks: any[]; questions: any[] } {
    const textBlocks: any[] = [];
    const questions: any[] = [];
    blocks.forEach((block, index) => {
      const orderIndex = index + 1;
      if (block.blockType === 'TEXT') {
        textBlocks.push({
          orderIndex,
          title: block.title || '',
          content: block.content || '',
        });
        return;
      }
      questions.push({
        orderIndex,
        kind: block.kinds?.[0] || block.kind || InformedConsentKind.TERMS_OF_USE,
        kinds: block.kinds || [],
        questionType: block.questionType,
        label: block.label,
        helpText: block.helpText,
        required: block.required !== false,
        answerOptions: block.answerOptions || [],
      });
    });
    return { textBlocks, questions };
  }

  syncDefaultVersionTitle(): void {
    if (this.versionTitleTouched) return;
    this.form.patchValue({
      versionTitle: this.defaultVersionTitle(this.form.get('name').value, this.nextVersionNumber()),
    }, { emitEvent: false });
  }

  markVersionTitleTouched(): void {
    this.versionTitleTouched = true;
  }

  insertShortcut(token: string): void {
    if (this.activeShortcutBlockIndex === undefined) return;
    const contentControl = this.blocks.at(this.activeShortcutBlockIndex)?.get('content');
    contentControl?.setValue(`${contentControl.value || ''} ${token}`);
  }

  private nextVersionNumber(): number {
    return this.modelId ? (this.model?.versions?.length || 0) + 1 : 1;
  }

  private defaultVersionTitle(name: string, versionNumber: number): string {
    return `${this.versionPrefix(name)} - V${versionNumber || 1}`;
  }

  private versionPrefix(name: string): string {
    const words = String(name || 'Consentimiento')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return 'CI';
    if (words.length === 1) return words[0].toUpperCase();
    return words.map((word) => word[0]).join('').toUpperCase();
  }

  private optionValue(label: string, orderIndex: number): string {
    return (label || `option-${orderIndex}`)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `option-${orderIndex}`;
  }
}
