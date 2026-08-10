'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { supabase } from 'src/lib/supabase';

import { getSafeRedirectPath } from 'src/auth/utils/safe-redirect';

type GoogleCredentialResponse = {
  credential: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            nonce: string;
            use_fedcm_for_prompt: boolean;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type: 'standard';
              theme: 'outline';
              size: 'large';
              text: 'continue_with';
              shape: 'pill';
              locale: 'th';
              width: number;
            }
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type GoogleLoginButtonProps = {
  clientId: string;
  nextPath?: string;
};

function createNonce() {
  const values = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function hashNonce(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function GoogleLoginButton({ clientId, nextPath }: GoogleLoginButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef('');
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const handleCredential = useCallback(
    async ({ credential }: GoogleCredentialResponse) => {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
        nonce: nonceRef.current,
      });

      if (signInError) {
        setError('ยืนยันตัวตนกับ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      const role = data.user?.app_metadata.role ?? 'user';
      const safeUserPath = getSafeRedirectPath(nextPath, '/account');
      const userPath = safeUserPath.startsWith('/admin') ? '/account' : safeUserPath;

      router.replace(role === 'admin' ? '/admin' : userPath);
      router.refresh();
    },
    [nextPath, router]
  );

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) {
      return undefined;
    }

    let active = true;

    const initializeGoogle = async () => {
      const rawNonce = createNonce();
      const hashedNonce = await hashNonce(rawNonce);

      if (!active || !buttonRef.current || !window.google) return;

      nonceRef.current = rawNonce;
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        locale: 'th',
        width: Math.min(buttonRef.current.clientWidth, 340),
      });
    };

    initializeGoogle();

    return () => {
      active = false;
      window.google?.accounts.id.cancel();
    };
  }, [clientId, handleCredential, scriptReady]);

  return (
    <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 340, mx: 'auto' }}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError('โหลด Google Login ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ')}
      />

      {/* {!clientId && (
        <Alert severity="warning">ยังไม่ได้กำหนด GOOGLE_CLIENT_ID ใน Environment Variables</Alert>
      )} */}
      {error && <Alert severity="error">{error}</Alert>}

      <FormControlLabel
        sx={{
          m: 0,
          p: 1.25,
          width: 1,
          textAlign: 'left',
          alignItems: 'flex-start',
          border: '1px solid',
          borderColor: consentAccepted ? 'success.main' : 'divider',
          borderRadius: 2.5,
          bgcolor: consentAccepted ? 'success.lighter' : 'background.neutral',
          transition: 'background-color 160ms ease, border-color 160ms ease',
          '& .MuiFormControlLabel-label': { minWidth: 0, flex: 1 },
        }}
        control={
          <Checkbox
            checked={consentAccepted}
            onChange={(event) => setConsentAccepted(event.target.checked)}
            inputProps={{ 'aria-describedby': 'login-consent-description' }}
            sx={{ mt: -0.75, ml: -0.75 }}
          />
        }
        label={
          <Typography id="login-consent-description" sx={{ fontSize: 13, lineHeight: 1.65 }}>
            ฉันได้อ่านและยอมรับ{' '}
            <Link
              component="button"
              type="button"
              fontWeight={900}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setConsentOpen(true);
              }}
            >
              ข้อกำหนดและนโยบาย
            </Link>
            {' '}ของ LOVEZA HUNT
          </Typography>
        }
      />

      <Box
        aria-disabled={!consentAccepted}
        sx={{
          minHeight: 44,
          width: 1,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          opacity: consentAccepted ? 1 : 0.45,
          transition: 'opacity 160ms ease',
        }}
      >
        {loading ? (
          <Box
            sx={{
              inset: 0,
              zIndex: 3,
              display: 'grid',
              position: 'absolute',
              placeItems: 'center',
              borderRadius: 99,
              bgcolor: 'rgba(255,255,255,.82)',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : null}
        {!scriptReady && clientId ? <CircularProgress size={24} /> : null}
        <Box ref={buttonRef} sx={{ width: 1, display: 'flex', justifyContent: 'center' }} />
        {!consentAccepted ? (
          <Box
            title="กรุณายอมรับข้อกำหนดก่อนเข้าสู่ระบบ"
            sx={{ inset: 0, zIndex: 2, position: 'absolute', cursor: 'not-allowed' }}
          />
        ) : null}
      </Box>

      <Dialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="login-consent-title"
      >
        <DialogTitle id="login-consent-title" sx={{ pb: 1, fontWeight: 1000 }}>
          ข้อกำหนดก่อนเข้าสู่ระบบ
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
            โปรดอ่านข้อมูลต่อไปนี้ก่อนใช้บัญชี Google เข้าสู่ LOVEZA HUNT
          </Typography>

          <Box component="ul" sx={{ my: 2.5, pl: 3 }}>
            {[
              'ให้ข้อมูลพิกัดและสถานะสินค้าโดยสุจริต และไม่จงใจส่งข้อมูลเท็จหรือข้อมูลซ้ำ',
              'ไม่ส่งข้อความ รูปภาพ หรือเนื้อหาที่ผิดกฎหมาย ละเมิดสิทธิ หรือสร้างความเสียหายแก่ผู้อื่น',
              'ข้อมูลร้านค้าและสต็อกมาจากชุมชน จึงอาจคลาดเคลื่อนหรือไม่เป็นปัจจุบัน',
              'ข้อมูลบัญชีใช้เพื่อยืนยันตัวตน รักษาความปลอดภัย และจัดการประวัติการแจ้งข้อมูล',
              'ทีมงานอาจตรวจสอบ แก้ไข หรือลบข้อมูลที่ไม่เป็นไปตามแนวทางของชุมชน',
            ].map((item) => (
              <Typography component="li" key={item} sx={{ mb: 1.25, pl: 0.5, lineHeight: 1.7 }}>
                {item}
              </Typography>
            ))}
          </Box>

          <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.7 }}>
            อ่านรายละเอียดฉบับเต็มได้ที่{' '}
            <Link href="/terms/" target="_blank" rel="noopener noreferrer" fontWeight={800}>
              ข้อกำหนดการใช้งาน
            </Link>
            {' · '}
            <Link href="/privacy/" target="_blank" rel="noopener noreferrer" fontWeight={800}>
              นโยบายความเป็นส่วนตัว
            </Link>
            {' · '}
            <Link
              href="/community-guidelines/"
              target="_blank"
              rel="noopener noreferrer"
              fontWeight={800}
            >
              แนวทางชุมชน
            </Link>
          </Typography>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setConsentOpen(false)}>
            อ่านแล้ว ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Typography sx={{ color: '#8a9290', fontSize: 12, lineHeight: 1.65 }}>
        ใช้ Google Client ID เพื่อยืนยันตัวตน จากนั้น Supabase จะสร้าง Session สำหรับบันทึกผู้รายงาน
      </Typography> */}
    </Stack>
  );
}
