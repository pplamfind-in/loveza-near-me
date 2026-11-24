'use client';

import styles from './krathong-river.module.css';

import type { FormEvent, CSSProperties } from 'react';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { supabase } from 'src/lib/supabase';
import { activityTheme, activityButtonSx } from 'src/lib/activity-theme';

import { FlavorPollShare } from './flavor-poll-share';

const lanternTracks = [
  { x: 8, size: 12, duration: 28, offset: 9, sway: 16 },
  { x: 16, size: 16, duration: 34, offset: 23, sway: -12 },
  { x: 27, size: 10, duration: 32, offset: 13, sway: 13 },
  { x: 70, size: 13, duration: 31, offset: 24, sway: -14 },
  { x: 81, size: 17, duration: 36, offset: 16, sway: 10 },
  { x: 92, size: 11, duration: 27, offset: 7, sway: -16 },
];

const flowers: Record<string, string> = {
  lotus: '🪷',
  marigold: '🌼',
  orchid: '🌸',
  'custom:ดาวเรือง': '🌼',
  'custom:กล้วยไม้': '🌸',
};

type Launch = { id: string; design: string; image_url: string | null; created_at: string };
type FloatingKrathong = Launch & { age: number; lane: number };

const driftMs = 60_000;
const riverLimit = 60;
const idleDesignLimit = 5;

async function findCandleFlame(imageUrl: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageUrl;
  await image.decode();

  // Match the floating image's centered object-fit box before locating its flame.
  const width = 64;
  const height = 56;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
  const { data } = ctx.getImageData(0, 0, width, height);
  const warm = new Uint8Array(width * height);
  const candle = new Uint8Array(width * height);
  let top = height;
  let bottom = 0;
  for (let pixel = 0; pixel < warm.length; pixel += 1) {
    const offset = pixel * 4;
    if (data[offset + 3] < 160) continue;
    const row = Math.floor(pixel / width);
    top = Math.min(row, top);
    bottom = row;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    if (red > 175 && green > 100 && red >= green && green - blue > 44 && red - blue > 85) {
      warm[pixel] = 1;
    }
    if (red > 160 && green > 125 && red >= green - 5 && green - blue > 11 && red - blue > 25) {
      candle[pixel] = 1;
    }
  }

  // A flame must sit over a vertical candle shaft. This rejects gold ornaments
  // such as the finial on top of the lotus and the tips of incense sticks.
  const searchEnd = Math.min(height - 15, top + (bottom - top) * 0.46);
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = Math.max(top, 1); y < searchEnd; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x;
      if (!warm[pixel] || warm[pixel - width]) continue;

      let flame = 0;
      for (let row = y; row < y + 6; row += 1) {
        const center = row * width + x;
        flame += warm[center - 1] + warm[center] + warm[center + 1];
      }
      if (flame < 4) continue;

      let shaft = 0;
      let straight = 0;
      for (let row = y + 6; row < y + 16; row += 1) {
        const center = row * width + x;
        shaft += candle[center - 1] + candle[center] + candle[center + 1];
        straight += candle[center];
      }
      if (shaft < 15 || straight < 6) continue;

      const score = shaft + straight * 2 + flame * 0.6 - y * 1.3;
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

function Krathong({ design, imageUrl }: { design: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <Box
        component="img"
        src={imageUrl}
        alt=""
        sx={{ width: 64, height: 56, objectFit: 'contain' }}
      />
    );
  }

  return (
    <span aria-hidden="true" className={styles.krathong}>
      <span className={styles.candle} />
      <span className={styles.flower}>
        {Object.hasOwn(flowers, design) ? flowers[design] : flowers.lotus}
      </span>
      <span className={styles.leaves} />
    </span>
  );
}

export function KrathongRiver({
  activityId,
  activityTitle,
  activityDescription,
  themeColor,
  open,
  preview,
  designs,
}: {
  activityId: string;
  activityTitle: string;
  activityDescription: string;
  themeColor: string | null;
  open: boolean;
  preview: boolean;
  designs: { label: string; imageUrl: string }[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selected = designs.find(({ label }) => label === selectedLabel);
  const [wish, setWish] = useState('');
  const [ownWishes, setOwnWishes] = useState<Record<string, string>>({});
  const [floating, setFloating] = useState<FloatingKrathong[]>([]);
  const [flamePositions, setFlamePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [idlePositions, setIdlePositions] = useState<{ phase: number; lane: number }[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ label: string; imageUrl: string; wish: string; surroundingImages: string[] } | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIdlePositions(Array.from({ length: idleDesignLimit }, () => ({
        phase: Math.random(),
        lane: Math.floor(Math.random() * 23),
      })));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let active = true;
    const images = new Set(designs.map(({ imageUrl }) => imageUrl).filter(Boolean));
    Promise.all(
      Array.from(images, async (imageUrl) => {
        const position = await findCandleFlame(imageUrl).catch(() => null);
        return [imageUrl, position] as const;
      })
    ).then((entries) => {
      if (active) {
        setFlamePositions(
          Object.fromEntries(entries.flatMap(([url, position]) => (position ? [[url, position]] : [])))
        );
      }
    });
    return () => {
      active = false;
    };
  }, [designs]);

  const receive = useCallback((launches: Launch[]) => {
    const now = Date.now();

    setFloating((current) => {
      const visible = current.filter(({ created_at }) => now - Date.parse(created_at) < driftMs);
      const recent = new Map(visible.map((row) => [row.id, row]));

      for (const launch of launches) {
        const age = Math.max(0, now - Date.parse(launch.created_at));
        if (age >= driftMs || recent.has(launch.id)) continue;
        recent.set(launch.id, {
          ...launch,
          age,
          lane: parseInt(launch.id.slice(0, 4), 16) % 23,
        });
      }

      if (recent.size === visible.length && visible.length === current.length) return current;

      return Array.from(recent.values())
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
        .slice(-riverLimit);
    });
  }, []);

  useEffect(() => {
    const prune = window.setInterval(() => receive([]), 5000);
    if (preview) return () => window.clearInterval(prune);

    let active = true;
    let subscribed = false;
    const syncRiver = async () => {
      const { data } = await supabase
        .from('activity_krathongs')
        .select('id, design, image_url, created_at')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .limit(riverLimit);
      if (active && data) receive(data as Launch[]);
    };

    const channel = supabase
      .channel(`krathong-river:${activityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_krathongs',
          filter: `activity_id=eq.${activityId}`,
        },
        ({ new: row }) => {
          if (active) receive([row as Launch]);
        }
      )
      .subscribe((status) => {
        if (!active) return;
        subscribed = status === 'SUBSCRIBED';
        if (subscribed) void syncRiver();
      });
    void syncRiver();
    const fallback = window.setInterval(() => {
      if (!subscribed) void syncRiver();
    }, 6000);

    return () => {
      active = false;
      window.clearInterval(prune);
      window.clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [activityId, preview, receive]);

  async function submitKrathong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || sending || closed || (!open && !preview)) return;
    const design = `custom:${selected.label}`;
    const cleanWish = wish.trim();
    setSent(null);
    setError('');
    setSending(true);

    try {
      let launch: Launch;
      if (preview) {
        launch = {
          id: crypto.randomUUID(),
          design,
          image_url: selected.imageUrl || null,
          created_at: new Date().toISOString(),
        };
      } else {
        const { data, error: launchError } = await supabase.rpc('launch_activity_krathong', {
          target_activity_id: activityId,
          chosen_design: design,
          wish_text: cleanWish,
        });
        if (launchError?.code === 'P0001') {
          setClosed(true);
          return;
        }
        if (launchError?.code === 'P0002') {
          setError('มีคนลอยกระทงพร้อมกันหลายคน ลองใหม่อีกสักครู่');
          return;
        }
        if (launchError?.code === '22023') {
          setError('รายการกระทงมีการเปลี่ยนแปลง กรุณาโหลดหน้าใหม่');
          return;
        }
        if (launchError || !data) throw new Error('Could not launch krathong');
        launch = data as Launch;
      }

      if (cleanWish) {
        setOwnWishes((current) => Object.fromEntries(
          [...Object.entries(current), [launch.id, cleanWish]].slice(-riverLimit)
        ));
      }
      receive([launch]);
      setWish('');
      setSelectedLabel('');
      setPickerOpen(false);
      const surroundingImages = floating
        .filter(({ id, created_at }) => id !== launch.id && Date.now() - Date.parse(created_at) < driftMs)
        .slice(-6)
        .flatMap(({ image_url }) => image_url ? [image_url] : []);
      for (const basket of designs) {
        if (surroundingImages.length >= 6) break;
        if (basket.imageUrl && basket.imageUrl !== selected.imageUrl && !surroundingImages.includes(basket.imageUrl)) {
          surroundingImages.push(basket.imageUrl);
        }
      }
      setSent({ ...selected, wish: cleanWish, surroundingImages });
    } catch {
      setError('ลอยกระทงไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setSending(false);
    }
  }

  const idleDesigns = designs.slice(0, idleDesignLimit);
  const idleKrathongs = idleDesigns.map(({ label, imageUrl }, index) => ({
    id: `idle:${label}`,
    design: `custom:${label}`,
    image_url: imageUrl || null,
    age: ((index + (idlePositions[index]?.phase ?? 0.5)) * driftMs) / idleDesigns.length,
    lane: idlePositions[index]?.lane ?? Math.round(((index + 1) * 22) / (idleDesigns.length + 1)),
  }));
  const visibleKrathongs = [...idleKrathongs, ...floating];

  return (
    <div className={styles.scene}>
      <div className={styles.skyEffects} aria-hidden="true">
        {lanternTracks.map(({ x, size, duration, offset, sway }) => (
          <span
            key={x}
            className={styles.lantern}
            style={{
              '--lantern-x': `${x}%`,
              '--lantern-size': `${size}px`,
              '--lantern-duration': `${duration}s`,
              '--lantern-delay': `-${offset}s`,
              '--lantern-sway': `${sway}px`,
            } as CSSProperties}
          />
        ))}
        <span className={styles.firework} />
        <span className={styles.firework} />
        <span className={styles.firework} />
      </div>
      <div className={styles.river} role="img" aria-label="แม่น้ำหน้าวัดอรุณในคืนลอยกระทง">
        {visibleKrathongs.map(({ id, design: launchedDesign, image_url, age, lane }, index) => (
          <span
            aria-hidden="true"
            key={id}
            className={id.startsWith('idle:') ? `${styles.drifting} ${styles.idle}` : styles.drifting}
            onAnimationIteration={(event) => {
              if (index >= idleDesigns.length || event.target !== event.currentTarget) return;
              const nextLane = (lane + 1 + Math.floor(Math.random() * 22)) % 23;
              setIdlePositions((current) => current.map((position, positionIndex) =>
                positionIndex === index ? { ...position, lane: nextLane } : position
              ));
            }}
            onAnimationEnd={(event) => {
              if (id.startsWith('idle:') || event.target !== event.currentTarget) return;
              setFloating((current) => current.filter((krathong) => krathong.id !== id));
            }}
            style={{ '--age': `-${age}ms`, '--lane': lane } as CSSProperties}
          >
            <span className={styles.floatSurface}>
              {ownWishes[id] && <span className={styles.wishCapsule}>{ownWishes[id]}</span>}
              <span className={styles.wake} />
              <span className={styles.reflection}>
                <Krathong design={launchedDesign} imageUrl={image_url} />
              </span>
              <span className={styles.basket}>
                <Krathong design={launchedDesign} imageUrl={image_url} />
                {image_url && flamePositions[image_url] && (
                  <span
                    className={styles.candleFlame}
                    style={{
                      left: flamePositions[image_url].x + 0.5,
                      top: flamePositions[image_url].y,
                    }}
                  />
                )}
              </span>
            </span>
          </span>
        ))}
      </div>
      {closed || (!open && !preview) ? (
        <Alert className={styles.notice} severity="info">
          กิจกรรมนี้ยังไม่เปิดให้ลอยกระทง
        </Alert>
      ) : !designs.length ? (
        <Alert className={styles.notice} severity="info">
          กิจกรรมนี้ยังไม่มีแบบกระทงให้เลือก
        </Alert>
      ) : sent ? (
        <Box className={styles.notice}>
          <FlavorPollShare
            flavor={sent.label}
            imageUrl={sent.imageUrl}
            krathong={{
              title: activityTitle,
              descriptionHtml: activityDescription,
              wish: sent.wish,
              surroundingImages: sent.surroundingImages,
            }}
            secondaryAction={
              <Button
                variant="contained"
                onClick={() => {
                  setSent(null);
                  setPickerOpen(true);
                }}
                sx={{ ...activityButtonSx, minHeight: 48, borderRadius: '14px' }}
              >
                ลอยอีกครั้ง
              </Button>
            }
          />
        </Box>
      ) : !pickerOpen ? (
        <Box className={styles.notice}>
          <Button
            variant="contained"
            onClick={() => setPickerOpen(true)}
            sx={{ ...activityButtonSx, minHeight: 48, borderRadius: '14px' }}
          >
            เลือกกระทง
          </Button>
        </Box>
      ) : (
        <Stack
          className={styles.form}
          sx={{
            p: 1.5,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            boxShadow: '0 12px 44px #08051d66',
          }}
        >
          <div>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography id="krathong-design" variant="subtitle2">
                เลือกกระทง
              </Typography>
              <Button size="small" onClick={() => setPickerOpen(false)}>
                ปิด
              </Button>
            </Stack>
            <div className={styles.designs} role="group" aria-labelledby="krathong-design">
              {designs.map(({ label, imageUrl }) => (
                <Button
                  key={label}
                  type="button"
                  color="inherit"
                  variant="outlined"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setWish('');
                    setError('');
                    setSelectedLabel(label);
                  }}
                  sx={{
                    minWidth: 0,
                    justifyContent: 'flex-start',
                    flexDirection: 'column',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.75,
                    borderRadius: 2,
                    '& img': {
                      width: 'min(100%, 92px)',
                      height: { xs: 52, sm: 72 },
                    },
                    overflowWrap: 'anywhere',
                    borderColor: 'divider',
                  }}
                >
                  <Krathong design={`custom:${label}`} imageUrl={imageUrl} />
                  <Typography variant="caption">{label}</Typography>
                </Button>
              ))}
            </div>
          </div>
        </Stack>
      )}
      <Dialog
        open={Boolean(selected) && !closed && (open || preview)}
        onClose={() => {
          if (!sending) setSelectedLabel('');
        }}
        fullWidth
        maxWidth="xs"
        aria-labelledby="krathong-wish-title"
        sx={activityTheme(themeColor)}
      >
        <Box component="form" onSubmit={submitKrathong}>
          <DialogTitle id="krathong-wish-title">{selected?.label}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 1.5 ,py:2}}>
            <Stack sx={{ py:2}}>
            <TextField
              autoFocus
              label="คำอธิษฐาน (ไม่บังคับ)"
              helperText="คำอธิษฐานจะอยู่ในภาพเมื่อคุณบันทึกหรือแชร์"
              value={wish}
              disabled={sending}
              onChange={(event) => setWish(event.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              fullWidth
              sx={{ mt: 0.5 }}
            />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={sending}
              onClick={() => setSelectedLabel('')}
              sx={{ color: 'color-mix(in srgb, var(--activity-primary) 70%, currentColor)' }}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={sending}
              sx={{ ...activityButtonSx, minHeight: 44 }}
            >
              ลอยกระทง
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </div>
  );
}
