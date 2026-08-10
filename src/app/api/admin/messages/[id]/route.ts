import { z } from 'zod';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

const statusSchema = z.object({ status: z.enum(['new', 'read', 'resolved']) });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'รหัสข้อความไม่ถูกต้อง' }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }

  const resolved = parsed.data.status === 'resolved';
  const { data, error } = await supabase
    .from('contact_messages')
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? user.id : null,
    })
    .eq('id', id)
    .select('id, status, updated_at, resolved_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'อัปเดตข้อความไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
