import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour scheme',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      document.documentElement.dataset['theme'] = context.globals['theme'] ?? 'light';
      return story();
    },
  ],
};

export default preview;
