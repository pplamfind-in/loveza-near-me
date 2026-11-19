import type { Metadata } from 'next';
import type { LovezaProduct } from 'src/types/loveza-product';

import { cache } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { getProductFlavorIcon } from 'src/lib/product-flavor-icon';

import { Iconify } from 'src/components/iconify';

import { ProductCan } from 'src/sections/home/product-can';
import { FlavorNavigation } from 'src/sections/products/flavor-navigation';
import { FlavorLikeButton } from 'src/sections/products/flavor-like-button';

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
  const [{ data: flavorRows }, { data: likes }, { data: auth }] = await Promise.all([
    supabase
      .from('products')
      .select('slug, thai_name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id'),
    supabase
      .from('product_like_counts')
      .select('like_count')
      .eq('product_id', product.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const flavorIcon = getProductFlavorIcon(product);
  const loginHref = `/auth/login/?next=${encodeURIComponent(`/products/${product.slug}/`)}`;
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
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {flavorIcon ? (
                    <Image
                      src={flavorIcon}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                      style={{ flexShrink: 0, objectFit: 'contain' }}
                    />
                  ) : (
                    product.fruit
                  )}
                  ความซ่ารสโปรดของคุณ ✦
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
                  '& > div img': {
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
                {product.is_new && (
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      top: { xs: 8, md: 16 },
                      left: { xs: 'calc(50% - 104px)', md: 'calc(50% - 126px)' },
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  >
                    <Image
                      src="/assets/loveza/new-badge.png"
                      alt="สินค้าใหม่"
                      width={96}
                      height={64}
                    />
                  </Box>
                )}
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
          <Box
            sx={{
              pb: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) auto' },
              gridTemplateAreas: {
                xs: '"title" "hearts" "description" "maps" "note"',
                md: '"title hearts" "description description" "maps maps" "like like" "note note"',
              },
              columnGap: 1.5,
              rowGap: { xs: 1.5, md: 2 },
              textAlign: { xs: 'center', md: 'left' },
              alignItems: 'center',
            }}
          >
            <Box sx={{ gridArea: 'title' }}>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: 800,
                  color: 'primary.dark',
                }}
              >
                YOUR FIZZY COMPANION
              </Typography>
              <Typography
                component="h1"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  gap: 0.75,
                  fontSize: { xs: 30, md: 42 },
                  fontWeight: 900,
                  lineHeight: 1.35,
                  color: `color-mix(in srgb, ${color} 67%, #241C22)`,
                }}
              >
                {flavorIcon && (
                  <Image
                    src={flavorIcon}
                    alt=""
                    width={52}
                    height={52}
                    unoptimized
                    style={{ flexShrink: 0, objectFit: 'contain' }}
                  />
                )}
                {product.thai_name}
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 18 }}>
                {product.name}
              </Typography>
            </Box>
            <FlavorLikeButton
              key={product.id}
              id={product.id}
              name={product.thai_name}
              signedIn={Boolean(auth.user)}
              initialCount={Number(likes?.like_count ?? 0)}
              loginHref={loginHref}
            />
            <Box sx={{ gridArea: 'description', py: 1 }}>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {product.description ||
                  `พบกับ Loveza ${product.thai_name} แล้วออกไปค้นหาร้านใกล้คุณด้วยกัน`}
              </Typography>
              {product.meta && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
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
            <Box
              sx={{
                display: 'grid',
                gridArea: 'maps',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 1,
                alignItems: 'stretch',
                '& .MuiButton-root': {
                  minWidth: 0,
                  minHeight: 44,
                  px: { xs: 1, sm: 1.5 },
                  py: 0.75,
                  gap: { xs: 0.5, sm: 1 },
                  borderRadius: '12px',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  textAlign: { xs: 'center', sm: 'left' },
                  fontSize: 14,
                  lineHeight: 1.35,
                  fontWeight: 800,
                  boxShadow: 'none',
                  '&:hover, &:active': { boxShadow: 'none' },
                  '& .MuiButton-startIcon': {
                    m: 0,
                    flexShrink: 0,
                    width: 24,
                    justifyContent: 'center',
                  },
                  '& .MuiButton-endIcon': {
                    display: { xs: 'none', sm: 'inherit' },
                    ml: 'auto',
                    mr: 0,
                  },
                },
              }}
            >
              <Button
                href="/nearby/"
                variant="contained"
                disableElevation
                startIcon={<Iconify icon="ri:compass-3-line" width={20} />}
                endIcon={<Iconify icon="ri:arrow-right-line" width={18} />}
              >
                ค้นหาร้านใกล้ฉัน
              </Button>
              <Button
                href="/mapza/"
                color="inherit"
                startIcon={
                  <Box
                    component="img"
                    src="/assets/icons/loveza/voxel-map-pin.svg"
                    alt=""
                    sx={{ width: 24, height: 24 }}
                  />
                }
                endIcon={<Iconify icon="ri:arrow-right-line" width={18} />}
                sx={{ bgcolor: 'background.paper' }}
              >
                แผนที่ความซ่าทั่วไทย
              </Button>
            </Box>
            <Typography
              sx={{ gridArea: 'note', fontSize: 11, color: 'text.secondary', lineHeight: 1.7 }}
            >
              แผนที่รวบรวมข้อมูลจากชุมชน ร้านแต่ละแห่งอาจมีรสชาติและจำนวนสินค้าแตกต่างกัน
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
