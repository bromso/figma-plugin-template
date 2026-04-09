import path from 'node:path';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^figma-plugin-ds$/,
            replacement: path.resolve(
              __dirname,
              '../../../packages/ui/__mocks__/figma-plugin-ds.js',
            ),
          },
        ],
      },
    });
  },
};

export default config;
