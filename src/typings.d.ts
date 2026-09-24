/*
 * Extra typings definitions
 */

// Allow .json files imports
declare module '*.json';

// SystemJS module definition
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module 'apollo-upload-client' {
  import { ApolloLink } from 'apollo-link';

  export interface UploadLinkOptions {
    uri?: string;
    credentials?: string;
    headers?: { [key: string]: string };
    fetch?: typeof fetch;
  }

  export function createUploadLink(options?: UploadLinkOptions): ApolloLink;
}
