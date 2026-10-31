import { IconName } from '../icon/icons';

/** One navigation destination, shared by the header, the footer and the phone menu. */
export interface NavItem {
  label: string;
  path: string;
  /** Match the path exactly when marking the current page (use for `/`). */
  exact?: boolean;
  icon?: IconName;
}
