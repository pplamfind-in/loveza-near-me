import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import { createClient } from 'src/lib/supabase/server';

import { SessionCard } from 'src/sections/auth-loveza/session-card';

export const metadata: Metadata = { title: 'Admin Dashboard | Loveza Near Me' };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== 'admin') redirect('/auth/admin');

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f7f3fb', py: { xs: 10, md: 14 } }}>
      <Container>
        <SessionCard user={user} role="admin" />
      </Container>
    </Box>
  );
}
