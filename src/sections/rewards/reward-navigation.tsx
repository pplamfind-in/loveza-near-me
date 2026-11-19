'use client';

import type { CSSProperties } from 'react';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Reward = { id: string; name: string };

export function RewardNavigation({
  rewards,
  id,
  children,
  back,
}: {
  rewards: Reward[];
  id: string;
  children: React.ReactNode;
  back: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const [offset, setOffset] = useState(0);
  const [exitOffset, setExitOffset] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const index = rewards.findIndex((reward) => reward.id === id);
  const canNavigate = rewards.length > 1 && index >= 0;
  const previous = rewards[(index - 1 + rewards.length) % rewards.length];
  const next = rewards[(index + 1) % rewards.length];
  const navigate = (reward: Reward | undefined, destinationOffset = 0) => {
    if (!canNavigate || pending || !reward) return;
    setExitOffset(destinationOffset);
    startTransition(() =>
      router.push(`/rewards/${encodeURIComponent(reward.id)}/`, { scroll: false })
    );
  };
  return (
    <Box aria-busy={pending} sx={{ position: 'relative', minWidth: 0 }}>
      <Box
        onTouchStart={(event) => {
          if (pending || event.touches.length !== 1) {
            start.current = null;
            moved.current = true;
            setOffset(0);
            return;
          }
          const touch = event.touches[0];
          moved.current = false;
          start.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchMove={(event) => {
          const origin = start.current;
          if (!origin || event.touches.length !== 1) return;
          const touch = event.touches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.hypot(dx, dy) > 10) moved.current = true;
          const horizontal = Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5;
          setOffset(canNavigate && horizontal ? Math.max(-72, Math.min(72, dx * 0.58)) : 0);
        }}
        onTouchCancel={() => {
          start.current = null;
          moved.current = true;
          setOffset(0);
        }}
        onTouchEnd={(event) => {
          const origin = start.current;
          start.current = null;
          setOffset(0);
          if (!origin) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.hypot(dx, dy) > 10) moved.current = true;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            navigate(dx < 0 ? next : previous, Math.sign(dx) * event.currentTarget.clientWidth);
          }
        }}
        sx={{
          position: 'relative',
          mx: { xs: -2, sm: -3, md: 0 },
          px: { xs: 2, sm: 3, md: 0 },
          overflowX: 'clip',
          touchAction: 'pan-y',
          opacity: pending ? 0.6 : 1,
          transition: 'opacity .15s',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Box sx={{ position: 'relative', perspective: '1000px' }}>
          <Box
            style={
              {
                '--reward-swipe-offset': `${pending ? exitOffset : offset}px`,
              } as CSSProperties
            }
            sx={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: {
                xs: `translateX(var(--reward-swipe-offset)) rotateY(${flipped ? 180 : 0}deg)`,
                md: 'none',
              },
              transition: offset ? 'none' : 'transform 240ms ease',
              '@media (prefers-reduced-motion: reduce)': {
                transform: { xs: `rotateY(${flipped ? 180 : 0}deg)`, md: 'none' },
                transition: 'none',
              },
            }}
          >
            <Box sx={{ backfaceVisibility: 'hidden' }}>{children}</Box>
            <Box
              aria-hidden={!flipped}
              sx={{
                display: { xs: 'grid', md: 'none' },
                position: 'absolute',
                inset: 0,
                width: '100%',
                maxWidth: 'var(--reward-card-max-width, 440px)',
                mx: 'auto',
                containerType: 'inline-size',
                placeItems: 'center',
                alignContent: 'center',
                p: 1.5,
                textAlign: 'center',
                overflowWrap: 'anywhere',
                overflowY: 'auto',
                border: '6px solid white',
                borderRadius: '22px',
                background:
                  'radial-gradient(ellipse at 50% 40%, #FFFFFFB3, transparent 72%), linear-gradient(155deg, #F5F8EA, #DFEEE2)',
                boxShadow: '0 5px 0 #EDE4D7',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {back}
            </Box>
          </Box>
          <Box
            component="button"
            type="button"
            aria-label={flipped ? 'พลิกกลับไปดูด้านหน้า' : 'พลิกการ์ดเพื่อดูภารกิจ'}
            disabled={pending}
            onClick={(event) => {
              if (event.detail === 0 || !moved.current) setFlipped((current) => !current);
              moved.current = false;
            }}
            onContextMenu={(event) => event.preventDefault()}
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'absolute',
              inset: 0,
              width: '100%',
              maxWidth: 'var(--reward-card-max-width, 440px)',
              mx: 'auto',
              p: 0,
              border: 0,
              borderRadius: '22px',
              bgcolor: 'transparent',
              cursor: 'pointer',
              WebkitTouchCallout: 'none',
            }}
          />
        </Box>
        {canNavigate && (
          <>
            <IconButton
              disabled={pending}
              onClick={() => navigate(previous)}
              aria-label={`การ์ดก่อนหน้า ${previous.name}`}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
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
              aria-label={`การ์ดถัดไป ${next.name}`}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
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
      {canNavigate && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: { xs: 0, md: 1 },
              mt: { xs: 0.5, md: 1.5 },
            }}
          >
            {rewards.map((reward) => (
              <Box
                key={reward.id}
                component="button"
                type="button"
                aria-label={reward.name}
                aria-current={reward.id === id ? 'page' : undefined}
                disabled={pending}
                onClick={() => navigate(reward)}
                sx={{
                  p: 0,
                  border: 0,
                  cursor: 'pointer',
                  width: { xs: 20, md: 28 },
                  height: { xs: 24, md: 28 },
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: reward.id === id ? 20 : 8,
                    height: 8,
                    borderRadius: '8px',
                    bgcolor: reward.id === id ? 'primary.main' : 'grey.300',
                  }}
                />
              </Box>
            ))}
          </Box>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 11 }}>
            การ์ดที่ {index + 1} / {rewards.length}
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              {' · ปัดเพื่อเปลี่ยน · แตะการ์ดเพื่อพลิก'}
            </Box>
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              {' · กดลูกศรหรือเลือกจุดเพื่อดูการ์ดอื่น'}
            </Box>
          </Typography>
        </>
      )}
    </Box>
  );
}
