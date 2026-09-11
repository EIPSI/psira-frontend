import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { EvaluationAutomation } from '../@types/evaluation-automation';

export const EvaluationAutomationsTable: TableColumn<EvaluationAutomation>[] = [
  {
    title: 'evaluationAutomations.title',
    translationPath: 'evaluationAutomations.title',
    name: 'title',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'core.status',
    translationPath: 'core.status',
    name: 'formattedStatus',
    altName: 'active',
    render: 'tag',
    sort: true,
  },
  {
    title: 'evaluationAutomations.triggerPoint',
    translationPath: 'evaluationAutomations.triggerPoint',
    name: 'formattedTriggerPoint',
    altName: 'triggerPoint',
    render: 'tag',
    sort: true,
  },
  {
    title: 'evaluationAutomations.type',
    translationPath: 'evaluationAutomations.type',
    name: 'formattedAutomationType',
    altName: 'automationType',
    render: 'tag',
    sort: true,
  },
  {
    title: 'evaluationAutomations.departments',
    translationPath: 'evaluationAutomations.departments',
    name: 'departmentNames',
    sort: true,
  },
  {
    title: 'evaluationAutomations.role',
    translationPath: 'evaluationAutomations.role',
    name: 'roleName',
    sort: true,
  },
  {
    title: 'evaluationAutomations.associatedResource',
    translationPath: 'evaluationAutomations.associatedResource',
    name: 'resourceName',
    sort: true,
  },
  {
    title: 'evaluationAutomations.delayFromTrigger',
    translationPath: 'evaluationAutomations.delayFromTrigger',
    name: 'delayLabel',
    sort: true,
  },
  {
    title: 'evaluationAutomations.priority',
    translationPath: 'evaluationAutomations.priority',
    name: 'priority',
    sort: true,
  },
  {
    title: 'evaluationAutomations.createdAt',
    translationPath: 'evaluationAutomations.createdAt',
    name: 'createdAt',
    render: 'date',
    sort: true,
  },
  {
    title: 'evaluationAutomations.updatedAt',
    translationPath: 'evaluationAutomations.updatedAt',
    name: 'updatedAt',
    render: 'date',
    sort: true,
  },
];
