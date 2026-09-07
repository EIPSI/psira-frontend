import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { auditTime, distinctUntilChanged, map } from 'rxjs/operators';

export type ViewportSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ViewportState {
  width: number;
  height: number;
  size: ViewportSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

@Injectable({
  providedIn: 'root',
})
export class ViewportService {
  private readonly isBrowser: boolean;
  private readonly stateSubject: BehaviorSubject<ViewportState>;

  readonly state$: Observable<ViewportState>;
  readonly isMobile$: Observable<boolean>;

  constructor(@Inject(PLATFORM_ID) platformId: object, private zone: NgZone) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.stateSubject = new BehaviorSubject<ViewportState>(this.readViewport());
    this.state$ = this.stateSubject.asObservable();
    this.isMobile$ = this.state$.pipe(
      map((state) => state.isMobile),
      distinctUntilChanged()
    );

    if (this.isBrowser) {
      this.zone.runOutsideAngular(() => {
        fromEvent(window, 'resize')
          .pipe(auditTime(100), map(() => this.readViewport()))
          .subscribe((state) => this.zone.run(() => this.stateSubject.next(state)));
      });
    }
  }

  get snapshot(): ViewportState {
    return this.stateSubject.value;
  }

  private readViewport(): ViewportState {
    const width = this.isBrowser ? window.innerWidth : BREAKPOINTS.xl;
    const height = this.isBrowser ? window.innerHeight : 800;
    const size = this.resolveSize(width);

    return {
      width,
      height,
      size,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
    };
  }

  private resolveSize(width: number): ViewportSize {
    if (width < BREAKPOINTS.sm) return 'xs';
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    return 'xl';
  }
}
