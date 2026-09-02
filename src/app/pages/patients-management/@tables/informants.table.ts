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
    title: 'First Name',
    name: 'firstName',
    translationPath: 'tables.informants.firstName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Middle Name',
    name: 'middleName',
    translationPath: 'tables.informants.middleName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Last Name',
    name: 'lastName',
    translationPath: 'tables.informants.lastName',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Phone',
    name: 'phone',
    translationPath: 'tables.informants.phone',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Email',
    name: 'email',
    translationPath: 'tables.informants.email',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Address',
    name: 'address',
    translationPath: 'tables.informants.address',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Patient',
    name: 'patientNames',
    translationPath: 'tables.informants.patientNames',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Relationship Type',
    name: 'formattedRelationshipType',
    translationPath: 'tables.informants.formattedRelationshipType',
    isFilterable: false,
    sort: true,
  },
  {
    title: 'Created At',
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
