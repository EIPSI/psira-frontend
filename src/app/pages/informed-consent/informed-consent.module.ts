import { NgModule } from '@angular/core';
import { InformedConsentRoutingModule } from './informed-consent-routing.module';
import { InformedConsentSharedModule } from './informed-consent-shared.module';

@NgModule({
  imports: [
    InformedConsentSharedModule,
    InformedConsentRoutingModule,
  ],
})
export class InformedConsentModule {}
