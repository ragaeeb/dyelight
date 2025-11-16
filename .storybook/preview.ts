import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
    parameters: {
        controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /Date$/ } },
        layout: 'fullscreen',
    },
};

export default preview;
