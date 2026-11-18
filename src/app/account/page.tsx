import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { getAccountAvatars } from 'src/lib/account-avatars';

import { SessionCard } from 'src/sections/auth-loveza/session-card';
import { FlavorCollection } from 'src/sections/explorer/flavor-collection';
import { ExplorerProgressPanel } from 'src/sections/explorer/explorer-progress';
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

  const [avatarOptions, productsResult] = await Promise.all([
    getAccountAvatars(),
    supabase
      .from('products')
      .select('id, slug, thai_name, name, image_url, fruit')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id'),
  ]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: '100px',
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
            src="/assets/icons/loveza/voxel-store.svg"
            alt=""
            sx={{ width: 56, height: 56, mb: 2 }}
          />
          <Typography
            sx={{ color: 'primary.dark', fontSize: 11, fontWeight: 800, letterSpacing: 2 }}
          >
            MY EXPLORER SPACE
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
            พื้นที่ของนักล่า Loveza
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
            จัดการโปรไฟล์ ติดตามพิกัดที่คุณแจ้ง และร่วมเติมแผนที่ไปด้วยกัน
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3, md: 3 },
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 0.72fr) minmax(0, 1.8fr)' },
          }}
        >
          <Box sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
            <SessionCard user={user} role="user" compact avatarOptions={avatarOptions} />
          </Box>
          <Box sx={{ minWidth: 0, display: 'grid', gap: 3 }}>
            <ExplorerProgressPanel />
            <FlavorCollection
              products={productsResult.data ?? []}
              userId={user.id}
              unavailable={Boolean(productsResult.error)}
            />
            <ReportHistorySection />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
