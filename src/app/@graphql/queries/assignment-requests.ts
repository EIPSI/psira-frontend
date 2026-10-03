import gql from 'graphql-tag';

const assignmentRequestFields = gql`
  fragment AssignmentRequestFields on AssignmentRequest {
    id
    kind
    status
    patientId
    therapistId
    assigneeId
    requesterId
    createdAt
    respondedAt
    patient {
      id
      firstName
      middleName
      lastName
      medicalRecordNo
    }
    therapist {
      id
      firstName
      middleName
      lastName
      email
    }
    assignee {
      id
      username
      active
      firstName
      middleName
      lastName
      email
      phone
      workID
      address
      gender
      birthDate
      nationality
      createdAt
      updatedAt
      deletedAt
      departments {
        id
        name
        description
        active
      }
      roles {
        id
        code
        name
        createdAt
        updatedAt
      }
      permissions {
        id
        name
        createdAt
        updatedAt
      }
    }
    requester {
      id
      firstName
      middleName
      lastName
      email
    }
  }
`;

const pendingAssignmentRequests = gql`
  query {
    pendingAssignmentRequests {
      ...AssignmentRequestFields
    }
  }
  ${assignmentRequestFields}
`;

const pendingPatientCaseManagerRequests = gql`
  query($patientId: Int!) {
    pendingPatientCaseManagerRequests(patientId: $patientId) {
      ...AssignmentRequestFields
    }
  }
  ${assignmentRequestFields}
`;

export const AssignmentRequestsQueries = {
  pendingAssignmentRequests,
  pendingPatientCaseManagerRequests,
};
