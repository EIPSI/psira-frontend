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
    sort: true,
  },
  {
    title: 'Trigger Point',
    name: 'formattedTriggerPoint',
    altName: 'triggerPoint',
    render: 'tag',
    sort: true,
  },
  {
    title: 'Tipo',
    name: 'formattedAutomationType',
    altName: 'automationType',
    render: 'tag',
    sort: true,
  },
  {
    title: 'Departamento/s',
    name: 'departmentNames',
    sort: true,
  },
  {
    title: 'Rol',
    name: 'roleName',
    sort: true,
  },
  {
    title: 'Recurso asociado',
    name: 'resourceName',
    sort: true,
  },
  {
    title: 'Tiempo desde trigger',
    name: 'delayLabel',
    sort: true,
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
