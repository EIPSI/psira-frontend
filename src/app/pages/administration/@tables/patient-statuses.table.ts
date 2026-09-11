const actions: any[] = [
  {
    type: 'patientStatuses.editPatientStatus',
    name: 'patientStatuses.editPatientStatus',
  },
  {
    type: 'patientStatuses.deletePatientStatus',
    name: 'patientStatuses.deletePatientStatus',
  },
];

const columns: any[] = [
  {
    title: 'tables.patientStatuses.name',
    name: 'name',
    translationPath: 'tables.patientStatuses.name',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'tables.patientStatuses.description',
    name: 'description',
    translationPath: 'tables.patientStatuses.description',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'tables.patientStatuses.formattedCreatedAt',
    name: 'formattedCreatedAt',
    translationPath: 'tables.patientStatuses.formattedCreatedAt',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'tables.patientStatuses.formattedUpdatedAt',
    name: 'formattedUpdatedAt',
    translationPath: 'tables.patientStatuses.formattedUpdatedAt',
    isFilterable: false,
    sort: true,
  },
];

export const PatientStatusesTable = {
  actions,
  columns,
};
