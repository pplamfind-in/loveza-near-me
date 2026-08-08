// ----------------------------------------------------------------------

/**
 * Thai-language "time ago" label. The project's shared `fToNow` util renders
 * in whatever dayjs locale is active (English by default, no `th` locale is
 * registered), so nearby-store timestamps use this small local formatter
 * instead of pulling in a full locale for one string.
 */
export function formatRelativeTimeTh(input: string | Date | null | undefined): string {
  if (!input) return '';

  const date = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) return '';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}
