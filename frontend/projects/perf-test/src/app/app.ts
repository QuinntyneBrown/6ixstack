import { NgComponentOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component } from '@angular/core';
import { SCENARIOS } from '../scenarios';

declare global {
  interface Window {
    __perf?: { scenario: string; iterations: number; renderMs: number };
  }
}

/**
 * Renders one scenario named by `?scenario=` with `?iterations=` instances, then records the time from
 * bootstrap to the first render in `window.__perf` for the runner (scripts/run-perf-test.ts).
 */
@Component({
  selector: 'sx-root',
  imports: [NgComponentOutlet],
  template: `
    @if (scenario) {
      <ng-container *ngComponentOutlet="scenario.component; inputs: { items: items }" />
    } @else {
      <h1>Perf test</h1>
      <ul>
        @for (name of names; track name) {
          <li>
            <a [href]="'?scenario=' + name + '&iterations=1000'">{{ name }}</a>
          </li>
        }
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly params = new URLSearchParams(location.search);
  protected readonly names = Object.keys(SCENARIOS);
  protected readonly scenario = SCENARIOS[this.params.get('scenario') ?? ''];
  private readonly iterations = Number(this.params.get('iterations') ?? 1000);
  protected readonly items = Array.from({ length: this.iterations }, (_, i) => i);

  constructor() {
    performance.mark('scenario-start');
    afterNextRender(() => {
      const measure = performance.measure('scenario-render', 'scenario-start');
      window.__perf = {
        scenario: this.params.get('scenario') ?? '',
        iterations: this.iterations,
        renderMs: measure.duration,
      };
    });
  }
}
