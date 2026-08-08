import { redirect } from 'next/navigation';

export default function LegacyReportHistoryPage() {
  redirect('/account#report-history');
}
