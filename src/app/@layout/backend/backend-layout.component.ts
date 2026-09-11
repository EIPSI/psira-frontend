import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewportService } from '@shared/services/viewport.service';

@Component({
  selector: 'app-backend-layout',
  templateUrl: './backend-layout.component.html',
  styleUrls: ['./backend-layout.component.scss'],
})
export class BackendLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isMobile = false;
  user: any;
  private viewportSubscription?: Subscription;

  constructor(private viewportService: ViewportService) {}

  ngOnInit(): void {
    this.viewportSubscription = this.viewportService.state$.subscribe((state) => {
      const wasMobile = this.isMobile;
      this.isMobile = state.isMobile;
      if (this.isMobile && !wasMobile) {
        this.isCollapsed = true;
      }
    });
  }

  toggleSider(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  closeMobileSider(): void {
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  ngOnDestroy(): void {
    if (this.viewportSubscription) {
      this.viewportSubscription.unsubscribe();
    }
  }
}
