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
    <Box component="section" id="flavors" sx={{ py: { xs: 9, md: 13 } }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#ef2382', fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>
            LOVEZA LOVE POTION
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 1,
              px: 1,
              fontSize: { xs: 36, sm: 46, md: 64 },
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: '-.06em',
              overflowWrap: 'anywhere',
            }}
          >
            {products.length} รสชาติ พร้อมส่ง
          </Typography>
        </Box>

        <Box sx={{ mt: { xs: 4, md: 6 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 1 } }}>
          {products.map((product) => (
            <Box key={product.id}>
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
                  href="#finder"
                  sx={{
                    px: 2.5,
                    color: product.accent,
                    fontWeight: 800,
                    borderRadius: 99,
                    bgcolor: `${product.accent}14`,
                  }}
                >
                  {product.name}
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
  );
}
