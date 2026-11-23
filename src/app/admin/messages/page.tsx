import type { Metadata } from 'next';

import { absoluteUrl } from 'src/lib/seo';
import { getGmailSmtpConfig } from 'src/lib/gmail-smtp';
import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

import { ContactMessagesPanel } from 'src/sections/admin/contact-messages-panel';

export const metadata: Metadata = { title: 'ข้อความติดต่อ | Loveza Admin' };

export default async function AdminMessagesPage() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  const { sender, password } = await getGmailSmtpConfig(supabase);

  return (
    <DashboardContent maxWidth="xl">
      <ContactMessagesPanel
        replySender={sender}
        replyConfigured={Boolean(sender && password)}
        replySiteUrl={absoluteUrl('/')}
      />
    </DashboardContent>
  );
}
