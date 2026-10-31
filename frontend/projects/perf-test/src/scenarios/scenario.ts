import { Type } from '@angular/core';

/** A perf-test scenario renders `iterations` instances of one component. */
export interface Scenario {
  name: string;
  component: Type<unknown>;
}
