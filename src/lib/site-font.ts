export const SITE_FONT_OPTIONS = [
  { value: 'line_seed', label: 'LINE Seed Sans TH' },
  { value: 'prompt', label: 'Prompt (Google Font)' },
] as const;

export type SiteFont = (typeof SITE_FONT_OPTIONS)[number]['value'];

export const DEFAULT_SITE_FONT: SiteFont = 'line_seed';

export function isSiteFont(value: unknown): value is SiteFont {
  return SITE_FONT_OPTIONS.some((option) => option.value === value);
}
