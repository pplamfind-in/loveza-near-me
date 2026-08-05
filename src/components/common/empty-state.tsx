import type { ReactNode } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import SearchOffRounded from '@mui/icons-material/SearchOffRounded';

// ----------------------------------------------------------------------

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      {icon ?? <SearchOffRounded sx={{ fontSize: 56, color: 'text.disabled' }} />}
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button
          variant="contained"
          onClick={onAction}
          href={actionHref}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
