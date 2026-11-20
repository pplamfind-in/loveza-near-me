import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';
import { reportSchema, INVALID_PHOTO_MESSAGE } from 'src/app/report/schema';

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

  let values = parsed.data;

  if (values.storeId) {
    const { data: canonicalStore, error: canonicalStoreError } = await supabase
      .from('stores')
      .select('name, store_type, address, province, district')
      .eq('id', values.storeId)
      .eq('is_active', true)
      .single();

    if (canonicalStoreError || !canonicalStore) {
      return NextResponse.json(
        { status: 'error', message: 'ไม่พบร้านที่เลือก กรุณาขอพิกัดและเลือกใหม่อีกครั้ง' },
        { status: 409 }
      );
    }

    values = {
      ...values,
      storeName: canonicalStore.name,
      storeType: canonicalStore.store_type,
      address: canonicalStore.address ?? '',
      province: canonicalStore.province,
      district: canonicalStore.district ?? values.district,
    };
  }

  let logo: Buffer | undefined;
  if (values.storeLogo && values.storeType === 'other' && !values.storeId) {
    const file = values.storeLogo;
    const format = file.type === 'image/jpg' ? 'jpeg' : file.type.slice('image/'.length);

    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 16_000_000,
      });
      const metadata = await image.metadata();
      if (metadata.format !== format) throw new Error(INVALID_PHOTO_MESSAGE);

      logo = await image
        .rotate()
        .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'เปิดไฟล์โลโก้ไม่ได้ กรุณาเลือกรูปใหม่' },
        { status: 400 }
      );
    }
  }

  let logoPath: string | undefined;
  let photoUrl: string | null = null;
  let photoPath: string | null = null;

  if (values.photo) {
    const photo = values.photo;
    const format = photo.type === 'image/jpg' ? 'jpeg' : photo.type.slice('image/'.length);

    try {
      const image = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 60_000_000 });
      const metadata = await image.metadata();
      if (metadata.format !== format) throw new Error(INVALID_PHOTO_MESSAGE);
      await image.resize(1, 1, { fastShrinkOnLoad: false }).toBuffer();
    } catch {
      return NextResponse.json(
        { status: 'error', message: INVALID_PHOTO_MESSAGE },
        { status: 400 }
      );
    }

    const extension = format === 'jpeg' ? 'jpg' : format;
    photoPath = `${user.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(photoPath, photo, { contentType: `image/${format}` });

    if (uploadError) {
      return NextResponse.json(
        { status: 'error', message: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง' },
        { status: 500 }
      );
    }

    photoUrl = supabase.storage.from('report-images').getPublicUrl(photoPath).data.publicUrl;
  }

  const cleanupUploads = async () => {
    if (photoPath) {
      const { error } = await supabase.storage.from('report-images').remove([photoPath]);
      if (error) console.error('[api/reports] failed to clean up orphaned photo', error);
    }
    if (logoPath) {
      const { error } = await supabase.storage.from('store-logos').remove([logoPath]);
      if (error) console.error('[api/reports] failed to clean up orphaned logo', error);
    }
  };

  if (logo) {
    const path = `${user.id}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('store-logos')
      .upload(path, logo, { contentType: 'image/webp' });

    if (uploadError) {
      await cleanupUploads();
      return NextResponse.json(
        { status: 'error', message: 'อัปโหลดโลโก้ไม่สำเร็จ กรุณาลองอีกครั้ง' },
        { status: 500 }
      );
    }
    logoPath = path;
  }

  const reportArgs = {
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
  };
  const { data, error } = logoPath
    ? await supabase.rpc('submit_store_report_with_logo', { ...reportArgs, p_logo_path: logoPath })
    : await supabase.rpc('submit_store_report_v2', {
        ...reportArgs,
        p_store_type: values.storeType,
        p_store_id: values.storeId ?? null,
      });

  if (error) {
    await cleanupUploads();
    console.error('[api/reports] atomic report submission failed', error);
    if (error.message.includes('Invalid report data')) {
      return NextResponse.json(
        { status: 'error', message: 'ข้อมูลพิกัดไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }
    if (error.message.includes('Invalid store reference')) {
      return NextResponse.json(
        { status: 'error', message: 'ยืนยันร้านเดิมไม่สำเร็จ กรุณาลองส่งพิกัดใหม่อีกครั้ง' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { status: 'error', message: 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' },
      { status: 500 }
    );
  }

  const result = data as {
    duplicate?: boolean;
    resolvable?: boolean;
    autoApproved?: boolean;
    storeId?: string;
    duplicateName?: string;
    distanceM?: number;
    radiusM?: number;
  } | null;

  if (result?.duplicate) {
    await cleanupUploads();

    const distance = Math.max(0, Math.round(result.distanceM ?? 0));

    if (result.resolvable && result.storeId) {
      return NextResponse.json(
        {
          status: 'duplicate',
          message: `พบร้าน "${result.duplicateName}" อยู่ใกล้กันประมาณ ${distance} เมตร ใช่ร้านเดียวกันไหม?`,
          candidate: {
            storeId: result.storeId,
            storeName: result.duplicateName ?? '',
            distanceM: distance,
          },
        },
        { status: 409 }
      );
    }

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
  if (result?.autoApproved) {
    revalidatePath('/nearby');
    revalidatePath('/mapza');
  }

  return NextResponse.json({
    status: 'success',
    message: result?.autoApproved
      ? 'เพิ่มจุดขายและแสดงบนแผนที่แล้ว ขอบคุณที่ช่วยชุมชน Loveza!'
      : 'ส่งพิกัดเรียบร้อยแล้ว ระบบจะแสดงผลหลังแอดมินตรวจสอบและอนุมัติ',
  });
}
