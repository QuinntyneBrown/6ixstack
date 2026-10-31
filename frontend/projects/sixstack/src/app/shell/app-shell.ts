import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter, SiteHeader, SkipLink } from 'components';
import { FOOTER_ITEMS, NAV_ITEMS } from './nav-items';

/** The frame every page sits in: skip link, header, main region and footer (site/app-shell design). */
@Component({
  selector: 'sx-app-shell',
  imports: [RouterOutlet, SkipLink, SiteHeader, SiteFooter],
  template: `
    <sx-skip-link target="main" />
    <sx-site-header [items]="navItems" />
    <main id="main" class="page" tabindex="-1">
      <router-outlet />
    </main>
    <sx-site-footer [items]="footerItems" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }
    main {
      flex: 1;
      width: 100%;
    }
    main:focus {
      outline: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly navItems = NAV_ITEMS;
  protected readonly footerItems = FOOTER_ITEMS;
}
