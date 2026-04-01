import { EnvironmentBase } from './environment.base';

export const environment = {
  ...EnvironmentBase,
  production: true,
  baseURL: 'https://staging.psira.equipoeipsi.com/graphql', /*https://staging-api.mhira.net/graphql*/
};
