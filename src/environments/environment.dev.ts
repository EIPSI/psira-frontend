import { EnvironmentBase } from './environment.base';
/*export const environment = EnvironmentBase;*/
export const environment = {
  ...EnvironmentBase,
  production: false, // opcional, EnvironmentBase ya lo pone
  hmr: false, // como lo tengas
  email: true, // como lo tengas
  baseURL: '/graphql',
};
