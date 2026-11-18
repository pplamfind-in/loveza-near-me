'use client';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function RewardDownloadButton({
  id,
  iconOnly = false,
  shareEnabled = false,
}: {
  id: string;
  iconOnly?: boolean;
  shareEnabled?: boolean;
}) {
  const [pending, setPending] = useState<'download' | 'share' | null>(null);
  const [error, setError] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const preparedFile = useRef<File | null>(null);

  const handleCard = async (action: 'download' | 'share') => {
    if (pending) return;
    setError('');
    setShareNotice('');
    const fallbackMessage = 'ดาวน์โหลดภาพ PNG แล้วแนบรูปใน Facebook หรือ Instagram ได้เลย';
    if (action === 'share' && (!navigator.share || !navigator.canShare)) {
      setShareNotice(fallbackMessage);
      return;
    }

    setPending(action);
    const filename = `loveza-${id}.png`;
    const cached = preparedFile.current?.name === filename ? preparedFile.current : null;
    try {
      let file = cached;
      if (!file) {
        const response = await fetch(`/api/rewards/${encodeURIComponent(id)}/download/`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || 'เตรียมภาพการ์ดไม่สำเร็จ กรุณาลองอีกครั้ง');
        }
        file = new File([await response.blob()], filename, { type: 'image/png' });
      }

      if (action === 'share') {
        const data = { files: [file] };
        if (!navigator.canShare(data)) {
          setShareNotice(fallbackMessage);
          return;
        }

        try {
          await navigator.share(data);
        } catch (reason) {
          if (reason instanceof DOMException && reason.name === 'AbortError') return;
          if (!cached && reason instanceof DOMException && reason.name === 'NotAllowedError') {
            preparedFile.current = file;
            setShareNotice('ภาพพร้อมแล้ว กดแชร์ภาพอีกครั้งเพื่อเลือกแอป');
            return;
          }
          setShareNotice(fallbackMessage);
        }
        return;
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'เตรียมภาพการ์ดไม่สำเร็จ');
    } finally {
      preparedFile.current = cached ? null : preparedFile.current;
      setPending(null);
    }
  };
  if (iconOnly)
    return (
      <>
        <Tooltip title={pending ? 'กำลังเตรียมการ์ด…' : 'ดาวน์โหลดการ์ด PNG'}>
          <span>
            <IconButton
              disabled={Boolean(pending)}
              onClick={() => handleCard('download')}
              aria-label={pending ? 'กำลังเตรียมการ์ด' : 'ดาวน์โหลดการ์ด PNG'}
              aria-busy={Boolean(pending)}
              sx={{
                width: 42,
                height: 42,
                bgcolor: '#FFFDFA',
                color: 'primary.dark',
                border: '2px solid white',
                borderRadius: '12px',
                boxShadow: '0 3px 0 #00000012',
                '&:hover': { bgcolor: 'primary.lighter' },
              }}
            >
              <Iconify icon={pending ? 'ri:loader-4-line' : 'ri:download-2-line'} width={22} />
            </IconButton>
          </span>
        </Tooltip>
        <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError('')}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      {shareNotice && (
        <Alert severity="info" sx={{ mb: 1 }}>
          {shareNotice}
        </Alert>
      )}
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        justifyContent={shareEnabled ? { xs: 'center', md: 'flex-start' } : undefined}
        spacing={1}
        sx={
          shareEnabled ? { '& .MuiButton-root': { height: 42, borderRadius: '10px' } } : undefined
        }
      >
        <Button
          fullWidth={!shareEnabled}
          variant="contained"
          disabled={Boolean(pending)}
          onClick={() => handleCard('download')}
          startIcon={<Iconify icon="ri:download-2-line" />}
          sx={{
            minHeight: 46,
            borderRadius: '10px',
            boxShadow: '0 3px 0 #233F2B',
            '&:hover': { boxShadow: '0 3px 0 #233F2B' },
          }}
        >
          {pending === 'download' ? 'กำลังเตรียมการ์ด…' : 'ดาวน์โหลดการ์ด PNG'}
        </Button>
        {shareEnabled && (
          <Button
            variant="outlined"
            sx={{
              boxShadow: '0 3px 0 currentColor',
              '&:hover': { boxShadow: '0 3px 0 currentColor' },
            }}
            disabled={Boolean(pending)}
            onClick={() => handleCard('share')}
            aria-busy={pending === 'share'}
            startIcon={
              <Iconify icon={pending === 'share' ? 'ri:loader-4-line' : 'ri:share-forward-line'} />
            }
          >
            แชร์ภาพ
          </Button>
        )}
      </Stack>
      {shareEnabled && !shareNotice && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          ถ้าไม่มี Facebook หรือ Instagram ในเมนูแชร์ ให้ดาวน์โหลด PNG แล้วแนบรูปในแอป
        </Typography>
      )}
    </Box>
  );
}
