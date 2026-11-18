export const REWARD_SOURCES = {
  uniqueStores: 'จำนวนร้านไม่ซ้ำ',
  provinces: 'จำนวนจังหวัด',
  approvedReports: 'จำนวนการแจ้งที่ผ่านอนุมัติ',
  explorationDays: 'จำนวนวันที่ออกสำรวจ',
} as const;
export type RewardRule = {
  id: string;
  name: string;
  source: keyof typeof REWARD_SOURCES;
  unit: string;
  description: string;
  max_target: number;
  sort_order: number;
  is_active: boolean;
};
export function formatRewardCondition(rule: Pick<RewardRule, 'name' | 'unit'>, target: number) {
  return `${rule.name} ${target} ${rule.unit}`;
}
