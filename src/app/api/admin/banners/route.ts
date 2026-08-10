import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { landingBannerSchema } from 'src/app/admin/banners/schema';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  getLandingBannerImagePath,
  LANDING_BANNER_IMAGE_BUCKET,
} from 'src/lib/supabase/landing-banner-image';

const BANNER_FIELDS =
  'id, title, image_url, mobile_image_url, alt_text, sort_order, is_active, created_at, updated_at';

export async function GET() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabase
    .from('landing_banners')
    .select(BANNER_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'โหลดข้อมูล Banner ไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ banners: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const parsed = landingBannerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูล Banner ไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from('landing_banners')
    .insert({
      ...values,
      mobile_image_url: values.mobile_image_url || null,
    })
    .select(BANNER_FIELDS)
    .single();

  if (error) {
    const imagePaths = [values.image_url, values.mobile_image_url]
      .map(getLandingBannerImagePath)
      .filter((path): path is string => !!path);
    if (imagePaths.length) await supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).remove(imagePaths);

    return NextResponse.json({ error: 'บันทึก Banner ไม่สำเร็จ' }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/admin/banners');
  return NextResponse.json({ banner: data }, { status: 201 });
}
