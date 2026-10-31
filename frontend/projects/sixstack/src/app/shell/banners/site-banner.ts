import { AlertAction, AlertKind } from 'components';

/** A site-wide condition shown under the header (L2-075). */
export interface SiteBanner {
  id: string;
  kind: AlertKind;
  title: string;
  text: string;
  actions?: AlertAction[];
  dismissible: boolean;
  role: 'status' | 'alert' | null;
  onDismiss?: () => void;
}

/** Where a banner comes from; the outlet renders them in this order. */
export type BannerSource = 'connectivity' | 'version' | 'maintenance';
export const BANNER_ORDER: BannerSource[] = ['connectivity', 'version', 'maintenance'];
