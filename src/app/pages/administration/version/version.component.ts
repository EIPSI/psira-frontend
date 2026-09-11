import { Component, OnInit } from '@angular/core';
import { version } from '../../../../../package.json';
import { DisclaimersService } from '../@services/disclaimers.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit {

  version: string = version;
  versionMessage = '';

  constructor(
    private disclaimersService: DisclaimersService,
    private errorService: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.versionMessage = this.renderVersionMessage();
    this.disclaimersService.disclaimers().subscribe(
      ({ data }: any) => {
        const message = data.disclaimers.find((disclaimer: any) => disclaimer.type === 'versionMessage');
        this.versionMessage = this.renderVersionMessage(message?.description);
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to load version message' })
    );
  }

  private renderVersionMessage(description?: string): string {
    const template = description || '<h3 class="heading">Version {{version}}</h3>';
    return template.replace(/{{\s*version\s*}}/g, this.version);
  }

}
