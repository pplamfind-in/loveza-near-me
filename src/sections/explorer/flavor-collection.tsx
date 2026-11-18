'use client';

import type { LovezaProduct } from 'src/types/loveza-product';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useAccountReportsQuery } from 'src/app/account/use-account-reports';
import { normalizeFlavor, collectFoundFlavors } from 'src/lib/explorer/flavor-collection';

import { Iconify } from 'src/components/iconify';

type CollectionProduct = Pick<
  LovezaProduct,
  'id' | 'slug' | 'thai_name' | 'name' | 'image_url' | 'fruit'
>;

export function FlavorCollection({
  products,
  userId,
  unavailable = false,
}: {
  products: CollectionProduct[];
  userId: string;
  unavailable?: boolean;
}) {
  const { data: reports = [], isLoading, isError, refetch } = useAccountReportsQuery();
  const found = useMemo(() => collectFoundFlavors(reports), [reports]);
  const unlocked = useMemo(
    () => products.filter((product) => found.has(normalizeFlavor(product.slug))),
    [products, found]
  );
  const [newFlavors, setNewFlavors] = useState<string[]>([]);
  useEffect(() => {
    if (isLoading || isError || unavailable) return;
    const key = `loveza-flavor-book:${userId}`;
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      const seen = new Set(
        Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : []
      );
      setNewFlavors(
        unlocked.filter((product) => !seen.has(product.id)).map((product) => product.id)
      );
      localStorage.setItem(
        key,
        JSON.stringify([...seen, ...unlocked.map((product) => product.id)])
      );
    } catch {
      /* Animation history is optional; collection always comes from approved reports. */
    }
  }, [unlocked, userId, isLoading, isError, unavailable]);
  return (
    <Box
      component="section"
      aria-labelledby="flavor-book-title"
      sx={{
        p: { xs: 2, md: 3 },
        border: '5px solid var(--palette-background-paper)',
        borderRadius: '18px',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 0 var(--palette-grey-200)',
        '@keyframes flavorUnlock': {
          '0%': { transform: 'scale(.92) rotate(-3deg)', opacity: 0.5 },
          '60%': { transform: 'scale(1.03) rotate(2deg)' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: 1 },
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            sx={{ fontSize: 10, color: 'primary.dark', fontWeight: 800, letterSpacing: 2 }}
          >
            MY FLAVOR BOOK
          </Typography>
          <Typography
            id="flavor-book-title"
            component="h2"
            sx={{ mt: 0.5, fontSize: { xs: 22, md: 26 }, fontWeight: 900 }}
          >
            สมุดสะสมความซ่า
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            bgcolor: '#E8F0E4',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
          }}
        >
          <Iconify icon="ri:book-open-line" width={26} />
        </Box>
      </Stack>
      <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.8, color: 'text.secondary' }}>
        ทุกความซ่ามีเรื่องราว แจ้งรสที่พบจริง แล้วเก็บให้ครบในสมุดของคุณ
      </Typography>
      {isError || unavailable ? (
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              onClick={() => (unavailable ? window.location.reload() : refetch())}
            >
              ลองอีกครั้ง
            </Button>
          }
        >
          โหลดสมุดสะสมไม่สำเร็จ
        </Alert>
      ) : isLoading ? (
        <Skeleton height={240} />
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'primary.dark' }}>
              ค้นพบแล้ว {unlocked.length} / {products.length} รสชาติ
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {products.length > 0 && unlocked.length === products.length
                ? 'ครบทุกความซ่าแล้ว! ✦'
                : 'ค่อย ๆ สะสมไปด้วยกัน'}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={products.length ? (unlocked.length / products.length) * 100 : 0}
            aria-label="ความคืบหน้าสะสมรสชาติ"
            sx={{
              height: 8,
              borderRadius: '4px',
              mb: 2.5,
              bgcolor: '#E8EDDF',
              '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: '4px' },
            }}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {products.map((product) => {
              const date = found.get(normalizeFlavor(product.slug));
              const palette: Record<string, { bg: string; accent: string }> = {
                honey_lemon: { bg: '#E4F4FC', accent: '#1983AB' },
                lychee: { bg: '#FCE5EF', accent: '#B82D6E' },
                kyoho_grape: { bg: '#EFE5FA', accent: '#7849A5' },
                yoghurt: { bg: '#E3F3F3', accent: '#258586' },
              };
              const tone = palette[normalizeFlavor(product.slug)] ?? {
                bg: '#E8F0E4',
                accent: '#427653',
              };
              const fresh = Boolean(date) && newFlavors.includes(product.id);
              return (
                <Box
                  key={product.id}
                  sx={{
                    p: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'center',
                    bgcolor: '#FFFDFA',
                    border: '2px solid',
                    borderColor: date ? tone.bg : '#E5E3DE',
                    boxShadow: '0 3px 0 #EDE4D7',
                    borderRadius: '14px',
                    animation: fresh ? 'flavorUnlock .65s ease-out' : 'none',
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  }}
                >
                  {date && (
                    <Box
                      aria-label="ค้นพบแล้ว"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        zIndex: 1,
                        width: 24,
                        height: 24,
                        bgcolor: '#FFFDFA',
                        borderRadius: '8px',
                        display: 'grid',
                        placeItems: 'center',
                        color: tone.accent,
                      }}
                    >
                      <Iconify icon="ri:check-line" width={16} />
                    </Box>
                  )}
                  {fresh && (
                    <Chip
                      size="small"
                      label="ใหม่ ✦"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        color: 'primary.dark',
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      height: { xs: 148, xl: 160 },
                      bgcolor: date ? tone.bg : '#F0F0ED',
                      borderRadius: '10px',
                      pt: 1,
                      display: 'grid',
                      placeItems: 'center',
                      position: 'relative',
                      mb: 1,
                    }}
                  >
                    {product.image_url ? (
                      <Box
                        component="img"
                        src={product.image_url}
                        alt={product.thai_name}
                        sx={{
                          width: '100%',
                          height: 136,
                          objectFit: 'contain',
                          filter: date ? 'drop-shadow(0 5px 7px #3E373014)' : 'grayscale(1)',
                          opacity: date ? 1 : 0.25,
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 50, opacity: date ? 1 : 0.25 }}>
                        {product.fruit}
                      </Typography>
                    )}
                    {!date && (
                      <Iconify
                        icon="ri:lock-2-fill"
                        width={30}
                        sx={{ position: 'absolute', color: 'text.secondary' }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, mt: 1.5, lineHeight: 1.5 }}>
                    {product.thai_name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                    {product.name}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      minHeight: 20,
                      fontSize: 10,
                      color: date ? tone.accent : 'text.secondary',
                    }}
                  >
                    {date
                      ? `พบเมื่อ ${new Date(date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}`
                      : 'รอคุณออกไปค้นพบ'}
                  </Typography>
                  <Button
                    href={`/products/${encodeURIComponent(product.slug)}/`}
                    size="small"
                    endIcon={<Iconify icon="ri:arrow-right-line" width={14} />}
                    sx={{
                      fontSize: 11,
                      minHeight: 32,
                      mt: 0.75,
                      mb: 0.5,
                      color: date ? tone.accent : 'text.secondary',
                      borderRadius: '8px',
                      bgcolor: date ? tone.bg : '#F3F2EE',
                      width: '100%',
                    }}
                  >
                    รู้จักรสนี้
                  </Button>
                </Box>
              );
            })}
          </Box>
          {products.length === 0 && (
            <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
              กำลังเตรียมรสชาติให้สะสม
            </Typography>
          )}
          {newFlavors.length > 0 && (
            <Typography
              role="status"
              sx={{ mt: 2, color: 'primary.dark', fontSize: 13, fontWeight: 700 }}
            >
              ✦ ปลดล็อกการ์ดใหม่ {newFlavors.length} รสชาติแล้ว!
            </Typography>
          )}
          <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 11, lineHeight: 1.8 }}>
            นับประวัติเดิมที่ผ่านอนุมัติและแจ้งว่ามีสินค้า/เหลือน้อยเท่านั้น
            ไม่รวมสินค้าหมดหรือไม่แน่ใจ การสะสมไม่ใช่การยืนยันสินค้าคงเหลือปัจจุบัน
          </Typography>
          <Button
            href="/report/"
            variant="outlined"
            fullWidth
            startIcon={<Iconify icon="ri:map-pin-add-line" />}
            sx={{ mt: 2, borderRadius: '10px', borderColor: '#B6CEB6', minHeight: 44 }}
          >
            เจอรสใหม่? แจ้งพิกัดเพื่อสะสม
          </Button>
        </>
      )}
    </Box>
  );
}
