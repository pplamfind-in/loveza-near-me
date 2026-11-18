import { normalizeFlavor } from './flavor-collection';

// Must match the flavors that the report form and its server schema accept.
const REPORTABLE_FLAVORS = new Set(['honey_lemon', 'lychee', 'kyoho_grape', 'yoghurt']);
export function rewardProductFlavor(slug: string) {
  const key = normalizeFlavor(slug);
  return REPORTABLE_FLAVORS.has(key) ? key : null;
}
export type RewardProduct = {
  id: string;
  thai_name: string;
  slug: string;
  is_new: boolean;
  is_active: boolean;
};
