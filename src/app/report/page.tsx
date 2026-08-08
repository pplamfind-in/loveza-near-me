import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { ReportForm } from './report-form';

export const metadata: Metadata = {
  title: 'แจ้งพิกัด Loveza | Loveza Near Me',
  robots: NO_INDEX_ROBOTS,
};

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=%2Freport');

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 12px 12px, rgba(124,58,237,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 3,
            p: { xs: 3, md: 5 },
            color: '#351129',
            border: '3px solid #351129',
            borderRadius: { xs: '26px', md: '38px' },
            bgcolor: '#FDE047',
            boxShadow: '8px 9px 0 #E5007E',
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}>
            SPOTTED LOVEZA!
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1,
              fontSize: { xs: 42, md: 64 },
              lineHeight: 0.98,
              fontWeight: 1000,
              letterSpacing: '-.06em',
            }}
          >
            เจอแล้ว อย่าเก็บไว้คนเดียว
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 700, fontSize: { xs: 15, md: 17 } }}>
            ปักหมุดร้าน รสชาติ และจำนวนที่เหลือ ให้แก๊ง Loveza ตามไปซื้อได้เลย
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            border: '3px solid #351129',
            borderRadius: { xs: '24px', md: '32px' },
            boxShadow: '7px 8px 0 #351129',
          }}
        >
          <ReportForm />
        </Paper>
      </Container>
    </Box>
  );
}
