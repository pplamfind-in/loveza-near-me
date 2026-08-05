import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

import { BottomNavigation } from './bottom-navigation';

// ----------------------------------------------------------------------

type MobileAppShellProps = {
  children: ReactNode;
  hideBottomNav?: boolean;
};

export function MobileAppShell({ children, hideBottomNav }: MobileAppShellProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <Box
          component="main"
          sx={{
            flex: '1 1 auto',
            px: 2,
            pt: 2,
            pb: hideBottomNav ? 3 : '88px',
          }}
        >
          {children}
        </Box>

        {!hideBottomNav && <BottomNavigation />}
      </Box>
    </Box>
  );
}
