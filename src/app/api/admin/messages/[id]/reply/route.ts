import { z } from 'zod';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';

import { getGmailSmtpConfig } from 'src/lib/gmail-smtp';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { buildContactReplyEmail } from 'src/lib/contact-reply-email';

export const runtime = 'nodejs';

const replySchema = z.object({ text: z.string().trim().min(1).max(5000) });
const logoContentId = 'loveza-hunt-logo@lovezahunt.xyz';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 415 });
  }

  const { id } = await params;
  const reply = replySchema.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !reply.success) {
    return NextResponse.json(
      { error: 'กรุณาระบุข้อความตอบกลับไม่เกิน 5,000 ตัวอักษร' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .select('name, email, subject')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'โหลดข้อความต้นฉบับไม่สำเร็จ' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'ไม่พบข้อความต้นฉบับ' }, { status: 404 });

  const recipient = z.email().max(254).safeParse(data.email);
  if (!recipient.success) {
    return NextResponse.json({ error: 'อีเมลผู้ติดต่อไม่ถูกต้อง' }, { status: 422 });
  }

  const { sender, password } = await getGmailSmtpConfig(supabase);
  if (!sender || !password) {
    return NextResponse.json(
      { error: 'ยังไม่ได้ตั้งค่าบัญชี Gmail SMTP บนเซิร์ฟเวอร์' },
      { status: 503 }
    );
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: sender.address, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const logo = await readFile(join(process.cwd(), 'public/logo/logo-email.png'));
    await transport.sendMail({
      from: sender,
      to: { name: '', address: recipient.data },
      subject: `Re: ${data.subject.replace(/[\r\n]+/g, ' ')}`,
      ...buildContactReplyEmail({
        name: data.name,
        subject: data.subject,
        message: reply.data.text,
        logoUrl: `cid:${logoContentId}`,
      }),
      attachments: [
        {
          filename: 'loveza-hunt.png',
          content: logo,
          contentType: 'image/png',
          cid: logoContentId,
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: 'Gmail SMTP ส่งอีเมลไม่สำเร็จ' }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
