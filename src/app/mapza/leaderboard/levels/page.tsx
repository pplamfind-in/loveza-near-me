import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { Iconify } from 'src/components/iconify';

import { ExplorerLevelMap } from 'src/sections/explorer/explorer-level-map';

export const metadata: Metadata = createSeoMetadata({
  title: 'เส้นทางนักสำรวจ 100 เลเวล | Loveza Hunt',
  description: 'สำรวจเส้นทาง Loveza Hunt และดูเงื่อนไขเลเวล 1–100',
  path: '/mapza/leaderboard/levels/',
});

export default async function ExplorerLevelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Box
      sx={{
        position: 'relative',
        isolation: 'isolate',
        display: 'flex',
        flexDirection: 'column',
        height: '100svh',
        pt: { xs: 'max(12px, env(safe-area-inset-top))', md: 2 },
        pb: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 2 },
        bgcolor: '#8BC457',
        '--explorer-scene': 'url(/assets/loveza/explorer-level-island.webp)',
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundColor: 'inherit',
          backgroundImage: 'var(--explorer-scene)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        },
        '&:has([data-explorer-region="21"]:not([inert]))': {
          bgcolor: '#A9C985',
          '--explorer-scene': 'url(/assets/loveza/explorer-level-forest.webp)',
        },
        '&:has([data-explorer-region="41"]:not([inert]))': {
          bgcolor: '#D7E8F0',
          '--explorer-scene': 'url(/assets/loveza/explorer-level-snowy.webp)',
        },
        '&:has([data-explorer-region="61"]:not([inert]))': {
          bgcolor: '#B7E0D6',
          '--explorer-scene': 'url(/assets/loveza/explorer-level-waterfall.webp)',
        },
        '&:has([data-explorer-region="81"]:not([inert]))': {
          bgcolor: '#F5D4C9',
          '--explorer-scene': 'url(/assets/loveza/explorer-level-heart.webp)',
        },
      }}
    >
      <ExplorerLevelMap hasAccount={Boolean(user)}>
        <Button
          href="/mapza/leaderboard/?period=all#leaderboard-results"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ bgcolor: '#FFFDF1', color: '#264B36', px: 1.5 }}
        >
          กลับไปอันดับสะสม
        </Button>
      </ExplorerLevelMap>
    </Box>
  );
}
