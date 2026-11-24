export const ACCOUNT_MODES = ['hunter', 'merchant'] as const;

export type AccountMode = (typeof ACCOUNT_MODES)[number];
