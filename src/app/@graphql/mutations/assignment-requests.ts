import gql from 'graphql-tag';

const assignmentRequestResult = `
  id
  kind
  status
  patientId
  therapistId
  assigneeId
  requesterId
  respondedAt
`;

const acceptAssignmentRequest = gql`
  mutation($id: Int!) {
    acceptAssignmentRequest(id: $id) {
      ${assignmentRequestResult}
    }
  }
`;

const rejectAssignmentRequest = gql`
  mutation($id: Int!) {
    rejectAssignmentRequest(id: $id) {
      ${assignmentRequestResult}
    }
  }
`;

const cancelAssignmentRequest = gql`
  mutation($id: Int!) {
    cancelAssignmentRequest(id: $id) {
      ${assignmentRequestResult}
    }
  }
`;

export const AssignmentRequestsMutations = {
  acceptAssignmentRequest,
  rejectAssignmentRequest,
  cancelAssignmentRequest,
};
