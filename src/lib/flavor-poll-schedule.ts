type PollSchedule = {
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const bangkokDateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});

export function getFlavorPollStatus(poll: PollSchedule, now = Date.now()) {
  if (!poll.is_active) return 'closed';
  if (poll.starts_at && Date.parse(poll.starts_at) > now) return 'upcoming';
  if (poll.ends_at && Date.parse(poll.ends_at) <= now) return 'ended';
  return 'active';
}

export const flavorPollStatusLabel = {
  upcoming: 'ตั้งเวลาเผยแพร่',
  ended: 'สิ้นสุดแล้ว',
  active: 'เปิดโหวต',
  closed: 'ปิดโหวต',
};

export function getFlavorPollPublicationStatus(poll: PollSchedule & { is_published: boolean }) {
  if (!poll.is_published) return 'draft';

  const status = getFlavorPollStatus(poll);
  return status === 'active' ? 'published' : status;
}

export const flavorPollPublicationLabel = {
  draft: 'แบบร่าง',
  upcoming: 'ตั้งเวลาเผยแพร่',
  published: 'เผยแพร่แล้ว',
  ended: 'สิ้นสุดแล้ว',
  closed: 'ปิดกิจกรรม',
};

export function formatBangkokPollDate(value: string) {
  return bangkokDateTime.format(new Date(value));
}

export function parseFlavorPollSourceUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 2048
      ? url.href
      : null;
  } catch {
    return null;
  }
}
