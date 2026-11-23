import type { createClient } from 'src/lib/supabase/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { activityTint, activityTheme } from 'src/lib/activity-theme';
import { getFlavorPollStatus, flavorPollStatusLabel } from 'src/lib/flavor-poll-schedule';

import { Iconify } from 'src/components/iconify';

import { explorerCardSx, landingCardRadius } from './explorer-styles';

export async function FlavorPollsSection({ db }: { db: Awaited<ReturnType<typeof createClient>> }) {
  const now = new Date();
  const query = db
    .from('flavor_polls')
    .select(
      'id, slug, activity_type, title, is_published, is_active, starts_at, ends_at, theme_color'
    )
    .order('created_at', { ascending: false });
  const visible = `and(is_published.eq.true,is_active.eq.true,or(starts_at.is.null,starts_at.lte.${now.toISOString()}))`;
  const { data: activities } = await (process.env.NODE_ENV === 'development'
    ? query
    : query.or(visible));
  if (!activities?.length) return null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        component="section"
        id="flavor-polls"
        aria-label="กิจกรรม Loveza Hunt"
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: activities.length > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
          },
        }}
      >
        {activities.map((activity) => {
          const matching = activity.activity_type === 'matching';
          const status = getFlavorPollStatus(activity, now.getTime());
          const draft = !activity.is_published;
          const open = !draft && status === 'active';
          const preview = process.env.NODE_ENV === 'development' && !open;
          return (
            <Stack
              component="a"
              key={activity.id}
              id={`${matching ? 'game' : 'poll'}-${activity.id}`}
              href={paths.activity.details(activity.slug ?? activity.id)}
              spacing={2}
              sx={{
                ...explorerCardSx,
                p: { xs: 2, sm: 3 },
                minWidth: 0,
                border: '5px solid',
                borderColor: 'common.white',
                borderRadius: landingCardRadius,
                textDecoration: 'none',
                color: 'text.primary',
                ...activityTheme(activity.theme_color),
                background: `linear-gradient(115deg, ${activityTint}, var(--palette-background-paper))`,
                transition: 'box-shadow 160ms ease',
                '&:hover': {
                  boxShadow: '0 5px 0 var(--palette-grey-300), 0 12px 28px rgba(48,63,35,.10)',
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ color: 'text.primary' }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 1.25,
                      bgcolor: 'common.white',
                    }}
                  >
                    <Iconify
                      icon={matching ? 'ri:gamepad-line' : 'ri:bar-chart-box-line'}
                      width={20}
                    />
                  </Box>
                  <Typography variant="subtitle2">{matching ? 'เกมจับคู่' : 'โพลชุมชน'}</Typography>
                </Stack>
                <Chip
                  size="small"
                  color={open ? 'success' : 'default'}
                  label={
                    preview
                      ? 'ตัวอย่างกิจกรรม'
                      : matching && open
                        ? 'เล่นได้'
                        : flavorPollStatusLabel[status]
                  }
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: 21, sm: 25 },
                  fontWeight: 900,
                  overflowWrap: 'anywhere',
                  flex: 1,
                }}
              >
                {activity.title}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ color: 'primary.dark' }}
              >
                <Typography variant="subtitle2">
                  {open ? (matching ? 'เล่นเกม' : 'ร่วมโหวต') : 'ดูกิจกรรม'}
                </Typography>
                <Iconify icon="ri:arrow-right-line" width={18} />
              </Stack>
            </Stack>
          );
        })}
      </Box>
    </Container>
  );
}
