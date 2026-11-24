import type { ReactNode } from 'react';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type FormSectionProps = {
  step?: string;
  sx?: SxProps<Theme>;
  heading?: 'h2' | 'h3';
  icon: string;
  title: string;
  description?: string;
  color: string;
  children: ReactNode;
};

export function FormSection({
  step,
  icon,
  title,
  description,
  color,
  children,
  sx = [],
  heading = 'h2',
}: FormSectionProps) {
  return (
    <Box
      component="section"
      sx={[
        {
          p: { xs: 2, sm: 2.5, md: 0 },
          display: step === '01' ? 'grid' : 'block',
          gridTemplateColumns:
            step === '01' ? { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' } : undefined,
          alignItems: 'center',
          gap: step === '01' ? { xs: 2, md: 3 } : undefined,
          border: '5px solid var(--palette-background-paper)',
          borderRadius: '18px',
          bgcolor: 'var(--palette-background-paper)',
          boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ mb: step === '01' ? 0 : 2.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            display: 'grid',
            flexShrink: 0,
            color: 'var(--palette-text-primary)',
            borderRadius: '12px',
            placeItems: 'center',
            bgcolor: color,
            border: '1px solid var(--palette-grey-300)',
            boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
          }}
        >
          <Iconify icon={icon} width={23} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          {step && (
            <Typography
              sx={{
                color: 'var(--palette-primary-main)',
                fontSize: 10,
                fontWeight: 1000,
                letterSpacing: 1.5,
              }}
            >
              STEP {step}
            </Typography>
          )}
          <Typography
            component={heading}
            sx={{
              color: 'var(--palette-text-primary)',
              fontSize: { xs: 18, md: 20 },
              fontWeight: 900,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                mt: 0.15,
                color: 'var(--palette-text-secondary)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      {children}
    </Box>
  );
}

export const reportSubmitButtonSx = {
  minWidth: { sm: 180 },
  minHeight: 48,
  color: 'primary.contrastText',
  borderRadius: '12px',
  backgroundImage: 'none',
  bgcolor: 'primary.main',
  boxShadow: '0 4px 0 var(--palette-primary-darker)',
  '&:hover': {
    bgcolor: 'primary.dark',
    boxShadow: '0 4px 0 var(--palette-primary-darker)',
  },
};
