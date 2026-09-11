import gql from 'graphql-tag';

const createOneReport = gql`
  mutation($input: CreateOneReportInput!) {
    createOneReport(input: $input) {
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
`;

const createManyReports = gql`
  mutation($input: CreateManyReportsInput!) {
    createManyReports(input: $input) {
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
    }
  }
`;

const updateOneReport = gql`
  mutation($input: UpdateOneReportInput!) {
    updateOneReport(input: $input) {
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
`;

const updateManyReports = gql`
  mutation($input: UpdateManyReportsInput!) {
    updateManyReports(input: $input) {
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
    }
  }
`;

const deleteOneReport = gql`
  mutation($input: DeleteOneReportInput!) {
    deleteReport(input: $input) {
      id
    }
  }
`;

const addRolesToReport = gql`
  mutation($input: ReportRoleInput!) {
    addRolesToReport(input: $input) {
      id
    }
  }
`;

const startReportSession = gql`
  mutation($reportId: Int!, $patientId: Int, $contextType: String, $contextParams: String) {
    startReportSession(
      reportId: $reportId
      patientId: $patientId
      contextType: $contextType
      contextParams: $contextParams
    ) {
      id
      reportId
      userId
      patientId
      contextType
      contextParams
      closedBy
      startedAt
      lastSeenAt
      endedAt
      durationSeconds
      active
    }
  }
`;

const heartbeatReportSession = gql`
  mutation($sessionId: Int!) {
    heartbeatReportSession(sessionId: $sessionId) {
      id
      reportId
      userId
      patientId
      contextType
      contextParams
      closedBy
      startedAt
      lastSeenAt
      endedAt
      durationSeconds
      active
    }
  }
`;

const endReportSession = gql`
  mutation($sessionId: Int!) {
    endReportSession(sessionId: $sessionId) {
      id
      reportId
      userId
      patientId
      contextType
      contextParams
      closedBy
      startedAt
      lastSeenAt
      endedAt
      durationSeconds
      active
    }
  }
`;

export const ReportsMutations = {
  createOneReport,
  createManyReports,
  updateOneReport,
  updateManyReports,
  deleteOneReport,
  addRolesToReport,
  startReportSession,
  heartbeatReportSession,
  endReportSession,
};
