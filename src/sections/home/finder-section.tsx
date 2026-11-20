import type { StoreStatus, LatestStorePreview } from 'src/types/store';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { formatRelativeTimeTh } from 'src/utils/relative-time-th';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

import { MobileCardCarousel } from './mobile-card-carousel';
import { explorerCardSx, explorerLabelSx } from './explorer-styles';

const finderSteps = [
  {
    number: '01',
    title: 'ค้นหาจาก GPS',
    body: 'เปิดตำแหน่งบนมือถือ เพื่อดูร้านที่มี Loveza ใกล้คุณ เรียงตามระยะทาง',
    color: 'var(--palette-primary-main)',
  },
  {
    number: '02',
    title: 'พบแล้วช่วยบอกต่อ',
    body: 'เข้าสู่ระบบด้วย Google แล้วแจ้งร้าน รสชาติ และจำนวนสินค้าที่พบได้ทันที',
    color: 'var(--palette-primary-main)',
  },
  {
    number: '03',
    title: 'ข้อมูลที่เชื่อถือได้',
    body: 'พิกัดที่แจ้งจะผ่านการตรวจสอบจากทีมดูแล ก่อนแสดงให้คนอื่นค้นหา',
    color: 'var(--palette-primary-main)',
  },
];

const STATUS_COLOR: Record<StoreStatus, string> = {
  available: 'var(--palette-primary-dark)',
  low_stock: 'var(--palette-warning-dark)',
  out_of_stock: 'var(--palette-error-dark)',
  unknown: 'var(--palette-text-secondary)',
};

function MapPreview({ stores }: { stores: LatestStorePreview[] }) {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        ...explorerCardSx,
        border: '5px solid var(--palette-background-paper)',
        borderRadius: '18px',
        bgcolor: 'background.paper',
        boxShadow: '0 16px 48px rgba(65,49,30,.06)',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          height: { xs: 210, sm: 250 },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'primary.lighter',
          backgroundImage:
            'linear-gradient(32deg, transparent 43%, rgba(255,253,250,.95) 44%, rgba(255,253,250,.95) 49%, transparent 50%), linear-gradient(120deg, transparent 53%, rgba(255,253,250,.9) 54%, rgba(255,253,250,.9) 59%, transparent 60%), linear-gradient(rgba(66,118,83,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(66,118,83,.06) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 110,
            height: 75,
            top: 24,
            right: -20,
            borderRadius: '40px',
            bgcolor: 'rgba(66,118,83,.09)',
            transform: 'rotate(-25deg)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 90,
            height: 65,
            bottom: -10,
            left: 20,
            ...explorerCardSx,
            bgcolor: 'rgba(66,118,83,.09)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            px: 1.5,
            py: 0.75,
            bgcolor: 'background.paper',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="ri:map-2-line" width={15} />
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>ภาพประกอบแผนที่</Typography>
        </Box>
        {[
          { top: '34%', left: '24%' },
          { top: '25%', left: '72%' },
          { top: '64%', left: '56%' },
        ].map(({ top, left }) => (
          <Box
            key={left}
            sx={{
              top,
              left,
              position: 'absolute',
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '14px 14px 14px 4px',
              transform: 'rotate(-45deg)',
              bgcolor: 'primary.main',
              border: '3px solid var(--palette-background-paper)',
              boxShadow: '0 6px 14px rgba(48,92,61,.18)',
            }}
          >
            <Image
              src="/assets/icons/loveza/voxel-store.svg"
              alt=""
              width={26}
              height={26}
              style={{ transform: 'rotate(45deg)', borderRadius: 5 }}
            />
          </Box>
        ))}
        <Box
          sx={{
            position: 'absolute',
            left: '42%',
            top: '57%',
            width: 46,
            height: 46,
            transform: 'translate(-16px, -16px)',
            overflow: 'hidden',
            borderRadius: '50%',
            bgcolor: 'info.main',
            border: '3px solid var(--palette-common-white)',
            boxShadow: '0 0 0 5px rgba(17,168,226,.22), 0 5px 12px rgba(26,73,91,.22)',
          }}
        >
          <Image
            src="/assets/avatar/avatar-explorer.webp"
            alt=""
            width={40}
            height={40}
            style={{ display: 'block', objectFit: 'cover' }}
          />
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography component="h3" sx={{ fontSize: 17, fontWeight: 800 }}>
              พิกัดล่าสุดจากชุมชน
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: 12, color: 'text.secondary' }}>
              ข้อมูลจากการแจ้งพบสินค้า
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              borderRadius: '12px',
              display: 'flex',
            }}
          >
            <Iconify icon="ri:community-line" width={22} />
          </Box>
        </Stack>
        <Stack component="ul" spacing={0} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {stores.map((store) => {
            const updatedAt = formatRelativeTimeTh(store.last_reported_at);
            const color = STATUS_COLOR[store.current_status];
            return (
              <Box
                component="li"
                key={store.id}
                sx={{ py: 1.75, borderTop: '1px solid var(--palette-grey-200)' }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Box
                    sx={{
                      mt: 0.25,
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: '12px',
                      color: 'primary.main',
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon="ri:store-2-line" width={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: 1.6,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {store.name}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 11, color: 'text.secondary' }}>
                      {store.province}
                      {updatedAt ? ` · อัปเดต ${updatedAt}` : ' · ยังไม่มีเวลาอัปเดต'}
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      useFlexGap
                      flexWrap="wrap"
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Box
                        sx={{
                          px: 1,
                          py: 0.35,
                          borderRadius: 99,
                          bgcolor: 'background.default',
                          color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.6,
                        }}
                      >
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                          {STORE_STATUS_LABEL[store.current_status]}
                        </Typography>
                      </Box>
                      {store.estimated_quantity !== null ? (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                          แจ้งไว้ {store.estimated_quantity.toLocaleString('th-TH')} กระป๋อง
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })}
          {stores.length === 0 ? (
            <Box component="li" sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                ยังไม่มีข้อมูลร้านที่ได้รับการอนุมัติ
              </Typography>
              <Button href="/report" size="small" sx={{ mt: 1 }}>
                ช่วยแจ้งพิกัดแรก
              </Button>
            </Box>
          ) : null}
        </Stack>
        <Button
          href="/nearby"
          variant="contained"
          startIcon={<Iconify icon="ri:compass-3-line" width={19} />}
          endIcon={<Iconify icon="ri:arrow-right-line" width={17} />}
          sx={{
            mt: 1.5,
            mb: 0.5,
            minHeight: 46,
            px: 1.5,
            width: { xs: 'calc(100% - 105px)', sm: 'calc(100% - 145px)', lg: 'calc(100% - 165px)' },
            minWidth: 145,
            fontSize: 13,
            borderRadius: '12px',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          ค้นหาร้าน
        </Button>
      </Box>
    </Box>
  );
}

export function FinderSection({ latestStores }: { latestStores: LatestStorePreview[] }) {
  return (
    <Container maxWidth="lg">
      <Box component="section" id="finder" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <Box>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 5, md: 8 },
              alignItems: 'center',
              gridTemplateColumns: { xs: '1fr', md: '.9fr 1.1fr' },
            }}
          >
            <Box>
              <Typography
                sx={{
                  ...explorerLabelSx,
                }}
              >
                YOUR NEXT DESTINATION
              </Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 2,
                  fontSize: { xs: 32, md: 46 },
                  lineHeight: 1.3,
                  fontWeight: 900,
                  letterSpacing: '-.03em',
                }}
              >
                ตามหา LOVE ZA
                <Box
                  component="span"
                  sx={{ display: 'block', color: 'var(--palette-primary-main)' }}
                >
                  ใกล้คุณ
                </Box>
              </Typography>
              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 500,
                  color: 'var(--palette-text-secondary)',
                  fontSize: 17,
                  lineHeight: 1.8,
                }}
              >
                ไม่ต้องเดินหาร้านแบบเดาสุ่ม เปิด GPS เพื่อดูว่าร้านไหนมี Loveza ขาย อยู่ห่างเท่าไร
                และเหลือสินค้าแค่ไหน จากข้อมูลที่ Community ช่วยกันอัปเดต
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                <Button
                  href="/nearby"
                  variant="contained"
                  startIcon={<Iconify icon="ri:navigation-fill" />}
                  sx={{
                    px: 3,
                    py: 1.45,
                    borderRadius: 99,
                    bgcolor: 'var(--palette-primary-main)',
                    '&:hover': { bgcolor: 'var(--palette-primary-dark)' },
                  }}
                >
                  ค้นหาใกล้ฉัน
                </Button>
                <Button
                  href="/report"
                  startIcon={<Iconify icon="ri:edit-2-fill" />}
                  sx={{ px: 3, py: 1.45, color: 'var(--palette-primary-main)', borderRadius: 99 }}
                >
                  เจอ Loveza แจ้งพิกัด
                </Button>
              </Stack>

              <Stack
                direction="row"
                spacing={2.5}
                sx={{ mt: 4, color: 'var(--palette-text-secondary)' }}
              >
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Iconify
                    icon="ri:smartphone-fill"
                    width={16}
                    sx={{ color: 'var(--palette-primary-main)' }}
                  />
                  <Typography sx={{ fontSize: 12, fontWeight: 800 }}>GPS บนมือถือ</Typography>
                </Stack>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Iconify
                    icon="ri:time-fill"
                    width={16}
                    sx={{ color: 'var(--palette-primary-main)' }}
                  />
                  <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                    สต็อกตามที่ชุมชนแจ้ง
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Box>
              <Box sx={{ position: 'relative' }}>
                <MapPreview stores={latestStores} />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: { xs: -16, sm: -28, lg: -40 },
                    width: { xs: 150, sm: 210, lg: 240 },
                    height: { xs: 225, sm: 315, lg: 360 },
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  <Image
                    src="/assets/illustrations/p-korn.webp"
                    unoptimized
                    alt="ตัวละคร Voxel ยืนชวนสำรวจร้าน Loveza"
                    fill
                    sizes="(max-width: 599px) 150px, 240px"
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'bottom right',
                      filter: 'drop-shadow(-6px 8px 10px rgba(48,63,35,.16))',
                    }}
                  />
                </Box>
              </Box>
              <Typography
                sx={{
                  mt: 2,
                  color: 'var(--palette-text-secondary)',
                  fontSize: 12,
                  lineHeight: 1.8,
                }}
              >
                ข้อมูลจากการแจ้งของชุมชน สินค้าอาจเปลี่ยนแปลงหลังการอัปเดต
                ควรตรวจสอบกับร้านก่อนเดินทาง
              </Typography>
            </Box>
          </Box>

          <Box id="how-it-works" sx={{ pt: { xs: 8, md: 10 } }}>
            <Typography
              component="h2"
              sx={{
                textAlign: 'center',
                color: 'var(--palette-primary-main)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 2,
              }}
            >
              HOW IT WORKS
            </Typography>
            <MobileCardCarousel
              id="community"
              label="วิธีใช้งาน Loveza"
              count={finderSteps.length}
              gridSx={{
                mt: 3,
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              {finderSteps.map((step) => (
                <Box
                  key={step.number}
                  sx={{
                    p: { xs: 3, md: 3.5 },
                    ...explorerCardSx,
                    border: '5px solid var(--palette-background-paper)',
                    borderRadius: '18px',
                    bgcolor: [
                      'var(--palette-secondary-lighter)',
                      'var(--palette-primary-lighter)',
                      'var(--palette-primary-lighter)',
                    ][Number(step.number) - 1],
                  }}
                >
                  <Typography sx={{ color: step.color, fontSize: 13, fontWeight: 900 }}>
                    QUEST / {step.number}
                  </Typography>
                  <Typography component="h3" sx={{ mt: 3, fontSize: 22, fontWeight: 900 }}>
                    {step.title}
                  </Typography>
                  <Typography
                    sx={{ mt: 1, color: 'var(--palette-text-secondary)', lineHeight: 1.7 }}
                  >
                    {step.body}
                  </Typography>
                </Box>
              ))}
            </MobileCardCarousel>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
