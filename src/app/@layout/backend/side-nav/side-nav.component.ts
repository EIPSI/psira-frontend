import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { MENU } from '@app/pages/pages.menu';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})
export class SideNavComponent implements OnInit {
  isFolded: boolean;
  isSideNavDark: boolean;
  public menuItems: any[] = [];
  @Input() isCollapsed = false;
  @Output() navigated = new EventEmitter<void>();

  constructor(private themeService: ThemeConstantService, public perms: AppPermissionsService) {}

  ngOnInit(): void {
    this.themeService.isMenuFoldedChanges.subscribe((isFolded) => (this.isFolded = isFolded));
    this.themeService.isSideNavDarkChanges.subscribe((isDark) => (this.isSideNavDark = isDark));
    this.filterMenu();
  }

  filterMenu() {
    const isPatient = this.perms.isPatient();
    const items = MENU.filter((item: any) => {
      if (isPatient) {
        return item.path === 'patient-dashboard';
      } else {
        return item.path !== 'patient-dashboard';
      }
    });
    this.menuItems = items.sort((a: any, b: any) => {
      if (a.path === 'administration') return 1;
      if (b.path === 'administration') return -1;
      return 0;
    });
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  emitNavigated(): void {
    this.navigated.emit();
  }
}
