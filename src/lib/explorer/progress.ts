export const POINTS_PER_STORE = 10;
export const MAX_EXPLORER_LEVEL = 100;

const LEVEL_TITLES = new Map([
  [1, 'นักสำรวจมือใหม่'],
  [5, 'นักปักหมุด'],
  [10, 'นักล่าความซ่า'],
  [25, 'นักสำรวจชุมชน'],
  [50, 'ผู้บุกเบิก'],
  [75, 'นักสำรวจรุ่นเก๋า'],
  [100, 'ตำนาน Loveza'],
]);

export const EXPLORER_LEVELS = (() => {
  let totalStores = 0;
  let name = 'นักสำรวจมือใหม่';

  return Array.from({ length: MAX_EXPLORER_LEVEL }, (_, index) => {
    const level = index + 1;
    const storesToAdvance =
      level === 1 ? 0 : level <= 10 ? 1 : level <= 40 ? 2 : level <= 80 ? 3 : 4;
    const titleUnlock = LEVEL_TITLES.get(level) ?? null;
    totalStores += storesToAdvance;
    name = titleUnlock ?? name;

    return {
      level,
      name,
      titleUnlock,
      storesToAdvance,
      totalStores,
      points: totalStores * POINTS_PER_STORE,
    };
  });
})();

type ExplorerReport = {
  store_id: string | null;
  approval_status: string;
  province: string;
  created_at: string;
  flavors?: string[] | null;
  stock_status?: string;
};

export type ExplorerProgress = ReturnType<typeof buildExplorerProgress>;

const bangkokDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export function buildExplorerProgress(reports: ExplorerReport[], now = new Date()) {
  const approved = reports.filter(
    (report) => report.approval_status === 'approved' && report.store_id
  );
  const stores = new Set(approved.map((report) => report.store_id));
  const provinces = new Set(approved.map((report) => report.province.trim()).filter(Boolean));
  // Lifetime points are derived from moderated reports, never from client-submitted scores.
  const points = stores.size * POINTS_PER_STORE;
  const levelIndex = EXPLORER_LEVELS.reduce(
    (index, level, current) => (points >= level.points ? current : index),
    0
  );
  const level = EXPLORER_LEVELS[levelIndex];
  const next = EXPLORER_LEVELS[levelIndex + 1];
  const today = bangkokDate(now);
  const todayCompleted = approved.some((report) => {
    const date = new Date(report.created_at);
    return Number.isFinite(date.getTime()) && bangkokDate(date) === today;
  });
  return {
    points,
    level: level.level,
    levelName: level.name,
    storesToNextLevel: next ? next.totalStores - stores.size : null,
    nextLevelTitleUnlock: next?.titleUnlock ?? null,
    nextLevelName: next?.name ?? null,
    nextLevelPoints: next?.points ?? null,
    progressPercent: next
      ? Math.min(100, Math.round(((points - level.points) / (next.points - level.points)) * 100))
      : 100,
    uniqueStores: stores.size,
    approvedReports: approved.length,
    explorationDays: new Set(
      approved
        .map((report) => new Date(report.created_at))
        .filter((date) => Number.isFinite(date.getTime()))
        .map(bangkokDate)
    ).size,
    provinces: provinces.size,
    today,
    missions: [
      {
        id: 'today',
        title: 'ส่งต่อความซ่าวันนี้',
        description: 'แจ้งพิกัดวันนี้ 1 ร้าน และผ่านอนุมัติ',
        current: todayCompleted ? 1 : 0,
        target: 1,
        daily: true,
      },
      {
        id: 'first',
        title: 'หมุดแรกของฉัน',
        description: 'มีร้านที่ผ่านอนุมัติร้านแรก',
        current: Math.min(stores.size, 1),
        target: 1,
        daily: false,
      },
      {
        id: 'three',
        title: 'เพื่อนร่วมทาง',
        description: 'ช่วยแจ้งร้านไม่ซ้ำให้ครบ 3 ร้าน',
        current: Math.min(stores.size, 3),
        target: 3,
        daily: false,
      },
      {
        id: 'province',
        title: 'ออกสำรวจต่างจังหวัด',
        description: 'มีพิกัดผ่านอนุมัติใน 2 จังหวัด',
        current: Math.min(provinces.size, 2),
        target: 2,
        daily: false,
      },
    ],
  };
}
