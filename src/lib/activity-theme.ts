export const activityColorPattern = /^#[0-9A-Fa-f]{6}$/;

export function activityTheme(color: string | null) {
  const theme = {
    '--activity-primary': 'var(--palette-primary-main)',
    '--activity-contrast': 'var(--palette-primary-contrastText)',
  };

  if (!color || !activityColorPattern.test(color)) return theme;

  const luminance = [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const channel = parseInt(color.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + weight * linear;
  }, 0);

  return {
    '--activity-primary': color,
    '--activity-contrast': luminance > 0.179 ? '#000000' : '#FFFFFF',
  };
}

export const activityTint =
  'color-mix(in srgb, var(--activity-primary) 18%, var(--palette-background-paper))';

export const activityButtonSx = {
  bgcolor: 'var(--activity-primary)',
  color: 'var(--activity-contrast)',
  '&:hover': { filter: 'brightness(.94)', bgcolor: 'var(--activity-primary)' },
  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
};
