import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, Renderer2 } from '@angular/core';

@Directive({ selector: '[appCalendarOverflow]' })
export class CalendarOverflowDirective implements AfterViewInit, OnDestroy {
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private readonly updateOverflow = () => {
    const element = this.elementRef.nativeElement;
    const hasMore = element.scrollHeight - element.clientHeight - element.scrollTop > 1;
    if (hasMore) this.renderer.addClass(element, 'has-more-events');
    else this.renderer.removeClass(element, 'has-more-events');
  };

  constructor(private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const element = this.elementRef.nativeElement;
      element.addEventListener('scroll', this.updateOverflow, { passive: true });
      window.addEventListener('resize', this.updateOverflow);
      const observerConstructor = (window as any).ResizeObserver;
      if (observerConstructor) {
        this.resizeObserver = new observerConstructor(this.updateOverflow);
        this.resizeObserver.observe(element);
        if (element.firstElementChild) this.resizeObserver.observe(element.firstElementChild);
      }
      this.mutationObserver = new MutationObserver(this.updateOverflow);
      this.mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });
      this.updateOverflow();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.elementRef.nativeElement.removeEventListener('scroll', this.updateOverflow);
    window.removeEventListener('resize', this.updateOverflow);
  }
}
