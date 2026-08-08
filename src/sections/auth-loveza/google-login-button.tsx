'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

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

  const handleCredential = useCallback(
    async ({ credential }: GoogleCredentialResponse) => {
      setLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
        nonce: nonceRef.current,
      });

      if (signInError) {
        setError('ยืนยันตัวตนกับ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      router.replace(getSafeRedirectPath(nextPath, '/account'));
      router.refresh();
    },
    [nextPath, router]
  );

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) return undefined;

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
        width: Math.min(buttonRef.current.clientWidth, 400),
      });
    };

    initializeGoogle();

    return () => {
      active = false;
      window.google?.accounts.id.cancel();
    };
  }, [clientId, handleCredential, scriptReady]);

  return (
    <Stack spacing={2}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError('โหลด Google Login ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ')}
      />

      {!clientId && (
        <Alert severity="warning">ยังไม่ได้กำหนด GOOGLE_CLIENT_ID ใน Environment Variables</Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ minHeight: 44, display: 'grid', placeItems: 'center', position: 'relative' }}>
        {loading && (
          <Box sx={{ inset: 0, zIndex: 1, display: 'grid', position: 'absolute', placeItems: 'center', borderRadius: 99, bgcolor: 'rgba(255,255,255,.82)' }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!scriptReady && clientId && <CircularProgress size={24} />}
        <Box ref={buttonRef} sx={{ width: 1, display: 'flex', justifyContent: 'center' }} />
      </Box>

      <Typography sx={{ color: '#8a9290', fontSize: 12, lineHeight: 1.65 }}>
        ใช้ Google Client ID เพื่อยืนยันตัวตน จากนั้น Supabase จะสร้าง Session สำหรับบันทึกผู้รายงาน
      </Typography>
    </Stack>
  );
}
