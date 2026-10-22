import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AssessmentService } from './../pages/assessment/@services/assessment.service';
import { FullAssessment } from './../pages/assessment/@types/assessment';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environments/environment';
import { decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


@Injectable({ providedIn: 'root' })
export class AssessmentResolver implements Resolve<FullAssessment> {
  constructor(private service: AssessmentService) {}

  public resolve(route: ActivatedRouteSnapshot): Observable<FullAssessment> {
    try {
      const encryptedId = route.queryParamMap.get('assessment');
      if (!encryptedId) throw new Error('Invalid assessment link');
      const uuid = encryptedId.startsWith('v3:')
        ? of(decryptRoutePayload(encryptedId, environment.secretKey))
        : this.service.resolvePublicAssessmentLink(encryptedId);
      return uuid.pipe(
        switchMap((value) => this.service.getFullPublicAssessment(value)),
        catchError((error) => of({ loadError: error.message } as any))
      );
    } catch (err) {
      return of({ loadError: 'Unable to open this assessment link.' } as any);
    }
  }
}
