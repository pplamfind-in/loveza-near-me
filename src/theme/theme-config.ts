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
      lighter: '#FFE5F3',
      light: '#FF61B3',
      main: '#E5007E',
      dark: '#B80065',
      darker: '#72003F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#F1E8FF',
      light: '#B994FF',
      main: '#7C3AED',
      dark: '#5B21B6',
      darker: '#35106E',
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
      contrastText: '#2A2028',
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
      50: '#FFFCFE',
      100: '#FFF8FC',
      200: '#F8EEF4',
      300: '#E9DCE4',
      400: '#CDBBC6',
      500: '#998A94',
      600: '#6F616B',
      700: '#4B3D47',
      800: '#2A2028',
      900: '#171014',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
