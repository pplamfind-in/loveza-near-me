'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export type CookieConsentValue = 'all' | 'necessary';

type CookieConsentProps = {
  initialConsent: CookieConsentValue | null;
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function CookieConsent({ initialConsent }: CookieConsentProps) {
  const [consent, setConsent] = useState<CookieConsentValue | null>(initialConsent);

  const saveConsent = (value: CookieConsentValue) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `loveza_cookie_consent=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    setConsent(value);
    if (value === 'all') window.location.reload();
  };

  if (consent) return null;

  return (
    <Box
      role="dialog"
      aria-live="polite"
      aria-label="การตั้งค่าคุกกี้"
      sx={{
        left: { xs: 12, sm: 24 },
        right: { xs: 12, sm: 24 },
        bottom: { xs: 12, sm: 24 },
        zIndex: 1600,
        position: 'fixed',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2.5}
        sx={{
          maxWidth: 1080,
          mx: 'auto',
          p: { xs: 2.25, sm: 3 },
          border: '1px solid rgba(0,169,157,.16)',
          borderRadius: '24px',
          bgcolor: 'rgba(255,255,255,.97)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 22px 70px rgba(38,59,63,.2)',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#262d2c', fontSize: 18, fontWeight: 900 }}>
            เราใช้คุกกี้เพื่อให้ระบบทำงาน
          </Typography>
          <Typography sx={{ mt: 0.75, color: '#68716f', fontSize: 13, lineHeight: 1.65 }}>
            คุกกี้ที่จำเป็นใช้สำหรับ Login และรักษา Session อย่างปลอดภัย
            ส่วนคุกกี้เพิ่มเติมจะใช้เพื่อปรับปรุงประสบการณ์เมื่อคุณอนุญาตเท่านั้น{' '}
            อ่านรายละเอียดได้ใน{' '}
            <Box component="a" href="/cookies" sx={{ color: '#008e84', fontWeight: 800 }}>
              นโยบายคุกกี้
            </Box>
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1}>
          <Button
            color="inherit"
            onClick={() => saveConsent('necessary')}
            sx={{ borderRadius: 99 }}
          >
            เฉพาะที่จำเป็น
          </Button>
          <Button
            variant="contained"
            onClick={() => saveConsent('all')}
            sx={{ borderRadius: 99, bgcolor: '#00a99d', '&:hover': { bgcolor: '#008e84' } }}
          >
            ยอมรับทั้งหมด
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
