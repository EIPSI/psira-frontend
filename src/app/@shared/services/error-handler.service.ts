import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApolloError, isApolloError } from 'apollo-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SkipLogicError } from '../../assessment-form/skip-logic';

type AnyError = ApolloError | SkipLogicError | Error;

export interface ErrorHandlerOptions {
  prefix?: string;
  forcePrefix?: boolean;
  duration?: number;
}

const isSkipLogicError = (error: AnyError): error is SkipLogicError => !!(error as SkipLogicError).isSkipLogicError;
const informedConsentBlockMessage = 'Pending mandatory informed consent must be completed before using PSIRA.';
const informedConsentDashboardPath = '/psira/dashboard';
const informedConsentPendingPath = '/psira/informed-consent/pending';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(private messageService: NzMessageService, private router: Router) {}

  public handleError(error: AnyError, options: ErrorHandlerOptions = {}): void {
    if (this.isInformedConsentBlock(error)) {
      this.redirectToPendingInformedConsents();
      return;
    }

    if (isApolloError(error)) {
      // show error directly if it has no graphQL Errors
      if (!error?.graphQLErrors?.length) {
        const msg = options.prefix && options.forcePrefix ? `${options.prefix} - ${error.message}` : error.message;
        this.dispatchError(msg, error, options, 5000);
      }

      // show graphQL Errors
      for (const e of error.graphQLErrors) {
        // Use e.extensions.message if available, otherwise fallback to e.message
        const specificMessage = (e as any).extensions?.message || e.message;
        const msg = options.prefix && options.forcePrefix ? `${options.prefix} - ${specificMessage}` : specificMessage;
        this.dispatchError(msg, e, options, 5000);
      }
    } else if (isSkipLogicError(error)) {
      const msg = options.prefix && options.forcePrefix ? `${options.prefix} - ${error.message}` : error.message;
      this.dispatchError(msg, error, options, 5000);
    } else {
      const msg = options.prefix ? `${options.prefix} - ${error}` : error.toString();
      this.dispatchError(msg, error, options);
    }
  }

  private dispatchError(msg: string, error: AnyError, options: ErrorHandlerOptions, duration: number = 3000): void {
    // show error to user
    this.messageService.error(msg, { nzDuration: options.duration ?? duration });

    // log error to console
    console.error(error);
  }

  private isInformedConsentBlock(error: AnyError): boolean {
    if (isApolloError(error)) {
      return error.graphQLErrors.some((e) => e.message === informedConsentBlockMessage);
    }
    return error?.message === informedConsentBlockMessage;
  }

  private redirectToPendingInformedConsents(): void {
    if (this.router.url.startsWith(informedConsentPendingPath)) return;
    if (this.router.url !== informedConsentDashboardPath) {
      this.router.navigate([informedConsentDashboardPath]);
    }
  }
}
