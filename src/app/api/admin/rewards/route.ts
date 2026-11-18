import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { rewardSchema } from 'src/app/admin/rewards/schema';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { rewardProductFlavor } from 'src/lib/explorer/reward-product';
import { getRewardCharacters } from 'src/lib/explorer/reward-catalog';
import { formatRewardCondition } from 'src/lib/explorer/reward-rules';

async function save(request: Request, update: boolean) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const parsed = rewardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const values = parsed.data;
  if (!(await getRewardCharacters()).includes(values.character))
    return NextResponse.json({ error: 'ไม่พบไฟล์ตัวละครในโปรเจกต์' }, { status: 400 });
  const { data: rule, error: ruleError } = await supabase
    .from('explorer_reward_rules')
    .select('*')
    .eq('id', values.metric)
    .maybeSingle();
  if (ruleError || !rule)
    return NextResponse.json({ error: 'ไม่พบเงื่อนไขรางวัล' }, { status: 400 });
  if (values.target > rule.max_target)
    return NextResponse.json(
      { error: `เป้าหมายต้องไม่เกิน ${rule.max_target} ${rule.unit}` },
      { status: 400 }
    );
  if (!rule.is_active) {
    const { data: existing } = update
      ? await supabase.from('explorer_rewards').select('metric').eq('id', values.id).maybeSingle()
      : { data: null };
    if (existing?.metric !== values.metric)
      return NextResponse.json({ error: 'เงื่อนไขนี้ปิดใช้งานแล้ว' }, { status: 400 });
  }
  let requiredFlavor: string | null = null;
  let requiredProductName: string | null = null;
  if (values.required_product_id) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, slug, thai_name, is_active')
      .eq('id', values.required_product_id)
      .maybeSingle();
    if (productError || !product)
      return NextResponse.json({ error: 'ไม่พบสินค้าที่ต้องพบ' }, { status: 400 });
    requiredFlavor = rewardProductFlavor(product.slug);
    if (!requiredFlavor)
      return NextResponse.json(
        { error: 'สินค้านี้ยังไม่มีรสชาติให้เลือกในแบบแจ้งพิกัด' },
        { status: 400 }
      );
    if (!product.is_active) {
      const { data: old } = update
        ? await supabase
            .from('explorer_rewards')
            .select('required_product_id')
            .eq('id', values.id)
            .maybeSingle()
        : { data: null };
      if (old?.required_product_id !== product.id)
        return NextResponse.json({ error: 'สินค้านี้ปิดใช้งานแล้ว' }, { status: 400 });
    }
    requiredProductName = product.thai_name;
  }
  const row = {
    ...values,
    required_flavor: requiredFlavor,
    required_product_name: requiredProductName,
    condition: formatRewardCondition(rule, values.target),
    updated_at: new Date().toISOString(),
  };
  const query = update
    ? supabase.from('explorer_rewards').update(row).eq('id', values.id)
    : supabase.from('explorer_rewards').insert(row);
  const { data, error } = await query.select('*').single();
  if (error?.code === '23505')
    return NextResponse.json({ error: 'รหัสรางวัลนี้มีแล้ว' }, { status: 409 });
  if (error?.code === 'PGRST116')
    return NextResponse.json({ error: 'ไม่พบรางวัลที่แก้ไข' }, { status: 404 });
  if (error) return NextResponse.json({ error: 'บันทึกรางวัลไม่สำเร็จ' }, { status: 500 });
  revalidatePath('/rewards');
  revalidatePath('/admin/rewards');
  return NextResponse.json({ reward: data }, { status: update ? 200 : 201 });
}
export async function POST(request: Request) {
  return save(request, false);
}
export async function PATCH(request: Request) {
  return save(request, true);
}
