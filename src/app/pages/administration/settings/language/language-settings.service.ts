import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LanguageMutations } from '@app/@graphql/mutations/languages';
import { LanguageQueries } from '@app/@graphql/queries/languages';

export interface Language {
  id: number;
  code: string;
  name: string;
  nativeName?: string;
  active: boolean;
  isDefault: boolean;
  fallbackCode?: string;
}

export interface TranslationKey {
  key: string;
  namespace: string;
  defaultText?: string;
  description?: string;
  variables?: string[];
  isSystem: boolean;
}

export interface TranslationValue {
  id: number;
  languageCode: string;
  key: string;
  value?: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageSettingsService {
  constructor(private apollo: Apollo) {}

  languages(): Observable<Language[]> {
    return this.apollo
      .query<any>({ query: LanguageQueries.languages, fetchPolicy: 'no-cache' })
      .pipe(map((result) => result.data.languages || []));
  }

  translationKeys(namespace?: string): Observable<TranslationKey[]> {
    return this.apollo
      .query<any>({
        query: LanguageQueries.translationKeys,
        variables: { namespace },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.translationKeys || []));
  }

  translationValues(languageCode: string): Observable<TranslationValue[]> {
    return this.apollo
      .query<any>({
        query: LanguageQueries.translationValues,
        variables: { languageCode },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.translationValues || []));
  }

  createLanguage(input: Partial<Language>): Observable<Language> {
    return this.apollo
      .mutate<any>({
        mutation: LanguageMutations.createLanguage,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.createLanguage));
  }

  updateLanguage(input: Partial<Language> & { id: number }): Observable<Language> {
    return this.apollo
      .mutate<any>({
        mutation: LanguageMutations.updateLanguage,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.updateLanguage));
  }

  updateTranslationValue(input: { languageCode: string; key: string; value: string }): Observable<TranslationValue> {
    return this.apollo
      .mutate<any>({
        mutation: LanguageMutations.updateTranslationValue,
        variables: { input },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.updateTranslationValue));
  }
}
