import { z } from 'zod';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getGmailSmtpConfig, encryptGmailAppPassword } from 'src/lib/gmail-smtp';

export const runtime = 'nodejs';

const settingsSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  password: z
    .string()
    .max(64)
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^[a-z]{16}$/i)),
});

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { headers, status: 403 });

  const { password, storedInAdmin } = await getGmailSmtpConfig(supabase);
  if (!storedInAdmin || !password) {
    return NextResponse.json(
      { error: 'เปิดดูได้เฉพาะ App Password ที่บันทึกผ่านหน้าแอดมิน' },
      { headers, status: 404 }
    );
  }

  return NextResponse.json({ password }, { headers });
}

export async function PUT(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 415 });
  }

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'กรุณากรอกอีเมลและ Google App Password 16 ตัวอักษร' },
      { status: 400 }
    );
  }

  const encrypted = encryptGmailAppPassword(parsed.data.password);
  if (!encrypted) {
    return NextResponse.json(
      { error: 'ยังไม่ได้ตั้งค่าคีย์เข้ารหัสบนเซิร์ฟเวอร์' },
      { status: 503 }
    );
  }

  const { error } = await supabase.from('admin_gmail_smtp_settings').upsert({
    id: true,
    email: parsed.data.email,
    encrypted_password: encrypted,
  });
  if (error)
    return NextResponse.json({ error: 'บันทึกบัญชี Gmail SMTP ไม่สำเร็จ' }, { status: 500 });

  return NextResponse.json({ email: parsed.data.email });
}
