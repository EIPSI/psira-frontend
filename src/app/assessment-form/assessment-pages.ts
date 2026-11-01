// Splitting a view into pages must not change question or occurrence identifiers:
// answers, conditions and required-answer validation continue to use the original data.
export function buildQuestionnairePages(questionnaires: any[]): any[] {
  const pages: any[] = [];
  let baseKey: string;
  let page: any;
  for (const [index, questionnaire] of (questionnaires || []).entries()) {
    const key = `${questionnaire.sourceBundleId || 'direct'}:${questionnaire.screenId ||
      questionnaire.occurrenceId || questionnaire._id || index}`;
    const createPage = () => {
      page = {
        id: `${key}:${pages.length}`,
        label: questionnaire.screenLabel || '',
        sourceBundleId: questionnaire.sourceBundleId,
        progressMode: questionnaire.progressMode || 'NONE',
        headerHtml: questionnaire.screenHeaderHtml,
        footerHtml: questionnaire.screenFooterHtml,
        bundleHeaderHtml: questionnaire.bundleHeaderHtml,
        bundleNoticeHtml: questionnaire.bundleNoticeHtml,
        questionnaires: [],
      };
      pages.push(page);
    };
    if (key !== baseKey) {
      createPage();
      baseKey = key;
    }
    let groups: any[] = [];
    const flush = () => {
      if (groups.length) page.questionnaires.push({ ...questionnaire, questionGroups: groups });
      groups = [];
    };
    for (const group of questionnaire.questionGroups || []) {
      if (group.pageBreakBefore && (groups.length || page.questionnaires.length)) {
        flush();
        createPage();
      }
      groups.push(group);
    }
    flush();
  }
  return pages.filter(item => item.questionnaires.length);
}
