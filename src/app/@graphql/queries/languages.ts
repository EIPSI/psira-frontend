import gql from 'graphql-tag';

const languages = gql`
  query {
    languages {
      id
      code
      name
      nativeName
      active
      isDefault
      fallbackCode
    }
  }
`;

const translationKeys = gql`
  query($namespace: String) {
    translationKeys(namespace: $namespace) {
      key
      namespace
      defaultText
      description
      variables
      isSystem
    }
  }
`;

const translationValues = gql`
  query($languageCode: String!) {
    translationValues(languageCode: $languageCode) {
      id
      languageCode
      key
      value
    }
  }
`;

export const LanguageQueries = {
  languages,
  translationKeys,
  translationValues,
};
