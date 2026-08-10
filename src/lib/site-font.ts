export const SITE_FONT_OPTIONS = [
  { value: 'line_seed', label: 'LINE Seed Sans TH' },
  { value: 'prompt', label: 'Prompt (Google Font)' },
  { value: 'kanit', label: 'Kanit (Google Font)' },
] as const;

export type SiteFont = (typeof SITE_FONT_OPTIONS)[number]['value'];

export const DEFAULT_SITE_FONT: SiteFont = 'line_seed';

export const SITE_FONT_PREVIEW_FAMILY: Record<SiteFont, string> = {
  line_seed: "'LINE Seed Sans TH', sans-serif",
  prompt: 'var(--font-prompt), sans-serif',
  kanit: 'var(--font-kanit), sans-serif',
};

export function isSiteFont(value: unknown): value is SiteFont {
  return SITE_FONT_OPTIONS.some((option) => option.value === value);
}
