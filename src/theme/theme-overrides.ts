'use client';

import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';

import { themeConfig } from './theme-config';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel(themeConfig.palette.primary),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel(themeConfig.palette.primary),
      },
    },
  },
};
