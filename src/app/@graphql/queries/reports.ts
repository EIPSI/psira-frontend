import gql from 'graphql-tag';

const reports = gql`
  query($paging: CursorPaging, $filter: ReportFilter, $sorting: [ReportSort!]) {
    reports(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          anonymus
          name
          description
          status
          repositoryLink
          appName
          url
          resources
          createdAt
          updatedAt
          roles {
            id
            name
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const availableShinyApps = gql`
  query {
    availableShinyApps {
      appName
      title
      url
    }
  }
`;

const getReportForCurrentUser = gql`
  query($id: Int!) {
    getReportForCurrentUser(id: $id) {
      id
      name
      description
      resources
      appName
      url
      status
    }
  }
`;

const getReportEmbed = gql`
  query($id: Int!, $patientId: Int) {
    getReportEmbed(id: $id, patientId: $patientId) {
      embedUrl
      expiresAt
      report {
        id
        name
        description
        resources
        appName
        url
        status
      }
    }
  }
`;

export const ReportsQueries = {
  reports,
  availableShinyApps,
  getReportForCurrentUser,
  getReportEmbed,
};
