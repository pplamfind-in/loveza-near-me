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
  title: 'แจ้งพิกัด Loveza | Loveza Hunt',
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
        minHeight: '100dvh',
        pt: '100px',
        pb: { xs: 'calc(140px + env(safe-area-inset-bottom))', md: '100px' },
        background: 'var(--palette-background-default)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: { xs: 3, md: 4 },
            p: { xs: 3, md: 5 },
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
            background:
              'linear-gradient(90deg, #FBF6ED 20%, rgba(251,246,237,.96) 45%, rgba(251,246,237,.12) 100%), url(/assets/loveza/nearby-explorer-v1.webp) right center / cover',
            boxShadow: '0 4px 0 var(--palette-grey-200)',
          }}
        >
          <Box
            component="img"
            src="/assets/icons/loveza/voxel-map-pin.svg"
            alt=""
            sx={{ width: 56, height: 56, mb: 2 }}
          />
          <Typography
            sx={{ color: 'primary.dark', fontSize: 11, fontWeight: 800, letterSpacing: 2 }}
          >
            SHARE YOUR DISCOVERY
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1,
              maxWidth: 650,
              fontSize: { xs: 32, md: 48 },
              lineHeight: 1.35,
              fontWeight: 900,
            }}
          >
            เจอแล้ว บอกต่อความซ่า
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 540,
              color: 'text.secondary',
              fontSize: { xs: 15, md: 17 },
              lineHeight: 1.8,
            }}
          >
            ปักหมุดร้าน เลือกรสชาติ และแจ้งจำนวนที่พบ เพื่อให้ทุกคนตามไปเจอ Loveza
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 0,
            border: 0,
            borderRadius: '18px',
            bgcolor: 'var(--palette-background-default)',
            boxShadow: 'none',
          }}
        >
          <ReportForm />
        </Paper>
      </Container>
    </Box>
  );
}
