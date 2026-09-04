import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, pluck, switchMap } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class DynamicTranslationLoader extends TranslateLoader {
  constructor(private http: HttpClient) {
    super();
  }

  getTranslation(lang: string): Observable<any> {
    return this.localFallback(lang).pipe(
      switchMap((fallback) =>
        this.http
          .post<any>(environment.baseURL, {
            query: `
              query($languageCode: String) {
                languageBundle(languageCode: $languageCode) {
                  languageCode
                  fallbackCode
                  translationsJson
                }
              }
            `,
            variables: { languageCode: this.normalize(lang) },
          })
          .pipe(
            map((response) => this.deepMerge(fallback, JSON.parse(response?.data?.languageBundle?.translationsJson || '{}'))),
            catchError(() => of(fallback))
          )
      )
    );
  }

  private localFallback(lang: string): Observable<any> {
    const normalized = this.normalize(lang) || 'en';
    return from(import(`../../translations/${normalized}`)).pipe(
      pluck('default'),
      catchError(() => from(import('../../translations/en')).pipe(pluck('default'))),
      switchMap((translations) => of(translations))
    );
  }

  private normalize(lang: string): string {
    return String(lang || '').toLowerCase().split('-')[0].split('_')[0];
  }

  private deepMerge(base: any, overrides: any): any {
    const result = { ...(base || {}) };
    Object.keys(overrides || {}).forEach((key) => {
      if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        result[key] = this.deepMerge(result[key], overrides[key]);
      } else if (overrides[key] !== undefined && overrides[key] !== null && overrides[key] !== '') {
        result[key] = overrides[key];
      }
    });
    return result;
  }
}
