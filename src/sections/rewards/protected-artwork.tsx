'use client';

import Box from '@mui/material/Box';

export function ProtectedArtwork({ children }: { children: React.ReactNode }) {
  return (
    <Box
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      sx={{
        position: 'absolute',
        inset: 0,
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        '& img': { pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' },
      }}
    >
      {children}
    </Box>
  );
}
