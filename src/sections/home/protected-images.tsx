'use client';

import Box from '@mui/material/Box';

/** Deters casual image saving while keeping link menus and text selection available. */
export function ProtectedHomeImages({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'contents',
        '& img': { userSelect: 'none', WebkitTouchCallout: 'none', WebkitUserDrag: 'none' },
      }}
      onContextMenu={(event) => {
        if (event.target instanceof Element && event.target.closest('img, picture'))
          event.preventDefault();
      }}
      onDragStart={(event) => {
        if (event.target instanceof Element && event.target.closest('img, picture'))
          event.preventDefault();
      }}
    >
      {children}
    </Box>
  );
}
