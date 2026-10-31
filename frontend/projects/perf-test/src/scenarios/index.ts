import { Scenario } from './scenario';
import { scenario as notificationItem } from './NotificationItem';
import { scenario as directoryCard } from './DirectoryCard';
import { scenario as featureCard } from './FeatureCard';
import { scenario as eventMap } from './EventMap';
import { scenario as inlineStatus } from './InlineStatus';
import { scenario as backLink } from './BackLink';
import { scenario as table } from './Table';
import { scenario as stat } from './Stat';
import { scenario as logoTile } from './LogoTile';
import { scenario as list } from './List';
import { scenario as buttonGroup } from './ButtonGroup';
import { scenario as calendarDayList } from './CalendarDayList';
import { scenario as monthGrid } from './MonthGrid';
import { scenario as reviewCard } from './ReviewCard';
import { scenario as tooltip } from './Tooltip';
import { scenario as nextSteps } from './NextSteps';
import { scenario as successPanel } from './SuccessPanel';
import { scenario as formSection } from './FormSection';
import { scenario as errorSummary } from './ErrorSummary';
import { scenario as fieldSet } from './FieldSet';
import { scenario as choice } from './Choice';
import { scenario as input } from './Input';
import { scenario as formField } from './FormField';
import { scenario as optionButton } from './OptionButton';
import { scenario as dockedActionBar } from './DockedActionBar';
import { scenario as description } from './Description';
import { scenario as personLink } from './PersonLink';
import { scenario as avatar } from './Avatar';
import { scenario as factItem } from './FactItem';
import { scenario as dateTile } from './DateTile';
import { scenario as emptyState } from './EmptyState';
import { scenario as skeleton } from './Skeleton';
import { scenario as searchField } from './SearchField';
import { scenario as topicChip } from './TopicChip';
import { scenario as segmentedControl } from './SegmentedControl';
import { scenario as dayGroup } from './DayGroup';
import { scenario as eventRow } from './EventRow';
import { scenario as badge } from './Badge';
import { scenario as topicTag } from './TopicTag';
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
  [
    notificationItem,
    directoryCard,
    featureCard,
    eventMap,
    inlineStatus,
    backLink,
    table,
    stat,
    logoTile,
    list,
    buttonGroup,
    calendarDayList,
    monthGrid,
    reviewCard,
    tooltip,
    nextSteps,
    successPanel,
    formSection,
    errorSummary,
    fieldSet,
    choice,
    input,
    formField,
    optionButton,
    dockedActionBar,
    description,
    personLink,
    avatar,
    factItem,
    dateTile,
    emptyState,
    skeleton,
    searchField,
    topicChip,
    segmentedControl,
    icon,
    dayGroup,
    eventRow,
    badge,
    topicTag,
    alert,
    toast,
    divider,
    dialogShell,
    statusPage,
    siteFooter,
    siteHeader,
    skipLink,
    button,
  ].map((s) => [s.name, s]),
);
