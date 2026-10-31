import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  // index.stories.ts is the only file Storybook globs; it re-exports one file per example.
  stories: ['../stories/src/**/index.stories.ts'],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {},
};

export default config;
