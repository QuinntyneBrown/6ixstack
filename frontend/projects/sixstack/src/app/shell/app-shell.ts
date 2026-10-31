import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SiteFooter, SiteHeader, SkipLink, ToastRegion } from 'components';
import { ConnectivityService } from './banners/connectivity.service';
import { EmailVerificationNotice } from './email-verification-notice';
import { AccountControls } from './session/account-controls';
import { SessionStore } from './session/session-store';
import { SiteBannerOutlet } from './banners/site-banner-outlet';
import { MenuController } from './menu-controller';
import { FOOTER_ITEMS, NAV_ITEMS } from './nav-items';

/** The frame every page sits in: skip link, header, main region and footer (site/app-shell design). */
@Component({
  selector: 'sx-app-shell',
  imports: [AccountControls, RouterOutlet, SkipLink, SiteHeader, SiteFooter, ToastRegion, SiteBannerOutlet],
  template: `
    <sx-skip-link target="main" />
    <sx-site-header
      [items]="navItems"
      [menuExpanded]="menu.isOpen()"
      [submitDisabled]="!connectivity.online()"
      [showSubmit]="!hideSubmit()"
      (menuRequested)="menu.open($event)"
    >
      @if (session.user(); as user) {
        <sx-account-controls slot="actions" [user]="user" />
      }
    </sx-site-header>
    <sx-site-banner-outlet />
    <main id="main" class="page" tabindex="-1">
      <router-outlet />
    </main>
    <sx-toast-region />
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
  protected readonly menu = inject(MenuController);
  protected readonly connectivity = inject(ConnectivityService);
  private readonly route = inject(ActivatedRoute);
  protected readonly session = inject(SessionStore);

  /** Route data `hideSubmit: true` hides the header's Submit event button (the submit page, organizer pages). */
  protected readonly hideSubmit = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let route = this.route;
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data['hideSubmit'] === true;
      }),
    ),
    { initialValue: false },
  );
  protected readonly navItems = NAV_ITEMS;
  protected readonly footerItems = FOOTER_ITEMS;

  constructor() {
    inject(EmailVerificationNotice).watch();
    this.session.load().subscribe();
  }
}
