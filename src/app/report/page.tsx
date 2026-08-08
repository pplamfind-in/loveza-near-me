import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createClient } from 'src/lib/supabase/server';

import { ReportForm } from './report-form';

export const metadata: Metadata = { title: 'แจ้งพิกัด Loveza | Loveza Near Me' };

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=%2Freport');

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#fff5fa', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography
          component="h1"
          sx={{ fontSize: { xs: 38, md: 56 }, fontWeight: 900, letterSpacing: '-.05em' }}
        >
          เจอ Loveza ที่ไหน?
        </Typography>
        <Typography sx={{ mt: 1, mb: 4, color: 'text.secondary', fontSize: 17 }}>
          บอกพิกัดและจำนวนที่พบ ข้อมูลจะเผยแพร่หลัง Admin ตรวจสอบ
        </Typography>
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4 }}>
          <ReportForm />
        </Paper>
      </Container>
    </Box>
  );
}
