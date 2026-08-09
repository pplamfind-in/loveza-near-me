import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { SessionCard } from 'src/sections/auth-loveza/session-card';
import { ReportHistorySection } from 'src/sections/account/report-history-section';

export const metadata: Metadata = {
  title: 'บัญชีของฉัน | Loveza Hunt',
  robots: NO_INDEX_ROBOTS,
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: '100px',
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: { xs: 4, md: 5 },
            p: { xs: 3, md: 4.5 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '26px', md: '36px' },
            background: 'linear-gradient(135deg, #7C3AED, #E5007E)',
            boxShadow: '8px 9px 0 #351129',
          }}
        >
          <Typography sx={{ color: '#FDE047', fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}>
            MY LOVEZA SPACE
          </Typography>
          <Typography
            component="h1"
            sx={{ mt: 1, fontSize: { xs: 42, md: 60 }, lineHeight: 1, fontWeight: 1000 }}
          >
            โปรไฟล์สายซ่า ✦
          </Typography>
          <Typography sx={{ mt: 1.5, color: '#FFF0F8', fontSize: 17 }}>
            ดูโปรไฟล์และภารกิจปักหมุด Loveza ของคุณ
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 6, md: 4, lg: 5 },
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(200px, 0.82fr) minmax(0, 1.8fr)' },
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
