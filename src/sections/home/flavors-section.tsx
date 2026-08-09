import type { LovezaProduct } from 'src/types/loveza-product';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { ProductCan } from './product-can';

type FlavorsSectionProps = {
  products: LovezaProduct[];
};

export function FlavorsSection({ products }: FlavorsSectionProps) {
  return (
    <Container maxWidth="xl">
      <Box component="section" id="flavors" sx={{ py: { xs: 7, md: 8 } }}>
        <Container
          maxWidth="xl"
          sx={{
            p: { xs: '30px 14px !important', sm: '48px 30px !important', md: '64px !important' },
            color: '#fff',
            overflow: 'hidden',
            border: '3px solid #351129',
            borderRadius: { xs: '32px', md: '48px' },
            background:
              'radial-gradient(circle at 18px 18px, rgba(255,255,255,.12) 3px, transparent 3.5px) 0 0 / 38px 38px, #6D28D9',
            boxShadow: '10px 12px 0 #351129',
          }}
        >
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
              <Typography
                sx={{
                  px: 1.5,
                  py: 0.75,
                  width: 'fit-content',
                  color: '#351129',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  border: '2px solid #351129',
                  borderRadius: 99,
                  bgcolor: '#70E1F5',
                  boxShadow: '3px 3px 0 #351129',
                  transform: 'rotate(-2deg)',
                }}
              >
                PICK YOUR VIBE
              </Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 1,
                  maxWidth: 650,
                  fontSize: { xs: 40, sm: 52, md: 68 },
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: '-.06em',
                }}
              >
                เลือกรส แล้วไปซ่า!
              </Typography>
            </Box>
            <Typography
              sx={{
                maxWidth: 390,
                color: '#F4EFFF',
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.7,
              }}
            >
              ทั้ง {products.length} รสชาติ พร้อมเติมความสดชื่น
              เลือกรสที่ใช่แล้วตามหาร้านใกล้คุณได้เลย
            </Typography>
          </Box>

          <Box
            sx={{
              mt: { xs: 3, md: 5 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {products.map((product) => (
              <Box
                key={product.id}
                sx={{
                  pb: 2.5,
                  border: '3px solid #351129',
                  borderRadius: { xs: '28px', md: '36px' },
                  bgcolor: '#FFF9FC',
                  boxShadow: '6px 7px 0 #351129',
                  transition: 'transform 180ms ease',
                  '&:hover': { transform: 'translateY(-8px) rotate(-1deg)' },
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
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    href="/nearby"
                    sx={{
                      px: 2.5,
                      color: product.accent,
                      fontWeight: 800,
                      border: '2px solid #351129',
                      borderRadius: 99,
                      bgcolor: '#fff',
                      boxShadow: '3px 4px 0 #351129',
                    }}
                  >
                    ค้นหารส {product.name}
                    <Iconify icon="ri:arrow-right-up-line" width={18} sx={{ ml: 0.75 }} />
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
        </Container>
      </Box>
    </Container>
  );
}
