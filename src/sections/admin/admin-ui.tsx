'use client';

import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

// Keep portal dialogs in the same visual system as the admin workspace.
export function AdminUI({ children }: { children: React.ReactNode }) {
  return (
    <Box data-loveza-admin sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <GlobalStyles
        styles={{
          'body:has([data-loveza-admin])': {
            '& .MuiButton-root': {
              borderRadius: 10,
              textTransform: 'none',
              minHeight: 38,
              boxShadow: 'none',
            },
            '& .MuiButton-containedPrimary': {
              backgroundImage: 'none',
              boxShadow: '0 3px 0 #233F2B',
            },
            '& .MuiIconButton-root': { borderRadius: 10 },
            '& .MuiChip-root': { borderRadius: 7 },
            '& .MuiOutlinedInput-root': { borderRadius: 10 },
            '& .MuiTableContainer-root': { overflowX: 'auto' },
            '& .MuiTableCell-root': {
              padding: '14px 16px',
              borderBottomColor: '#F2EADF',
              fontSize: 14,
            },
            '& .MuiTableCell-head': {
              backgroundColor: '#E8F0E4',
              color: '#305C3D',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            },
            '& .MuiTableRow-hover:hover': { backgroundColor: '#FBF6ED' },
            '& .MuiDialog-paper': {
              border: '5px solid #FFFDFA',
              borderRadius: 18,
              backgroundColor: '#FFFDFA',
              boxShadow: '0 24px 60px rgba(35,63,43,.16)',
            },
            '& .MuiDialogTitle-root': { fontSize: 22, padding: '24px 24px 16px' },
            '& .MuiDialogActions-root': { padding: '16px 24px 24px', gap: 8 },
            '& .MuiAlert-root': { borderRadius: 10 },
            '& .MuiButton-root:focus-visible': { outline: '2px solid #427653', outlineOffset: 3 },
          },
          '[data-loveza-admin] main .MuiPaper-root:not(.MuiAlert-root):not(.MuiPopover-paper)': {
            border: '5px solid #FFFDFA',
            borderRadius: 16,
            boxShadow: '0 4px 0 #F2EADF',
            backgroundImage: 'none',
          },
          '[data-loveza-admin] main h1': { fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.4 },
        }}
      />
      {children}
    </Box>
  );
}
