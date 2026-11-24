'use server';

import { z } from 'zod';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';
import { STORE_LOGO_BUCKET } from 'src/lib/supabase/store-logo';

import { getPinProvince } from './pin-province';
import { merchantStockSchema } from './stock-schema';
import { merchantSettingsSchema } from './settings-schema';

const merchantPath = '/account/merchant';

export async function saveMerchantSettings(formData: FormData, createFromProfile = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login?next=/account/merchant');

  const { data: accountType } = await supabase
    .from('account_types')
    .select('kind')
    .eq('user_id', user.id)
    .maybeSingle();
  if (accountType?.kind !== (createFromProfile ? 'hunter' : 'merchant')) return 'บัญชีนี้ไม่มีสิทธิ์ตั้งค่าร้าน';

  const result = merchantSettingsSchema.safeParse({
    name: formData.get('name'),
    branch_name: formData.get('branch_name') ?? '',
    store_type_code: formData.get('store_type_code'),
    logo: formData.get('logo'),
    removeLogo: formData.get('removeLogo') === 'true',
  });
  if (!result.success) return result.error.issues[0].message;

  const {
    store_type_code: storeTypeCode,
    branch_name: branchName,
    name,
    logo,
    removeLogo,
  } = result.data;
  let storeName = name;
  if (storeTypeCode) {
    const master = await supabase
      .from('store_types')
      .select('name')
      .eq('code', storeTypeCode)
      .eq('is_active', true)
      .maybeSingle();
    if (master.error) return 'โหลดข้อมูล Master ไม่สำเร็จ';

    if (master.data) {
      storeName = master.data.name;
    } else {
      const current = await supabase
        .from('merchant_accounts')
        .select('name')
        .eq('user_id', user.id)
        .eq('store_type_code', storeTypeCode)
        .maybeSingle();
      if (current.error) return 'โหลดข้อมูลร้านไม่สำเร็จ';
      if (!current.data) return 'กรุณาเลือกร้านจากข้อมูล Master';
      storeName = current.data.name;
    }
  }
  if (!storeName || storeName.length > 120) return 'กรุณาตรวจสอบชื่อร้าน';

  const bucket = supabase.storage.from(STORE_LOGO_BUCKET);
  let previousLogo: string | null = null;
  let newLogo: string | undefined;
  if (logo || removeLogo) {
    const { data: current, error } = await supabase
      .from('merchant_accounts')
      .select('logo_path')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return 'โหลดโลโก้ร้านไม่สำเร็จ';
    previousLogo = current?.logo_path ?? null;
  }

  if (logo) {
    let content: Buffer;
    try {
      const image = sharp(Buffer.from(await logo.arrayBuffer()), { limitInputPixels: 16_000_000 });
      const format = logo.type === 'image/jpg' ? 'jpeg' : logo.type.slice('image/'.length);
      if ((await image.metadata()).format !== format) throw new Error('Image type mismatch');
      content = await image
        .rotate()
        .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return 'เปิดไฟล์โลโก้ไม่ได้ กรุณาเลือกรูปใหม่';
    }
    newLogo = `${user.id}/${randomUUID()}.webp`;
    const { error } = await bucket.upload(newLogo, content, { contentType: 'image/webp' });
    if (error) return 'อัปโหลดโลโก้ไม่สำเร็จ';
  }

  const settings = {
    name: storeName,
    branch_name: branchName || null,
    store_type_code: storeTypeCode || null,
    ...(newLogo || removeLogo ? { logo_path: newLogo ?? null } : {}),
  };
  if (createFromProfile) {
    const { data, error } = await supabase.rpc('create_merchant_from_profile', {
      shop_name: storeName,
      shop_branch: settings.branch_name,
      shop_type: settings.store_type_code,
      shop_logo: newLogo ?? null,
    });
    if (error || data !== true) {
      if (newLogo) await bucket.remove([newLogo]);
      return 'สร้างร้านไม่สำเร็จ กรุณาลองใหม่';
    }
    revalidatePath('/account', 'layout');
    return redirect('/account/merchant/');
  }
  const { error } = await supabase
    .from('merchant_accounts')
    .insert({ user_id: user.id, ...settings });
  let saveError = error;
  if (error?.code === '23505') {
    const updated = await supabase
      .from('merchant_accounts')
      .update(settings)
      .eq('user_id', user.id)
      .select('user_id')
      .single();
    saveError = updated.error;
  }
  if (saveError) {
    if (newLogo) await bucket.remove([newLogo]);
    return 'บันทึกข้อมูลร้านไม่สำเร็จ';
  }

  if (previousLogo && previousLogo !== newLogo) await bucket.remove([previousLogo]);
  revalidatePath('/nearby');
  revalidatePath('/mapza');

  revalidatePath(merchantPath);
  return null;
}

export async function updateMerchantStock(
  storeId: string,
  filters: { q: string; page: number },
  values: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login?next=/account/merchant');

  const input = merchantStockSchema.safeParse(values);
  if (!z.uuid().safeParse(storeId).success) return 'ไม่พบร้านที่เลือก';
  if (!input.success) return input.error.issues[0].message;

  const { status, quantity, flavor } = input.data;
  const { data, error } = await supabase.rpc('update_merchant_flavor_stock', {
    target_store_id: storeId,
    stock_status: status,
    quantity: quantity === '' ? null : Number(quantity),
    flavor,
  });
  if (error) return 'บันทึกสต็อกไม่สำเร็จ กรุณาลองใหม่';
  if (data !== true) return 'บัญชีนี้ไม่มีสิทธิ์อัปเดตสต็อกร้าน หรือร้านปิดใช้งานแล้ว';

  revalidatePath('/nearby');
  revalidatePath('/mapza');
  revalidatePath(merchantPath);
  const query = new URLSearchParams({ q: filters.q, page: String(filters.page), status: 'stock' });
  return redirect(`${merchantPath}?${query}#merchant-stock`);
}

const pinSchema = z.object({
  latitude: z.number().min(5).max(21),
  longitude: z.number().min(97).max(106),
  allowNearby: z.boolean().optional(),
});

const pinErrors: Record<string, string> = {
  'missing-settings': 'กรุณาบันทึกชื่อร้านก่อนปักหมุด',
  'already-registered': 'บัญชีนี้มีหมุดร้านอยู่แล้ว',
  'existing-store':
    'มีหมุดร้านใกล้เคียงอยู่แล้ว หากเป็นร้านเดียวกันให้เลือกหมุดเดิม หากเป็นคนละร้านให้ยืนยันเพิ่มหมุดใหม่',
  'pending-pin': 'มีพิกัดใกล้เคียงกำลังรอตรวจสอบ',
  invalid: 'กรุณาเลือกพิกัดร้านภายในประเทศไทย',
};

export async function saveMerchantPin(value: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนปักหมุด' };

  const pin = pinSchema.safeParse(value);
  if (!pin.success) return { error: pinErrors.invalid };
  const { latitude, longitude, allowNearby } = pin.data;
  const province = await getPinProvince(latitude, longitude);
  if (!province) return { error: pinErrors.invalid };

  const { data, error } = await supabase.rpc('register_merchant_store', {
    pin_latitude: latitude,
    pin_longitude: longitude,
    pin_province: province,
    ...(allowNearby ? { allow_nearby: true } : {}),
  });
  if (error || data !== 'registered') {
    const warning =
      !error && ['existing-store', 'pending-pin', 'already-registered'].includes(data);
    const canAddNearby = !error && (data === 'existing-store' || data === 'pending-pin');
    return {
      error: pinErrors[data] ?? 'บันทึกหมุดไม่สำเร็จ กรุณาลองอีกครั้ง',
      warning,
      canAddNearby,
    };
  }

  revalidatePath(merchantPath);
  revalidatePath('/nearby');
  revalidatePath('/mapza');
  return { error: null };
}

export async function submitExistingMerchantPin(storeId: string) {
  if (!z.uuid().safeParse(storeId).success) return { error: 'ไม่พบหมุดร้านที่เลือก' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนเลือกหมุด' };

  const [store, access] = await Promise.all([
    supabase
      .from('stores')
      .select('name, province, latitude, longitude')
      .eq('id', storeId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('merchant_stores')
      .select('store_id')
      .eq('merchant_id', user.id)
      .eq('store_id', storeId)
      .maybeSingle(),
  ]);
  if (store.error || !store.data || access.error) return { error: 'โหลดหมุดร้านที่เลือกไม่สำเร็จ' };
  if (access.data) {
    const result = await saveMerchantPin({
      latitude: store.data.latitude,
      longitude: store.data.longitude,
    });
    return { ...result, requested: false };
  }

  const request = `ขอสิทธิ์หมุดเดิม: ${store.data.name} (${store.data.province})\nรหัสหมุด: ${storeId}`;
  const { error } = await supabase
    .from('merchant_accounts')
    .update({ branch_request: request.slice(0, 1000) })
    .eq('user_id', user.id)
    .is('self_store_id', null)
    .select('user_id')
    .single();
  if (error) return { error: 'ส่งคำขอไม่สำเร็จ กรุณาตรวจสอบข้อมูลร้านของคุณ' };

  revalidatePath('/admin/merchants');
  return { error: null, requested: true };
}
