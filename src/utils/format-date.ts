import 'dayjs/locale/th';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('th');

// ----------------------------------------------------------------------

export function formatReportDate(input: string | null): string {
  if (!input) return 'ไม่ทราบวันที่';

  const date = dayjs(input);

  if (!date.isValid()) return 'ไม่ทราบวันที่';

  return `แจ้งเมื่อ ${date.format('D MMM YYYY เวลา HH:mm')} น.`;
}

export function formatRelativeDate(input: string | null): string {
  if (!input) return 'ไม่ทราบวันที่';

  const date = dayjs(input);

  if (!date.isValid()) return 'ไม่ทราบวันที่';

  return date.fromNow();
}
