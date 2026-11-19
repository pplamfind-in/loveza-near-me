'use client';

import { useRouter } from 'next/navigation';
import { useRef, useTransition } from 'react';

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
  const index = flavors.findIndex((flavor) => flavor.slug === slug);
  const canNavigate = flavors.length > 1 && index >= 0;
  const previous = flavors[(index - 1 + flavors.length) % flavors.length];
  const next = flavors[(index + 1) % flavors.length];
  const navigate = (flavor: Flavor | undefined) => {
    if (!canNavigate || pending || !flavor) return;
    startTransition(() =>
      router.push(`/products/${encodeURIComponent(flavor.slug)}/`, { scroll: false })
    );
  };
  return (
    <Box aria-busy={pending} sx={{ position: 'relative' }}>
      <Box
        onTouchStart={(event) => {
          const touch = event.touches[0];
          start.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchCancel={() => {
          start.current = null;
        }}
        onTouchEnd={(event) => {
          const origin = start.current;
          start.current = null;
          if (!origin) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
            navigate(dx < 0 ? next : previous);
        }}
        sx={{
          touchAction: 'pan-y',
          opacity: pending ? 0.6 : 1,
          transition: 'opacity .15s',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
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
              position: 'absolute',
              top: '48%',
              left: { xs: -8, sm: 0 },
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
              position: 'absolute',
              top: '48%',
              right: { xs: -8, sm: 0 },
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
