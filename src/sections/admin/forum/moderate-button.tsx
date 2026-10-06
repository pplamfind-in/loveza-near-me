'use client';

import { useState, useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { moderateForum, setForumVisibility } from 'src/app/admin/forum/actions';

export function ModerateButton({
  id,
  threadId,
  kind,
}: {
  id: string;
  threadId: string;
  kind: 'thread' | 'comment';
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(moderateForum, {});
  return (
    <>
      <Button size="small" color="error" variant="outlined" onClick={() => setOpen(true)}>
        ลบ{kind === 'thread' ? 'กระทู้' : 'ความคิดเห็น'}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>ยืนยันการลบ{kind === 'thread' ? 'กระทู้' : 'ความคิดเห็น'}?</DialogTitle>
        <Stack component="form" action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="thread_id" value={threadId} />
          <input type="hidden" name="kind" value={kind} />
          <DialogContent>
            {kind === 'thread'
              ? 'ความคิดเห็น คำตอบ และรูปภาพของกระทู้จะถูกลบด้วย'
              : 'คำตอบใต้ความคิดเห็นนี้จะถูกลบด้วย'}
            {state.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {state.error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" color="error" variant="contained" disabled={pending}>
              {pending ? 'กำลังลบ…' : 'ยืนยันลบ'}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
}

export function VisibilityButton({
  id,
  threadId,
  kind,
  hidden,
}: {
  id: string;
  threadId: string;
  kind: 'thread' | 'comment';
  hidden: boolean;
}) {
  const [state, action, pending] = useActionState(setForumVisibility, {});
  return (
    <Stack component="form" action={action} spacing={1}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="thread_id" value={threadId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="hidden" value={String(!hidden)} />
      <Button
        type="submit"
        size='medium'
        color={hidden ? 'success' : 'warning'}
        variant="outlined"
        disabled={pending}
      >
        {pending ? 'กำลังบันทึก…' : hidden ? 'เลิกซ่อน' : 'ซ่อน'}
      </Button>
      {state.error && <Alert severity="error">{state.error}</Alert>}
    </Stack>
  );
}
