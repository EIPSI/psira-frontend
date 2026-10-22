import gql from 'graphql-tag';

const patientStatuses = gql`
  query($paging: CursorPaging, $filter: PatientStatusFilter, $sorting: [PatientStatusSort!]) {
    patientStatuses(paging: $paging, filter: $filter, sorting: $sorting) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          name
          description
          createdAt
          updatedAt
        }
        cursor
      }
    }
  }
`;

export const PatientStatusesQueries = {
  patientStatuses,
};
