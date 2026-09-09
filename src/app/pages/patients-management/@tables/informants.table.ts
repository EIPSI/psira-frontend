const actions: any[] = [
  {
    type: 'Edit Informant',
    name: 'Edit Informant',
  },
  {
    type: 'Delete Informant',
    name: 'Delete Informant',
  },
];

const columns: any[] = [
  {
    title: 'forms.patients.firstName',
    name: 'firstName',
    translationPath: 'tables.informants.firstName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.middleName',
    name: 'middleName',
    translationPath: 'tables.informants.middleName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.lastName',
    name: 'lastName',
    translationPath: 'tables.informants.lastName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.phone',
    name: 'phone',
    translationPath: 'tables.informants.phone',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.email',
    name: 'email',
    translationPath: 'tables.informants.email',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.address',
    name: 'address',
    translationPath: 'tables.informants.address',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.patient',
    name: 'patientNames',
    translationPath: 'tables.informants.patientNames',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'forms.patients.relationshipType',
    name: 'formattedRelationshipType',
    translationPath: 'tables.informants.formattedRelationshipType',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'tables.patients.createdAt',
    name: 'formattedCreatedAt',
    translationPath: 'tables.informants.formattedCreatedAt',
    isFilterable: false,
    sort: true,
  },
];

export const InformantsTable = {
  actions,
  columns,
};
