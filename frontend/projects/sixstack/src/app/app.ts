import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from './shell/app-shell';

@Component({
  selector: 'sx-root',
  imports: [AppShell],
  template: `<sx-app-shell />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
