import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import {
  Language,
  LanguageSettingsService,
  TranslationKey,
  TranslationValue,
} from './language-settings.service';

type TranslationRow = TranslationKey & {
  value: string;
  originalValue: string;
  dirty: boolean;
};

type LanguageShortcut = {
  token: string;
  variable: string;
  description: string;
  keys: string[];
};

@Component({
  selector: 'app-language-settings',
  templateUrl: './language-settings.component.html',
  styleUrls: ['./language-settings.component.scss'],
})
export class LanguageSettingsComponent implements OnInit {
  languages: Language[] = [];
  selectedLanguage?: Language;
  rows: TranslationRow[] = [];
  loading = false;
  savingKey?: string;
  search = '';
  namespace = '';
  languageModalVisible = false;
  shortcutsVisible = false;
  languageDraft: Partial<Language> = {};

  constructor(
    private service: LanguageSettingsService,
    private message: NzMessageService,
    private translate: TranslateService,
    private clipboard: Clipboard
  ) {}

  sortByKey = (a: TranslationRow, b: TranslationRow) => a.key.localeCompare(b.key);
  sortByDefault = (a: TranslationRow, b: TranslationRow) => (a.defaultText || '').localeCompare(b.defaultText || '');

  ngOnInit(): void {
    this.loadLanguages();
  }

  get namespaces(): string[] {
    return Array.from(new Set(this.rows.map((row) => row.namespace))).sort();
  }

  get filteredRows(): TranslationRow[] {
    const term = this.search.trim().toLowerCase();
    return this.rows.filter((row) => {
      const matchesNamespace = !this.namespace || row.namespace === this.namespace;
      const matchesSearch =
        !term ||
        row.key.toLowerCase().includes(term) ||
        (row.defaultText || '').toLowerCase().includes(term) ||
        (row.value || '').toLowerCase().includes(term);
      return matchesNamespace && matchesSearch;
    });
  }

  get shortcuts(): LanguageShortcut[] {
    const byVariable = new Map<string, Set<string>>();
    this.rows.forEach((row) => {
      const variables = new Set<string>([
        ...(row.variables || []),
        ...this.extractVariables(row.defaultText || ''),
        ...this.extractVariables(row.value || ''),
      ]);
      variables.forEach((variable) => {
        if (!byVariable.has(variable)) byVariable.set(variable, new Set<string>());
        byVariable.get(variable).add(row.key);
      });
    });
    return Array.from(byVariable.keys()).sort().map((variable) => {
      const keys = Array.from(byVariable.get(variable) || []).sort();
      return {
        token: `{{${variable}}}`,
        variable,
        description: this.shortcutDescription(variable, keys),
        keys,
      };
    });
  }

  get hasShortcuts(): boolean {
    return this.shortcuts.length > 0;
  }

  loadLanguages(): void {
    this.loading = true;
    this.service.languages().subscribe(
      (languages) => {
        this.languages = languages;
        this.selectedLanguage = this.selectedLanguage
          ? languages.find((language) => language.id === this.selectedLanguage.id)
          : languages.find((language) => language.isDefault) || languages[0];
        this.loadTranslations();
      },
      (error) => {
        // Keep the UI message friendly, but preserve the GraphQL details for debugging deployments.
        console.error('[LanguageSettings] Unable to load languages', error);
        this.loading = false;
        this.message.error(this.translate.instant('language.unableLoadLanguages'));
      }
    );
  }

  selectLanguage(language: Language): void {
    this.selectedLanguage = language;
    this.loadTranslations();
  }

  loadTranslations(): void {
    if (!this.selectedLanguage) {
      this.loading = false;
      return;
    }
    this.loading = true;
    forkJoin([
      this.service.translationKeys().pipe(
        catchError((error) => {
          console.error('[LanguageSettings] Unable to load translation keys', error);
          return of([] as TranslationKey[]);
        })
      ),
      this.service.translationValues(this.selectedLanguage.code).pipe(
        catchError((error) => {
          console.error('[LanguageSettings] Unable to load translation values', error);
          return of([] as TranslationValue[]);
        })
      ),
    ]).subscribe(
      ([keys, values]) => {
        const translationKeys = keys as TranslationKey[];
        const translationValues = values as TranslationValue[];
        const valuesByKey = new Map<string, TranslationValue>(
          translationValues.map((value: TranslationValue) => [value.key, value])
        );
        this.rows = translationKeys.map((key: TranslationKey) => {
          const value = valuesByKey.get(key.key)?.value || '';
          return {
            ...key,
            value,
            originalValue: value,
            dirty: false,
          };
        });
        this.loading = false;
        if (!translationKeys.length) {
          this.message.error(this.translate.instant('language.unableLoadTranslations'));
        }
      },
      (error) => {
        console.error('[LanguageSettings] Unable to load translations', error);
        this.loading = false;
        this.message.error(this.translate.instant('language.unableLoadTranslations'));
      }
    );
  }

  markDirty(row: TranslationRow): void {
    row.dirty = row.value !== row.originalValue;
  }

  saveRow(row: TranslationRow): void {
    if (!this.selectedLanguage) return;
    this.savingKey = row.key;
    this.service
      .updateTranslationValue({
        languageCode: this.selectedLanguage.code,
        key: row.key,
        value: row.value || '',
      })
      .subscribe(
        (saved) => {
          row.value = saved.value || '';
          row.originalValue = row.value;
          row.dirty = false;
          this.savingKey = undefined;
          this.message.success(this.translate.instant('language.saved'));
        },
        () => {
          this.savingKey = undefined;
          this.message.error(this.translate.instant('language.unableSaveTranslation'));
        }
      );
  }

  restoreDefault(row: TranslationRow): void {
    row.value = row.defaultText || '';
    this.markDirty(row);
  }

  rowDescription(row: TranslationRow): string {
    const path = row.key.split('.').slice(1).join(' > ') || row.key;
    const variables = new Set<string>([
      ...(row.variables || []),
      ...this.extractVariables(row.defaultText || ''),
      ...this.extractVariables(row.value || ''),
    ]);
    const variableText = variables.size
      ? ` ${this.translate.instant('language.variablesUsed')}: ${Array.from(variables).map((variable) => `{{${variable}}}`).join(', ')}.`
      : '';
    return `${this.translate.instant('language.location')}: ${row.namespace} > ${path}. ${this.translate.instant('language.usage')}: ${this.translate.instant('language.visibleTextUsage')}.${variableText}`;
  }

  showShortcuts(): void {
    this.shortcutsVisible = true;
  }

  copyShortcut(token: string, event?: Event): void {
    event?.stopPropagation();
    const copied = this.clipboard.copy(token);
    copied
      ? this.message.success(this.translate.instant('language.variableCopied'))
      : this.message.error(this.translate.instant('language.variableCopyFailed'));
  }

  trackShortcut(index: number, shortcut: LanguageShortcut): string {
    return shortcut.token;
  }

  openCreateLanguage(): void {
    this.languageDraft = { active: true, isDefault: false, fallbackCode: 'en' };
    this.languageModalVisible = true;
  }

  openEditLanguage(language: Language): void {
    this.languageDraft = { ...language };
    this.languageModalVisible = true;
  }

  closeLanguageModal(): void {
    this.languageModalVisible = false;
  }

  saveLanguage(): void {
    const draft = this.languageDraft;
    if (!draft.code || !draft.name) {
      this.message.warning(this.translate.instant('language.codeAndNameRequired'));
      return;
    }
    const request = draft.id
      ? this.service.updateLanguage(draft as Language)
      : this.service.createLanguage(draft);
    request.subscribe(
      () => {
        this.languageModalVisible = false;
        this.loadLanguages();
      },
      () => this.message.error(this.translate.instant('language.unableSaveLanguage'))
    );
  }

  private extractVariables(text: string): string[] {
    const variables = new Set<string>();
    const regex = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;
    let match: RegExpExecArray | null = regex.exec(text || '');
    while (match) {
      variables.add(match[1]);
      match = regex.exec(text || '');
    }
    return Array.from(variables);
  }

  private shortcutDescription(variable: string, keys: string[]): string {
    const knownDescriptions: Record<string, string> = {
      actual: this.translate.instant('language.shortcutActual'),
      date: this.translate.instant('language.shortcutDate'),
      key: this.translate.instant('language.shortcutKey'),
      language: this.translate.instant('language.shortcutLanguage'),
      total: this.translate.instant('language.shortcutTotal'),
      time: this.translate.instant('language.shortcutTime'),
    };
    const description = knownDescriptions[variable] || this.translate.instant('language.shortcutGeneric', { variable });
    const examples = keys.slice(0, 4).join(', ');
    const suffix = keys.length > 4 ? ` +${keys.length - 4}` : '';
    return `${description} ${this.translate.instant('language.usedIn')}: ${examples}${suffix}.`;
  }
}
