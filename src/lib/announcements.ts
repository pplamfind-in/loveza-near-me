export const ANNOUNCEMENT_BUCKET = 'announcement-covers';
export const ANNOUNCEMENT_COVER_LIMIT = 5 * 1024 * 1024;
export const ANNOUNCEMENT_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const bangkokCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const bangkokDisplay = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok',
  dateStyle: 'long',
});

export function announcementCalendarDate(date: Date) {
  return bangkokCalendar.format(date);
}

export function formatAnnouncementDate(value: string) {
  return bangkokDisplay.format(new Date(value));
}
