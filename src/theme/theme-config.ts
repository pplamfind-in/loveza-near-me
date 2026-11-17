import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'LINE Seed Sans TH',
    secondary: 'LINE Seed Sans TH',
  },
  /** **************************************
   * Palette
   *************************************** */

  palette: {
    primary: {
      lighter: '#E8F0E4',
      light: '#83AD87',
      main: '#427653',
      dark: '#305C3D',
      darker: '#233F2B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#FBF0CD',
      light: '#E9C76C',
      main: '#AC7628',
      dark: '#80551D',
      darker: '#523817',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#E0F7FF',
      light: '#67D8FF',
      main: '#11A8E2',
      dark: '#087AA8',
      darker: '#064866',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#DDFBEF',
      light: '#69E0AD',
      main: '#18B875',
      dark: '#0B8653',
      darker: '#075438',
      contrastText: '#FFFFFF',
    },
    warning: {
      lighter: '#FFF6D8',
      light: '#FFD569',
      main: '#FFB000',
      dark: '#B97800',
      darker: '#754500',
      contrastText: '#2E251E',
    },
    error: {
      lighter: '#FFE8ED',
      light: '#FF879B',
      main: '#F0445E',
      dark: '#B6223A',
      darker: '#720F25',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FFFDFA',
      100: '#FBF6ED',
      200: '#F2EADF',
      300: '#E4D9CB',
      400: '#C7B9A7',
      500: '#948675',
      600: '#706355',
      700: '#514437',
      800: '#2E251E',
      900: '#1D1814',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
