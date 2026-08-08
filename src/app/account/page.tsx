import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createClient } from 'src/lib/supabase/server';

import { SessionCard } from 'src/sections/auth-loveza/session-card';
import { ReportHistorySection } from 'src/sections/account/report-history-section';

export const metadata: Metadata = { title: 'บัญชีของฉัน | Loveza Near Me' };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#fbf3f9', py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: { xs: 4, md: 5 } }}>
          <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            MY LOVEZA
          </Typography>
          <Typography component="h1" sx={{ mt: 1, fontSize: { xs: 38, md: 52 }, fontWeight: 900 }}>
            บัญชีของฉัน
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 17 }}>
            จัดการบัญชีและติดตามข้อมูลพิกัดที่คุณช่วยแจ้ง
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 6, md: 4, lg: 5 },
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(360px, 0.82fr) minmax(0, 1.18fr)' },
          }}
        >
          <Box sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
            <SessionCard user={user} role="user" compact />
          </Box>
          <ReportHistorySection />
        </Box>
      </Container>
    </Box>
  );
}
