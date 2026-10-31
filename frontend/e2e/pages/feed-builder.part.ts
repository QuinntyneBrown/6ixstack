import { Locator } from '@playwright/test';

/** The custom feed choice form, inline on /feeds or inside the subscribe dialog. */
export class FeedBuilderPart {
  readonly allTopics: Locator;
  readonly topicError: Locator;
  readonly create: Locator;

  constructor(readonly root: Locator) {
    this.allTopics = root.getByRole('checkbox', { name: 'All topics' });
    this.topicError = root.locator('#feed-topics-error');
    this.create = root.getByRole('button', { name: /^(Create feed link|Creating feed…|Try again)$/ });
  }

  topic(name: string): Locator {
    return this.root.getByRole('checkbox', { name, exact: true });
  }

  where(name: 'GTA and streaming' | 'GTA only' | 'Streaming only'): Locator {
    return this.root.getByRole('radio', { name });
  }

  async choose(topics: string[], where?: 'GTA and streaming' | 'GTA only' | 'Streaming only'): Promise<void> {
    for (const t of topics) await this.topic(t).check();
    if (where) await this.where(where).check();
  }
}

/** A created feed: its link with Copy, and the calendar app options. */
export class FeedLinkPart {
  readonly link: Locator;
  readonly copy: Locator;

  constructor(readonly root: Locator) {
    this.link = root.getByLabel('Feed link');
    this.copy = root.getByRole('button', { name: /^Copy/ });
  }

  option(name: 'Google Calendar' | 'Outlook' | 'Apple Calendar'): Locator {
    return this.root.getByRole('link', { name: new RegExp(`^${name}`) });
  }
}
