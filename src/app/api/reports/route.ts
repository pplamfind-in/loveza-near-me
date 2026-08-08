import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { reportSchema } from 'src/app/report/schema';
import { createClient } from 'src/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { status: 'error', message: 'กรุณาเข้าสู่ระบบด้วย Google ก่อนแจ้งพิกัด' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const parsed = reportSchema.safeParse({
    ...Object.fromEntries(formData),
    flavors: formData.getAll('flavors'),
    photo: formData.get('photo') || null,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', message: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const hasPhoto = values.photo instanceof File && values.photo.size > 0;

  let photoUrl: string | null = null;
  let photoPath: string | null = null;

  if (hasPhoto) {
    const photo = values.photo as File;
    const extension = photo.name.split('.').pop() || 'jpg';
    photoPath = `${user.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(photoPath, photo, { contentType: photo.type });

    if (uploadError) {
      return NextResponse.json(
        { status: 'error', message: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง' },
        { status: 500 }
      );
    }

    photoUrl = supabase.storage.from('report-images').getPublicUrl(photoPath).data.publicUrl;
  }

  const { data, error } = await supabase.rpc('submit_store_report', {
    p_store_name: values.storeName,
    p_address: values.address || null,
    p_province: values.province,
    p_district: values.district,
    p_latitude: values.latitude,
    p_longitude: values.longitude,
    p_flavors: values.flavors,
    p_stock_status: values.stockStatus,
    p_estimated_quantity: values.estimatedQuantity,
    p_photo_url: photoUrl,
    p_note: values.note || null,
  });

  if (error) {
    if (photoPath) {
      const { error: removeError } = await supabase.storage
        .from('report-images')
        .remove([photoPath]);
      if (removeError) {
        console.error('[api/reports] failed to clean up orphaned photo', removeError);
      }
    }
    console.error('[api/reports] atomic report submission failed', error);
    if (error.message.includes('Invalid report data')) {
      return NextResponse.json(
        { status: 'error', message: 'ข้อมูลพิกัดไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { status: 'error', message: 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' },
      { status: 500 }
    );
  }

  const result = data as {
    duplicate?: boolean;
    duplicateName?: string;
    distanceM?: number;
    radiusM?: number;
  } | null;

  if (result?.duplicate) {
    if (photoPath) {
      const { error: removeError } = await supabase.storage
        .from('report-images')
        .remove([photoPath]);
      if (removeError) {
        console.error('[api/reports] failed to clean up orphaned photo', removeError);
      }
    }

    const distance = Math.max(0, Math.round(result.distanceM ?? 0));
    return NextResponse.json(
      {
        status: 'error',
        message: `พบพิกัด ${result.duplicateName || 'ร้านเดิม'} อยู่ใกล้กันประมาณ ${distance} เมตร จึงไม่บันทึกซ้ำ`,
      },
      { status: 409 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/network');
  revalidatePath('/admin/users');
  revalidatePath('/account');

  return NextResponse.json({
    status: 'success',
    message: 'เพิ่มจุดขายแล้ว ระบบกำลังแสดงผลแบบเรียลไทม์ ขอบคุณที่ช่วยชุมชน Loveza!',
  });
}
