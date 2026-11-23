import { SITE_NAME, absoluteUrl } from 'src/lib/seo';

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

export function buildContactReplyEmail({
  name,
  subject,
  message,
  siteUrl = absoluteUrl('/'),
  assetBaseUrl = new URL(siteUrl).origin,
  logoUrl = `${assetBaseUrl}/logo/logo-email.png`,
}: {
  name: string;
  subject: string;
  message: string;
  siteUrl?: string;
  assetBaseUrl?: string;
  logoUrl?: string;
}) {
  const contactUrl = new URL('/contact-us/', siteUrl).href;
  const greeting = name.trim() ? `สวัสดีคุณ ${name.trim()}` : 'สวัสดีครับ';
  const signature = `ทีม ${SITE_NAME}`;
  const senderNote =
    'อีเมลนี้ส่งจากบัญชีที่ผู้ดูแลเว็บไซต์ Loveza Hunt ใช้ตอบข้อความจากแบบฟอร์มติดต่อ';
  const verificationNote =
    'หากต้องการตรวจสอบอีเมลฉบับนี้ ให้เข้าเว็บไซต์ Loveza Hunt ด้วยตนเอง แล้วไปที่หน้าติดต่อเรา';

  return {
    text: [
      `จากคำถาม\n${subject}`,
      greeting,
      message,
      signature,
      siteUrl,
      `${senderNote}\n${verificationNote}\n${contactUrl}`,
    ].join('\n\n'),
    html: `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    @font-face {
      font-family: 'LINE Seed Sans TH';
      src: url('${assetBaseUrl}/fonts/LINESeedSansTH-Regular.woff2') format('woff2');
      font-style: normal;
      font-weight: 400;
      font-display: swap;
    }
    @font-face {
      font-family: 'LINE Seed Sans TH';
      src: url('${assetBaseUrl}/fonts/LINESeedSansTH-Bold.woff2') format('woff2');
      font-style: normal;
      font-weight: 700;
      font-display: swap;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f0e8;color:#2d251e;font-family:'LINE Seed Sans TH',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f0e8;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#fffdfa;border:1px solid #e6dac8;border-radius:20px;font-family:'LINE Seed Sans TH',Tahoma,Arial,sans-serif;">
        <tr><td align="center" style="padding:32px 24px 20px;">
          <img src="${escapeHtml(logoUrl)}" alt="${SITE_NAME}" width="180" style="display:block;max-width:100%;height:auto;border:0;">
          <p style="margin:20px 0 4px;font-size:14px;font-weight:700;color:#2e573b;">จากคำถาม</p>
          <h1 style="margin:0 0 8px;font-size:23px;line-height:1.45;color:#2d251e;">${escapeHtml(subject)}</h1>
        </td></tr>
        <tr><td style="padding:0 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${escapeHtml(greeting)}</p>
          <div style="padding:18px 20px;border-radius:12px;background-color:#f3f6ef;color:#2d251e;font-size:16px;line-height:1.8;overflow-wrap:anywhere;word-wrap:break-word;">
            ${escapeHtml(message).replace(/\r\n?|\n/g, '<br>')}
          </div>
          <p style="margin:20px 0 0;font-size:16px;line-height:1.7;">${signature}</p>
        </td></tr>
        <tr><td align="center" style="padding:24px;">
          <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:12px 22px;border-radius:9px;background-color:#2e573b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">ไปที่ Loveza Hunt</a>
        </td></tr>
        <tr><td align="center" style="padding:0 24px 24px;">
          <div style="padding-top:16px;border-top:1px solid #e6dac8;color:#635b51;font-size:13px;line-height:1.6;">
            ${senderNote}<br>
            ${verificationNote}<br>
            <a href="${escapeHtml(contactUrl)}" style="color:#2e573b;text-decoration:underline;">หน้าติดต่อเรา · ${escapeHtml(new URL(siteUrl).hostname)}</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
