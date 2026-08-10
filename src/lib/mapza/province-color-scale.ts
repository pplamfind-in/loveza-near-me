export type ProvinceColorSettings = {
  noDataColor: string;
  tier1Max: number;
  tier1Color: string;
  tier2Max: number;
  tier2Color: string;
  tier3Max: number;
  tier3Color: string;
  tier4Color: string;
};

export type ProvinceColorSettingsRow = {
  province_no_data_color?: unknown;
  province_tier_1_max?: unknown;
  province_tier_1_color?: unknown;
  province_tier_2_max?: unknown;
  province_tier_2_color?: unknown;
  province_tier_3_max?: unknown;
  province_tier_3_color?: unknown;
  province_tier_4_color?: unknown;
};

export const DEFAULT_PROVINCE_COLOR_SETTINGS: ProvinceColorSettings = {
  noDataColor: '#B1BFBF',
  tier1Max: 2,
  tier1Color: '#70E1F5',
  tier2Max: 6,
  tier2Color: '#FDE047',
  tier3Max: 14,
  tier3Color: '#FF78B8',
  tier4Color: '#E5007E',
};

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export function isValidProvinceColorSettings(settings: ProvinceColorSettings) {
  return (
    Number.isInteger(settings.tier1Max) &&
    Number.isInteger(settings.tier2Max) &&
    Number.isInteger(settings.tier3Max) &&
    settings.tier1Max >= 1 &&
    settings.tier1Max < settings.tier2Max &&
    settings.tier2Max < settings.tier3Max &&
    settings.tier3Max <= 999999 &&
    [
      settings.noDataColor,
      settings.tier1Color,
      settings.tier2Color,
      settings.tier3Color,
      settings.tier4Color,
    ].every((color) => HEX_COLOR_PATTERN.test(color))
  );
}

export function provinceColorSettingsFromRow(row: unknown): ProvinceColorSettings {
  if (!row || typeof row !== 'object') return DEFAULT_PROVINCE_COLOR_SETTINGS;

  const value = row as ProvinceColorSettingsRow;

  const settings: ProvinceColorSettings = {
    noDataColor: String(value.province_no_data_color).toUpperCase(),
    tier1Max: Number(value.province_tier_1_max),
    tier1Color: String(value.province_tier_1_color).toUpperCase(),
    tier2Max: Number(value.province_tier_2_max),
    tier2Color: String(value.province_tier_2_color).toUpperCase(),
    tier3Max: Number(value.province_tier_3_max),
    tier3Color: String(value.province_tier_3_color).toUpperCase(),
    tier4Color: String(value.province_tier_4_color).toUpperCase(),
  };

  return isValidProvinceColorSettings(settings)
    ? settings
    : DEFAULT_PROVINCE_COLOR_SETTINGS;
}

export function buildProvinceColorScale(settings: ProvinceColorSettings) {
  return [
    { maxCount: 0, color: settings.noDataColor, label: 'ยังไม่มีข้อมูล' },
    {
      maxCount: settings.tier1Max,
      color: settings.tier1Color,
      label: `1-${settings.tier1Max} จุดขาย`,
    },
    {
      maxCount: settings.tier2Max,
      color: settings.tier2Color,
      label: `${settings.tier1Max + 1}-${settings.tier2Max} จุดขาย`,
    },
    {
      maxCount: settings.tier3Max,
      color: settings.tier3Color,
      label: `${settings.tier2Max + 1}-${settings.tier3Max} จุดขาย`,
    },
    {
      maxCount: Infinity,
      color: settings.tier4Color,
      label: `${settings.tier3Max + 1} จุดขายขึ้นไป`,
    },
  ];
}
