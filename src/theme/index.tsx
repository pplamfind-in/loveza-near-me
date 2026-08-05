'use client';

import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { primaryColor, secondaryColor, backgroundDefault } from './palette';

// ----------------------------------------------------------------------

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: primaryColor, contrastText: '#fff' },
    secondary: { main: secondaryColor, contrastText: '#fff' },
    background: { default: backgroundDefault, paper: '#FFFFFF' },
    success: { main: '#2E9E5B' },
    warning: { main: '#F2A93B' },
    error: { main: '#E4483D' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'LINE Seed Sans TH', sans-serif",
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, minHeight: 48, paddingInline: 20 },
        sizeLarge: { minHeight: 56, fontSize: '1rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 20 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { minWidth: 44, minHeight: 44 },
      },
    },
  },
});

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
