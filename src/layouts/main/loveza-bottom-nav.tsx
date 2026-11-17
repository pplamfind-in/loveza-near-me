'use client';

import type { LovezaHeaderUser } from '../components/loveza-header-account';

import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import { usePathname } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

type LovezaBottomNavProps = {
  user: LovezaHeaderUser | null;
};

const guestItems = [
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-line', activeIcon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-line', activeIcon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-line', activeIcon: 'ri:map-pin-2-fill' },
  { label: 'กระทู้', path: '/forum', icon: 'ri:chat-3-line', activeIcon: 'ri:chat-3-fill' },
];

const userItems = [
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-line', activeIcon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-line', activeIcon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-line', activeIcon: 'ri:map-pin-2-fill' },
  { label: 'กระทู้', path: '/forum', icon: 'ri:chat-3-line', activeIcon: 'ri:chat-3-fill' },
  {
    label: 'แจ้งพิกัด',
    path: '/report',
    icon: 'ri:map-pin-add-line',
    activeIcon: 'ri:map-pin-add-fill',
  },
];

const adminItems = [
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-line', activeIcon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-line', activeIcon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-line', activeIcon: 'ri:map-pin-2-fill' },
  {
    label: 'จัดการ',
    path: '/admin',
    icon: 'ri:shield-check-line',
    activeIcon: 'ri:shield-check-fill',
  },
];

function normalizePath(path: string) {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}

export function LovezaBottomNav({ user }: LovezaBottomNavProps) {
  const pathname = usePathname();
  const items = user ? (user.role === 'admin' ? adminItems : userItems) : guestItems;
  const currentPath = normalizePath(pathname);
  const activePath = items.find((item) =>
    item.path === '/'
      ? currentPath === '/'
      : currentPath === item.path || currentPath.startsWith(`${item.path}/`)
  )?.path;

  return (
    <Paper
      component="nav"
      data-loveza-bottom-nav
      aria-label="เมนูหลักด้านล่าง"
      elevation={0}
      sx={(theme) => ({
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar + 1,
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        overflow: 'hidden',
        bgcolor: 'var(--palette-background-paper)',
        borderRadius: '22px 22px 0 0',
        pb: 'max(12px, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--palette-grey-300)',
        boxShadow: '0 -4px 24px rgba(65,49,30,.06)',
      })}
    >
      <BottomNavigation
        showLabels
        value={activePath ?? false}
        sx={{
          height: 68,
          px: 1,
          gap: 0.5,
          bgcolor: 'var(--palette-background-paper)',
          borderRadius: '22px 22px 0 0',
          '& .MuiBottomNavigationAction-root': {
            my: 0.75,
            minWidth: 0,
            px: 0.5,
            color: 'var(--palette-text-secondary)',
            borderRadius: '14px',
            transition: 'color 160ms ease, background-color 160ms ease',
            '&:focus-visible': {
              outline: '2px solid var(--palette-primary-main)',
              outlineOffset: -2,
            },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            '&.Mui-selected': {
              color: 'var(--palette-primary-main)',
              bgcolor: 'var(--palette-primary-lighter)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            mt: 0.35,
            fontSize: '10px !important',
            fontWeight: 800,
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            href={item.path}
            value={item.path}
            aria-current={activePath === item.path ? 'page' : undefined}
            label={item.label}
            icon={
              <Iconify width={24} icon={activePath === item.path ? item.activeIcon : item.icon} />
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
