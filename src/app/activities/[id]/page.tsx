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

import { isActivitySlug } from 'src/lib/activity-slug';
import { createClient } from 'src/lib/supabase/server';
import { getGuestVoterId } from 'src/lib/flavor-poll-guest';
import { getFlavorPollOptionDetails } from 'src/lib/flavor-poll-options';
import { activityTheme, activityColorPattern } from 'src/lib/activity-theme';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';
import {
  getFlavorPollStatus,
  formatBangkokPollDate,
  flavorPollStatusLabel,
  parseFlavorPollSourceUrl,
} from 'src/lib/flavor-poll-schedule';

import { Iconify } from 'src/components/iconify';

import { MatchingGame } from 'src/sections/home/matching-game';
import { FlavorPollShare } from 'src/sections/home/flavor-poll-share';
import { FlavorPollPicker } from 'src/sections/home/flavor-poll-picker';
import { FlavorPollSubmit } from 'src/sections/home/flavor-poll-submit';
import { ActivityPhotoForm } from 'src/sections/home/activity-photo-form';

import { voteForFlavor, previewFlavorVote } from '../vote-action';

export const metadata: Metadata = { title: 'กิจกรรม | Loveza Hunt' };

const pollBubbles = [
  { top: '18%', left: '-5%', width: 'clamp(76px, 16vw, 250px)' },
  { top: '28%', right: '4%', width: 'clamp(35px, 7vw, 104px)' },
  { top: '45%', left: '16%', width: 'clamp(30px, 6vw, 90px)' },
  { top: '52%', right: '-4%', width: 'clamp(80px, 17vw, 260px)' },
  { top: '72%', left: '4%', width: 'clamp(50px, 10vw, 145px)' },
  { top: '79%', right: '16%', width: 'clamp(26px, 5vw, 72px)' },
];

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    flavorVote?: string;
    step?: string;
    preview?: string;
    previewVote?: string;
    results?: string;
  }>;
}) {
  const [{ id }, { flavorVote, step, preview: previewParam, previewVote, results }] =
    await Promise.all([params, searchParams]);
  const lookupColumn = z.uuid().safeParse(id).success ? 'id' : 'slug';
  if (lookupColumn === 'slug' && !isActivitySlug(id)) notFound();

  const adminPreview = previewParam === '1';
  const db = await createClient();
  const now = new Date();
  const columns =
    'id, slug, activity_type, title, description_html, options, is_published, is_active, option_details, starts_at, ends_at, source_url, theme_color';
  const query = db
    .from('flavor_polls')
    .select(`${columns}, theme_text_color, background_image_url, right_background_image_url`)
    .eq(lookupColumn, id);
  const visible = `and(is_published.eq.true,or(starts_at.is.null,starts_at.lte.${now.toISOString()}))`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [result, adminSession] = await Promise.all([
    (isDevelopment || adminPreview ? query : query.or(visible)).maybeSingle(),
    adminPreview ? db.auth.getUser() : null,
  ]);
  if (adminPreview && adminSession?.data.user?.app_metadata.role !== 'admin') notFound();
  const { data: poll, error } =
    isDevelopment && result.error?.code === '42703'
      ? await db.from('flavor_polls').select(columns).eq(lookupColumn, id).maybeSingle()
      : result;
  if (error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!poll) notFound();

  const backgroundImage =
    'background_image_url' in poll && typeof poll.background_image_url === 'string'
      ? poll.background_image_url
      : null;
  const rightBackgroundImage =
    'right_background_image_url' in poll && typeof poll.right_background_image_url === 'string'
      ? poll.right_background_image_url
      : null;
  const sideImages = [
    { side: 'left', src: backgroundImage || rightBackgroundImage },
    { side: 'right', src: rightBackgroundImage || backgroundImage },
  ] as const;
  const hasSideImages = Boolean(backgroundImage || rightBackgroundImage);
  const textColor = 'theme_text_color' in poll ? poll.theme_text_color : null;
  const activityTextColor =
    typeof textColor === 'string' && activityColorPattern.test(textColor)
      ? textColor
      : 'var(--activity-contrast)';
  const matching = poll.activity_type === 'matching';
  const photoActivity = poll.activity_type === 'photo';
  const pollStatus = getFlavorPollStatus(poll, now.getTime());
  const preview =
    adminPreview || (isDevelopment && (!poll.is_published || pollStatus !== 'active'));
  const communityPoll = !matching && !photoActivity;
  const showResults = results === '1';
  if (
    showResults &&
    (!communityPoll ||
      !poll.is_published ||
      (poll.starts_at && Date.parse(poll.starts_at) > now.getTime()))
  ) {
    notFound();
  }
  const pollResults = showResults
    ? await db.rpc('get_public_flavor_poll_results', { target_poll_id: poll.id })
    : null;
  const resultRows = (
    (pollResults?.data ?? []) as { option_label: string; vote_count: number }[]
  ).toSorted((a, b) => Number(b.vote_count) - Number(a.vote_count));
  const totalVotes = resultRows.reduce((sum, option) => sum + Number(option.vote_count), 0);
  const podium = resultRows.filter((option) => Number(option.vote_count) > 0).slice(0, 3);
  const [user, guestId] = await Promise.all([
    matching || preview || showResults ? null : db.auth.getUser().then(({ data }) => data.user),
    communityPoll && !preview && !showResults ? getGuestVoterId() : null,
  ]);
  const [vote, guestVote] = await Promise.all([
    user && communityPoll
      ? db
          .from('flavor_poll_votes')
          .select('option_label')
          .eq('voter_id', user.id)
          .eq('poll_id', poll.id)
          .maybeSingle()
      : null,
    guestId
      ? db
          .rpc('get_guest_flavor_vote', { target_poll_id: poll.id, browser_id: guestId })
          .maybeSingle<{ option_label: string }>()
      : null,
  ]);
  const voteError = vote?.error || guestVote?.error;
  const simulatedVote =
    adminPreview && !photoActivity && poll.options.includes(previewVote) ? previewVote : undefined;
  const chosen = simulatedVote ?? vote?.data?.option_label ?? guestVote?.data?.option_label;
  const chosenImage = chosen
    ? getFlavorPollOptionDetails(poll.option_details, chosen).imageUrl
    : null;

  const open = preview ? matching : pollStatus === 'active';
  const playing = matching && open && step === 'play';
  const canVote = !chosen && (adminPreview || (open && !voteError));
  const href = paths.activity.details(poll.slug ?? poll.id);
  const previewHref = adminPreview ? `${href}?preview=1` : href;
  const backHref = adminPreview
    ? `/admin/flavor-polls/${encodeURIComponent(poll.id)}/edit/`
    : '/#flavor-polls';
  const source = parseFlavorPollSourceUrl(poll.source_url);
  const activityDescription = sanitizeFlavorPollDescription(poll.description_html);

  const sourceLink =
    source && !playing ? (
      <Button
        href={source}
        target="_blank"
        rel="noopener noreferrer"
        variant="text"
        color="inherit"
        size="small"
        endIcon={<Iconify icon="ri:external-link-line" />}
        sx={{ alignSelf: 'center', minHeight: 44 }}
      >
        ดูโพสต์ต้นทาง
      </Button>
    ) : null;

  return (
    <Box
      component="main"
      data-activity-page
      sx={{
        minHeight: '100dvh',
        ...activityTheme(poll.theme_color),
        bgcolor: 'var(--activity-primary)',
        color: activityTextColor,
        pt: { xs: 'calc(env(safe-area-inset-top) + 16px)', md: 3 },
        pb: matching
          ? { xs: 'calc(env(safe-area-inset-bottom) + 24px)', md: 8 }
          : 'calc(env(safe-area-inset-bottom) + 8px)',
        ...(!matching && { display: 'flex', flexDirection: 'column' }),
        ...((!matching || hasSideImages) && { position: 'relative', isolation: 'isolate' }),
      }}
    >
      {(!matching || hasSideImages) && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {hasSideImages
            ? sideImages.map(({ side, src }) => (
                <Box
                  key={side}
                  component="img"
                  src={src ?? undefined}
                  alt=""
                  decoding="async"
                  sx={{
                    position: 'absolute',
                    top:
                      side === 'left' ? { xs: '7dvh', md: '4dvh' } : { xs: '49dvh', md: '37dvh' },
                    [side]: { xs: '-28%', md: '-12%' },
                    width: {
                      xs: side === 'right' ? 'min(80%, 460px)' : 'min(66%, 380px)',
                      md: 'min(48%, 850px)',
                    },
                    height: {
                      xs: side === 'right' ? 'min(58dvh, 460px)' : 'min(48dvh, 380px)',
                      md: 'min(80dvh, 820px)',
                    },
                    objectFit: 'contain',
                    opacity: { xs: 0.24, md: 0.38 },
                    transform: side === 'left' ? 'rotate(-8deg)' : 'rotate(8deg)',
                  }}
                />
              ))
            : pollBubbles.map((bubble) => (
                <Box
                  key={bubble.top}
                  sx={{
                    ...bubble,
                    position: 'absolute',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    opacity: { xs: 0.22, md: 0.32 },
                    background:
                      'radial-gradient(ellipse at 30% 23%, #FFFFFF 0%, #FFFFFF80 8%, transparent 22%), radial-gradient(circle at 70% 74%, #FFE8AC 0%, transparent 42%), radial-gradient(circle at 42% 45%, #F9DCF3 0%, #FF9DD5 61%, #DF348A 82%, #FFD0E5 100%)',
                    boxShadow: 'inset 0 0 0 1px #FFFFFFC0, 0 8px 22px #801B5340',
                  }}
                />
              ))}
        </Box>
      )}
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1.5, sm: 3, lg: 5 }, ...(!matching && { display: 'flex', flex: 1 }) }}
      >
        <Stack spacing={matching ? { xs: 1.5, sm: 2.5 } : 2.5} sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Button
              href={playing ? previewHref : backHref}
              color="inherit"
              startIcon={<Iconify icon="ri:arrow-left-line" />}
              sx={{ alignSelf: 'flex-start', minHeight: 44 }}
            >
              {playing ? 'กลับไปหน้าแนะนำ' : adminPreview ? 'กลับไปหน้าแก้ไข' : 'กลับไปดูกิจกรรม'}
            </Button>
            <Box
              component="img"
              src="/logo/logo-email.png"
              alt="Loveza Hunt"
              width={360}
              height={149}
              sx={{ display: 'block', width: { xs: 92, sm: 120 }, height: 'auto', flexShrink: 0 }}
            />
          </Stack>
          {flavorVote === 'invalid' && (
            <Alert severity="warning">กรุณาเลือกคำตอบที่ต้องการโหวต</Alert>
          )}
          {!chosen && flavorVote === 'duplicate' && (
            <Alert severity="info">คุณโหวตกิจกรรมนี้แล้ว</Alert>
          )}
          {(flavorVote === 'error' || voteError) && (
            <Alert severity="error">ส่งหรือโหลดข้อมูลโหวตไม่สำเร็จ กิจกรรมอาจปิดแล้ว</Alert>
          )}
          {showResults ? (
            <Stack
              component="section"
              spacing={2}
              useFlexGap
              sx={{ width: 1, maxWidth: 640, flex: 1, mx: 'auto', pt: 2 }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography component="h1" variant="h3">
                  ผลโหวตชุมชน
                </Typography>
                <Typography sx={{ mt: 1 }}>{poll.title}</Typography>
              </Box>
              {pollResults?.error ? (
                <Alert severity="error">โหลดผลโหวตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
              ) : (
                <>
                  {podium.length > 0 && (
                    <Box
                      component="section"
                      aria-label="โพเดียมผลโหวต"
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        alignItems: 'end',
                        gap: { xs: 0.75, sm: 1.5 },
                        textAlign: 'center',
                      }}
                    >
                      {[1, 0, 2].map((place, column) => {
                        const entry = podium[place];
                        if (!entry) return null;
                        const count = Number(entry.vote_count);
                        const rank =
                          resultRows.findIndex((row) => Number(row.vote_count) === count) + 1;
                        const { imageUrl } = getFlavorPollOptionDetails(
                          poll.option_details,
                          entry.option_label
                        );
                        const middle = place === 0;
                        const podiumColor = ['#FFC82C', '#A7BFFB', '#FFA87C'][place];

                        return (
                          <Stack
                            key={entry.option_label}
                            spacing={0.5}
                            sx={{ gridColumn: column + 1, minWidth: 0 }}
                          >
                            <Box
                              component="img"
                              src={imageUrl || '/assets/loveza/loveza-heart.webp'}
                              alt=""
                              sx={{
                                alignSelf: 'center',
                                width: { xs: middle ? 92 : 66, sm: middle ? 118 : 84 },
                                height: { xs: middle ? 160 : 114, sm: middle ? 195 : 145 },
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 5px 8px #0003)',
                              }}
                            />
                            <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                              {entry.option_label}
                            </Typography>
                            <Typography variant="caption">
                              {count.toLocaleString('th-TH')} โหวต ·{' '}
                              {((count * 100) / totalVotes).toLocaleString('th-TH', {
                                maximumFractionDigits: 1,
                              })}
                              %
                            </Typography>
                            <Box
                              aria-label={`อันดับ ${rank}`}
                              sx={{
                                minHeight: {
                                  xs: middle ? 62 : place === 1 ? 48 : 36,
                                  sm: middle ? 84 : place === 1 ? 64 : 48,
                                },
                                display: 'grid',
                                placeItems: 'center',
                                borderRadius: '14px 14px 0 0',
                                borderTop: '2px solid #FFFFFFA6',
                                background: `linear-gradient(180deg, ${podiumColor} 0%, ${podiumColor}E8 40%, ${podiumColor}00 100%)`,
                                color: '#251D26',
                                fontSize: { xs: 28, sm: 40 },
                                fontWeight: 900,
                              }}
                            >
                              {rank}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Box>
                  )}
                  <Stack
                    spacing={0.5}
                    sx={{
                      mt: 'auto',
                      p: { xs: 1.25, sm: 2 },
                      borderRadius: '20px',
                      overflow: 'hidden',
                      bgcolor: 'common.white',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.primary',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                      sx={{ px: 1.25, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <Typography variant="subtitle2">โหวตทั้งหมด</Typography>
                      <Stack direction="row" alignItems="baseline" spacing={0.75}>
                        <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {totalVotes.toLocaleString('th-TH')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          คะแนน
                        </Typography>
                      </Stack>
                    </Stack>
                    {resultRows.slice(podium.length).map(({ option_label, vote_count }, index) => {
                      const count = Number(vote_count);
                      const percent = totalVotes ? (count * 100) / totalVotes : 0;
                      const rank =
                        resultRows.findIndex((row) => Number(row.vote_count) === count) + 1;
                      const { imageUrl } = getFlavorPollOptionDetails(
                        poll.option_details,
                        option_label
                      );
                      return (
                        <Stack
                          key={option_label}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{
                            px: 1,
                            py: 0.5,
                            minHeight: 45,
                            borderTop: index ? '1px solid' : undefined,
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="caption"
                            aria-label={count > 0 ? `อันดับ ${rank}` : 'ยังไม่มีคะแนน'}
                            sx={{
                              width: 16,
                              flexShrink: 0,
                              textAlign: 'center',
                              color: 'text.secondary',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {count > 0 ? rank : '–'}
                          </Typography>
                          {imageUrl && (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt=""
                              loading="lazy"
                              sx={{ width: 28, height: 36, objectFit: 'contain', flexShrink: 0 }}
                            />
                          )}
                          <Typography
                            variant="subtitle2"
                            sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}
                          >
                            {option_label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {count.toLocaleString('th-TH')} โหวต
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              minWidth: '4ch',
                              textAlign: 'right',
                              flexShrink: 0,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {percent.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                gap={1.5}
                sx={{ mt: pollResults?.error ? 'auto' : 0 }}
              >
                <Button
                  href={href}
                  variant="contained"
                  sx={{
                    alignSelf: 'center',
                    minHeight: 48,
                    bgcolor: 'common.white',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'common.white' },
                  }}
                >
                  กลับหน้าโหวต
                </Button>
                {sourceLink}
              </Stack>
            </Stack>
          ) : chosen ? (
            <Stack
              component="section"
              aria-labelledby="vote-success-title"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ flex: 1, width: 1, maxWidth: 580, mx: 'auto', py: 3, textAlign: 'center' }}
            >
              <Typography
                id="vote-success-title"
                component="h1"
                sx={{ fontSize: { xs: 34, sm: 48 }, fontWeight: 900 }}
              >
                โหวตสำเร็จ!
              </Typography>
              <Typography>ขอบคุณที่ร่วมสนุกกับ Loveza Hunt</Typography>
              <Box
                component="img"
                src={chosenImage || '/assets/loveza/loveza-heart.webp'}
                alt=""
                sx={{
                  width: chosenImage ? 'min(85%, 360px)' : 100,
                  height: chosenImage ? 'clamp(205px, 40dvh, 410px)' : 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 18px #0003)',
                  transform: chosenImage ? 'rotate(-8deg)' : undefined,
                }}
              />
              <Box>
                <Typography variant="body2">รสที่คุณเลือก</Typography>
                <Typography component="p" sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 900 }}>
                  {chosen}
                </Typography>
              </Box>
              <FlavorPollShare
                key={chosen}
                flavor={chosen}
                imageUrl={chosenImage}
                secondaryAction={
                  <Button
                    href={simulatedVote ? previewHref : '/#flavor-polls'}
                    variant="contained"
                    sx={{
                      minHeight: 48,
                      width: 'fit-content',
                      px: { xs: 1.5, sm: 3 },
                      borderRadius: '14px',
                      bgcolor: 'common.white',
                      color: 'var(--activity-primary)',
                      '&:hover': { bgcolor: 'common.white', filter: 'brightness(.96)' },
                    }}
                  >
                    {simulatedVote ? 'โหวตอีกครั้ง' : 'กลับไปดูกิจกรรม'}
                  </Button>
                }
              />
            </Stack>
          ) : (
            <Stack
              component="article"
              spacing={matching ? 0 : 1}
              sx={{ minWidth: 0, flex: matching ? undefined : 1 }}
            >
              <Box
                sx={{
                  pt: matching ? 0 : { xs: 1, sm: 2 },
                  ...(!matching && {
                    alignItems: 'center',
                    textAlign: 'center',
                  }),
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
                    justifyContent="center"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    {!matching && (
                      <Typography
                        variant="subtitle2"
                        sx={
                          photoActivity
                            ? {
                                px: 2,
                                py: 0.5,
                                borderRadius: '999px',
                                border: '1px solid var(--activity-primary)',
                                bgcolor: 'common.white',
                                color: 'var(--activity-primary)',
                              }
                            : undefined
                        }
                      >
                        {photoActivity ? 'กิจกรรมส่งภาพถ่าย' : 'โพลชุมชน'}
                      </Typography>
                    )}
                    
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
                    ...(!matching && {
                      fontSize: { xs: 'clamp(30px, 8vw, 40px)', sm: 36, md: 42 },
                      maxWidth: '27ch',
                      textWrap: 'balance',
                    }),
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
                  <Typography variant="body2" color="inherit" sx={{ mt: 1 }}>
                    สิ้นสุด {formatBangkokPollDate(poll.ends_at)} น.
                  </Typography>
                )}
                {matching && open && !playing && (
                  <Button
                    href={`${previewHref}${adminPreview ? '&' : '?'}step=play`}
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
                  ...(!matching && { display: 'flex', flexDirection: 'column', flex: 1 }),
                }}
              >
                {activityDescription && !playing && (
                  <Box
                    sx={{
                      mt: matching ? 2 : 0,
                      typography: 'body2',
                      overflowWrap: 'anywhere',
                      ...(!matching && {
                        maxWidth: 580,
                        mx: 'auto',
                        textAlign: 'center',
                        fontSize: { xs: 16, sm: 18 },
                      }),
                      '& p': { my: 1 },
                      ...(!matching && { '& > :first-child': { mt: 0 } }),
                      '& img': {
                        display: 'block',
                        maxWidth: 1,
                        height: 'auto',
                        borderRadius: 1,
                        mx: matching ? 0 : 'auto',
                      },
                      '& pre': { overflowX: 'auto' },
                      '& a': {
                        color: 'inherit',
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
                ) : photoActivity ? (
                  <Box sx={{ width: 1, maxWidth: 580, mx: 'auto', py: 2 }}>
                    {preview || (open && user) ? (
                      <ActivityPhotoForm
                        activityId={poll.id}
                        title={poll.title}
                        preview={preview}
                      />
                    ) : open ? (
                      <Button
                        href={`/auth/login?next=${encodeURIComponent(href)}`}
                        variant="contained"
                        startIcon={<Iconify icon="ri:login-box-line" />}
                        sx={{
                          display: 'flex',
                          mx: 'auto',
                          width: 'fit-content',
                          minHeight: 48,
                          bgcolor: 'common.white',
                          color: 'var(--activity-primary)',
                          '&:hover': { bgcolor: 'common.white' },
                        }}
                      >
                        เข้าสู่ระบบเพื่อส่งภาพ
                      </Button>
                    ) : (
                      <Typography align="center">กิจกรรมนี้ปิดรับภาพแล้ว</Typography>
                    )}
                  </Box>
                ) : (
                  <Stack
                    component="form"
                    action={(preview ? previewFlavorVote : voteForFlavor).bind(
                      null,
                      poll.id,
                      poll.slug
                    )}
                    spacing={2}
                    sx={{
                      mt: activityDescription ? 2 : 0,
                      maxWidth: 580,
                      width: 1,
                      mx: 'auto',
                      flex: 1,
                    }}
                  >
                    <FlavorPollPicker
                      options={(poll.options as string[]).map((label) => ({
                        label,
                        ...getFlavorPollOptionDetails(poll.option_details, label),
                      }))}
                      canVote={canVote}
                    />
                    {(preview || open) && <FlavorPollSubmit disabled={!canVote} />}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
          {!showResults && sourceLink}
        </Stack>
      </Container>
    </Box>
  );
}
