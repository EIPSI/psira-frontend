import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { EvaluationAutomation } from '../@types/evaluation-automation';

export const EvaluationAutomationsTable: TableColumn<EvaluationAutomation>[] = [
  {
    title: 'Título',
    name: 'title',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Estado',
    name: 'formattedStatus',
    altName: 'active',
    render: 'tag',
  },
  {
    title: 'Trigger Point',
    name: 'formattedTriggerPoint',
    altName: 'triggerPoint',
    render: 'tag',
  },
  {
    title: 'Tipo',
    name: 'formattedAutomationType',
    altName: 'automationType',
    render: 'tag',
  },
  {
    title: 'Departamento/s',
    name: 'departmentNames',
  },
  {
    title: 'Rol',
    name: 'roleName',
  },
  {
    title: 'Recurso asociado',
    name: 'resourceName',
  },
  {
    title: 'Tiempo desde trigger',
    name: 'delayLabel',
  },
  {
    title: 'Prioridad',
    name: 'priority',
    sort: true,
  },
  {
    title: 'Creado',
    name: 'createdAt',
    render: 'date',
    sort: true,
  },
  {
    title: 'Actualizado',
    name: 'updatedAt',
    render: 'date',
    sort: true,
  },
];
