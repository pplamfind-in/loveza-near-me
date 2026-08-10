import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

const MESSAGE_FIELDS =
  'id, name, email, subject, message, status, created_at, updated_at, resolved_at';

export async function GET() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabase
    .from('contact_messages')
    .select(MESSAGE_FIELDS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: 'โหลดข้อความไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
