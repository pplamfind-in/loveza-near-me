import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import { createClient } from 'src/lib/supabase/server';

import { SessionCard } from 'src/sections/auth-loveza/session-card';

export const metadata: Metadata = { title: 'บัญชีของฉัน | Loveza Near Me' };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/user');

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f3fbfa', py: { xs: 10, md: 14 } }}>
      <Container>
        <SessionCard user={user} role="user" />
      </Container>
    </Box>
  );
}
