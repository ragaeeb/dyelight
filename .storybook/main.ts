import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-docs'],
    framework: { name: '@storybook/react-vite', options: {} },
    async viteFinal(config) {
        config.plugins = config.plugins ?? [];
        config.plugins.push(tsconfigPaths());
        return config;
    },
};

export default config;
