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
const DIGIT_COLORS = ['#00a99d', '#00a9dc', '#6d3b8c', '#E5007E', '#f1a900', '#ef5da8'];

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
        color: '#48245f',
        display: 'flex',
        overflow: 'hidden',
        position: 'fixed',
        alignItems: 'center',
        boxSizing: 'border-box',
        overscrollBehavior: 'none',
        px: { xs: 1.5, sm: 4, md: 6 },
        py: { xs: 7, md: 5 },
        bgcolor: '#eaf8ff',
        '&::before': {
          content: '""',
          inset: 0,
          zIndex: 1,
          position: 'absolute',
          pointerEvents: 'none',
          background: {
            xs: 'linear-gradient(135deg, rgba(238,250,255,.90), rgba(255,237,247,.88))',
            md: 'linear-gradient(90deg, rgba(237,250,255,.98) 0%, rgba(255,255,255,.90) 42%, rgba(255,255,255,.16) 72%, rgba(255,225,239,.12) 100%)',
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
        src="/assets/loveza/loveza-hero-v2.png"
        alt="Loveza ทั้งสามรสชาติแช่เย็นพร้อมผลไม้และน้ำแข็ง"
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
          color: '#5a2b72',
          position: 'fixed',
          border: '1px solid rgba(109,59,140,.14)',
          bgcolor: 'rgba(255,255,255,.76)',
          boxShadow: '0 10px 30px rgba(86,42,106,.14)',
          backdropFilter: 'blur(12px)',
          '&:hover': { color: '#E5007E', bgcolor: '#fff' },
        }}
      >
        <Iconify icon="ri:close-line" width={26} />
      </IconButton>

      <Box sx={{ zIndex: 2, width: 1, maxWidth: 1240, mx: 'auto' }}>
        <Box
          sx={{
            width: { xs: 1, md: '58%', lg: '54%' },
            p: { xs: 2.5, sm: 4, md: 0 },
            py: { xs: 5, sm: 5, md: 0 },
            textAlign: { xs: 'center', md: 'left' },
            border: { xs: '1px solid rgba(255,255,255,.72)', md: 0 },
            borderRadius: { xs: 4, md: 0 },
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
            <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>
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
            <Typography sx={{ color: '#806c87', fontSize: 10, fontWeight: 800 }}>
              {isLive ? 'REALTIME' : 'กำลังเชื่อมต่อ'}
            </Typography>
          </Stack>

          <Typography
            component="h1"
            sx={{
              mt: 2,
              fontSize: { xs: 34, sm: 48, md: 66 },
              lineHeight: 1.08,
              fontWeight: 1000,
              letterSpacing: '-.04em',
              color: '#4c255f',
              textShadow: '0 8px 34px rgba(255,255,255,.84)',
            }}
          >
            พบจุดขาย Loveza แล้ว
          </Typography>
          <Typography sx={{ mt: 1.5, color: '#745d7d', fontSize: { xs: 15, md: 18 } }}>
            จุดขายที่ได้รับการยืนยันจากผู้ใช้งานทั่วประเทศไทย
          </Typography>
          <Typography sx={{ mt: 0.75, color: '#806c87', fontSize: 12, lineHeight: 1.6 }}>
            รวมจุดที่แจ้งใหม่ทันทีโดยไม่ต้องรออนุมัติ · ตรวจซ้ำในระยะ{' '}
            {formatRadiusM(stats.duplicateRadiusM)}
          </Typography>

          {hasError ? (
            <Alert severity="warning" sx={{ maxWidth: 560, mx: 'auto', mt: 3, textAlign: 'left' }}>
              ข้อมูลบางส่วนโหลดไม่สำเร็จ กรุณาลองเปิดหน้านี้อีกครั้ง
            </Alert>
          ) : null}

          <Stack
            key={pulseKey}
            direction="row"
            justifyContent={{ xs: 'center', md: 'flex-start' }}
            spacing={{ xs: 0.5, sm: 1, md: 1.5 }}
            sx={{
              mt: { xs: 4, md: 5 },
              animation: pulseKey ? 'counterPop .55s ease-out' : 'none',
            }}
          >
            {locationDigits.map((digit, index) => (
              <Box key={`${digitLabels[index]}-${index}`}>
                <Paper
                  elevation={0}
                  sx={{
                    width: { xs: 42, sm: 72, md: 96 },
                    height: { xs: 66, sm: 104, md: 132 },
                    color: DIGIT_COLORS[index % DIGIT_COLORS.length],
                    display: 'grid',
                    border: `1px solid ${DIGIT_COLORS[index % DIGIT_COLORS.length]}33`,
                    borderRadius: { xs: 2.5, md: 3.5 },
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,.88)',
                    boxShadow: `inset 0 -12px 28px ${DIGIT_COLORS[index % DIGIT_COLORS.length]}12, 0 14px 34px rgba(86,42,106,.14)`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography
                    sx={{ fontSize: { xs: 32, sm: 48, md: 64 }, lineHeight: 1, fontWeight: 1000 }}
                  >
                    {digit}
                  </Typography>
                </Paper>
                <Typography
                  sx={{
                    mt: 1.25,
                    color: '#806c87',
                    fontSize: { xs: 8, sm: 10, md: 11 },
                    fontWeight: 800,
                  }}
                >
                  {digitLabels[index]}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Typography sx={{ mt: { xs: 3, md: 4 }, fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}>
            จุดขายทั่วประเทศไทย
          </Typography>

          <Button
            component={Link}
            href="/admin/locations"
            variant="contained"
            startIcon={<Iconify icon="ri:map-2-fill" />}
            sx={{
              mt: 4,
              px: 4,
              py: 1.4,
              color: '#fff',
              borderRadius: 99,
              bgcolor: '#E5007E',
              boxShadow: '0 12px 30px rgba(239,35,130,.28)',
              '&:hover': { bgcolor: '#d81972' },
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
            borderRadius: 3,
            bgcolor: '#00a99d',
            boxShadow: '0 16px 40px rgba(0,169,157,.30)',
            transform: 'translateX(-50%)',
            animation: 'counterPop .45s ease-out',
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
