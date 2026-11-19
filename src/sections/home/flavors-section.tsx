import type { LovezaProduct } from 'src/types/loveza-product';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { formatCompactCount } from 'src/utils/format-compact-count';

import { getProductFlavorIcon } from 'src/lib/product-flavor-icon';

import { Iconify } from 'src/components/iconify';

import { ProductCan } from './product-can';
import { explorerLabelSx } from './explorer-styles';

type FlavorsSectionProps = {
  products: LovezaProduct[];
};

function FlavorIcon({ product }: { product: LovezaProduct }) {
  const icon = getProductFlavorIcon(product);
  if (!icon) return null;

  return (
    <Image
      src={icon}
      alt=""
      width={30}
      height={30}
      unoptimized
      style={{ flexShrink: 0, objectFit: 'contain' }}
    />
  );
}

export function FlavorsSection({ products }: FlavorsSectionProps) {
  const desktopColumns = products.length === 5 ? 3 : Math.min(Math.max(products.length, 1), 4);
  return (
    <Container maxWidth="lg">
      <Box component="section" id="flavors" sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={explorerLabelSx}>CHOOSE YOUR FLAVOR</Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 1,
                  maxWidth: 650,
                  fontSize: { xs: 30, sm: 38, md: 46 },
                  lineHeight: 1.3,
                  fontWeight: 900,
                  letterSpacing: '-.03em',
                }}
              >
                ความซ่าที่อยากค้นพบ
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', maxWidth: 420 }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: { xs: 64, md: 84 },
                  height: { xs: 72, md: 94 },
                  position: 'relative',
                }}
              >
                <Image
                  src="/assets/illustrations/p-kard.webp"
                  unoptimized
                  alt=""
                  fill
                  sizes="84px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography
                sx={{
                  maxWidth: 390,
                  color: 'var(--palette-text-secondary)',
                  fontSize: { xs: 14, md: 16 },
                  lineHeight: 1.7,
                }}
              >
                ทั้ง {products.length} รสชาติ พร้อมเติมความสดชื่น
                เลือกรสที่ใช่แล้วตามหาร้านใกล้คุณได้เลย
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: { xs: 3, md: 5 },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: `repeat(${desktopColumns}, minmax(0, 1fr))`,
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {products.map((product) => (
              <Box
                key={product.id}
                sx={{
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  background: /^#[0-9a-f]{6}$/i.test(product.color)
                    ? `linear-gradient(165deg, ${product.color}14, ${product.color}26)`
                    : '#F5F1EA',
                  border: '1px solid var(--palette-grey-200)',
                  borderRadius: '22px',
                  boxShadow: '0 3px 0 #EDE4D7',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '@media (hover: hover) and (prefers-reduced-motion: no-preference)': {
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 7px 14px #523B2514' },
                  },
                }}
              >
                {product.like_count !== undefined && (
                  <Button
                    href={`/products/${encodeURIComponent(product.slug)}/`}
                    aria-label={`ดู ${product.thai_name} · ${product.like_count} หัวใจ`}
                    startIcon={
                      <Image
                        src="/assets/loveza/loveza-heart.webp"
                        alt=""
                        width={30}
                        height={27}
                        unoptimized
                      />
                    }
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 2,
                      minWidth: 44,
                      minHeight: 44,
                      px: 1.25,
                      '&&': { borderRadius: '999px' },
                      bgcolor: 'transparent',
                      color: '#AD2452',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      '& .MuiButton-startIcon': { ml: 0, mr: 0.5 },
                      '&:hover': { bgcolor: 'transparent', color: '#8E1940' },
                    }}
                  >
                    {formatCompactCount(product.like_count)}
                  </Button>
                )}
                {product.is_new ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 4,
                      zIndex: 2,
                      width: { xs: 96, md: 112 },
                      pointerEvents: 'none',
                    }}
                  >
                    <Image
                      src="/assets/loveza/new-badge.png"
                      alt="สินค้าใหม่"
                      width={1536}
                      height={1024}
                      sizes="112px"
                      style={{ display: 'block', width: '100%', height: 'auto' }}
                    />
                  </Box>
                ) : null}
                <Box
                  component="a"
                  href={`/products/${encodeURIComponent(product.slug)}/`}
                  aria-label={`ดูรายละเอียด Loveza ${product.thai_name}`}
                  sx={{
                    display: 'block',
                    position: 'relative',
                    pt: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -3,
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
                <Box
                  sx={{
                    px: 2,
                    py: 2,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      component="h3"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: { xs: 22, lg: 20 },
                        fontWeight: 900,
                        lineHeight: 1.35,
                        color: /^#[0-9a-f]{6}$/i.test(product.color)
                          ? `color-mix(in srgb, ${product.color} 67%, #241C22)`
                          : 'text.primary',
                      }}
                    >
                      <FlavorIcon product={product} />
                      {product.thai_name}
                    </Typography>
                    <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                      {product.name}
                    </Typography>
                  </Box>
                  <IconButton
                    href={`/products/${encodeURIComponent(product.slug)}/`}
                    aria-label={`ดูรายละเอียด ${product.thai_name}`}
                    sx={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      color: 'primary.darker',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                    }}
                  >
                    <Iconify icon="ri:arrow-right-line" width={20} />
                  </IconButton>
                </Box>
              </Box>
            ))}

            {products.length === 0 ? (
              <Typography sx={{ gridColumn: '1 / -1', py: 8, color: 'text.secondary' }}>
                กำลังเตรียมสินค้าใหม่ พบกันเร็ว ๆ นี้
              </Typography>
            ) : null}
          </Box>
          {products.length > 0 ? (
            <Typography
              sx={{
                mt: 2,
                color: 'text.secondary',
                fontSize: 11,
                lineHeight: 1.7,
                textAlign: 'center',
              }}
            >
              * ภาพสินค้าเป็นเพียงภาพตัวอย่าง ไม่ใช่สินค้าจริง
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Container>
  );
}
