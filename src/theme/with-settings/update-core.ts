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
  const isKanit = fontFamily?.includes('Kanit') ?? false;
  const resolvedFontFamily = fontFamily?.includes(',')
    ? `${fontFamily}, sans-serif`
    : setFont(fontFamily);
  const currentTypography = (
    typeof theme.typography === 'function' ? {} : (theme.typography ?? {})
  ) as TypographyVariantsOptions;
  const clampFontWeight = (fontWeight: React.CSSProperties['fontWeight']) => {
    if (!isKanit || fontWeight === undefined) return fontWeight;
    if (typeof fontWeight === 'number') return Math.min(fontWeight, 600);
    if (fontWeight === 'bold' || fontWeight === 'bolder') return 600;

    const numericWeight = Number(fontWeight);
    return Number.isFinite(numericWeight) ? Math.min(numericWeight, 600) : fontWeight;
  };

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
      fontWeightBold: clampFontWeight(currentTypography.fontWeightBold),
      fontWeightExtraBold: clampFontWeight(currentTypography.fontWeightExtraBold),
      h1: {
        ...currentTypography.h1,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h1?.fontWeight),
      },
      h2: {
        ...currentTypography.h2,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h2?.fontWeight),
      },
      h3: {
        ...currentTypography.h3,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h3?.fontWeight),
      },
      h4: {
        ...currentTypography.h4,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h4?.fontWeight),
      },
      h5: {
        ...currentTypography.h5,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h5?.fontWeight),
      },
      h6: {
        ...currentTypography.h6,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.h6?.fontWeight),
      },
      subtitle1: {
        ...currentTypography.subtitle1,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.subtitle1?.fontWeight),
      },
      subtitle2: {
        ...currentTypography.subtitle2,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.subtitle2?.fontWeight),
      },
      body1: {
        ...currentTypography.body1,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.body1?.fontWeight),
      },
      body2: {
        ...currentTypography.body2,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.body2?.fontWeight),
      },
      caption: {
        ...currentTypography.caption,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.caption?.fontWeight),
      },
      overline: {
        ...currentTypography.overline,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.overline?.fontWeight),
      },
      button: {
        ...currentTypography.button,
        fontFamily: resolvedFontFamily,
        fontWeight: clampFontWeight(currentTypography.button?.fontWeight),
      },
    },
  };
}
