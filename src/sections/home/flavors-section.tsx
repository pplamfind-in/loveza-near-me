import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { ProductCan } from './product-can';

const flavors = [
  { name: 'Honey Lemon', thaiName: 'รสน้ำผึ้งมะนาว', color: '#00a9dc', accent: '#087cae', fruit: '🍋', meta: 'VITAMIN B3 • B6 • B12' },
  { name: 'Lychee', thaiName: 'รสลิ้นจี่', color: '#ee2c82', accent: '#00a99d', fruit: '🫧', meta: 'VITAMIN B3 • B6 • B12' },
  { name: 'Kyoho Grape', thaiName: 'รสองุ่นเคียวโฮ', color: '#7245a3', accent: '#4d287e', fruit: '🍇', meta: 'VITAMIN B3 • B6 • B12' },
];

export function FlavorsSection() {
  return (
    <Box component="section" id="flavors" sx={{ pb: { xs: 11, md: 16 } }}>
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
            3 รสชาติ พร้อมส่ง
          </Typography>
        </Box>

        <Box sx={{ mt: { xs: 4, md: 6 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 1 } }}>
          {flavors.map((flavor) => (
            <Box key={flavor.name}>
              <ProductCan {...flavor} />
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  href="#finder"
                  sx={{
                    px: 2.5,
                    color: flavor.accent,
                    fontWeight: 800,
                    borderRadius: 99,
                    bgcolor: `${flavor.accent}14`,
                  }}
                >
                  {flavor.name} &nbsp; ↗
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
