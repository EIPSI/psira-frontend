import { Component, OnInit, Input } from '@angular/core';
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
  public menuItems = [];
  @Input() isCollapsed = false;

  constructor(private themeService: ThemeConstantService, public perms: AppPermissionsService) {}

  ngOnInit(): void {
    this.themeService.isMenuFoldedChanges.subscribe((isFolded) => (this.isFolded = isFolded));
    this.themeService.isSideNavDarkChanges.subscribe((isDark) => (this.isSideNavDark = isDark));
    this.filterMenu();
  }

  filterMenu() {
    const isPatient = this.perms.isPatient();
    this.menuItems = MENU.filter((item: any) => {
      if (isPatient) {
        return item.path === 'patient-dashboard';
      } else {
        return item.path !== 'patient-dashboard';
      }
    });
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
