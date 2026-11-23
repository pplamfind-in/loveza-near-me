'use client';

import type { FocusEvent } from 'react';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Pair = { label: string; imageUrl: string; description: string };
type Card = { id: number; pair: Pair };

function shuffleCards(cards: Card[]) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function readPlayClock() {
  return performance.now();
}

function formatPlayTime(seconds: number) {
  return [Math.floor(seconds / 60), seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function MatchingGame({
  pairs,
  sharePath,
  title,
}: {
  pairs: Pair[];
  sharePath: string;
  title: string;
}) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [clockStartedAt, setClockStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [manualShareUrl, setManualShareUrl] = useState('');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const complete = deck.length > 0 && matched.length * 2 === deck.length;
  const boardSlots = pairs.flatMap((pair, index) => [
    { id: index * 2, pair },
    { id: index * 2 + 1, pair },
  ]);
  const hasCenterLogo = boardSlots.length === 8;

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  useEffect(() => {
    if (clockStartedAt === null) return undefined;
    const timer = window.setInterval(
      () => setElapsedSeconds(Math.floor((readPlayClock() - clockStartedAt) / 1000)),
      200
    );
    return () => window.clearInterval(timer);
  }, [clockStartedAt]);

  async function shareGame(useShareSheet: boolean) {
    const url = new URL(sharePath, window.location.origin);
    setShareNotice('');
    setManualShareUrl('');

    if (useShareSheet && navigator.share) {
      try {
        await navigator.share({
          title,
          text: complete
            ? `ฉันจับคู่ครบ ${pairs.length} คู่ใน ${attempts} ครั้ง มาลองเล่นด้วยกัน!`
            : 'มาลองเล่นเกมจับคู่กับ Loveza Hunt ด้วยกัน!',
          url: url.href,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url.href);
      setShareNotice('คัดลอกลิงก์แล้ว นำไปวางในแชตหรือสติกเกอร์ลิงก์บน Instagram Story ได้');
    } catch {
      setManualShareUrl(url.href);
    }
  }

  function start(revealIndex?: number) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    const shuffled = shuffleCards(boardSlots);
    setDeck(shuffled);
    const firstCard = revealIndex === undefined ? undefined : shuffled[revealIndex];
    setRevealed(firstCard ? [firstCard.id] : []);
    setMatched([]);
    setAttempts(0);
    setElapsedSeconds(0);
    setClockStartedAt(firstCard ? readPlayClock() : null);
    setAnnouncement(firstCard ? `เปิดการ์ด ${firstCard.pair.label}` : 'เริ่มเกมแล้ว');
  }

  function flip(card: Card) {
    if (revealed.length === 2 || revealed.includes(card.id) || matched.includes(card.pair.label))
      return;
    const first = deck.find(({ id }) => id === revealed[0]);
    if (!first) {
      if (clockStartedAt === null) setClockStartedAt(readPlayClock());
      setRevealed([card.id]);
      setAnnouncement(`เปิดการ์ด ${card.pair.label}`);
      return;
    }

    setAttempts((count) => count + 1);
    if (first.pair.label === card.pair.label) {
      if ((matched.length + 1) * 2 === deck.length && clockStartedAt !== null) {
        setElapsedSeconds(Math.floor((readPlayClock() - clockStartedAt) / 1000));
        setClockStartedAt(null);
      }
      setMatched((current) => [...current, card.pair.label]);
      setRevealed([]);
      setAnnouncement(`จับคู่ ${card.pair.label} สำเร็จ`);
      return;
    }
    setRevealed([first.id, card.id]);
    setAnnouncement(`เปิดการ์ด ${card.pair.label} ยังไม่ตรงคู่`);
    hideTimer.current = setTimeout(() => {
      setRevealed([]);
      hideTimer.current = null;
    }, 850);
  }

  return (
    <Stack
      id="matching-board"
      tabIndex={-1}
      spacing={{ xs: 1.5, sm: 2 }}
      sx={{
        mt: { xs: 1.5, sm: 2.5 },
        mx: 'auto',
        width: 1,
        maxWidth: pairs.length > 6 ? 880 : 688,
        minWidth: 0,
        scrollMarginTop: 16,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ width: 1, maxWidth: hasCenterLogo ? 480 : undefined, alignSelf: 'center' }}
      >
        <Typography variant="body2" sx={{ fontSize: { xs: 13, sm: 14 } }}>
          {deck.length ? (
            'เปิดการ์ดทีละ 2 ใบ'
          ) : (
            <>
              แตะการ์ดเพื่อเริ่มจับคู่ให้ครบ <strong>{pairs.length} คู่</strong>
            </>
          )}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            flexShrink: 0,
            px: 1.25,
            py: 0.5,
            borderRadius: '9px',
            bgcolor: complete ? '#E1F0E4' : '#FFFFFF8F',
            color: complete ? '#306044' : '#4F3169',
          }}
        >
          <Iconify icon="ri:timer-line" width={17} />
          <Typography
            component="span"
            role="timer"
            aria-label={complete ? 'เวลาที่ใช้เล่น' : 'เวลาเล่น'}
            variant="subtitle2"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPlayTime(elapsedSeconds)}
          </Typography>
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: hasCenterLogo
            ? 'repeat(3, minmax(0, 1fr))'
            : {
                xs: 'repeat(3, minmax(0, 1fr))',
                sm: 'repeat(4, minmax(0, 1fr))',
                md:
                  boardSlots.length > 12
                    ? 'repeat(6, minmax(0, 1fr))'
                    : 'repeat(4, minmax(0, 1fr))',
              },
          gap: { xs: 0.75, sm: 1.25 },
          width: 1,
          maxWidth: hasCenterLogo ? 480 : undefined,
          alignSelf: 'center',
        }}
      >
        {hasCenterLogo && (
          <Box
            sx={{
              gridArea: '2 / 2',
              display: 'grid',
              placeItems: 'center',
              aspectRatio: { xs: '1', sm: '4 / 4.4' },
              p: 1,
              borderRadius: '12px',
              border: '1px solid #FFF',
              bgcolor: '#FFFFFFA6',
            }}
          >
            <Box
              component="img"
              src="/logo/logo-email.png"
              alt="Loveza Hunt"
              sx={{ display: 'block', width: 1, maxWidth: 120, height: 'auto' }}
            />
          </Box>
        )}
        {boardSlots.map((slot, index) => {
          const card = deck[index] ?? slot;
          const found = matched.includes(card.pair.label);
          const faceUp = found || revealed.includes(card.id);
          return (
            <Button
              key={slot.id}
              aria-label={
                faceUp
                  ? `การ์ด ${index + 1}: ${card.pair.label}${found ? ' จับคู่แล้ว' : ''}`
                  : `เปิดการ์ดใบที่ ${index + 1}`
              }
              aria-pressed={faceUp}
              aria-disabled={faceUp || revealed.length === 2}
              onClick={() => (deck.length ? flip(card) : start(index))}
              variant="outlined"
              sx={{
                aspectRatio: { xs: '1', sm: '4 / 4.4' },
                minWidth: 0,
                minHeight: 44,
                p: 0.75,
                position: 'relative',
                overflow: 'hidden',
                '&&': { borderRadius: '12px' },
                lineHeight: 1.2,
                overflowWrap: 'anywhere',
                borderColor: found ? '#8CBD99' : faceUp ? 'divider' : '#BAA4D2',
                boxShadow: found ? '0 2px 0 #BCDCC4' : faceUp ? 'none' : '0 3px 0 #CDB9E0',
                color: '#59387A',
                bgcolor: found ? '#E8F6EB' : faceUp ? 'background.paper' : '#EEE3FA',
                ...(!faceUp && {
                  backgroundImage:
                    'radial-gradient(circle at 30% 16%, #FFFFFF45, transparent 76%), linear-gradient(#0002, #0002)',
                  bgcolor: 'var(--activity-primary)',
                  borderColor: 'var(--activity-contrast)',
                  boxShadow: '0 3px 0 #0004',
                  '&:hover': { borderColor: '#FFFFFF', filter: 'brightness(1.1)' },
                }),
              }}
            >
              {faceUp ? (
                card.pair.imageUrl ? (
                  <>
                    <Box
                      component="img"
                      src={card.pair.imageUrl}
                      alt=""
                      title={card.pair.description || card.pair.label}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: '10%',
                        width: '80%',
                        height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 26px)' },
                        objectFit: 'contain',
                        borderRadius: 1,
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 3,
                        insetInline: 4,
                        fontSize: { xs: 10, sm: 12 },
                        lineHeight: 1.15,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: { xs: 2, sm: 1 },
                        overflow: 'hidden',
                        fontWeight: 800,
                      }}
                    >
                      {card.pair.label}
                    </Typography>
                  </>
                ) : (
                  <Typography component="span" variant="caption" sx={{ fontWeight: 800 }}>
                    {card.pair.label}
                  </Typography>
                )
              ) : (
                <Box
                  component="img"
                  src="/assets/loveza/loveza-heart.webp"
                  alt=""
                  sx={{
                    display: 'block',
                    width: '48%',
                    maxWidth: 56,
                    height: 'auto',
                    filter: 'drop-shadow(0 3px 0 #40235870)',
                  }}
                />
              )}
              {found && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    display: 'grid',
                    placeItems: 'center',
                    width: { xs: 15, sm: 18 },
                    height: { xs: 15, sm: 18 },
                    borderRadius: '50%',
                    bgcolor: '#D0EAD6',
                    color: '#2B6340',
                  }}
                >
                  <Iconify icon="ri:check-line" width={13} />
                </Box>
              )}
            </Button>
          );
        })}
      </Box>
      <Box
        role="status"
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        {announcement}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{
          pt: 0.75,
          width: 1,
          maxWidth: hasCenterLogo ? 480 : undefined,
          alignSelf: 'center',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          '& .MuiButton-root': {
            minHeight: 46,
            minWidth: 0,
            px: { xs: 0.5, sm: 1.5 },
            borderRadius: '14px',
            fontWeight: 800,
          },
          '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
        }}
      >
        <Button
          variant="contained"
          disableElevation
          size="small"
          onClick={() => void shareGame(true)}
          startIcon={<Iconify icon="ri:share-forward-line" />}
          sx={{
            bgcolor: 'var(--activity-contrast)',
            color: 'var(--activity-primary)',
            boxShadow: '0 2px 0 #0004',
            '&:hover': { bgcolor: 'var(--activity-contrast)', filter: 'brightness(.94)' },
          }}
        >
          แชร์ชวนเพื่อน
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => void shareGame(false)}
          startIcon={<Iconify icon="ri:link" />}
          sx={{
            color: 'text.primary',
            borderColor: 'var(--activity-contrast)',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'common.white', borderColor: 'var(--activity-contrast)' },
          }}
        >
          คัดลอกลิงก์
        </Button>
      </Stack>
      {shareNotice && (
        <Alert severity="success" role="status">
          {shareNotice}
        </Alert>
      )}
      {manualShareUrl && (
        <TextField
          label="ลิงก์เกมสำหรับแชร์"
          value={manualShareUrl}
          size="small"
          fullWidth
          slotProps={{
            htmlInput: {
              readOnly: true,
              onFocus: (event: FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
            },
          }}
        />
      )}
      {deck.length > 0 && (
        <Button
          size="small"
          variant="text"
          color="inherit"
          onClick={() => start()}
          startIcon={<Iconify icon="ri:restart-line" width={19} />}
          sx={{
            minHeight: 44,
            alignSelf: 'center',
            '&&': { borderRadius: '12px' },
            px: 2,
            '&:hover': { bgcolor: '#FFFFFF20' },
          }}
        >
          เริ่มใหม่
        </Button>
      )}
    </Stack>
  );
}
