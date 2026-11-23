'use client';

import type { GalleryPhoto } from 'src/lib/activity-gallery';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { supabase } from 'src/lib/supabase';
import { galleryPageSize, galleryPhotoPage } from 'src/lib/activity-gallery';

import { Iconify } from 'src/components/iconify';

import { GoogleLoginButton } from 'src/sections/auth-loveza/google-login-button';

import { ProtectedHomeImages } from './protected-images';

export function ActivityGalleryGrid({
  initialPhotos,
  initialHasMore,
  initialOffset,
  activityId,
  authorQuery,
  examples,
  showExamples,
  signedIn,
  googleClientId,
}: {
  initialPhotos: GalleryPhoto[];
  initialHasMore: boolean;
  initialOffset: number;
  activityId: string;
  authorQuery: string;
  examples: GalleryPhoto[];
  showExamples: boolean;
  signedIn: boolean;
  googleClientId: string;
}) {
  const router = useRouter();
  const [pendingPhoto, setPendingPhoto] = useState<GalleryPhoto | null>(null);
  const [openPhoto, setOpenPhoto] = useState<GalleryPhoto | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState(false);
  const nextOffset = useRef(initialOffset + galleryPageSize);
  const pageRequest = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showExamples || !signedIn) return undefined;

    const pending = photos.filter((photo) => !(photo.id in liked)).slice(0, galleryPageSize);
    if (!pending.length) return undefined;

    let current = true;

    async function loadLikes() {
      try {
        const result = await supabase.rpc('get_activity_gallery_my_likes', {
          target_photo_ids: pending.map((photo) => photo.id),
        });
        if (result.error) throw result.error;
        if (!current) return;
        const rows = (result.data ?? []) as { photo_id: string }[];
        const likedIds = new Set(rows.map(({ photo_id }) => photo_id));
        setLiked((previous) => ({
          ...Object.fromEntries(pending.map(({ id }) => [id, likedIds.has(id)])),
          ...previous,
        }));
      } catch {
        if (current) setError('โหลดสถานะหัวใจไม่สำเร็จ กรุณารีเฟรชหน้า');
      }
    }

    void loadLikes();

    return () => {
      current = false;
    };
  }, [liked, photos, showExamples, signedIn]);

  const loadNextPage = useCallback(async () => {
    if (!hasMore || pageRequest.current) return;
    pageRequest.current = true;
    setLoadingPage(true);
    setPageError(false);

    try {
      const offset = nextOffset.current;
      let page;
      if (showExamples) {
        page = {
          photos: examples.slice(offset, offset + galleryPageSize),
          hasMore: offset + galleryPageSize < examples.length,
        };
      } else {
        const result = await supabase
          .rpc('list_activity_gallery', {
            target_activity_id: activityId,
            page_offset: offset,
            ...(authorQuery ? { author_query: authorQuery } : {}),
          })
          .limit(galleryPageSize + 1);
        if (result.error) throw result.error;
        page = galleryPhotoPage(result.data ?? []);
      }

      nextOffset.current += galleryPageSize;
      setPhotos((previous) => {
        const existing = new Set(previous.map(({ id }) => id));
        return [...previous, ...page.photos.filter(({ id }) => !existing.has(id))];
      });
      setHasMore(page.hasMore);
    } catch {
      setPageError(true);
    } finally {
      pageRequest.current = false;
      setLoadingPage(false);
    }
  }, [activityId, authorQuery, examples, hasMore, showExamples]);

  useEffect(() => {
    if (
      !hasMore ||
      loadingPage ||
      pageError ||
      !sentinel.current ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNextPage();
      },
      { rootMargin: '160px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loadingPage, loadNextPage, pageError, photos]);

  const saveLike = useCallback(
    async (photo: GalleryPhoto, next: boolean) => {
      if (showExamples) {
        setLiked((previous) => ({ ...previous, [photo.id]: next }));
        setCounts((previous) => ({
          ...previous,
          [photo.id]: Math.max(0, (previous[photo.id] ?? photo.likeCount) + (next ? 1 : -1)),
        }));
        return;
      }

      setLoading((previous) => ({ ...previous, [photo.id]: true }));
      setError('');
      try {
        const result = await supabase.rpc('set_activity_gallery_like', {
          target_photo_id: photo.id,
          should_like: next,
        });
        if (result.error) throw result.error;
        setLiked((previous) => ({ ...previous, [photo.id]: next }));
        setCounts((previous) => ({ ...previous, [photo.id]: Number(result.data) }));
      } catch {
        setError('บันทึกหัวใจไม่สำเร็จ กรุณาลองอีกครั้ง');
      } finally {
        setLoading((previous) => ({ ...previous, [photo.id]: false }));
      }
    },
    [showExamples]
  );

  const completeLogin = useCallback(async () => {
    if (pendingPhoto) await saveLike(pendingPhoto, true);
    setPendingPhoto((current) => (current === pendingPhoto ? null : current));
    router.refresh();
  }, [pendingPhoto, router, saveLike]);

  const renderAuthor = (photo: GalleryPhoto) => (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
      <Avatar
        src={photo.avatar || undefined}
        alt=""
        slotProps={{ img: { loading: 'lazy', referrerPolicy: 'no-referrer' } }}
        sx={{ width: { xs: 22, sm: 28 }, height: { xs: 22, sm: 28 }, flexShrink: 0 }}
      >
        {photo.name.slice(0, 1)}
      </Avatar>
      <Typography noWrap variant="caption" sx={{ minWidth: 0, fontWeight: 800 }}>
        {photo.name}
      </Typography>
    </Stack>
  );

  const renderLike = (photo: GalleryPhoto) => (
    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ px: { xs: 0.25, sm: 0.75 } }}>
      <IconButton
        aria-label={
          !signedIn ? 'เข้าสู่ระบบเพื่อกดหัวใจ' : liked[photo.id] ? 'ยกเลิกหัวใจ' : 'กดหัวใจ'
        }
        aria-pressed={Boolean(liked[photo.id])}
        disabled={signedIn && ((!showExamples && !(photo.id in liked)) || loading[photo.id])}
        onClick={() => {
          if (!signedIn) setPendingPhoto(photo);
          else void saveLike(photo, !liked[photo.id]);
        }}
        sx={{
          width: 38,
          height: 38,
        }}
      >
        <Image
          src="/assets/loveza/loveza-heart.webp"
          alt=""
          width={24}
          height={22}
          unoptimized
          style={{ height: 'auto', filter: liked[photo.id] ? undefined : 'grayscale(1)' }}
        />
      </IconButton>
      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
        {(counts[photo.id] ?? photo.likeCount).toLocaleString('th-TH')}
      </Typography>
    </Stack>
  );

  return (
    <>
      <ProtectedHomeImages>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(4, minmax(0, 1fr))',
              md: 'repeat(6, minmax(0, 1fr))',
            },
            gap: { xs: 1, sm: 2 },
          }}
        >
          {photos.map((photo) => (
            <Box
              key={photo.id}
              component="article"
              sx={{
                minWidth: 0,
                bgcolor: 'common.white',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: { xs: '12px', sm: '16px' },
                overflow: 'hidden',
                boxShadow: '0 4px 14px #0002',
              }}
            >
              <Box sx={{ px: { xs: 0.75, sm: 1.25 }, py: { xs: 0.75, sm: 1 } }}>
                {renderAuthor(photo)}
              </Box>
              <ButtonBase
                aria-label={`เปิดภาพกิจกรรมของ ${photo.name}`}
                onClick={() => setOpenPhoto(photo)}
                sx={{
                  display: 'block',
                  width: { xs: 'calc(100% - 8px)', sm: 'calc(100% - 16px)' },
                  mx: 'auto',
                  borderRadius: { xs: '7px', sm: '10px' },
                  overflow: 'hidden',
                  '&.Mui-focusVisible': {
                    outline: '2px solid var(--activity-primary)',
                    outlineOffset: -2,
                  },
                }}
              >
                <Box
                  component="img"
                  src={photo.src}
                  draggable={false}
                  alt={showExamples ? 'ภาพตัวอย่าง' : 'ภาพที่ผู้ร่วมกิจกรรมส่งมา'}
                  loading="lazy"
                  sx={{ display: 'block', width: 1, aspectRatio: '3 / 4', objectFit: 'cover' }}
                />
              </ButtonBase>
              {renderLike(photo)}
            </Box>
          ))}
        </Box>
      </ProtectedHomeImages>
      {hasMore && (
        <Stack ref={sentinel} alignItems="center" spacing={1} sx={{ minHeight: 36 }}>
          {loadingPage && <CircularProgress color="inherit" size={24} aria-label="กำลังโหลดภาพ" />}
          {pageError && <Typography role="status">โหลดภาพเพิ่มเติมไม่สำเร็จ</Typography>}
          {!loadingPage && (
            <Button color="inherit" onClick={() => void loadNextPage()}>
              {pageError ? 'ลองอีกครั้ง' : 'โหลดภาพเพิ่มเติม'}
            </Button>
          )}
        </Stack>
      )}

      {error && (
        <Typography align="center" role="status" variant="body2">
          {error}
        </Typography>
      )}
      <Dialog
        open={Boolean(openPhoto)}
        onClose={() => setOpenPhoto(null)}
        maxWidth="sm"
        aria-labelledby="activity-gallery-photo-title"
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'common.white',
              borderRadius: '18px',
              m: { xs: 1.5, sm: 3 },
              width: {
                xs: 'min(calc(100% - 24px), calc(52.5dvh + 16px))',
                sm: 'min(calc(100% - 48px), calc(52.5dvh + 24px))',
              },
            },
          },
        }}
      >
        {openPhoto && (
          <>
            <DialogTitle
              id="activity-gallery-photo-title"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: { xs: 1, sm: 1.5 },
                py: 1,
              }}
            >
              {renderAuthor(openPhoto)}
              <IconButton aria-label="ปิดภาพ" onClick={() => setOpenPhoto(null)}>
                <Iconify icon="ri:close-line" width={22} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 1, sm: 1.5 }, py: 0 }}>
              <ProtectedHomeImages>
                <Box
                  component="img"
                  src={openPhoto.src}
                  draggable={false}
                  alt={`ภาพกิจกรรมของ ${openPhoto.name}`}
                  sx={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '3 / 4',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    bgcolor: 'background.neutral',
                  }}
                />
              </ProtectedHomeImages>
            </DialogContent>
            <Box
              sx={{ px: { xs: 1, sm: 1.5 }, minHeight: 48, display: 'flex', alignItems: 'center' }}
            >
              {renderLike(openPhoto)}
            </Box>
          </>
        )}
      </Dialog>
      <Dialog
        open={Boolean(pendingPhoto)}
        onClose={() => setPendingPhoto(null)}
        aria-labelledby="gallery-login-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="gallery-login-title">เข้าสู่ระบบเพื่อกดหัวใจ</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              ระบบจะกดหัวใจให้รูปที่เลือกหลังเข้าสู่ระบบ
            </Typography>
            {pendingPhoto && googleClientId && (
              <GoogleLoginButton clientId={googleClientId} onSuccess={completeLogin} />
            )}
            {!googleClientId && (
              <Typography variant="body2" color="error">
                ยังไม่สามารถเข้าสู่ระบบด้วย Google ได้
              </Typography>
            )}
            <Button onClick={() => setPendingPhoto(null)} sx={{ alignSelf: 'flex-end' }}>
              ยกเลิก
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
