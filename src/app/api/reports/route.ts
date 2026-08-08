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

  if (hasPhoto) {
    const photo = values.photo as File;
    const extension = photo.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(path, photo, { contentType: photo.type });

    if (uploadError) {
      return NextResponse.json(
        { status: 'error', message: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง' },
        { status: 500 }
      );
    }

    photoUrl = supabase.storage.from('report-images').getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    store_name: values.storeName,
    address: values.address || null,
    province: values.province,
    district: values.district,
    latitude: values.latitude,
    longitude: values.longitude,
    flavors: values.flavors,
    stock_status: values.stockStatus,
    estimated_quantity: values.estimatedQuantity,
    photo_url: photoUrl,
    note: values.note || null,
    approval_status: 'pending',
  });

  if (error) {
    return NextResponse.json({ status: 'error', message: 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  revalidatePath('/account');

  return NextResponse.json({ status: 'success', message: 'ส่งข้อมูลแล้ว ขอบคุณที่ช่วยชุมชน Loveza!' });
}
