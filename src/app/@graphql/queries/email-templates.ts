import gql from 'graphql-tag';

const getAllEmailTemplates = gql `
 query($paging: CursorPaging, $filter: MailTemplateFilter, $departmentIds: [Int!]) {
    getAllEmailTemplates(paging: $paging, filter: $filter, departmentIds: $departmentIds) {
        edges {
            node {
                id
                name
                status
                subject
                purpose
                body
                isPublic
                departments{
                    id
                    name
                }
            }
        }
        pageInfo{
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
    }
}
`;

const getPatientEmailTemplates = gql `
query($patientId: ID) {
    getPatientEmailTemplates(patientId: $patientId) {
        id
        name
        subject
        body
        status
        purpose
        createdAt
        updatedAt
        deletedAt
        isPublic
        departments{
            id
            name
        }
    }
}`;

const getOneEmailTemplate = gql `
 query($id: ID!) {
    getEmailTemplate(id: $id) {
        id
        name
        status
        subject
        purpose
        body
        isPublic
        departments{
            id
            name
        }
    }
}
`;

export const EmailTemplatesQueries = {
    getAllEmailTemplates,
    getOneEmailTemplate,
    getPatientEmailTemplates
};
