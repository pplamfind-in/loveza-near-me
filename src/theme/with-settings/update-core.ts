import type { ColorSystem, TypographyVariantsOptions } from '@mui/material/styles';
import type { SettingsState } from 'src/components/settings';
import type { ThemeOptions, ThemeColorScheme, ColorSchemeOptionsExtended } from '../types';

import { setFont, hexToRgbChannel, createPaletteChannel } from 'minimal-shared/utils';

import { primaryColorPresets } from './color-presets';
import { createShadowColor } from '../core/custom-shadows';

// ----------------------------------------------------------------------

/**
 * Updates the core theme with the provided settings state.
 * @param theme - The base theme options to update.
 * @param settingsState - The settings state containing direction, fontFamily, contrast, and primaryColor.
 * @returns Updated theme options with applied settings.
 */

export function applySettingsToTheme(
  theme: ThemeOptions,
  settingsState?: SettingsState
): ThemeOptions {
  const {
    direction,
    fontFamily,
    contrast = 'default',
    primaryColor = 'default',
  } = settingsState ?? {};

  const isDefaultContrast = contrast === 'default';
  const isDefaultPrimaryColor = primaryColor === 'default';
  const resolvedFontFamily = fontFamily?.includes(',')
    ? `${fontFamily}, sans-serif`
    : setFont(fontFamily);
  const currentTypography = (
    typeof theme.typography === 'function' ? {} : (theme.typography ?? {})
  ) as TypographyVariantsOptions;

  const lightPalette = theme.colorSchemes?.light?.palette as ColorSystem['palette'];

  const primaryColorPalette = createPaletteChannel(primaryColorPresets[primaryColor]);
  // const secondaryColorPalette = createPaletteChannel(secondaryColorPresets[primaryColor]);

  const updateColorScheme = (schemeName: ThemeColorScheme) => {
    const currentScheme: ColorSchemeOptionsExtended = theme.colorSchemes?.[schemeName] ?? {};

    const updatedPalette = {
      ...currentScheme?.palette,
      ...(!isDefaultPrimaryColor && {
        primary: primaryColorPalette,
        // secondary: secondaryColorPalette,
      }),
      ...(schemeName === 'light' && {
        background: {
          ...lightPalette?.background,
          ...(!isDefaultContrast && {
            default: lightPalette.grey[200],
            defaultChannel: hexToRgbChannel(lightPalette.grey[200]),
          }),
        },
      }),
    };

    const updatedCustomShadows = {
      ...currentScheme?.customShadows,
      ...(!isDefaultPrimaryColor && {
        primary: createShadowColor(primaryColorPalette.mainChannel),
        // secondary: createShadowColor(secondaryColorPalette.mainChannel),
      }),
    };

    return {
      ...currentScheme,
      palette: updatedPalette,
      customShadows: updatedCustomShadows,
    };
  };

  return {
    ...theme,
    direction,
    colorSchemes: {
      light: updateColorScheme('light'),
      dark: updateColorScheme('dark'),
    },
    typography: {
      ...currentTypography,
      fontFamily: resolvedFontFamily,
      fontSecondaryFamily: resolvedFontFamily,
      h1: { ...currentTypography.h1, fontFamily: resolvedFontFamily },
      h2: { ...currentTypography.h2, fontFamily: resolvedFontFamily },
      h3: { ...currentTypography.h3, fontFamily: resolvedFontFamily },
      h4: { ...currentTypography.h4, fontFamily: resolvedFontFamily },
      h5: { ...currentTypography.h5, fontFamily: resolvedFontFamily },
      h6: { ...currentTypography.h6, fontFamily: resolvedFontFamily },
      subtitle1: { ...currentTypography.subtitle1, fontFamily: resolvedFontFamily },
      subtitle2: { ...currentTypography.subtitle2, fontFamily: resolvedFontFamily },
      body1: { ...currentTypography.body1, fontFamily: resolvedFontFamily },
      body2: { ...currentTypography.body2, fontFamily: resolvedFontFamily },
      caption: { ...currentTypography.caption, fontFamily: resolvedFontFamily },
      overline: { ...currentTypography.overline, fontFamily: resolvedFontFamily },
      button: { ...currentTypography.button, fontFamily: resolvedFontFamily },
    },
  };
}
