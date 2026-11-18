import type { Metadata } from 'next';
import type { LovezaProduct } from 'src/types/loveza-product';

import { cache } from 'react';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { Iconify } from 'src/components/iconify';

import { ProductCan } from 'src/sections/home/product-can';
import { FlavorNavigation } from 'src/sections/products/flavor-navigation';

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
  return data as LovezaProduct | null;
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'ไม่พบสินค้า | Loveza Hunt', robots: { index: false } };
  return createSeoMetadata({
    title: `Loveza ${product.thai_name} (${product.name}) | Loveza Hunt`,
    description:
      product.description ||
      `ทำความรู้จัก Loveza ${product.thai_name} และค้นหาร้านใกล้คุณจากแผนที่ชุมชน`,
    path: `/products/${encodeURIComponent(slug)}/`,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const supabase = await createClient();
  const { data: flavorRows } = await supabase
    .from('products')
    .select('slug, thai_name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id');
  const flavors = flavorRows ?? [{ slug: product.slug, thai_name: product.thai_name }];
  // Validate presentation colors before using values from the product catalog.
  const color = /^#[0-9a-f]{6}$/i.test(product.color) ? product.color : '#427653';
  return (
    <Box
      component="main"
      sx={{
        pt: '100px',
        pb: { xs: 12, md: 8 },
        minHeight: '100dvh',
        background: `radial-gradient(ellipse at 25% 32%, #fff7dc 0%, transparent 48%), linear-gradient(180deg, ${color}35 0%, ${color}12 60%, #FBF6ED 100%)`,
      }}
    >
      <Container maxWidth="lg">
        <Button
          href="/#flavors"
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ mb: 2 }}
        >
          ทุกรสชาติ
        </Button>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 3, md: 7 },
            alignItems: 'center',
          }}
        >
          <FlavorNavigation flavors={flavors} slug={slug}>
            <Box sx={{ textAlign: 'center', position: 'relative', py: { xs: 1, md: 3 } }}>
              <Typography
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  left: '8%',
                  top: '28%',
                  fontSize: 32,
                  color: '#E9B63B',
                  transform: 'rotate(-15deg)',
                }}
              >
                ✦
              </Typography>
              <Typography
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  right: '8%',
                  top: '48%',
                  fontSize: 24,
                  color,
                  transform: 'rotate(12deg)',
                }}
              >
                ✧
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 2.5,
                  py: 1.5,
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: '16px',
                  position: 'relative',
                  boxShadow: `0 5px 0 ${color}15`,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: '48%',
                    width: 16,
                    height: 16,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                  },
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                  {product.fruit} ความซ่ารสโปรดของคุณ ✦
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  pt: 2,
                  pb: 3,
                  '& > div > div': { height: { xs: 360, md: 430 } },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '78%',
                    height: 72,
                    bottom: 14,
                    left: '11%',
                    borderRadius: '50%',
                    background: `linear-gradient(180deg, #ffffffb0, ${color}22)`,
                    border: '3px solid #ffffff66',
                    boxShadow: `0 12px 0 ${color}09, 0 22px 35px ${color}12`,
                  },
                  background: `radial-gradient(ellipse at center, #ffffff90, transparent 68%)`,
                  '& img': {
                    height: { xs: 330, md: 400 },
                    maxWidth: 340,
                    filter: `drop-shadow(0 18px 18px ${color}35)`,
                    transition: 'transform .2s ease',
                    '&:hover': { transform: 'rotate(-4deg) translateY(-4px)' },
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                      '&:hover': { transform: 'none' },
                    },
                  },
                }}
              >
                <ProductCan
                  name={product.name}
                  thaiName={product.thai_name}
                  color={product.color}
                  accent={product.accent}
                  fruit={product.fruit}
                  meta={product.meta}
                  imageUrl={product.image_url}
                />
              </Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                ภาพประกอบสินค้า · ตรวจสอบรายละเอียดบนฉลากจริง
              </Typography>
            </Box>
          </FlavorNavigation>
          <Stack spacing={2} sx={{ pb: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography
                  sx={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, color: 'primary.dark' }}
                >
                  YOUR FIZZY COMPANION
                </Typography>
                {product.is_new && (
                  <Chip size="small" label="NEW ✦" color="secondary" sx={{ borderRadius: '8px' }} />
                )}
              </Stack>
              <Typography
                component="h1"
                sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 900, lineHeight: 1.35 }}
              >
                {product.thai_name}
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 18 }}>
                {product.name}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                border: '5px solid var(--palette-background-paper)',
                borderRadius: '18px',
                boxShadow: '0 4px 0 var(--palette-grey-200)',
              }}
            >
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 800, mb: 1 }}>
                ทำความรู้จักรสนี้ {product.fruit}
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {product.description ||
                  `พบกับ Loveza ${product.thai_name} แล้วออกไปค้นหาร้านใกล้คุณด้วยกัน`}
              </Typography>
              {product.meta && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: `${color}12`,
                    borderRadius: '12px',
                    border: `1px solid ${color}20`,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'background.paper',
                      borderRadius: '10px',
                      color,
                    }}
                  >
                    <Iconify icon="ri:sparkling-2-line" width={20} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary' }}>
                    {product.meta}
                  </Typography>
                </Stack>
              )}
            </Box>
            <Button
              href="/nearby/"
              variant="contained"
              size="large"
              startIcon={<Iconify icon="ri:compass-3-line" width={22} />}
              endIcon={<Iconify icon="ri:arrow-right-line" width={20} />}
              sx={{
                minHeight: 54,
                px: 2.5,
                justifyContent: 'space-between',
                '& .MuiButton-startIcon': { mr: 1.5 },
                '& .MuiButton-endIcon': { ml: 'auto', pl: 1 },
                borderRadius: '14px',
                bgcolor: 'primary.main',
                boxShadow: '0 5px 0 var(--palette-primary-darker)',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              ค้นหาร้านใกล้ฉัน
            </Button>
            <Button
              href="/mapza/"
              color="inherit"
              endIcon={<Iconify icon="ri:arrow-right-line" />}
              sx={{
                p: 1.5,
                minHeight: 72,
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
                border: '5px solid var(--palette-background-paper)',
                borderRadius: '18px',
                boxShadow: '0 4px 0 var(--palette-grey-200)',
              }}
            >
              <Box component="span" sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box
                  component="img"
                  src="/assets/icons/loveza/voxel-map-pin.svg"
                  alt=""
                  sx={{ width: 40, height: 40 }}
                />
                <Box component="span" sx={{ textAlign: 'left' }}>
                  <Typography
                    component="span"
                    sx={{ display: 'block', fontSize: 14, fontWeight: 800 }}
                  >
                    แผนที่ความซ่าทั่วไทย
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      fontSize: 12,
                      color: 'text.secondary',
                      fontWeight: 400,
                    }}
                  >
                    มาค้นพบร้านใหม่ไปด้วยกัน
                  </Typography>
                </Box>
              </Box>
            </Button>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.7 }}>
              แผนที่รวบรวมข้อมูลจากชุมชน ร้านแต่ละแห่งอาจมีรสชาติและจำนวนสินค้าแตกต่างกัน
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
