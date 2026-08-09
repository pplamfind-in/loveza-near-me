'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export type AdminOverviewStats = {
  users: number;
  locations: number;
  totalStock: number;
  products: number;
  activeProducts: number;
  pendingReports: number;
};

type AdminOverviewProps = {
  stats: AdminOverviewStats;
  hasError?: boolean;
};

const CARDS = [
  {
    key: 'pendingReports',
    label: 'รอตรวจสอบ',
    icon: 'ri:time-fill',
    href: '/admin#pending-reports',
    color: '#d97706',
    background: '#fff7e6',
    suffix: 'รายการ',
  },
  {
    key: 'locations',
    label: 'พิกัดทั้งหมด',
    icon: 'ri:map-2-fill',
    href: '/admin/locations',
    color: '#008f84',
    background: '#e9fbf8',
    suffix: 'จุด',
  },
  {
    key: 'totalStock',
    label: 'ยอดคงเหลือรวม',
    icon: 'ri:archive-stack-fill',
    href: '/admin/locations',
    color: '#e21d75',
    background: '#fff0f6',
    suffix: 'กระป๋อง',
  },
  {
    key: 'products',
    label: 'สินค้าในระบบ',
    icon: 'ri:drinks-2-fill',
    href: '/admin/products',
    color: '#6d3b8c',
    background: '#f6effa',
    suffix: 'รายการ',
  },
  {
    key: 'users',
    label: 'ผู้ใช้งาน',
    icon: 'ri:group-fill',
    href: '/admin/users',
    color: '#2574a9',
    background: '#edf7ff',
    suffix: 'คน',
  },
] as const;

export function AdminOverview({ stats, hasError = false }: AdminOverviewProps) {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            LOVEZA HUNT ADMIN
          </Typography>
          <Typography
            component="h1"
            sx={{ mt: 0.75, fontSize: { xs: 30, md: 38 }, fontWeight: 900 }}
          >
            ภาพรวมระบบ
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            ติดตามข้อมูลสำคัญและจัดการระบบ Loveza ได้จากที่เดียว
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            component={Link}
            href="/admin/network"
            color="secondary"
            variant="contained"
            startIcon={<Iconify icon="ri:fullscreen-fill" />}
            sx={{ borderRadius: 99 }}
          >
            เปิดภาพรวมเต็มจอ
          </Button>
          <Button
            component={Link}
            href="/admin/products"
            variant="outlined"
            startIcon={<Iconify icon="ri:add-circle-line" />}
            sx={{ borderRadius: 99 }}
          >
            จัดการสินค้า
          </Button>
          <Button
            component={Link}
            href="/admin/locations"
            variant="contained"
            startIcon={<Iconify icon="ri:map-pin-2-fill" />}
            sx={{ borderRadius: 99 }}
          >
            ดูพิกัดทั้งหมด
          </Button>
        </Stack>
      </Stack>

      {hasError ? (
        <Alert severity="warning">ข้อมูลสถิติบางส่วนโหลดไม่สำเร็จ กรุณารีเฟรชอีกครั้ง</Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
        }}
      >
        {CARDS.map((card) => {
          const value = stats[card.key];
          const hint =
            card.key === 'products'
              ? `${stats.activeProducts.toLocaleString('th-TH')} รายการแสดงบน Landing`
              : 'กดเพื่อดูรายละเอียด';

          return (
            <Paper
              key={card.key}
              component={Link}
              href={card.href}
              elevation={0}
              sx={{
                p: 2.5,
                color: 'text.primary',
                borderRadius: 3,
                textDecoration: 'none',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 14px 32px rgba(52,78,82,.10)',
                },
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  color: card.color,
                  display: 'grid',
                  borderRadius: 2,
                  placeItems: 'center',
                  bgcolor: card.background,
                }}
              >
                <Iconify icon={card.icon} width={25} />
              </Box>
              <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 13 }}>
                {card.label}
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 26, fontWeight: 900 }}>
                {value.toLocaleString('th-TH')} {card.suffix}
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 11 }}>
                {hint}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}
