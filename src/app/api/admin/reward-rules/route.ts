import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { rewardRuleSchema } from 'src/app/admin/reward-rules/schema';

async function save(request: Request, update: boolean) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const parsed = rewardRuleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const query = update
    ? supabase.from('explorer_reward_rules').update(parsed.data).eq('id', parsed.data.id)
    : supabase.from('explorer_reward_rules').insert(parsed.data);
  const { error } = await query.select('id').single();
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === '23505'
            ? 'รหัสนี้มีแล้ว'
            : error.code === '23514'
              ? 'มีรางวัลใช้อยู่: เปลี่ยนวิธีนับไม่ได้ และค่าสูงสุดต้องไม่น้อยกว่าเป้าหมายรางวัลเดิม'
              : 'บันทึกไม่สำเร็จ',
      },
      { status: 400 }
    );
  revalidatePath('/admin/reward-rules');
  revalidatePath('/admin/rewards');
  revalidatePath('/rewards');
  return NextResponse.json({ success: true });
}
export async function POST(r: Request) {
  return save(r, false);
}
export async function PATCH(r: Request) {
  return save(r, true);
}
export async function DELETE(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string')
    return NextResponse.json({ error: 'รหัสไม่ถูกต้อง' }, { status: 400 });
  const { data, error } = await supabase
    .from('explorer_reward_rules')
    .delete()
    .eq('id', body.id)
    .select('id');
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === '23503' ? 'มีรางวัลใช้เงื่อนไขนี้อยู่ กรุณาปิดใช้งานแทน' : 'ลบไม่สำเร็จ',
      },
      { status: 409 }
    );
  if (!data?.length) return NextResponse.json({ error: 'ไม่พบเงื่อนไข' }, { status: 404 });
  revalidatePath('/admin/reward-rules');
  revalidatePath('/admin/rewards');
  return NextResponse.json({ success: true });
}
