import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';
import { MAX_PHOTO_SIZE, ALLOWED_PHOTO_TYPES } from 'src/app/report/schema';

const stockUpdateSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  stockStatus: z.enum(['available', 'low_stock', 'out_of_stock', 'unknown']),
  estimatedQuantity: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(9999)])
    .transform((value) => (value === '' ? null : value)),
  note: z.string().trim().max(500).optional(),
  photo: z
    .instanceof(File)
    .nullable()
    .refine((file) => !file || file.size <= MAX_PHOTO_SIZE, 'ไฟล์รูปต้องไม่เกิน 5MB')
    .refine(
      (file) => !file || ALLOWED_PHOTO_TYPES.includes(file.type),
      'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP'
    ),
});

type StockUpdateResult = {
  duplicate?: boolean;
  autoApproved?: boolean;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนอัปเดตสินค้า' }, { status: 401 });

  const formData = await request.formData();
  const photo = formData.get('photo');
  const payload = stockUpdateSchema.safeParse({
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    stockStatus: formData.get('stockStatus'),
    estimatedQuantity: formData.get('estimatedQuantity'),
    note: formData.get('note') || undefined,
    photo: photo instanceof File && photo.size > 0 ? photo : null,
  });
  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues[0]?.message ?? 'ข้อมูลอัปเดตไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const { id } = await params;
  const { data: sourceReport, error: reportError } = await supabase
    .from('reports')
    .select('store_id, district, flavors')
    .eq('id', id)
    .eq('reporter_id', user.id)
    .eq('approval_status', 'approved')
    .not('store_id', 'is', null)
    .single();

  if (reportError || !sourceReport?.store_id) {
    return NextResponse.json(
      { error: 'อัปเดตได้เฉพาะพิกัดของคุณที่อนุมัติแล้วเท่านั้น' },
      { status: 404 }
    );
  }

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, store_type, address, province, district')
    .eq('id', sourceReport.store_id)
    .eq('is_active', true)
    .single();

  if (storeError || !store) {
    return NextResponse.json(
      { error: 'ร้านนี้ปิดใช้งานหรือไม่พบในระบบ จึงยังอัปเดตสินค้าไม่ได้' },
      { status: 409 }
    );
  }

  const district = store.district ?? sourceReport.district;
  if (!district) {
    return NextResponse.json(
      { error: 'ข้อมูลอำเภอ/เขตของร้านไม่ครบ กรุณาแจ้งแอดมินให้แก้ไขข้อมูลร้านก่อน' },
      { status: 409 }
    );
  }

  const estimatedQuantity =
    payload.data.stockStatus === 'out_of_stock' ? 0 : payload.data.estimatedQuantity;

  let photoUrl: string | null = null;
  let photoPath: string | null = null;

  if (payload.data.photo) {
    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    photoPath = `${user.id}/${randomUUID()}.${extensionByType[payload.data.photo.type]}`;
    const { error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(photoPath, payload.data.photo, { contentType: payload.data.photo.type });

    if (uploadError) {
      return NextResponse.json({ error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
    }

    photoUrl = supabase.storage.from('report-images').getPublicUrl(photoPath).data.publicUrl;
  }

  const cleanUpPhoto = async () => {
    if (!photoPath) return;
    const { error: removeError } = await supabase.storage.from('report-images').remove([photoPath]);
    if (removeError) {
      console.error('[api/account/reports/stock-update] failed to clean up photo', removeError);
    }
  };

  const { data, error } = await supabase.rpc('submit_store_report_v2', {
    p_store_name: store.name,
    p_store_type: store.store_type,
    p_address: store.address,
    p_province: store.province,
    p_district: district,
    p_latitude: payload.data.latitude,
    p_longitude: payload.data.longitude,
    p_flavors: sourceReport.flavors ?? [],
    p_stock_status: payload.data.stockStatus,
    p_estimated_quantity: estimatedQuantity,
    p_photo_url: photoUrl,
    p_note: payload.data.note || null,
    p_store_id: store.id,
  });

  if (error) {
    await cleanUpPhoto();
    console.error('[api/account/reports/stock-update] submission failed', {
      reportId: id,
      userId: user.id,
      error,
    });

    if (error.message.includes('Invalid store reference')) {
      return NextResponse.json(
        { error: 'ตำแหน่งปัจจุบันอยู่ไกลจากร้านเกินระยะที่กำหนด กรุณาอัปเดตเมื่ออยู่ที่ร้าน' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'อัปเดตสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
  }

  const result = data as StockUpdateResult | null;
  if (result?.duplicate) {
    await cleanUpPhoto();
    return NextResponse.json(
      { error: 'ร้านนี้มีรายงานที่กำลังรอตรวจสอบอยู่แล้ว กรุณารอผลอนุมัติก่อน' },
      { status: 409 }
    );
  }

  revalidatePath('/account');
  revalidatePath('/admin');
  revalidatePath('/admin/network');
  if (result?.autoApproved) {
    revalidatePath('/nearby');
    revalidatePath('/mapza');
  }

  return NextResponse.json({
    status: 'success',
    message: result?.autoApproved
      ? 'อัปเดตสถานะสินค้าของร้านแล้ว'
      : 'ส่งข้อมูลอัปเดตแล้ว รอแอดมินตรวจสอบและอนุมัติ',
  });
}
