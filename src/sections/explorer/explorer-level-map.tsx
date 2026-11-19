'use client';

import type { ReactNode } from 'react';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { EXPLORER_LEVELS, POINTS_PER_STORE } from 'src/lib/explorer/progress';
import { useExplorerProgressQuery } from 'src/app/account/use-account-reports';

import { Iconify } from 'src/components/iconify';

const regions = [
  { first: 1, last: 20, title: 'หมู่บ้านหมุดแรก', color: '#E1EACB', avatar: 'explorer' },
  { first: 21, last: 40, title: 'ป่าของนักสำรวจ', color: '#D5EAE2', avatar: 'gardener' },
  {
    first: 41,
    last: 60,
    title: 'เทือกเขาผู้บุกเบิก',
    color: '#E1E4F6',
    avatar: 'binoculars',
  },
  { first: 61, last: 80, title: 'หุบเขาน้ำตก', color: '#D5ECF3', avatar: 'campfire' },
  { first: 81, last: 100, title: 'เกาะตำนาน Loveza', color: '#F8E9B9', avatar: 'strawberry-cake' },
];

const trailWaypoints = [
  [14, 36],
  [40, 61],
  [76, 82],
  [85, 135],
  [61, 165],
  [30, 177],
  [12, 218],
  [42, 245],
  [76, 261],
  [87, 306],
  [64, 343],
  [34, 356],
  [15, 390],
  [46, 418],
  [79, 443],
];

const regionTrails = regions.map((region, regionIndex) => {
  const waypoints = EXPLORER_LEVELS.slice(region.first - 1, region.last).map((level, index) => {
    const [x, y] = trailWaypoints[index % trailWaypoints.length];
    return {
      level,
      x: regionIndex % 2 === 0 ? x : 100 - x,
      y: y + Math.floor(index / trailWaypoints.length) * 475,
    };
  });
  const height = Math.max(...waypoints.map(({ y }) => y)) + 38;
  const nodes = waypoints.map(({ y, ...node }) => ({ ...node, y: height - y }));
  const path = nodes
    .map(({ x, y }, index) => {
      const previous = nodes[index - 1];
      if (!previous) return `M ${x} ${y}`;

      const middleX = (previous.x + x) / 2;
      return `C ${middleX} ${previous.y}, ${middleX} ${y}, ${x} ${y}`;
    })
    .join(' ');

  return { ...region, nodes, height, path };
});
const regionArrowSx = {
  pointerEvents: 'auto',
  width: 44,
  height: 44,
  bgcolor: '#FFFDFA',
  border: '2px solid white',
  color: 'primary.dark',
  '&:hover': { bgcolor: 'primary.lighter' },
  '&.Mui-disabled': { bgcolor: '#FFFDFA', opacity: 0.65 },
};

function centerLevel(region: HTMLElement, level: number) {
  const marker = region.querySelector(`[data-level-node="${level}"]`);
  if (!marker) return false;

  region.scrollTop +=
    marker.getBoundingClientRect().top -
    region.getBoundingClientRect().top -
    region.clientHeight / 2;
  return true;
}

export function ExplorerLevelMap({
  hasAccount,
  children,
}: {
  hasAccount: boolean;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const visitedRegions = useRef(new Set<number>());
  const focusLevel = useRef<number | null>(null);
  const [page, setPage] = useState(0);
  const { data: progress, isFetchedAfterMount, isSuccess } = useExplorerProgressQuery(hasAccount);
  const currentLevel = hasAccount && isFetchedAfterMount && isSuccess ? progress.level : undefined;

  useEffect(() => {
    const restorePage = () => {
      const element = track.current;
      const level = Number(/^#levels-(\d+)$/.exec(window.location.hash)?.[1]);
      const index = regions.findIndex(({ first, last }) => level >= first && level <= last);
      if (element && index >= 0) {
        element.scrollLeft = index * element.clientWidth;
        setPage(index);
      }
    };
    restorePage();
    window.addEventListener('hashchange', restorePage);
    return () => window.removeEventListener('hashchange', restorePage);
  }, []);

  useEffect(() => {
    const region = track.current?.children[page];
    if (!(region instanceof HTMLElement)) return;
    if (focusLevel.current !== null && centerLevel(region, focusLevel.current)) {
      focusLevel.current = null;
      visitedRegions.current.add(page);
      return;
    }
    if (visitedRegions.current.has(page)) return;

    region.scrollTop = region.scrollHeight;
    visitedRegions.current.add(page);
  }, [page]);

  const goToPage = (index: number) => {
    const element = track.current;
    if (!element || index < 0 || index >= regions.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  };

  const [selected, setSelected] = useState<(typeof EXPLORER_LEVELS)[number] | null>(null);

  return (
    <>
      <Container maxWidth="lg" sx={{ mb: 1.5, flexShrink: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          useFlexGap
          flexWrap="wrap"
          spacing={0.75}
        >
          {children}
          {currentLevel !== undefined && (
            <Button
              onClick={() => {
                const index = regions.findIndex(
                  ({ first, last }) => currentLevel >= first && currentLevel <= last
                );
                const region = track.current?.children[index];
                if (!(region instanceof HTMLElement)) return;
                if (index === page) {
                  centerLevel(region, currentLevel);
                } else {
                  focusLevel.current = currentLevel;
                  goToPage(index);
                }
              }}
              startIcon={<Iconify icon="ri:map-pin-user-fill" width={17} />}
              sx={{
                minHeight: 36,
                px: 1.25,
                bgcolor: '#264B36',
                color: '#FFFDF1',
                fontWeight: 800,
                '&&:hover': { bgcolor: '#346649' },
              }}
            >
              เลเวลของคุณ {currentLevel}
            </Button>
          )}
        </Stack>
      </Container>
      {regions.map(({ first }) => (
        <Box
          key={first}
          id={`levels-${first}`}
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: 0,
          }}
        />
      ))}
      <Container
        maxWidth="lg"
        sx={{
          position: 'fixed',
          insetInline: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          pl: { xs: 'max(16px, env(safe-area-inset-left))', sm: 3 },
          pr: { xs: 'max(16px, env(safe-area-inset-right))', sm: 3 },
        }}
      >
        <IconButton
          aria-label="พื้นที่ก่อนหน้า"
          disabled={page === 0}
          onClick={() => goToPage(page - 1)}
          sx={regionArrowSx}
        >
          <Iconify icon="ri:arrow-left-s-line" width={26} />
        </IconButton>
        <IconButton
          aria-label="พื้นที่ถัดไป"
          disabled={page === regions.length - 1}
          onClick={() => goToPage(page + 1)}
          sx={regionArrowSx}
        >
          <Iconify icon="ri:arrow-right-s-line" width={26} />
        </IconButton>
      </Container>
      <Container maxWidth="lg" disableGutters sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Box
          ref={track}
          onScroll={(event) => {
            const element = event.currentTarget;
            const index = Math.max(
              0,
              Math.min(regions.length - 1, Math.round(element.scrollLeft / element.clientWidth))
            );
            if (index === page) return;
            setPage(index);
            window.history.replaceState(null, '', `#levels-${regions[index].first}`);
          }}
          sx={{
            display: 'grid',
            width: '100%',
            gridAutoFlow: 'column',
            gridAutoColumns: '100%',
            gridTemplateRows: 'minmax(0, 1fr)',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {regionTrails.map(({ first, last, title, color, avatar, nodes, height, path }, index) => (
            <Box
              key={first}
              component="section"
              data-explorer-region={first}
              inert={index !== page}
              aria-labelledby={`region-${first}`}
              sx={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'safe center',
                overflowY: 'auto',
                px: { xs: 7.5, sm: 10 },
                py: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  width: 'fit-content',
                  flexShrink: 0,
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  mx: 'auto',
                  mt: 1,
                  px: 1.5,
                  py: 0.75,
                  maxWidth: '100%',
                  borderRadius: '18px',
                  border: '3px solid #FFFDF1',
                  bgcolor: color,
                }}
              >
                <Avatar
                  src={`/assets/avatar/avatar-${avatar}.webp`}
                  alt=""
                  sx={{ width: 38, height: 38, flexShrink: 0, border: '2px solid #FFFDF1' }}
                />
                <Box>
                  <Typography id={`region-${first}`} component="h2" sx={{ fontWeight: 900 }}>
                    {title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                    เลเวล {first}–{last}
                  </Typography>
                </Box>
              </Stack>
              <Box
                sx={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '100%',
                  maxWidth: 640,
                  mx: 'auto',
                  mt: 1,
                  height,
                }}
              >
                <Box
                  component="svg"
                  aria-hidden="true"
                  viewBox={`0 0 100 ${height}`}
                  preserveAspectRatio="none"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  <path
                    d={path}
                    fill="none"
                    stroke="#345640"
                    strokeOpacity={0.72}
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeDasharray="2 11"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="#FFF9DB"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray="2 11"
                    vectorEffect="non-scaling-stroke"
                  />
                </Box>
                <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {nodes.map(({ level, x, y }) => {
                    const landmark = Boolean(level.titleUnlock);
                    const startsJourney = level.level === 1;
                    const regionFinish = level.level === last && !landmark;
                    const isCurrent = level.level === currentLevel;

                    return (
                      <Box
                        component="li"
                        key={level.level}
                        data-level-node={level.level}
                        sx={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: y,
                          transform: 'translate(-50%, -50%)',
                          ...(isCurrent && { zIndex: 1 }),
                        }}
                      >
                        <Button
                          aria-label={`เลเวล ${level.level}${level.titleUnlock ? ` · ${level.titleUnlock}` : ''}`}
                          aria-current={isCurrent ? 'step' : undefined}
                          aria-haspopup="dialog"
                          onClick={() => setSelected(level)}
                          sx={{
                            zIndex: 1,
                            position: 'relative',
                            width: { xs: 46, sm: 56 },
                            height: { xs: 46, sm: 56 },
                            minWidth: 0,
                            px: 0,
                            '&&': { borderRadius: { xs: '18px', sm: '22px' } },
                            border: '3px solid',
                            borderBottomWidth: 5,
                            borderColor: startsJourney
                              ? '#FFFDF1'
                              : landmark
                                ? '#BD7C26'
                                : regionFinish
                                  ? '#FFFDF1'
                                  : '#658358',
                            color: startsJourney ? '#FFFDF1' : landmark ? '#64420F' : '#254736',
                            bgcolor: startsJourney
                              ? '#264B36'
                              : landmark
                                ? '#FFD366'
                                : regionFinish
                                  ? '#CDE7AE'
                                  : '#FFFDF1',
                            fontWeight: 900,
                            fontSize: { xs: 15, sm: 18 },
                            transition: 'transform 150ms ease, background-color 150ms ease',
                            '@media (hover: hover)': {
                              '&:hover': {
                                transform: 'translateY(-3px) scale(1.04)',
                                bgcolor: startsJourney ? '#315C43' : '#FFF1B0',
                                '& [data-level-emblem]': {
                                  transform: 'rotate(12deg) scale(1.13)',
                                },
                              },
                            },
                            '&:active': { transform: 'translateY(3px)' },
                            '&:focus-visible': { outline: '2px solid #254736', outlineOffset: 3 },
                            ...(isCurrent && {
                              outline: '3px solid #264B36',
                              outlineOffset: 3,
                              borderColor: '#FFFDF1',
                              bgcolor: '#264B36',
                              color: '#FFFDF1',
                              '&&:hover': { bgcolor: '#346649' },
                            }),
                            '@media (prefers-reduced-motion: reduce)': {
                              transition: 'none',
                              '&:hover, &:active, &:hover [data-level-emblem]': {
                                transform: 'none',
                              },
                            },
                          }}
                        >
                          {level.level}
                          {isCurrent && (
                            <Box
                              component="span"
                              sx={{
                                position: 'absolute',
                                bottom: 'calc(100% + 7px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                px: 0.75,
                                py: 0.25,
                                border: '1px solid #FFFDF1',
                                borderRadius: '8px',
                                bgcolor: '#264B36',
                                color: '#FFFDF1',
                                whiteSpace: 'nowrap',
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              คุณอยู่ที่นี่
                            </Box>
                          )}
                          {(landmark || regionFinish) && (
                            <Box
                              component="span"
                              aria-hidden="true"
                              data-level-emblem
                              sx={{
                                position: 'absolute',
                                top: -9,
                                right: -6,
                                display: 'grid',
                                placeItems: 'center',
                                width: 22,
                                height: 22,
                                border: '2px solid #FFFDF1',
                                borderRadius: '50%',
                                bgcolor: startsJourney || regionFinish ? '#458361' : '#FFD773',
                                color: startsJourney || regionFinish ? '#FFFDF1' : '#683B14',
                                transition: 'transform 150ms ease',
                              }}
                            >
                              <Iconify
                                icon={
                                  startsJourney || regionFinish
                                    ? 'ri:flag-2-fill'
                                    : level.level === 100
                                      ? 'ri:trophy-fill'
                                      : 'ri:star-fill'
                                }
                                width={13}
                              />
                            </Box>
                          )}
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        aria-labelledby="explorer-level-detail-title"
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              m: 2,
              border: '4px solid #FFFDF1',
              borderRadius: '24px',
              bgcolor: '#F8F3E1',
              boxShadow: 'none',
            },
          },
        }}
      >
        {selected && (
          <>
            <DialogTitle id="explorer-level-detail-title" sx={{ px: 2, pt: 2, pb: 1.25 }}>
              <Stack component="span" direction="row" alignItems="center" spacing={1.25}>
                <Box
                  component="span"
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: '17px',
                    border: '2px solid #FFFDF1',
                    bgcolor: selected.titleUnlock ? '#FFD773' : '#DCEBCC',
                    color: '#284A36',
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  {selected.level}
                </Box>
                <Box component="span">
                  <Typography
                    component="span"
                    sx={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'primary.dark' }}
                  >
                    เลเวล {selected.level}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ display: 'block', fontSize: 19, fontWeight: 900, lineHeight: 1.3 }}
                  >
                    {selected.name}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pb: 1.5 }}>
              <Box sx={{ p: 1.25, borderRadius: '14px', bgcolor: '#FFFDF5' }}>
                <Typography sx={{ color: 'primary.dark', fontSize: 12, fontWeight: 800 }}>
                  เงื่อนไขของเลเวลนี้
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: 14 }}>
                  {selected.storesToAdvance
                    ? `แจ้งร้านไม่ซ้ำและผ่านอนุมัติเพิ่ม ${selected.storesToAdvance} ร้านจากเลเวลก่อน`
                    : 'เลเวลเริ่มต้นของนักสำรวจทุกคน'}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1,
                  mt: 1,
                }}
              >
                {[
                  {
                    label: 'ร้านสะสมขั้นต่ำ',
                    value: selected.totalStores,
                    icon: 'ri:map-pin-2-fill',
                    color: '#E0EDCF',
                  },
                  {
                    label: 'เหรียญสะสมขั้นต่ำ',
                    value: selected.points,
                    icon: 'ri:star-fill',
                    color: '#FBE8AA',
                  },
                ].map(({ label, value, icon, color }) => (
                  <Box
                    key={label}
                    sx={{ p: 1.25, borderRadius: '14px', bgcolor: color, color: '#284A36' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify icon={icon} width={16} />
                      <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
                        {value.toLocaleString('th-TH')}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 12 }}>
                ร้านไม่ซ้ำที่ผ่านอนุมัติรับ {POINTS_PER_STORE} เหรียญต่อร้าน
              </Typography>
              {selected.titleUnlock && (
                <Chip
                  icon={<Iconify icon="ri:star-fill" width={16} />}
                  label={`ฉายา ${selected.titleUnlock}`}
                  sx={{ mt: 1.5, bgcolor: '#FFE297', color: '#604819', fontWeight: 800 }}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button autoFocus variant="contained" fullWidth onClick={() => setSelected(null)}>
                ปิด
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
