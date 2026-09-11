import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { environment } from '../environments/environment';

const uri = environment.baseURL;
const informedConsentBlockMessage = 'Pending mandatory informed consent must be completed before using PSIRA.';
const informedConsentDashboardPath = '/psira/dashboard';
const informedConsentPendingPath = '/psira/informed-consent/pending';
const passwordChangePath = '/auth/change-password';

export function createApollo(httpLink: HttpLink, router: Router) {
  const informedConsentErrorLink = onError(({ graphQLErrors }) => {
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
    link: ApolloLink.from([informedConsentErrorLink, httpLink.create({ uri })]),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink, Router],
    },
  ],
})
export class GraphQLModule {}
