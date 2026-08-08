import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NearbyFinder } from './nearby-finder';

export const metadata: Metadata = { title: 'Loveza ใกล้ฉัน | Loveza Near Me' };

export default function NearbyPage() {
  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f1fbfa', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography
          component="h1"
          sx={{ fontSize: { xs: 40, md: 58 }, fontWeight: 900, letterSpacing: '-.05em' }}
        >
          Loveza ใกล้ฉัน
        </Typography>
        <Typography sx={{ mt: 1, mb: 4, color: 'text.secondary', fontSize: 17 }}>
          แสดงเฉพาะร้านที่ผ่านการตรวจสอบ เรียงจากใกล้ไปไกล
        </Typography>
        <NearbyFinder />
      </Container>
    </Box>
  );
}
