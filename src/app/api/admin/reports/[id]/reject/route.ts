import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase
    .from('reports')
    .update({
      approval_status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Reject report failed' }, { status: 500 });

  revalidatePath('/admin');
  revalidatePath('/admin/network');
  revalidatePath('/admin/users');

  return NextResponse.json({ status: 'success' });
}
