'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Portal from '@mui/material/Portal';
import Snackbar from '@mui/material/Snackbar';

import { formatCompactCount } from 'src/utils/format-compact-count';

import { supabase } from 'src/lib/supabase';

type FlavorLikeButtonProps = {
  id: string;
  name: string;
  initialCount: number;
  loginHref: string;
  signedIn: boolean;
};

const heartImage = '/assets/loveza/loveza-heart.webp';
const batchWindowMs = 5000;
const batchLimit = 100;
const remoteHeartsPerBatch = 8;
const visibleRemoteHearts = 16;

type FloatingHeart = { id: number; delay: number; remote: boolean };

function sendBatch(id: string, amount: number) {
  return fetch(`/api/products/${encodeURIComponent(id)}/likes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
    keepalive: true,
  });
}

export function FlavorLikeButton({
  id,
  name,
  initialCount,
  loginHref,
  signedIn,
}: FlavorLikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const nextHeart = useRef(0);
  const confirmedCount = useRef(initialCount);
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const showRemoteHearts = useCallback((increase: number) => {
    const amount = Math.min(increase, remoteHeartsPerBatch);
    if (amount <= 0) return;

    const firstId = nextHeart.current;
    nextHeart.current += amount;
    const incoming = Array.from({ length: amount }, (_, index) => ({
      id: firstId + index,
      delay: index * 65,
      remote: true,
    }));

    setHearts((current) => {
      const available = visibleRemoteHearts - current.filter((heart) => heart.remote).length;
      return available > 0 ? [...current, ...incoming.slice(0, available)] : current;
    });
  }, []);

  const flush = useCallback(
    async function flushBatch() {
      timer.current = null;
      if (inFlight.current || !pending.current) return;
      inFlight.current = true;
      const previousCount = confirmedCount.current;
      const amount = Math.min(pending.current, batchLimit);
      pending.current -= amount;

      try {
        const response = await sendBatch(id, amount);
        if (response.status === 401) {
          window.location.assign(loginHref);
          return;
        }
        if (!response.ok) throw new Error('Could not save likes');

        const result: { count: number } = await response.json();
        confirmedCount.current = Math.max(confirmedCount.current, result.count);
        showRemoteHearts(confirmedCount.current - previousCount - amount);
      } catch {
        setFailed(true);
      } finally {
        inFlight.current = false;
        setCount(confirmedCount.current + pending.current);
        if (pending.current && timer.current === null) {
          timer.current = setTimeout(() => void flushBatch(), batchWindowMs);
        }
      }
    },
    [id, loginHref, showRemoteHearts]
  );

  useEffect(() => {
    let active = true;

    const receiveCount = (value: unknown, animate = false) => {
      if (!active || (typeof value !== 'number' && typeof value !== 'string')) return;
      const nextCount = Number(value);
      if (!Number.isSafeInteger(nextCount) || nextCount < confirmedCount.current) return;
      const increase = nextCount - confirmedCount.current;
      confirmedCount.current = nextCount;
      // The write response reconciles overlapping events without replaying our own hearts.
      if (!inFlight.current) {
        if (animate) showRemoteHearts(increase);
        setCount(nextCount + pending.current);
      }
    };

    const channel = supabase
      .channel(`product-likes:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_like_counts',
          filter: `product_id=eq.${id}`,
        },
        ({ new: row }) => {
          if ('like_count' in row) receiveCount(row.like_count, true);
        }
      )
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        const { data } = await supabase
          .from('product_like_counts')
          .select('like_count')
          .eq('product_id', id)
          .maybeSingle();
        receiveCount(data?.like_count);
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [id, showRemoteHearts]);

  useEffect(() => {
    if (!signedIn) return undefined;

    const sendRemaining = () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;

      while (pending.current > 0) {
        const amount = Math.min(pending.current, batchLimit);
        pending.current -= amount;
        void sendBatch(id, amount).catch(() => {});
      }
    };

    window.addEventListener('pagehide', sendRemaining);
    return () => {
      window.removeEventListener('pagehide', sendRemaining);
      sendRemaining();
    };
  }, [id, signedIn]);

  const addLike = () => {
    pending.current += 1;
    setLiked(true);
    const heart = { id: nextHeart.current++, delay: 0, remote: false };
    setHearts((current) => [...current, heart]);
    setCount((current) => current + 1);
    if (timer.current === null && !inFlight.current) {
      timer.current = setTimeout(() => void flush(), batchWindowMs);
    }
  };

  return (
    <>
      <Box
        aria-label={`${count.toLocaleString('th-TH')} หัวใจ`}
        title={count.toLocaleString('th-TH')}
        sx={{
          display: 'flex',
          gridArea: 'hearts',
          position: { xs: 'absolute', md: 'static' },
          top: 2,
          insetInlineEnd: '24px',
          minHeight: { xs: 32, md: 'auto' },
          px: { xs: 1, md: 0 },
          py: { xs: 0.25, md: 0 },
          borderRadius: 99,
          border: { xs: '1px solid #EDBED1', md: 0 },
          bgcolor: { xs: '#FFF5F8', md: 'transparent' },
          alignItems: 'center',
          justifySelf: 'end',
          gap: { xs: 0.5, md: 1 },
          color: '#AD2452',
          fontSize: { xs: 16, md: 'clamp(2rem, 4vw, 3.5rem)' },
          fontWeight: 900,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Box
          component="span"
          sx={{ display: 'flex', '& img': { width: { xs: 24, md: 44 }, height: 'auto' } }}
        >
          <Image src={heartImage} alt="" width={44} height={40} unoptimized />
        </Box>
        {formatCompactCount(count)}
      </Box>
      <Button
        data-product-like-action
        href={signedIn ? undefined : loginHref}
        onClick={signedIn ? addLike : undefined}
        aria-label={signedIn ? `ส่งหัวใจให้ ${name}` : `เข้าสู่ระบบเพื่อส่งหัวใจให้ ${name}`}
        title={count.toLocaleString('th-TH')}
        startIcon={
          <Image
            src={heartImage}
            alt=""
            width={40}
            height={37}
            unoptimized
            loading="eager"
            style={{ width: 30, height: 'auto' }}
          />
        }
        sx={{
          gridArea: 'like',
          justifySelf: { xs: 'center', md: 'start' },
          flexShrink: 0,
          minHeight: 44,
          minWidth: { xs: 44, md: 72 },
          py: 0.625,
          pl: 0.625,
          pr: { xs: 0.625, md: 1.5 },
          borderRadius: '999px',
          bgcolor: liked ? '#FAD6E5' : '#FFF0F5',
          color: '#AD2452',
          border: '1px solid #EDBED1',
          boxShadow: '0 2px 0 #DC9CB7',
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          '& .MuiButton-startIcon': {
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            ml: 0,
            mr: { xs: 0, md: 0.75 },
            borderRadius: '50%',
            bgcolor: '#FFFBFD',
          },
          '&:hover': { bgcolor: '#FAD6E5', boxShadow: '0 2px 0 #DC9CB7' },
          '&:active': { transform: 'translateY(1px)', boxShadow: '0 1px 0 #DC9CB7' },
          '@media (prefers-reduced-motion: reduce)': {
            '&:active': { transform: 'none' },
          },
          '&&:focus-visible': {
            outlineColor: 'transparent',
            boxShadow: 'inset 0 0 0 2px #AD2452',
          },
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
          {signedIn ? 'ส่งหัวใจ' : 'เข้าสู่ระบบเพื่อส่งหัวใจ'}
        </Box>
      </Button>
      <Portal>
        <Box
          aria-hidden="true"
          sx={{
            position: 'fixed',
            left: '50%',
            bottom: 'env(safe-area-inset-bottom, 0px)',
            zIndex: 'tooltip',
            pointerEvents: 'none',
            '& > span': {
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              animation: 'loveza-heart-float 1200ms ease-out both',
            },
            '@keyframes loveza-heart-float': {
              '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(.6)' },
              '20%': { opacity: 1 },
              '100%': {
                opacity: 0,
                transform: 'translate(calc(-50% + var(--heart-drift)), -53vh) scale(1.2)',
              },
            },
            '@keyframes loveza-heart-fade': {
              from: { opacity: 1 },
              to: { opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': {
              top: '50%',
              bottom: 'auto',
              '& > span': {
                transform: 'translate(-50%, -50%)',
                animation: 'loveza-heart-fade 650ms ease-out forwards',
              },
            },
          }}
        >
          {hearts.map((heart) => (
            <Box
              component="span"
              key={heart.id}
              sx={{
                '--heart-drift': `${((heart.id % 5) - 2) * 24}px`,
              }}
              style={{ animationDelay: `${heart.delay}ms` }}
              onAnimationEnd={() =>
                setHearts((current) => current.filter((item) => item.id !== heart.id))
              }
            >
              <Image
                src={heartImage}
                alt=""
                width={40}
                height={37}
                unoptimized
                loading="eager"
                style={{ width: heart.id % 2 === 0 ? 28 : 46, height: 'auto', maxWidth: 'none' }}
              />
            </Box>
          ))}
        </Box>
      </Portal>
      <Snackbar
        open={failed}
        autoHideDuration={4000}
        onClose={() => setFailed(false)}
        message="บันทึกหัวใจชุดล่าสุดไม่สำเร็จ"
      />
    </>
  );
}
