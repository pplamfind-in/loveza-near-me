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
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-fill' },
  { label: 'เข้าสู่ระบบ', path: '/auth/login', icon: 'ri:login-circle-line' },
];

const userItems = [
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-fill' },
  { label: 'แจ้งพิกัด', path: '/report', icon: 'ri:edit-2-fill' },
  { label: 'บัญชี', path: '/account', icon: 'ri:user-3-fill' },
];

const adminItems = [
  { label: 'หน้าแรก', path: '/', icon: 'ri:home-5-fill' },
  { label: 'ซ่าทั่วไทย', path: '/mapza', icon: 'ri:map-2-fill' },
  { label: 'ใกล้ฉัน', path: '/nearby', icon: 'ri:map-pin-2-fill' },
  { label: 'จัดการ', path: '/admin', icon: 'ri:shield-check-fill' },
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
      elevation={12}
      sx={(theme) => ({
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar + 1,
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        overflow: 'hidden',
        bgcolor: '#FFF7FB',
        borderRadius: '22px 22px 0 0',
        pb: 'max(12px, env(safe-area-inset-bottom))',
        borderTop: '3px solid #351129',
      })}
    >
      <BottomNavigation
        showLabels
        value={activePath ?? false}
        sx={{
          height: 68,
          bgcolor: '#FFF7FB',
          borderRadius: '22px 22px 0 0',
          '& .MuiBottomNavigationAction-root': {
            my: 0.75,
            minWidth: 0,
            px: 0.5,
            color: '#817587',
            borderRadius: 2.5,
            transition: 'color 160ms ease, background-color 160ms ease',
            '&.Mui-selected': {
              color: '#351129',
              bgcolor: '#FDE047',
              border: '2px solid #351129',
              boxShadow: '2px 2px 0 #351129',
              '& svg': { transform: 'translateY(-1px) scale(1.08)' },
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
            label={item.label}
            icon={<Iconify width={23} icon={item.icon} />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
