import { normalizeFlavor } from './flavor-collection';
import { type RewardRule, formatRewardCondition } from './reward-rules';
import { buildExplorerProgress, type ExplorerProgress } from './progress';

export const REWARD_CARD_HEADER = {
  brand: 'LOVEZA HUNT',
  label: 'CHARACTER CARD',
  color: '#427653',
} as const;

export const EXPLORER_REWARDS = [
  {
    id: 'first-pin',
    name: 'Jazz · หมุดแรกของฉัน',
    character: 'p-jazz.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 1 ร้าน',
    metric: 'uniqueStores',
    target: 1,
    color: '#FBE1EC',
  },
  {
    id: 'trail-buddy',
    name: 'Kard · เพื่อนร่วมทาง',
    character: 'p-kard.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 3 ร้าน',
    metric: 'uniqueStores',
    target: 3,
    color: '#FBF0CD',
  },
  {
    id: 'province-explorer',
    name: 'Korn · นักสำรวจต่างจังหวัด',
    character: 'p-korn.webp',
    condition: 'มีพิกัดผ่านอนุมัติใน 2 จังหวัด',
    metric: 'provinces',
    target: 2,
    color: '#DDECF7',
  },
  {
    id: 'ten-discoveries',
    name: 'Sung · ผู้บุกเบิกความซ่า',
    character: 'p-sung.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 10 ร้าน',
    metric: 'uniqueStores',
    target: 10,
    color: '#DEF2E8',
  },
  {
    id: 'cheer-squad',
    name: 'Cheerleader · ทีมเชียร์นักล่า',
    character: 'p-cheerleader.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 2 ร้าน',
    metric: 'uniqueStores',
    target: 2,
    color: '#FCE4EE',
  },
  {
    id: 'little-explorer',
    name: 'Chibi · นักสำรวจตัวจิ๋ว',
    character: 'p-chibi-girl.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 5 ร้าน',
    metric: 'uniqueStores',
    target: 5,
    color: '#EAE2FA',
  },
  {
    id: 'heart-discovery',
    name: 'Kard Heart · ส่งต่อด้วยใจ',
    character: 'p-kard-heart.webp',
    condition: 'มีพิกัดผ่านอนุมัติใน 3 จังหวัด',
    metric: 'provinces',
    target: 3,
    color: '#FCE3E5',
  },
  {
    id: 'soda-adventure',
    name: 'Soda Girl · ผจญภัยความซ่า',
    character: 'p-soda-girl.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 15 ร้าน',
    metric: 'uniqueStores',
    target: 15,
    color: '#DFF2F8',
  },
  {
    id: 'discovery-duo',
    name: 'Sung & Kard · คู่หูนักสำรวจ',
    character: 'p-sung-kard.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 25 ร้าน',
    metric: 'uniqueStores',
    target: 25,
    color: '#FBEAD8',
  },
  {
    id: 'potion-legend',
    name: 'Sung Potion · ตำนานความซ่า',
    character: 'p-sung-potion-soda.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 50 ร้าน',
    metric: 'uniqueStores',
    target: 50,
    color: '#DFF1D9',
  },
  {
    id: 'sunshine-soda',
    name: 'Love Zay · สดใสไปด้วยกัน',
    character: 'p-love-zay-soda.webp',
    condition: 'มีร้านไม่ซ้ำที่ผ่านอนุมัติ 7 ร้าน',
    metric: 'uniqueStores',
    target: 7,
    color: '#FFF0C7',
  },
  {
    id: 'colorful-team',
    name: 'Loveza Team · แก๊งนักสำรวจ',
    character: 'p-group-colorful.webp',
    condition: 'มีพิกัดผ่านอนุมัติใน 5 จังหวัด',
    metric: 'provinces',
    target: 5,
    color: '#F6E2F1',
  },
] as const;

export type ExplorerReward = {
  id: string;
  name: string;
  character: string;
  condition: string;
  metric: string;
  rule?: RewardRule | null;
  target: number;
  color: string;
  sort_order?: number;
  is_active?: boolean;
  required_product_id?: string | null;
  required_flavor?: string | null;
  required_product_name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

/** Keep the configured order within each group; limited cards appear first. */
export function sortRewardsForDisplay(rewards: ExplorerReward[]) {
  return [...rewards].sort(
    (a, b) => Number(Boolean(b.starts_at && b.ends_at)) - Number(Boolean(a.starts_at && a.ends_at))
  );
}

export function getRewardSchedule(reward: ExplorerReward, now = new Date()) {
  if (!reward.starts_at || !reward.ends_at) return { state: 'always', label: '' };
  const format = (value: string) =>
    new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  if (now.getTime() < Date.parse(reward.starts_at))
    return { state: 'upcoming', label: `เริ่ม ${format(reward.starts_at)}` };
  if (now.getTime() >= Date.parse(reward.ends_at))
    return { state: 'ended', label: 'สิ้นสุดกิจกรรมแล้ว' };
  return { state: 'active', label: `ตามหาได้ถึง ${format(reward.ends_at)}` };
}

export function getRewardProgress(
  reward: ExplorerReward,
  progress: ExplorerProgress | null,
  reports?: Parameters<typeof buildExplorerProgress>[0],
  now = new Date()
) {
  const schedule = getRewardSchedule(reward, now);
  const scoped =
    (reward.starts_at && reward.ends_at) || reward.required_product_id
      ? reports && progress
        ? buildExplorerProgress(
            reports.filter((report) => {
              const time = Date.parse(report.created_at);
              return (
                (!reward.starts_at || time >= Date.parse(reward.starts_at)) &&
                (!reward.ends_at || time < Date.parse(reward.ends_at)) &&
                time <= now.getTime() &&
                (!reward.required_product_id ||
                  (Boolean(reward.required_flavor) &&
                    ['available', 'low_stock'].includes(report.stock_status ?? '') &&
                    (report.flavors ?? []).some(
                      (flavor) => normalizeFlavor(flavor) === reward.required_flavor
                    )))
              );
            }),
            now
          )
        : null
      : progress;
  const source =
    reward.rule?.source ??
    (reward.metric === 'uniqueStores' || reward.metric === 'provinces' ? reward.metric : null);
  const current = Math.min(source ? (scoped?.[source] ?? 0) : 0, reward.target);
  return {
    current,
    target: reward.target,
    unlocked: Boolean(scoped) && schedule.state !== 'upcoming' && current >= reward.target,
    schedule,
    condition: `${reward.rule ? formatRewardCondition(reward.rule, reward.target) : reward.condition}${reward.required_product_name ? ` · ต้องพบ ${reward.required_product_name}` : ''}`,
    unit: reward.rule?.unit ?? (reward.metric === 'provinces' ? 'จังหวัด' : 'ร้าน'),
  };
}
