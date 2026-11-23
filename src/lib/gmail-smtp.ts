import type { createClient } from 'src/lib/supabase/server';

import { z } from 'zod';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

function encryptionKey() {
  const key = process.env.GMAIL_SMTP_SETTINGS_KEY?.trim();
  return key && /^[a-f\d]{64}$/i.test(key) ? Buffer.from(key, 'hex') : null;
}

export function encryptGmailAppPassword(password: string) {
  const key = encryptionKey();
  if (!key) return null;

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decryptGmailAppPassword(value: string) {
  const key = encryptionKey();
  if (!key) return undefined;

  try {
    const bytes = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return undefined;
  }
}

export async function getGmailSmtpConfig(db: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await db
    .from('admin_gmail_smtp_settings')
    .select('email, encrypted_password')
    .eq('id', true)
    .maybeSingle();

  const email = z.email().safeParse(data?.email ?? process.env.GMAIL_SMTP_USER?.trim());
  const password = data
    ? decryptGmailAppPassword(data.encrypted_password)
    : process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, '');

  return {
    sender: email.success ? { name: 'Loveza Hunt', address: email.data } : null,
    password: error && error.code !== 'PGRST205' ? undefined : password,
    storedInAdmin: Boolean(data),
    canSave: !error && Boolean(encryptionKey()),
  };
}
