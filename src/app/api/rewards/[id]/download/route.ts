import type { ExplorerReward } from 'src/lib/explorer/rewards';

import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';
import { getRewardProgress } from 'src/lib/explorer/rewards';
import { renderRewardCard } from 'src/lib/explorer/reward-card';
import { buildExplorerProgress } from 'src/lib/explorer/progress';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: rewardRow, error: rewardError } = await db
    .from('explorer_rewards')
    .select('*, rule:explorer_reward_rules(*)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (rewardError) return NextResponse.json({ error: 'โหลดรางวัลไม่สำเร็จ' }, { status: 500 });
  if (!rewardRow) return NextResponse.json({ error: 'ไม่พบรางวัล' }, { status: 404 });
  const reward = rewardRow as ExplorerReward;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดาวน์โหลด' }, { status: 401 });
  const { data, error } = await db
    .from('reports')
    .select('store_id, approval_status, province, created_at, flavors, stock_status')
    .eq('reporter_id', user.id);
  if (error) return NextResponse.json({ error: 'ตรวจสอบภารกิจไม่สำเร็จ' }, { status: 500 });
  if (!getRewardProgress(reward, buildExplorerProgress(data ?? []), data ?? []).unlocked)
    return NextResponse.json({ error: 'รางวัลนี้ยังไม่ปลดล็อก' }, { status: 403 });
  try {
    const image = await renderRewardCard(reward);
    // Render before returning so failures become actionable JSON for the download button.
    const bytes = await image.arrayBuffer();
    const disposition =
      new URL(request.url).searchParams.get('preview') === '1' ? 'inline' : 'attachment';
    if (disposition === 'attachment') {
      const { error: logError } = await db.from('reward_download_events').insert({ reward_id: id });
      if (logError) console.error('Could not record reward download', logError.code);
    }
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${disposition}; filename="loveza-${reward.id}.png"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'สร้างการ์ดไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
  }
}
