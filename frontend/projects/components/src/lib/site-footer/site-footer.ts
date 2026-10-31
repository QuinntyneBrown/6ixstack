import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../navigation/nav-item';

/** The site footer: the tagline and the Footer navigation. */
@Component({
  selector: 'sx-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <p>{{ tagline() }}</p>
        <nav aria-label="Footer">
          <ul>
            @for (item of items(); track item.path) {
              <li>
                <a [routerLink]="item.path">{{ item.label }}</a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </footer>
  `,
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  readonly items = input.required<NavItem[]>();
  readonly tagline = input('Made in Toronto, for the people building in the 6ix.');
}
