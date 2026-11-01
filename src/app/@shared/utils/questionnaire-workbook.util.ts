export type QuestionnaireWorkbookKind = 'guide' | 'example';

export function questionnaireWorkbookFile(kind: QuestionnaireWorkbookKind, language?: string): string {
  const code = (language || 'en').toLowerCase().split(/[-_]/)[0];
  const locale = ['es', 'en', 'de', 'nl'].includes(code) ? code : 'en';
  const name = kind === 'guide' ? 'PSIRA-cuestionarios-guia' : 'PSIRA-cuestionario-ejemplo-completo';
  return `${name}-${locale}.xlsx`;
}
