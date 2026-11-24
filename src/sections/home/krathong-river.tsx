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
import { activityButtonSx } from 'src/lib/activity-theme';

import { FlavorPollShare } from './flavor-poll-share';

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
  open,
  preview,
  designs,
}: {
  activityId: string;
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
  const [idlePositions, setIdlePositions] = useState<{ phase: number; lane: number }[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ label: string; imageUrl: string } | null>(null);
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
      setSent(selected);
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
            isKrathong
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
      >
        <Box component="form" onSubmit={submitKrathong}>
          <DialogTitle id="krathong-wish-title">{selected?.label}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              autoFocus
              label="คำอธิษฐาน (ไม่บังคับ)"
              helperText="คนอื่นจะเห็นเฉพาะกระทงของคุณ"
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
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button disabled={sending} onClick={() => setSelectedLabel('')}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="contained" loading={sending} sx={{ minHeight: 44 }}>
              ลอยกระทง
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </div>
  );
}
