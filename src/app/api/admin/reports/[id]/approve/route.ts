import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase.rpc('approve_report', { report_id: id });

  if (error) return NextResponse.json({ error: 'Approve report failed' }, { status: 500 });

  revalidatePath('/admin');
  revalidatePath('/admin/locations');
  revalidatePath('/admin/users');
  revalidatePath('/nearby');

  return NextResponse.json({ status: 'success' });
}
