import type { Metadata } from 'next';

import { z } from 'zod';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { createClient } from 'src/lib/supabase/server';
import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';
import { getFlavorPollOptionDetails } from 'src/lib/flavor-poll-options';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';
import { activityTint, activityTheme, activityButtonSx } from 'src/lib/activity-theme';
import {
  getFlavorPollStatus,
  formatBangkokPollDate,
  flavorPollStatusLabel,
  parseFlavorPollSourceUrl,
} from 'src/lib/flavor-poll-schedule';

import { Iconify } from 'src/components/iconify';

import { MatchingGame } from 'src/sections/home/matching-game';
import { explorerCardSx } from 'src/sections/home/explorer-styles';

import { voteForFlavor } from '../vote-action';

export const metadata: Metadata = { title: 'กิจกรรม | Loveza Hunt' };

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flavorVote?: string; step?: string }>;
}) {
  const [{ id }, { flavorVote, step }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await createClient();
  const now = new Date();
  const { data: poll, error } = await db
    .from('flavor_polls')
    .select(
      'id, activity_type, title, description_html, options, is_active, option_details, starts_at, ends_at, source_url, theme_color'
    )
    .eq('id', id)
    .eq('is_published', true)
    .or(`starts_at.is.null,starts_at.lte.${now.toISOString()}`)
    .maybeSingle();
  if (error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!poll) notFound();

  const matching = poll.activity_type === 'matching';
  const user = matching ? null : (await db.auth.getUser()).data.user;
  const vote = user
    ? await db
        .from('flavor_poll_votes')
        .select('option_label')
        .eq('voter_id', user.id)
        .eq('poll_id', id)
        .maybeSingle()
    : null;
  const chosen = vote?.data?.option_label;

  const pollStatus = getFlavorPollStatus(poll, now.getTime());
  const open = pollStatus === 'active';
  const playing = matching && open && step === 'play';
  const canVote = open && Boolean(user) && !chosen && !vote?.error;
  const href = paths.activity.details(poll.id);
  const source = parseFlavorPollSourceUrl(poll.source_url);
  const activityDescription = sanitizeFlavorPollDescription(poll.description_html);

  const content = (
    <Box
      component="main"
      sx={{
        minHeight: matching ? '100dvh' : '75vh',
        ...activityTheme(poll.theme_color),
        bgcolor: matching ? 'var(--activity-primary)' : 'background.default',
        color: matching ? 'var(--activity-contrast)' : 'text.primary',
        pt: matching
          ? { xs: 'calc(env(safe-area-inset-top) + 16px)', md: 3 }
          : {
              xs: 'calc(var(--layout-header-mobile-height) + 20px)',
              md: 'calc(var(--layout-header-desktop-height) + 24px)',
            },
        pb: { xs: matching ? 'calc(env(safe-area-inset-bottom) + 24px)' : 5, md: 8 },
      }}
    >
      <Container
        maxWidth={matching ? false : 'md'}
        sx={matching ? { px: { xs: 1.5, sm: 3, lg: 5 } } : undefined}
      >
        <Stack spacing={matching ? { xs: 1.5, sm: 2.5 } : 2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Button
              href={playing ? href : '/#flavor-polls'}
              color="inherit"
              startIcon={<Iconify icon="ri:arrow-left-line" />}
              sx={{ alignSelf: 'flex-start', ...(matching && { minHeight: 44 }) }}
            >
              {playing ? 'กลับไปหน้าแนะนำ' : 'กลับไปดูกิจกรรม'}
            </Button>
            {matching && (
              <Box
                component="img"
                src="/logo/logo-email.png"
                alt="Loveza Hunt"
                width={360}
                height={149}
                sx={{ display: 'block', width: { xs: 92, sm: 120 }, height: 'auto', flexShrink: 0 }}
              />
            )}
          </Stack>
          {flavorVote === 'invalid' && (
            <Alert severity="warning">กรุณาเลือกคำตอบที่ต้องการโหวต</Alert>
          )}
          {flavorVote === 'duplicate' && <Alert severity="info">คุณโหวตกิจกรรมนี้แล้ว</Alert>}
          {(flavorVote === 'error' || vote?.error) && (
            <Alert severity="error">ส่งหรือโหลดข้อมูลโหวตไม่สำเร็จ กิจกรรมอาจปิดแล้ว</Alert>
          )}
          <Box
            component="article"
            sx={{
              minWidth: 0,
              ...(!matching && {
                ...explorerCardSx,
                borderRadius: 3,
                border: '5px solid',
                borderColor: 'common.white',
                overflow: 'hidden',
              }),
            }}
          >
            <Box
              sx={{
                p: matching ? 0 : { xs: 2, sm: 4 },
                background: matching
                  ? 'transparent'
                  : `linear-gradient(125deg, ${activityTint}, var(--palette-background-paper))`,
                borderBottom: matching ? 0 : '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                ...(matching && {
                  alignItems: 'center',
                  textAlign: 'center',
                  pt: { xs: 0.5, sm: 1 },
                  maxWidth: 680,
                  mx: 'auto',
                }),
              }}
            >
              {matching && !playing && (
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 1,
                    minHeight: { xs: 'clamp(270px, 86vw, 410px)', sm: 400 },
                    mb: { xs: 2, sm: 2.5 },
                    p: { xs: 1.5, sm: 2 },
                    overflow: 'hidden',
                    border: '4px solid #FFFDF8',
                    borderRadius: { xs: '22px', sm: '28px' },
                    background:
                      'radial-gradient(ellipse at 49% 68%, #FFFFFF45 0%, transparent 67%), linear-gradient(150deg, #0004, #0000)',
                    boxShadow: '0 5px 0 #0003',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/illustrations/p-sung-potion-soda.webp"
                    alt=""
                    width={1143}
                    height={1376}
                    sx={{
                      display: 'block',
                      width: 'auto',
                      height: { xs: 'clamp(226px, 73vw, 350px)', sm: 350 },
                      maxWidth: 1,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 12px #0006)',
                    }}
                  />
                </Box>
              )}
              {!playing && (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent={matching ? 'center' : 'space-between'}
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {!matching && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ color: 'primary.dark' }}
                    >
                      <Box
                        sx={{
                          flexShrink: 0,
                          display: 'grid',
                          placeItems: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 1.25,
                          bgcolor: 'common.white',
                          boxShadow: '0 2px 0 #C2DEC5',
                        }}
                      >
                        <Iconify icon="ri:bar-chart-box-line" width={20} />
                      </Box>
                      <Typography variant="subtitle2">โพลชุมชน</Typography>
                    </Stack>
                  )}
                  <Chip
                    size="small"
                    icon={
                      <Iconify icon={open ? 'ri:flashlight-fill' : 'ri:lock-2-line'} width={14} />
                    }
                    sx={{
                      fontWeight: 800,
                      ...(matching && {
                        color: '#174D76',
                        bgcolor: '#FFFFFFB8',
                        border: '1px solid #2A6390',
                      }),
                    }}
                    color={open ? 'success' : 'default'}
                    label={
                      matching ? (open ? 'เล่นได้' : 'ปิดแล้ว') : flavorPollStatusLabel[pollStatus]
                    }
                  />
                </Stack>
              )}
              <Typography
                component="h1"
                sx={{
                  mt: { xs: matching ? 1 : 1.5, sm: 1.5 },
                  fontSize: playing
                    ? { xs: 23, sm: 30 }
                    : { xs: matching ? 27 : 25, sm: 36, md: 42 },
                  fontWeight: 900,
                  lineHeight: 1.32,
                  overflowWrap: 'anywhere',
                }}
              >
                {poll.title}
              </Typography>
              {matching && open && !playing && (
                <Typography sx={{ mt: 0.75, fontSize: { xs: 14, sm: 16 } }}>
                  เปิดการ์ด หาคู่รสซ่า แล้วลองทำเวลาให้ดีที่สุด
                </Typography>
              )}
              {poll.ends_at && !playing && (
                <Typography
                  variant="body2"
                  color={matching ? 'inherit' : 'text.secondary'}
                  sx={{ mt: 1 }}
                >
                  สิ้นสุด {formatBangkokPollDate(poll.ends_at)} น.
                </Typography>
              )}
              {source && !playing && (
                <Button
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="text"
                  color={matching ? 'inherit' : 'primary'}
                  size="small"
                  endIcon={<Iconify icon="ri:external-link-line" />}
                  sx={{ mt: 1, alignSelf: matching ? 'center' : 'flex-start' }}
                >
                  ดูโพสต์ต้นทาง
                </Button>
              )}
              {matching && open && !playing && (
                <Button
                  href={`${href}?step=play`}
                  variant="contained"
                  size="large"
                  disableElevation
                  endIcon={<Iconify icon="ri:arrow-right-line" />}
                  sx={{
                    mt: 2,
                    width: 1,
                    minHeight: 54,
                    borderRadius: '18px',
                    bgcolor: 'var(--activity-contrast)',
                    color: 'var(--activity-primary)',
                    boxShadow: '0 4px 0 #0003',
                    '&:hover': { bgcolor: 'var(--activity-contrast)', filter: 'brightness(.94)' },
                  }}
                >
                  เล่นเกม
                </Button>
              )}
            </Box>
            <Box
              sx={{
                minWidth: 0,
                px: matching ? 0 : { xs: 2, sm: 3 },
                pb: matching ? 0 : { xs: 2, sm: 3 },
              }}
            >
              {activityDescription && !playing && (
                <Box
                  sx={{
                    mt: 2,
                    typography: 'body2',
                    overflowWrap: 'anywhere',
                    '& p': { my: 1 },
                    '& img': { display: 'block', maxWidth: 1, height: 'auto', borderRadius: 1 },
                    '& pre': { overflowX: 'auto' },
                    '& a': {
                      color: matching ? 'inherit' : 'primary.dark',
                      textDecoration: 'underline',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: activityDescription }}
                />
              )}
              {matching ? (
                playing && (
                  <MatchingGame
                    sharePath={href}
                    title={poll.title}
                    pairs={(poll.options as string[]).map((label) => ({
                      label,
                      ...getFlavorPollOptionDetails(poll.option_details, label),
                    }))}
                  />
                )
              ) : (
                <Stack
                  component="form"
                  action={voteForFlavor.bind(null, poll.id)}
                  spacing={2}
                  sx={{ mt: 2 }}
                >
                  <Box
                    component="fieldset"
                    disabled={!canVote}
                    sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}
                  >
                    <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
                      {canVote ? 'เลือกคำตอบของคุณ' : 'ตัวเลือกในโพล'}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'minmax(0, 1fr)',
                          sm: 'repeat(2, minmax(0, 1fr))',
                        },
                        gap: 1.25,
                      }}
                    >
                      {(poll.options as string[]).map((option) => {
                        const { imageUrl, description } = getFlavorPollOptionDetails(
                          poll.option_details,
                          option
                        );
                        return (
                          <Box
                            key={option}
                            component={canVote ? 'label' : 'div'}
                            sx={{
                              display: 'flex',
                              alignItems: imageUrl || description ? 'flex-start' : 'center',
                              gap: 1,
                              p: 1.25,
                              minHeight: 52,
                              border: '1px solid',
                              borderColor:
                                chosen === option ? 'var(--activity-primary)' : 'divider',
                              borderRadius: 1.5,
                              bgcolor: chosen === option ? activityTint : '#FFFDFA',
                              boxShadow: '0 2px 0 var(--palette-grey-200)',
                              overflowWrap: 'anywhere',
                              ...(canVote && {
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'var(--activity-primary)' },
                                '&:has(input:checked)': {
                                  borderColor: 'var(--activity-primary)',
                                  bgcolor: activityTint,
                                },
                                '&:focus-within': {
                                  outline: '2px solid var(--activity-primary)',
                                  outlineOffset: 2,
                                },
                              }),
                            }}
                          >
                            {canVote ? (
                              <Box
                                component="input"
                                type="radio"
                                name="option"
                                value={option}
                                required
                                sx={{
                                  m: imageUrl || description ? '3px 0 0' : 0,
                                  flexShrink: 0,
                                  accentColor: 'var(--activity-primary)',
                                }}
                              />
                            ) : chosen === option ? (
                              <Iconify
                                icon="ri:check-line"
                                width={18}
                                sx={{ color: 'var(--activity-primary)', flexShrink: 0 }}
                              />
                            ) : null}
                            <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                              {imageUrl && (
                                <Box
                                  component="img"
                                  src={imageUrl}
                                  alt=""
                                  loading="lazy"
                                  sx={{
                                    width: 1,
                                    height: 150,
                                    objectFit: 'contain',
                                    bgcolor: 'background.neutral',
                                    borderRadius: 1,
                                  }}
                                />
                              )}
                              <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
                                {option}
                              </Typography>
                              {description && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ whiteSpace: 'pre-wrap' }}
                                >
                                  {description}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  {chosen ? (
                    <Alert severity="success">คุณโหวต “{chosen}” แล้ว ขอบคุณที่ร่วมสนุก!</Alert>
                  ) : !open ? null : user ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={Boolean(vote?.error)}
                      sx={{ ...activityButtonSx, alignSelf: 'flex-start' }}
                    >
                      ส่งโหวต
                    </Button>
                  ) : (
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                      spacing={1.5}
                      sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        เข้าสู่ระบบเพื่อเลือกคำตอบและส่งโหวต
                      </Typography>
                      <Button
                        href={`/auth/login?next=${encodeURIComponent(href)}`}
                        variant="contained"
                        startIcon={<Iconify icon="ri:login-box-line" />}
                        sx={{ ...activityButtonSx, flexShrink: 0 }}
                      >
                        เข้าสู่ระบบเพื่อโหวต
                      </Button>
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );

  return matching ? content : <LovezaMainLayout>{content}</LovezaMainLayout>;
}
