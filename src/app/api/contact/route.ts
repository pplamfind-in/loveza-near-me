import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';
import { contactMessageSchema } from 'src/app/contact-us/schema';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (payload && typeof payload === 'object' && 'website' in payload && payload.website) {
    return NextResponse.json({ message: 'ส่งข้อความเรียบร้อยแล้ว' }, { status: 201 });
  }

  const parsed = contactMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    name: values.name,
    email: values.email.toLowerCase(),
    subject: values.subject,
    message: values.message,
  });

  if (error) {
    console.error('[api/contact] insert failed', error);
    return NextResponse.json(
      { error: 'ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'ส่งข้อความเรียบร้อยแล้ว ทีมงานจะตรวจสอบโดยเร็วที่สุด' },
    { status: 201 }
  );
}
