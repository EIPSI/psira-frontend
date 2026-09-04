import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NzI18nService, en_US, es_ES, de_DE } from 'ng-zorro-antd/i18n';
import * as moment from 'moment-timezone';
import 'moment/locale/es';
import 'moment/locale/de';

import { Logger } from '@core/logger.service';
import { environment } from '@env/environment';

const log = new Logger('I18nService');
const languageKey = 'language';

/**
 * Pass-through function to mark a string for translation extraction.
 * Running `npm translations:extract` will include the given string by using this.
 * @param s The string to extract for translation.
 * @return The same string.
 */
export function extract(s: string) {
  return s;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  defaultLanguage!: string;
  supportedLanguages!: string[];

  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    private nzI18nService: NzI18nService
  ) {
    // Embed languages to avoid extra HTTP requests
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = this.normalize(defaultLanguage);
    this.supportedLanguages = supportedLanguages.map((language) => this.normalize(language));
    this.language = '';
  }

  loadActiveLanguages(): Observable<{ code: string; name: string; nativeName?: string }[]> {
    return this.http
      .post<any>(environment.baseURL, {
        query: `
          query {
            activeLanguages {
              code
              name
              nativeName
            }
          }
        `,
      })
      .pipe(
        map((response) => response?.data?.activeLanguages || []),
        catchError(() => of([]))
      );
  }

  setSupportedLanguages(languages: string[]): void {
    const normalized = languages.map((language) => this.normalize(language)).filter((language) => !!language);
    this.supportedLanguages = Array.from(new Set([...(this.supportedLanguages || []), ...normalized]));
  }

  /**
   * Cleans up language change subscription.
   */
  destroy() {
  }

  setLanguage(language: string): void {
    localStorage.setItem(languageKey, this.normalize(language));
    this.language = language;
  }

  /**
   * Sets the current language.
   * Note: The current language is saved to the local storage.
   * If no parameter is specified, the language is loaded from local storage (if present).
   * @param language The IETF language code to set.
   */
  set language(language: string) {
    const storedLanguage = localStorage.getItem(languageKey);
    language = this.resolveLanguage(language, storedLanguage);

    log.debug(`Language set to ${language}`);
    this.applyRuntimeLocale(language);
    this.translateService.use(language);
  }

  /**
   * Gets the current language.
   * @return The current language code.
   */
  get language(): string {
    return this.translateService.currentLang;
  }

  private normalize(language: string): string {
    return String(language || '').toLowerCase().split('-')[0].split('_')[0];
  }

  private resolveLanguage(requestedLanguage?: string, storedLanguage?: string | null): string {
    const candidates = [
      requestedLanguage,
      storedLanguage,
      ...this.getBrowserLanguages(),
      this.translateService.getBrowserCultureLang(),
      this.translateService.getBrowserLang(),
      this.defaultLanguage,
    ];
    for (const candidate of candidates) {
      const resolved = this.findSupportedLanguage(candidate || '');
      if (resolved) return resolved;
    }
    return this.defaultLanguage;
  }

  private findSupportedLanguage(language: string): string {
    const normalized = this.normalize(language);
    if (!normalized) return '';
    if (this.supportedLanguages.includes(normalized)) return normalized;
    return this.supportedLanguages.find((supportedLanguage) => supportedLanguage.startsWith(normalized)) || '';
  }

  private getBrowserLanguages(): string[] {
    if (typeof navigator === 'undefined') return [];
    const languages = (navigator.languages && navigator.languages.length)
      ? Array.from(navigator.languages)
      : [navigator.language];
    return languages.filter((language) => !!language);
  }

  private applyRuntimeLocale(language: string): void {
    moment.locale(language || this.defaultLanguage || 'en');
    const nzLocales: Record<string, any> = {
      en: en_US,
      es: es_ES,
      de: de_DE,
    };
    this.nzI18nService.setLocale(nzLocales[language] || en_US);
  }
}
