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

// Measured visible bounds of the current 1774px-tall mobile can assets.
const mobileCanBounds: Record<string, { height: number; bottom: number }> = {
  'honey-lemon': { height: 1621, bottom: 87 },
  lychee: { height: 1628, bottom: 57 },
  'kyoho-grape': { height: 1744, bottom: 20 },
  yoghurt: { height: 1696, bottom: 38 },
  yogurt: { height: 1696, bottom: 38 },
};

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
  const canBounds = mobileCanBounds[product.slug];
  const referenceCan = mobileCanBounds['kyoho-grape'];
  const mobileCanScale = canBounds ? referenceCan.height / canBounds.height : 1;
  const mobileCanShift = canBounds
    ? ((canBounds.bottom * mobileCanScale - referenceCan.bottom) / 1774) * 100
    : 0;
  const flavorIcon = getProductFlavorIcon(product);
  const loginHref = `/auth/login/?next=${encodeURIComponent(`/products/${product.slug}/`)}`;
  const flavors = flavorRows ?? [{ slug: product.slug, thai_name: product.thai_name }];
  // Validate presentation colors before using values from the product catalog.
  const color = /^#[0-9a-f]{6}$/i.test(product.color) ? product.color : '#427653';
  return (
    <Box
      component="main"
      data-product-screen
      sx={{
        pt: { xs: 'var(--layout-header-mobile-height)', md: '100px' },
        pb: {
          xs: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          md: 8,
        },
        minHeight: '100dvh',
        display: { xs: 'flex', md: 'block' },
        flexDirection: 'column',
        '--product-action-inset': 'max(16px, calc((100% - 560px) / 2))',
        '--product-action-bottom': 'max(10px, env(safe-area-inset-bottom, 0px))',
        '--product-action-height': '48px',
        '@media (max-width: 899.95px)': {
          '--product-mobile-stage-height': 'clamp(132px, calc(100dvh - 370px), 398px)',
          height: '100dvh',
          overflowY: 'clip',
          '& [data-product-map-action].MuiButton-root, & [data-product-like-action].MuiButton-root':
            {
              height: 'var(--product-action-height)',
              minHeight: 'var(--product-action-height)',
              borderRadius: '12px',
              border: '1px solid #E9D9CF',
              bgcolor: '#FFFAF6',
              color: '#2F503A',
              boxShadow: 'none',
              '&:hover, &:active': { bgcolor: '#F8ECE5', boxShadow: 'none' },
            },
          '& [data-product-like-action].MuiButton-root': {
            position: 'fixed',
            gridArea: 'auto',
            insetInlineEnd: 'var(--product-action-inset)',
            bottom: 'var(--product-action-bottom)',
            zIndex: 'appBar',
            width: 'var(--product-action-height)',
            minWidth: 'var(--product-action-height)',
            borderRadius: '50%',
            p: 0,
            '& .MuiButton-startIcon': { bgcolor: 'transparent' },
            animation: 'product-actions-slide-up 300ms ease-out both',
          },
        },
        '@media (min-width: 560px) and (max-width: 899.95px) and (max-height: 620px)': {
          '--product-mobile-stage-height': 'clamp(132px, calc(100dvh - 216px), 398px)',
        },
        background: `radial-gradient(ellipse at 25% 32%, #fff7dc 0%, transparent 48%), linear-gradient(180deg, ${color}35 0%, ${color}12 60%, #FBF6ED 100%)`,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          display: { xs: 'flex', md: 'block' },
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Button
          href="/#flavors"
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ alignSelf: 'flex-start', mb: { xs: 0, md: 2 } }}
        >
          ย้อนกลับ
        </Button>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 1.5, md: 7 },
            alignItems: 'center',
            flex: 1,
            gridTemplateRows: { xs: 'auto minmax(min-content, 1fr)', md: 'auto' },
            '@media (min-width: 560px) and (max-width: 899.95px) and (max-height: 620px)': {
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gridTemplateRows: 'minmax(min-content, 1fr)',
              gap: 2,
            },
          }}
        >
          <FlavorNavigation flavors={flavors} slug={slug}>
            <Box
              sx={{
                textAlign: 'center',
                position: 'relative',
                py: { xs: 0, md: 3 },
              }}
            >
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
                  display: { xs: 'none', md: 'inline-block' },
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
                  pt: { xs: 3, md: 2 },
                  pb: { xs: 2, md: 3 },
                  '& > div > div': {
                    height: { xs: 'var(--product-mobile-stage-height, 398px)', md: 430 },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '78%',
                    height: { xs: 38, md: 72 },
                    bottom: { xs: 0, md: 14 },
                    left: '11%',
                    borderRadius: '50%',
                    background: `linear-gradient(180deg, #ffffffb0, ${color}22)`,
                    border: '3px solid #ffffff66',
                    boxShadow: `0 12px 0 ${color}09, 0 22px 35px ${color}12`,
                  },
                  background: `radial-gradient(ellipse at center, #ffffff90, transparent 68%)`,
                  '& > div img': {
                    height: {
                      xs: 'calc(var(--product-mobile-stage-height, 398px) - 6px)',
                      md: 400,
                    },
                    maxWidth: 340,
                    transformOrigin: { xs: 'center bottom', md: 'center' },
                    scale: { xs: mobileCanScale, md: 1 },
                    translate: { xs: `0 ${mobileCanShift}%`, md: 'none' },
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
                      left: {
                        xs: 'calc(50% - 112px)',
                        md: 'calc(50% - 126px)',
                      },
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
                {product.meta && (
                  <Box
                    sx={{
                      display: { xs: 'inline-flex', md: 'none' },
                      position: 'absolute',
                      right: 'max(0px, calc(50% - 126px))',
                      top: 44,
                      transform: 'rotate(-25deg)',
                      zIndex: 2,
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.75,
                      py: 0.375,
                      border: `1px solid ${color}30`,
                      borderRadius: 99,
                      bgcolor: '#FFF5EF',
                      color: 'text.primary',
                      fontSize: 10,
                      fontWeight: 800,
                      maxWidth: '52%',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <Iconify
                      icon="ri:sparkling-2-line"
                      width={14}
                      sx={{ color }}
                      aria-hidden="true"
                    />
                    {product.meta}
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
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  fontSize: 11,
                  color: 'text.secondary',
                }}
              >
                ภาพประกอบสินค้า · ตรวจสอบรายละเอียดบนฉลากจริง
              </Typography>
            </Box>
          </FlavorNavigation>
          <Box
            sx={{
              pb: { xs: 1, md: 2 },
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'minmax(0, 1fr) auto',
              },
              gridTemplateAreas: {
                xs: '"title title"',
                md: '"title hearts" "description description" "maps maps" "like like" "note note"',
              },
              columnGap: 1.5,
              rowGap: { xs: 1.25, md: 2 },
              textAlign: { xs: 'center', md: 'left' },
              alignItems: 'center',
            }}
          >
            <Box sx={{ gridArea: 'title' }}>
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
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
                  lineHeight: 1.2,
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
              <Typography
                sx={{
                  mt: { xs: 0, md: 0.75 },
                  color: 'text.secondary',
                  fontSize: { xs: 14, md: 18 },
                }}
              >
                {product.name}
              </Typography>
              <Typography
                sx={{
                  display: { xs: 'block', md: 'none' },
                  maxWidth: '34ch',
                  mx: 'auto',
                  mt: 0.5,
                  color: 'text.secondary',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {product.description?.trim() ||
                  (product.slug === 'yoghurt'
                    ? 'โซดารสโยเกิร์ต ผสมวิตามินและซิงก์'
                    : `โซดา Loveza ${product.thai_name}`)}
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
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                gridArea: 'description',
                py: { xs: 0, md: 1 },
              }}
            >
              <Typography
                sx={{
                  display: {
                    xs: product.description ? 'block' : 'none',
                    md: 'block',
                  },
                  color: 'text.secondary',
                  fontSize: { xs: 14, md: 16 },
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}
              >
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
                    mt: { xs: product.description ? 1 : 0, md: 2 },
                    mx: { xs: 'auto', md: 0 },
                    width: { xs: 'fit-content', md: 'auto' },
                    maxWidth: '100%',
                    px: { xs: 1.25, md: 1.5 },
                    py: { xs: 0.625, md: 1.5 },
                    bgcolor: `${color}12`,
                    borderRadius: { xs: 99, md: '12px' },
                    border: `1px solid ${color}20`,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 25, md: 32 },
                      height: { xs: 25, md: 32 },
                      flexShrink: 0,
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
                '@media (max-width: 899.95px)': {
                  position: 'fixed',
                  gridArea: 'auto',
                  insetInline: 'var(--product-action-inset)',
                  bottom: 'var(--product-action-bottom)',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) var(--product-action-height)',
                  pointerEvents: 'none',
                  '& .MuiButton-root.MuiButton-root': {
                    pointerEvents: 'auto',
                    px: 0.5,
                    fontSize: 12,
                    '& .MuiButton-startIcon': {
                      width: 18,
                      '& > *': { width: 18, height: 18 },
                    },
                  },
                  zIndex: 'appBar',
                  animation: 'product-actions-slide-up 300ms ease-out both',
                },
                '@keyframes product-actions-slide-up': {
                  from: { opacity: 0, transform: 'translateY(16px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
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
                data-product-map-action
                href="/nearby/"
                variant="contained"
                disableElevation
                startIcon={<Iconify icon="ri:compass-3-line" width={20} />}
                endIcon={<Iconify icon="ri:arrow-right-line" width={18} />}
              >
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  ร้านใกล้ฉัน
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  ค้นหาร้านใกล้ฉัน
                </Box>
              </Button>
              <Button
                data-product-map-action
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
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  แผนที่ทั่วไทย
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  แผนที่ความซ่าทั่วไทย
                </Box>
              </Button>
            </Box>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                gridArea: 'note',
                fontSize: 11,
                color: 'text.secondary',
                lineHeight: 1.7,
              }}
            >
              แผนที่รวบรวมข้อมูลจากชุมชน ร้านแต่ละแห่งอาจมีรสชาติและจำนวนสินค้าแตกต่างกัน
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
