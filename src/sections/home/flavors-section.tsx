import type { LovezaProduct } from 'src/types/loveza-product';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { ProductCan } from './product-can';
import { explorerCardSx, explorerLabelSx } from './explorer-styles';

type FlavorsSectionProps = {
  products: LovezaProduct[];
};

export function FlavorsSection({ products }: FlavorsSectionProps) {
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
                lg: 'repeat(4, minmax(0, 1fr))',
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
                  ...explorerCardSx,
                  border: '5px solid var(--palette-background-paper)',
                  borderRadius: '18px',
                  transition: 'transform 180ms ease',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
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
                    p: 2.5,
                    pt: 2,
                    borderTop: '1px solid var(--palette-grey-200)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                    }}
                  >
                    LOVEZA SODA
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{ mt: 0.75, fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}
                  >
                    {product.thai_name}
                  </Typography>
                  <Typography sx={{ mt: 0.5, mb: 2.5, color: 'text.secondary', fontSize: 13 }}>
                    {product.name}
                  </Typography>
                  <Button
                    href={`/products/${encodeURIComponent(product.slug)}/`}
                    variant="outlined"
                    fullWidth
                    endIcon={<Iconify icon="ri:arrow-right-line" width={18} />}
                    sx={{
                      mt: 'auto',
                      py: 1.2,
                      borderRadius: '12px',
                      justifyContent: 'space-between',
                      px: 2,
                      color: 'primary.dark',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      '&:hover': { bgcolor: 'primary.lighter', borderColor: 'primary.main' },
                    }}
                  >
                    ดูรายละเอียดรสนี้
                  </Button>
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
