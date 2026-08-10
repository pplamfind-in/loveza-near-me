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

type BannerRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: BannerRouteContext) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const parsed = landingBannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูล Banner ไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const { data: currentBanner, error: currentBannerError } = await supabase
    .from('landing_banners')
    .select('image_url, mobile_image_url')
    .eq('id', id)
    .single();

  if (currentBannerError || !currentBanner) {
    return NextResponse.json({ error: 'ไม่พบ Banner ที่ต้องการแก้ไข' }, { status: 404 });
  }

  const values = parsed.data;
  const oldPaths = [currentBanner.image_url, currentBanner.mobile_image_url]
    .map(getLandingBannerImagePath)
    .filter((path): path is string => !!path);
  const newPaths = [values.image_url, values.mobile_image_url]
    .map(getLandingBannerImagePath)
    .filter((path): path is string => !!path);

  const { data, error } = await supabase
    .from('landing_banners')
    .update({
      ...values,
      mobile_image_url: values.mobile_image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(BANNER_FIELDS)
    .single();

  if (error) {
    const orphanPaths = newPaths.filter((path) => !oldPaths.includes(path));
    if (orphanPaths.length) {
      await supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).remove(orphanPaths);
    }
    return NextResponse.json({ error: 'แก้ไข Banner ไม่สำเร็จ' }, { status: 500 });
  }

  const replacedPaths = oldPaths.filter((path) => !newPaths.includes(path));
  if (replacedPaths.length) {
    await supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).remove(replacedPaths);
  }

  revalidatePath('/');
  revalidatePath('/admin/banners');
  return NextResponse.json({ banner: data });
}

export async function DELETE(_request: Request, { params }: BannerRouteContext) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { data: banner, error: bannerError } = await supabase
    .from('landing_banners')
    .select('image_url, mobile_image_url')
    .eq('id', id)
    .single();

  if (bannerError || !banner) {
    return NextResponse.json({ error: 'ไม่พบ Banner ที่ต้องการลบ' }, { status: 404 });
  }

  const { error } = await supabase.from('landing_banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'ลบ Banner ไม่สำเร็จ' }, { status: 500 });

  const imagePaths = [banner.image_url, banner.mobile_image_url]
    .map(getLandingBannerImagePath)
    .filter((path): path is string => !!path);
  if (imagePaths.length) await supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).remove(imagePaths);

  revalidatePath('/');
  revalidatePath('/admin/banners');
  return NextResponse.json({ status: 'success' });
}
