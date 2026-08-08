'use client';

import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FFE5F3',
          light: '#FF61B3',
          main: '#E5007E',
          dark: '#B80065',
          darker: '#72003F',
          contrastText: '#FFFFFF',
        }),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FFE5F3',
          light: '#FF61B3',
          main: '#E5007E',
          dark: '#B80065',
          darker: '#72003F',
          contrastText: '#FFFFFF',
        }),
      },
    },
  },
};
