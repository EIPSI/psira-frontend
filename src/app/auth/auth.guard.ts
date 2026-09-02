import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Logger } from '@core';
import { AuthService } from '@app/auth/auth.service';
import { InformedConsentService } from '@app/pages/informed-consent/@services/informed-consent.service';

const log = new Logger('AuthGuard');

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private informedConsentService: InformedConsentService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (this.isAllowedDuringInformedConsentBlock(state.url)) {
      return true;
    }

    return this.informedConsentService.getPending().pipe(
      map((pending) => {
        if ((pending || []).some((consent) => consent.blocking)) {
          this.router.navigate(['/psira/dashboard']);
          return false;
        }
        return true;
      }),
      catchError(() => of(true))
    );
  }

  private isAllowedDuringInformedConsentBlock(url: string): boolean {
    return url.startsWith('/psira/dashboard') || url.startsWith('/auth/change-password');
  }
}
