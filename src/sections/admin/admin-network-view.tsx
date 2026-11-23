'use client';

import type { AdminNetworkStats } from 'src/types/admin-network';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { supabase } from 'src/lib/supabase';
import { formatRadiusM } from 'src/lib/admin/duplicate-radius';

import { Iconify } from 'src/components/iconify';

type AdminNetworkViewProps = {
  initialStats: AdminNetworkStats;
  hasError?: boolean;
};

const DIGIT_LABELS = ['หลักแสน', 'หลักหมื่น', 'หลักพัน', 'หลักร้อย', 'หลักสิบ', 'หลักหน่วย'];
const DIGIT_COLORS = ['#305C3D', '#427653', '#5B8555', '#AC7628', '#80551D', '#427653'];

export function AdminNetworkView({ initialStats, hasError = false }: AdminNetworkViewProps) {
  const [stats, setStats] = useState(initialStats);
  const [isLive, setIsLive] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [activity, setActivity] = useState<string | null>(null);
  const locationsRef = useRef(initialStats.locations);
  const latestStoreNameRef = useRef<string | null>(null);

  const locationDigits = Math.max(0, stats.locations).toString().padStart(6, '0').split('');
  const extraDigitCount = Math.max(0, locationDigits.length - DIGIT_LABELS.length);
  const digitLabels = [
    ...Array.from(
      { length: extraDigitCount },
      (_, index) => `หลักที่ ${locationDigits.length - index}`
    ),
    ...DIGIT_LABELS,
  ];

  useEffect(() => {
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let activityTimer: ReturnType<typeof setTimeout> | null = null;

    const showActivity = (message: string) => {
      if (!active) return;
      setActivity(message);
      if (activityTimer) clearTimeout(activityTimer);
      activityTimer = setTimeout(() => setActivity(null), 5000);
    };

    const refreshStats = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        try {
          const response = await fetch('/api/admin/network/stats', { cache: 'no-store' });
          if (!response.ok) return;

          const payload = (await response.json()) as { stats?: AdminNetworkStats };
          if (!active || !payload.stats) return;

          const increase = payload.stats.locations - locationsRef.current;
          locationsRef.current = payload.stats.locations;
          setStats(payload.stats);

          if (increase > 0) {
            setPulseKey((current) => current + 1);
            const storeName = increase === 1 ? latestStoreNameRef.current : null;
            showActivity(`+${increase} จุดใหม่${storeName ? ` · ${storeName}` : 'จากผู้ใช้งาน'}`);
          }

          latestStoreNameRef.current = null;
        } catch {
          // Keep the last known value. A later database event will retry automatically.
        }
      }, 250);
    };

    const channel = supabase
      .channel('admin-network-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const report = payload.new as { store_name?: string };
          latestStoreNameRef.current = report.store_name ?? null;
        }
        refreshStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, refreshStats)
      .subscribe((status) => {
        if (active) setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      if (activityTimer) clearTimeout(activityTimer);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Box
      component="main"
      sx={{
        inset: 0,
        zIndex: 2000,
        width: '100vw',
        height: '100dvh',
        color: 'text.primary',
        display: 'flex',
        overflowX: 'hidden',
        overflowY: 'hidden',
        position: 'fixed',
        alignItems: 'safe center',
        boxSizing: 'border-box',
        overscrollBehavior: 'none',
        px: { xs: 1.5, sm: 4, md: 6 },
        py: { xs: 7, md: 4 },
        bgcolor: 'background.default',
        '&::before': {
          content: '""',
          inset: 0,
          zIndex: 1,
          position: 'absolute',
          pointerEvents: 'none',
          background: {
            xs: 'linear-gradient(180deg, rgba(251,246,237,.96), rgba(251,246,237,.82))',
            md: 'linear-gradient(90deg, #FBF6ED 0%, rgba(251,246,237,.96) 40%, rgba(251,246,237,.12) 80%)',
          },
        },
        '&::after': {
          content: '""',
          zIndex: 1,
          width: 260,
          height: 260,
          position: 'absolute',
          left: -90,
          bottom: -100,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,232,72,.58), rgba(255,232,72,0) 68%)',
        },
        '@media (max-height: 760px)': {
          py: 7,
          '& .network-panel': { py: 2, px: { xs: 1.5, md: 0 } },
          '& .network-heading': { mt: 1, fontSize: 'clamp(24px, 4.5vh, 36px)' },
          '& .network-counter': { mt: 2 },
          '& .network-digit': { height: 'clamp(42px, 11vh, 76px)' },
          '& .network-counter-label': { mt: 1.5, fontSize: 18 },
          '& .network-cta': { mt: 2, py: 1 },
        },
        '@media (max-height: 520px)': {
          py: 6,
          '& .network-panel': { py: 1 },
          '& .network-description': { display: 'none' },
          '& .network-heading': { mt: 0.75, fontSize: 24 },
          '& .network-counter': { mt: 1 },
          '& .network-digit': { height: 44 },
          '& .network-digit-label': { display: 'none' },
          '& .network-counter-label': { mt: 1, fontSize: 16 },
          '& .network-cta': { mt: 1, minHeight: 36, py: 0.5 },
        },
        '@keyframes counterPop': {
          '0%': { opacity: 0.55, transform: 'scale(.88) translateY(8px)' },
          '65%': { transform: 'scale(1.04) translateY(-2px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      }}
    >
      <Image
        fill
        priority
        sizes="100vw"
        src="/assets/loveza/nearby-explorer-v1.webp"
        alt=""
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      <IconButton
        component={Link}
        href="/admin"
        aria-label="ปิดภาพรวมเต็มจอ"
        sx={{
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 3,
          color: 'primary.dark',
          position: 'fixed',
          border: '1px solid rgba(109,59,140,.14)',
          bgcolor: 'rgba(255,255,255,.76)',
          boxShadow: '0 10px 30px rgba(86,42,106,.14)',
          backdropFilter: 'blur(12px)',
          '&:hover': { color: '#427653', bgcolor: '#fff' },
        }}
      >
        <Iconify icon="ri:close-line" width={26} />
      </IconButton>

      <Box sx={{ zIndex: 2, width: 1, maxWidth: 1240, mx: 'auto' }}>
        <Box
          className="network-panel"
          sx={{
            width: { xs: 1, md: '65%', lg: '60%' },
            p: { xs: 2, sm: 3, md: 0 },
            py: { xs: 3, sm: 4, md: 0 },
            textAlign: { xs: 'center', md: 'left' },
            border: { xs: '5px solid var(--palette-background-paper)', md: 0 },
            borderRadius: '18px',
            bgcolor: { xs: 'rgba(255,255,255,.68)', md: 'transparent' },
            boxShadow: { xs: '0 24px 70px rgba(78,48,102,.12)', md: 'none' },
            backdropFilter: { xs: 'blur(18px)', md: 'none' },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: 'center', md: 'flex-start' }}
            alignItems="center"
          >
            <Iconify icon="ri:map-pin-2-fill" width={20} />
            <Typography sx={{ color: '#427653', fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>
              LOVEZA LIVE NETWORK
            </Typography>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                ml: 0.5,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: isLive ? '#16b86a' : '#f1a900',
                boxShadow: isLive ? '0 0 0 5px rgba(22,184,106,.12)' : 'none',
              }}
            />
            <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
              {isLive ? 'REALTIME' : 'กำลังเชื่อมต่อ'}
            </Typography>
          </Stack>

          <Typography
            component="h1"
            className="network-heading"
            sx={{
              mt: 2,
              fontSize: { xs: 34, sm: 48, md: 66 },
              lineHeight: 1.08,
              fontWeight: 1000,
              letterSpacing: '-.04em',
              color: 'primary.dark',
              textShadow: '0 8px 34px rgba(255,255,255,.84)',
            }}
          >
            พบจุดขาย Loveza แล้ว
          </Typography>
          <Typography
            className="network-description"
            sx={{ mt: 1.5, color: 'text.secondary', fontSize: { xs: 15, md: 18 } }}
          >
            ติดตามจุดขายที่ชุมชนช่วยกันค้นพบทั่วประเทศไทย
          </Typography>
          <Typography
            className="network-description"
            sx={{ mt: 0.75, color: 'text.secondary', fontSize: 12, lineHeight: 1.6 }}
          >
            อัปเดตตามข้อมูลล่าสุดในระบบ · ตรวจซ้ำในระยะ {formatRadiusM(stats.duplicateRadiusM)}
          </Typography>

          {hasError ? (
            <Alert severity="warning" sx={{ maxWidth: 560, mx: 'auto', mt: 3, textAlign: 'left' }}>
              ข้อมูลบางส่วนโหลดไม่สำเร็จ กรุณาลองเปิดหน้านี้อีกครั้ง
            </Alert>
          ) : null}

          <Stack
            key={pulseKey}
            className="network-counter"
            direction="row"
            justifyContent={{ xs: 'center', md: 'flex-start' }}
            spacing={{ xs: 0.5, sm: 1, md: 1.5 }}
            sx={{
              mt: { xs: 4, md: 5 },
              animation: pulseKey ? 'counterPop .55s ease-out' : 'none',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {locationDigits.map((digit, index) => (
              <Box key={`${digitLabels[index]}-${index}`}>
                <Paper
                  className="network-digit"
                  elevation={0}
                  sx={{
                    width: { xs: 36, sm: 60, md: 76 },
                    height: { xs: 54, sm: 84, md: 104 },
                    color: DIGIT_COLORS[index % DIGIT_COLORS.length],
                    display: 'grid',
                    border: `1px solid ${DIGIT_COLORS[index % DIGIT_COLORS.length]}33`,
                    borderRadius: '12px',
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,.88)',
                    boxShadow: `inset 0 -12px 28px ${DIGIT_COLORS[index % DIGIT_COLORS.length]}12, 0 14px 34px rgba(86,42,106,.14)`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography
                    sx={{ fontSize: { xs: 28, sm: 42, md: 54 }, lineHeight: 1, fontWeight: 1000 }}
                  >
                    {digit}
                  </Typography>
                </Paper>
                <Typography
                  className="network-digit-label"
                  sx={{
                    mt: 1.25,
                    color: 'text.secondary',
                    fontSize: { xs: 8, sm: 10, md: 11 },
                    fontWeight: 800,
                  }}
                >
                  {digitLabels[index]}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Typography
            className="network-counter-label"
            sx={{ mt: { xs: 3, md: 4 }, fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
          >
            จุดขายทั่วประเทศไทย
          </Typography>

          <Button
            component={Link}
            href="/admin/locations"
            className="network-cta"
            variant="contained"
            startIcon={<Iconify icon="ri:map-2-fill" />}
            sx={{
              mt: 4,
              px: 4,
              py: 1.4,
              color: '#fff',
              borderRadius: '12px',
              bgcolor: '#427653',
              boxShadow: '0 4px 0 var(--palette-primary-darker)',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            ดูรายละเอียดทุกจุดขาย
          </Button>
        </Box>
      </Box>

      {activity ? (
        <Paper
          role="status"
          elevation={0}
          sx={{
            left: '50%',
            bottom: { xs: 18, md: 28 },
            zIndex: 4,
            px: 2.5,
            py: 1.5,
            maxWidth: 'calc(100vw - 32px)',
            color: '#fff',
            display: 'flex',
            gap: 1,
            position: 'fixed',
            alignItems: 'center',
            borderRadius: '16px',
            bgcolor: '#427653',
            boxShadow: '0 16px 40px rgba(0,169,157,.30)',
            transform: 'translateX(-50%)',
            animation: 'counterPop .45s ease-out',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Iconify icon="ri:map-pin-add-fill" width={21} />
          <Typography sx={{ fontSize: 13, fontWeight: 900, overflowWrap: 'anywhere' }}>
            {activity}
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}
