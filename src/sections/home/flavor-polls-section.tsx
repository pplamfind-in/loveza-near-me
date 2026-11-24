import type { createClient } from 'src/lib/supabase/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { getFlavorPollStatus, flavorPollStatusLabel } from 'src/lib/flavor-poll-schedule';
import {
  activityTint,
  activityTheme,
  activityButtonSx,
  activityColorPattern,
} from 'src/lib/activity-theme';

import { Iconify } from 'src/components/iconify';

import { explorerCardSx, landingCardRadius } from './explorer-styles';

export async function FlavorPollsSection({ db }: { db: Awaited<ReturnType<typeof createClient>> }) {
  const now = new Date();
  const query = db
    .from('flavor_polls')
    .select(
      'id, slug, activity_type, title, is_published, is_active, starts_at, ends_at, theme_color, theme_text_color'
    )
    .order('created_at', { ascending: false });
  const visible = `and(is_published.eq.true,is_active.eq.true,or(starts_at.is.null,starts_at.lte.${now.toISOString()}))`;
  const { data: activities } = await (process.env.NODE_ENV === 'development'
    ? query
    : query.or(visible));
  if (!activities?.length) return null;

  return (
    <Container
      component="section"
      id="flavor-polls"
      aria-labelledby="home-activities-title"
      maxWidth="lg"
      sx={{ py: { xs: 4, md: 6 } }}
    >
      <Typography
        id="home-activities-title"
        component="h2"
        sx={{
          mb: { xs: 2, md: 3 },
          fontSize: { xs: 28, md: 40 },
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        ร่วมเล่นกิจกรรม
      </Typography>
      <Box
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
          const photoActivity = activity.activity_type === 'photo';
          const krathong = activity.activity_type === 'krathong';
          const status = getFlavorPollStatus(activity, now.getTime());
          const draft = !activity.is_published;
          const open = !draft && status === 'active';
          const preview = process.env.NODE_ENV === 'development' && !open;
          const href = paths.activity.details(activity.slug ?? activity.id);
          const showResults = activity.activity_type === 'poll' && !draft && status !== 'upcoming';
          const showGallery = photoActivity && !draft && status !== 'upcoming';
          return (
            <Stack
              component="article"
              key={activity.id}
              id={`${matching ? 'game' : 'poll'}-${activity.id}`}
              spacing={2}
              sx={{
                ...explorerCardSx,
                p: { xs: 2, sm: 3.25 },
                minWidth: 0,
                position: 'relative',
                border: '5px solid',
                borderColor: 'common.white',
                borderRadius: landingCardRadius,
                textDecoration: 'none',
                color: 'text.primary',
                ...activityTheme(activity.theme_color),
                background: `radial-gradient(ellipse at 0% 0%, ${activityTint}, transparent 78%), var(--palette-background-paper)`,
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
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: 1.5,
                      bgcolor: 'common.white',
                      color: matching ? 'common.black' : 'var(--activity-primary)',
                    }}
                  >
                    <Iconify
                      icon={
                        matching
                          ? 'ri:gamepad-line'
                          : photoActivity
                            ? 'ri:camera-line'
                            : krathong
                              ? 'ri:moon-line'
                              : 'ri:bar-chart-box-line'
                      }
                      width={23}
                    />
                  </Box>
                  <Typography variant="subtitle2">
                    {matching
                      ? 'เกมจับคู่'
                      : photoActivity
                        ? 'กิจกรรมส่งภาพถ่าย'
                        : krathong
                          ? 'ลอยกระทง'
                          : 'โพลชุมชน'}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  color={open ? 'success' : 'default'}
                  icon={
                    open ? (
                      <Iconify
                        icon={
                          photoActivity
                            ? 'ri:camera-line'
                            : matching
                              ? 'ri:gamepad-line'
                              : 'ri:flashlight-fill'
                        }
                        width={13}
                      />
                    ) : undefined
                  }
                  label={
                    preview
                      ? 'ตัวอย่างกิจกรรม'
                      : matching && open
                        ? 'เล่นได้'
                        : photoActivity && open
                          ? 'เปิดรับภาพ'
                          : krathong && open
                            ? 'เปิดให้ลอยกระทง'
                            : krathong && status === 'closed'
                              ? 'ปิดกิจกรรม'
                              : flavorPollStatusLabel[status]
                  }
                  sx={{
                    height: 27,
                    borderRadius: '999px',
                    fontWeight: 800,
                    border: '1px solid',
                    borderColor: open ? 'success.light' : 'divider',
                    bgcolor: open ? 'success.lighter' : 'background.paper',
                    color: open ? 'success.dark' : 'text.secondary',
                    '& .MuiChip-label': { px: 1.05 },
                    '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
                  }}
                />
              </Stack>
              <Typography
                component="h3"
                sx={{
                  fontSize: { xs: 22, sm: 28 },
                  fontWeight: 900,
                  lineHeight: 1.27,
                  overflowWrap: 'anywhere',
                  flex: 1,
                }}
              >
                {activity.title}
              </Typography>
              <Stack direction="row" alignItems="center" useFlexGap flexWrap="wrap" gap={1.5}>
                <Button
                  href={href}
                  color="inherit"
                  aria-label={`${open ? 'ร่วมกิจกรรม' : 'ดูกิจกรรม'} ${activity.title}`}
                  endIcon={<Iconify icon="ri:arrow-right-line" width={18} />}
                  sx={{
                    ...activityButtonSx,
                    color:
                      activity.theme_text_color &&
                      activityColorPattern.test(activity.theme_text_color)
                        ? activity.theme_text_color
                        : 'var(--activity-contrast)',
                    position: 'static',
                    minHeight: 44,
                    px: 2,
                    fontWeight: 800,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                    },
                    '&.Mui-focusVisible::after': {
                      outline: '2px solid var(--activity-primary)',
                      outlineOffset: 3,
                    },
                  }}
                >
                  {open
                    ? matching
                      ? 'เล่นเกม'
                      : photoActivity
                        ? 'ส่งภาพ'
                        : krathong
                          ? 'ลอยกระทง'
                          : 'ร่วมโหวต'
                    : 'ดูกิจกรรม'}
                </Button>
                {showGallery && (
                  <Typography
                    component="a"
                    href={`${href}gallery/`}
                    aria-label={`ดูภาพกิจกรรม ${activity.title}`}
                    variant="subtitle2"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: 'primary.dark',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    ดูภาพกิจกรรม
                  </Typography>
                )}
                {showResults && (
                  <Typography
                    component="a"
                    href={`${href}?results=1`}
                    aria-label={`ดูผลโหวต ${activity.title}`}
                    variant="subtitle2"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: 'primary.dark',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    ดูผลโหวต
                  </Typography>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Box>
    </Container>
  );
}
