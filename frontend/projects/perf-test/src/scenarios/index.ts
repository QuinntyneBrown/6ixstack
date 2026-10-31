import { Scenario } from './scenario';
import { scenario as icon } from './Icon';

/** Every scenario, by name. Add one file per component and register it here. */
export const SCENARIOS: Record<string, Scenario> = Object.fromEntries([icon].map((s) => [s.name, s]));
