'use client';

import { useId, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { deleteAnnouncement } from './actions';

export function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    setPending(true);
    setError('');
    try {
      const message = await deleteAnnouncement(id);
      if (message) setError(message);
      else setOpen(false);
    } catch {
      setError('ลบประกาศไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        color="error"
        aria-label={`ลบประกาศ ${title}`}
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        ลบ
      </Button>
      <Dialog
        open={open}
        onClose={pending ? undefined : () => setOpen(false)}
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>ลบประกาศนี้หรือไม่</DialogTitle>
        <DialogContent>
          {title}
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button color="error" loading={pending} onClick={remove}>
            ลบประกาศ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
