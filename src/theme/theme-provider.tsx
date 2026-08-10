'use client';

import type { Theme, ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';
import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { useSettingsContext } from 'src/components/settings';

import { createTheme } from './create-theme';
import { Rtl } from './with-settings/right-to-left';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Partial<MuiThemeProviderProps<Theme>> & {
  themeOverrides?: ThemeOptions;
  forcedFontFamily?: string;
};

export function ThemeProvider({
  themeOverrides,
  forcedFontFamily,
  children,
  ...other
}: ThemeProviderProps) {
  const settings = useSettingsContext();
  const { currentLang } = useTranslate();
  const settingsState = forcedFontFamily
    ? { ...settings.state, fontFamily: forcedFontFamily }
    : settings.state;

  const theme = createTheme({
    settingsState,
    localeComponents: currentLang?.systemValue,
    themeOverrides,
  });

  return (
    <ThemeVarsProvider disableTransitionOnChange theme={theme} {...other}>
      <CssBaseline />
      <Rtl direction={settings.state.direction}>{children}</Rtl>
    </ThemeVarsProvider>
  );
}
