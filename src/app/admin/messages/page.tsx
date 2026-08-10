import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { ContactMessagesPanel } from 'src/sections/admin/contact-messages-panel';

export const metadata: Metadata = { title: 'ข้อความติดต่อ | Loveza Admin' };

export default function AdminMessagesPage() {
  return (
    <DashboardContent maxWidth="xl">
      <ContactMessagesPanel />
    </DashboardContent>
  );
}
