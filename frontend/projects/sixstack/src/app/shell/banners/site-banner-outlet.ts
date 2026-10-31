import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Alert } from 'components';
import { BannerService } from './banner.service';

/** Renders the active site banners between the header and the main region. */
@Component({
  selector: 'sx-site-banner-outlet',
  imports: [Alert],
  template: `
    @for (banner of banners(); track banner.id) {
      <sx-alert
        banner
        [kind]="banner.kind"
        [title]="banner.title"
        [announce]="banner.role"
        [actions]="banner.actions ?? []"
        [dismissible]="banner.dismissible"
        (dismissed)="service.dismiss(banner)"
        >{{ banner.text }}</sx-alert
      >
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteBannerOutlet {
  protected readonly service = inject(BannerService);
  protected readonly banners = this.service.banners;
}
