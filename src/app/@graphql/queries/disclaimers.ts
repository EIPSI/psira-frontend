import gql from 'graphql-tag';

const disclaimers = gql`
  query {
    disclaimers {
      type
      description
      updatedAt
    }
  }
`;

export const DisclaimersQueries = {
  disclaimers,
  departmentDisclaimers: gql`
    query($departmentId: Int) {
      disclaimers: departmentDisclaimers(departmentId: $departmentId) { type description updatedAt }
    }
  `,
};
