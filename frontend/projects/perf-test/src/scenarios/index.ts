import { Scenario } from './scenario';
import { scenario as alert } from './Alert';
import { scenario as divider } from './Divider';
import { scenario as dialogShell } from './DialogShell';
import { scenario as statusPage } from './StatusPage';
import { scenario as siteFooter } from './SiteFooter';
import { scenario as siteHeader } from './SiteHeader';
import { scenario as skipLink } from './SkipLink';
import { scenario as button } from './Button';
import { scenario as icon } from './Icon';
import { scenario as toast } from './Toast';

/** Every scenario, by name. Add one file per component and register it here. */
export const SCENARIOS: Record<string, Scenario> = Object.fromEntries(
  [icon, alert, toast, divider, dialogShell, statusPage, siteFooter, siteHeader, skipLink, button].map(
    (s) => [s.name, s],
  ),
);
