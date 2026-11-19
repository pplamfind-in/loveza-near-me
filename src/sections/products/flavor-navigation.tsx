'use client';

import type { CSSProperties } from 'react';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

type Flavor = { slug: string; thai_name: string };

export function FlavorNavigation({
  flavors,
  slug,
  children,
}: {
  flavors: Flavor[];
  slug: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOffset, setDragOffset] = useState(0);
  const [exitOffset, setExitOffset] = useState(0);
  const index = flavors.findIndex((flavor) => flavor.slug === slug);
  const canNavigate = flavors.length > 1 && index >= 0;
  const previous = flavors[(index - 1 + flavors.length) % flavors.length];
  const next = flavors[(index + 1) % flavors.length];
  const navigate = (flavor: Flavor | undefined, offset = 0) => {
    if (!canNavigate || pending || !flavor) return;
    setExitOffset(offset);
    startTransition(() =>
      router.push(`/products/${encodeURIComponent(flavor.slug)}/`, { scroll: false })
    );
  };
  return (
    <Box
      aria-busy={pending}
      sx={{
        position: 'relative',
        minWidth: 0,
        mx: { xs: -2, sm: -3, md: 0 },
        overflowX: 'clip',
        '@media (min-width: 560px) and (max-width: 899.95px) and (max-height: 620px)': {
          mx: 0,
          '& > .MuiBox-root': { px: 0 },
        },
      }}
    >
      <Box
        onTouchStart={(event) => {
          if (!canNavigate || pending || event.touches.length !== 1) {
            start.current = null;
            setDragOffset(0);
            return;
          }
          const touch = event.touches[0];
          start.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchMove={(event) => {
          const origin = start.current;
          if (!origin || event.touches.length !== 1) return;
          const touch = event.touches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          const horizontal = Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5;
          setDragOffset(horizontal ? Math.max(-72, Math.min(72, dx * 0.58)) : 0);
        }}
        onTouchCancel={() => {
          start.current = null;
          setDragOffset(0);
        }}
        onTouchEnd={(event) => {
          const origin = start.current;
          start.current = null;
          setDragOffset(0);
          if (!origin) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            navigate(dx < 0 ? next : previous, Math.sign(dx) * event.currentTarget.clientWidth);
          }
        }}
        style={
          { '--flavor-swipe-offset': `${pending ? exitOffset : dragOffset}px` } as CSSProperties
        }
        sx={{
          px: { xs: 2, sm: 3, md: 0 },
          touchAction: 'pan-y',
          opacity: pending ? 0.6 : 1,
          transform: 'translateX(var(--flavor-swipe-offset))',
          transition: dragOffset ? 'none' : 'transform 200ms ease-out, opacity 180ms ease-out',
          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',
            transition: 'none',
          },
        }}
      >
        {children}
      </Box>
      {canNavigate && (
        <>
          <IconButton
            disabled={pending}
            onClick={() => navigate(previous)}
            aria-label={`รสก่อนหน้า ${previous.thai_name}`}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              position: 'absolute',
              top: '48%',
              left: 0,
              width: 44,
              height: 44,
              bgcolor: 'background.paper',
              border: '2px solid white',
              boxShadow: '0 3px 0 var(--palette-grey-200)',
              color: 'primary.dark',
              '&:hover': { bgcolor: 'primary.lighter' },
            }}
          >
            <Iconify icon="ri:arrow-left-s-line" width={26} />
          </IconButton>
          <IconButton
            disabled={pending}
            onClick={() => navigate(next)}
            aria-label={`รสถัดไป ${next.thai_name}`}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              position: 'absolute',
              top: '48%',
              right: 0,
              width: 44,
              height: 44,
              bgcolor: 'background.paper',
              border: '2px solid white',
              boxShadow: '0 3px 0 var(--palette-grey-200)',
              color: 'primary.dark',
              '&:hover': { bgcolor: 'primary.lighter' },
            }}
          >
            <Iconify icon="ri:arrow-right-s-line" width={26} />
          </IconButton>
        </>
      )}
    </Box>
  );
}
