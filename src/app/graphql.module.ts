import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule } from 'apollo-angular-link-http';
import { createUploadLink } from 'apollo-upload-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { environment } from '../environments/environment';

const uri = environment.baseURL;
const informedConsentBlockMessage = 'Pending mandatory informed consent must be completed before using PSIRA.';

function getAuthorizationHeader(): string {
  const userStr = localStorage.getItem('auth_app_token');
  if (!userStr) {
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    return user?.accessToken ? `Bearer ${user.accessToken}` : null;
  } catch (e) {
    return null;
  }
}

function authorizedFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const authorization = getAuthorizationHeader();
  const headers = new Headers(init.headers || {});

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
const informedConsentDashboardPath = '/psira/dashboard';
const informedConsentPendingPath = '/psira/informed-consent/pending';
const passwordChangePath = '/auth/change-password';

export function createApollo(router: Router) {
  const informedConsentErrorLink = onError(({ graphQLErrors, networkError }) => {
    const unauthenticated =
      graphQLErrors?.some((error) => error.extensions?.code === 'UNAUTHENTICATED')
      || (networkError as any)?.statusCode === 401;

    if (unauthenticated) {
      router.navigate(['/auth/login']);
      return;
    }

    const blocked = graphQLErrors?.some((error) => error.message === informedConsentBlockMessage);
    if (
      blocked
      && router.url !== informedConsentDashboardPath
      && !router.url.startsWith(informedConsentPendingPath)
      && !router.url.startsWith(passwordChangePath)
    ) {
      router.navigate([informedConsentDashboardPath]);
    }
  });

  return {
    link: ApolloLink.from([informedConsentErrorLink, createUploadLink({ uri, fetch: authorizedFetch }) as any]),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [Router],
    },
  ],
})
export class GraphQLModule {}
