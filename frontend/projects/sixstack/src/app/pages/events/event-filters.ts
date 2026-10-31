import { EventFormatFilter } from 'api';
import { TopicKey } from 'components';

/** The events page's filter state; it is mirrored into the URL and remembered (L2-005). */
export interface EventFilters {
  format: EventFormatFilter;
  topics: TopicKey[];
  q: string;
}

export const NO_FILTERS: EventFilters = { format: 'all', topics: [], q: '' };

export const FORMAT_LABELS: Record<EventFormatFilter, string> = {
  all: 'All',
  gta: 'In the GTA',
  streaming: 'Streaming',
};
