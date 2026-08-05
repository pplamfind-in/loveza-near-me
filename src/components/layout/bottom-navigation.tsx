'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Paper from '@mui/material/Paper';
import SearchRounded from '@mui/icons-material/SearchRounded';
import MuiBottomNavigation from '@mui/material/BottomNavigation';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import AddLocationAltRounded from '@mui/icons-material/AddLocationAltRounded';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'ค้นหา', href: '/', icon: <SearchRounded /> },
  { label: 'แจ้งพิกัด', href: '/report', icon: <AddLocationAltRounded /> },
  { label: 'ล่าสุด', href: '/latest', icon: <AccessTimeRounded /> },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
  );

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 600,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 0,
      }}
    >
      <MuiBottomNavigation
        showLabels
        value={activeIndex === -1 ? 0 : activeIndex}
        sx={{ height: 72 }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={item.icon}
            component={Link}
            href={item.href}
            sx={{ minWidth: 64, py: 1 }}
          />
        ))}
      </MuiBottomNavigation>
    </Paper>
  );
}
