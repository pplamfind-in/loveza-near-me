'use client';

import type { ForumActionState } from 'src/app/forum/schema';

import Image from 'next/image';
import { useId, useRef, useState, useEffect, useActionState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { forumCategories } from 'src/app/forum/schema';
import { saveThread, deletePost, saveComment } from 'src/app/forum/actions';
import {
  getForumImageUrl,
  FORUM_IMAGE_TYPES,
  MAX_FORUM_IMAGE_SIZE,
} from 'src/lib/supabase/forum-image';

import { Iconify } from 'src/components/iconify';

export function ThreadForm({
  thread,
}: {
  thread?: {
    id: string;
    title: string;
    body: string;
    category: string;
    image_path?: string | null;
  };
}) {
  const [title, setTitle] = useState(thread?.title ?? '');
  const [body, setBody] = useState(thread?.body ?? '');
  const [category, setCategory] = useState(thread?.category ?? forumCategories[0]);
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [removeImage, setRemoveImage] = useState(false);
  const [photoError, setPhotoError] = useState('');
  useEffect(() => {
    if (!photo) {
      setPreview(undefined);
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const [state, action, pending] = useActionState(
    async (previous: ForumActionState, form: FormData) => {
      if (photo) form.set('image', photo);
      const result = await saveThread(previous, form);
      if (result.success) {
        setPhoto(null);
        setRemoveImage(false);
        if (input.current) input.current.value = '';
      }
      return result;
    },
    {}
  );
  const imageUrl = preview ?? (!removeImage ? getForumImageUrl(thread?.image_path) : undefined);
  return (
    <Stack component="form" action={action} spacing={2}>
      {thread && <input type="hidden" name="id" value={thread.id} />}
      <TextField
        name="title"
        label="หัวข้อกระทู้"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={pending}
        slotProps={{ htmlInput: { minLength: 3, maxLength: 150 } }}
      />
      <TextField
        name="category"
        label="หมวดหมู่"
        select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        disabled={pending}
      >
        {forumCategories.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        name="body"
        label="เล่าเรื่องของคุณ"
        multiline
        minRows={5}
        required
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={pending}
        slotProps={{ htmlInput: { minLength: 10, maxLength: 10000 } }}
      />
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          รูปภาพประกอบ (ไม่บังคับ) · 1 รูป
        </Typography>
        <input type="hidden" name="remove_image" value={String(removeImage)} />
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_FORUM_IMAGE_SIZE || !FORUM_IMAGE_TYPES.includes(file.type)) {
              setPhotoError('รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB');
              event.target.value = '';
              return;
            }
            setPhotoError('');
            setPhoto(file);
            setRemoveImage(false);
          }}
        />
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="ตัวอย่างรูปประกอบกระทู้"
            width={800}
            height={500}
            unoptimized
            style={{
              width: '100%',
              height: 220,
              objectFit: 'contain',
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
        )}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            disabled={pending}
            onClick={() => input.current?.click()}
            startIcon={<Iconify icon="ri:image-add-line" />}
          >
            {imageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูปภาพ'}
          </Button>
          {imageUrl && (
            <Button
              size="small"
              color="error"
              disabled={pending}
              onClick={() => {
                setPhoto(null);
                setRemoveImage(true);
                setPhotoError('');
                if (input.current) input.current.value = '';
              }}
            >
              ลบรูป
            </Button>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          รับ JPG, PNG หรือ WEBP สูงสุด 5MB · ระบบแปลงเป็น WebP ไม่เกิน 2MB ก่อนจัดเก็บ
        </Typography>
        {photoError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {photoError}
          </Alert>
        )}
      </Box>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.success && <Alert severity="success">{state.success}</Alert>}
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        sx={{ alignSelf: 'flex-end', px: 3, minHeight: 40 }}
      >
        {pending ? 'กำลังบันทึก…' : thread ? 'บันทึกการแก้ไข' : 'โพสต์กระทู้'}
      </Button>
    </Stack>
  );
}

export function CommentForm({
  threadId,
  parentId,
  comment,
  onSaved,
}: {
  threadId: string;
  parentId?: string;
  onSaved?: () => void;
  comment?: { id: string; body: string };
}) {
  const [body, setBody] = useState(comment?.body ?? '');
  const [state, action, pending] = useActionState(
    async (previous: ForumActionState, form: FormData) => {
      const result = await saveComment(previous, form);
      if (result.success) {
        if (!comment) setBody('');
        onSaved?.();
      }
      return result;
    },
    {}
  );
  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="thread_id" value={threadId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      {comment && <input type="hidden" name="id" value={comment.id} />}
      <TextField
        name="body"
        label={comment ? 'แก้ไขความคิดเห็น' : parentId ? 'เขียนคำตอบ' : 'เขียนความคิดเห็น'}
        required
        multiline
        minRows={2}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={pending}
        slotProps={{ htmlInput: { maxLength: 3000 } }}
      />
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.success && <Alert severity="success">{state.success}</Alert>}
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        sx={{ alignSelf: 'flex-end', px: 3, minHeight: 40 }}
      >
        {pending ? 'กำลังส่ง…' : comment ? 'บันทึก' : parentId ? 'ส่งคำตอบ' : 'ส่งความคิดเห็น'}
      </Button>
    </Stack>
  );
}

export function DeletePostButton({
  id,
  threadId,
  kind,
  controlledOpen,
  onClose,
  onDeleted,
}: {
  id: string;
  threadId?: string;
  kind: 'thread' | 'comment';
  controlledOpen?: boolean;
  onClose?: () => void;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const [state, action, pending] = useActionState(
    async (previous: ForumActionState, form: FormData) => {
      const result = await deletePost(previous, form);
      if (result.success) {
        close();
        onDeleted?.();
      }
      return result;
    },
    {}
  );
  return (
    <>
      {controlledOpen === undefined && (
        <Button
          color="error"
          variant="text"
          size="small"
          startIcon={<Iconify icon="ri:delete-bin-6-line" width={18} />}
          sx={{ borderRadius: 1.5, minHeight: 36, px: 1.5, flexShrink: 0 }}
          onClick={() => setOpen(true)}
        >
          ลบ{kind === 'thread' ? 'กระทู้' : 'ความคิดเห็น'}
        </Button>
      )}
      <Dialog
        open={controlledOpen ?? open}
        onClose={() => {
          if (!pending) close();
        }}
      >
        <DialogTitle>
          ยืนยันการลบ
          {kind === 'thread'
            ? 'กระทู้และความคิดเห็นทั้งหมด'
            : 'ความคิดเห็นและคำตอบที่อยู่ใต้ความคิดเห็นนี้'}
          ?
        </DialogTitle>
        <Stack component="form" action={action} sx={{ p: 2 }} spacing={2}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="thread_id" value={threadId ?? ''} />
          {state.error && <Alert severity="error">{state.error}</Alert>}
          {state.success && <Alert severity="success">{state.success}</Alert>}
          <DialogActions>
            <Button onClick={close} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" color="error" disabled={pending}>
              {pending ? 'กำลังลบ…' : 'ยืนยันลบ'}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
}

export function ForumPostActions({
  thread,
  comment,
  threadId,
  onChanged,
}: {
  thread?: {
    id: string;
    title: string;
    body: string;
    category: string;
    image_path?: string | null;
  };
  comment?: { id: string; body: string };
  threadId: string;
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const post = thread ?? comment;
  if (!post) return null;

  return (
    <>
      <IconButton
        size="small"
        aria-label={thread ? 'จัดการกระทู้' : 'จัดการความคิดเห็น'}
        aria-controls={anchor ? menuId : undefined}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon="ri:more-fill" width={22} />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setEditing(true);
          }}
        >
          <Iconify icon="ri:edit-2-line" width={18} sx={{ mr: 1 }} /> แก้ไข
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setAnchor(null);
            setDeleting(true);
          }}
        >
          <Iconify icon="ri:delete-bin-6-line" width={18} sx={{ mr: 1 }} /> ลบ
        </MenuItem>
      </Menu>
      <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          แก้ไข{thread ? 'กระทู้' : 'ความคิดเห็น'}
          <IconButton aria-label="ปิดหน้าต่างแก้ไข" onClick={() => setEditing(false)}>
            <Iconify icon="ri:close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important', pb: 4 }}>
          {thread ? (
            <ThreadForm thread={thread} />
          ) : (
            <CommentForm
              threadId={threadId}
              comment={comment}
              onSaved={() => {
                setEditing(false);
                onChanged?.();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <DeletePostButton
        id={post.id}
        threadId={threadId}
        kind={thread ? 'thread' : 'comment'}
        onDeleted={onChanged}
        controlledOpen={deleting}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}

export function CreateThreadButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="contained"
        startIcon={<Iconify icon="ri:add-line" width={20} />}
        onClick={() => setOpen(true)}
        sx={{ flexShrink: 0, px: 2.5, minHeight: 42 }}
      >
        ตั้งกระทู้ใหม่
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          ตั้งกระทู้ใหม่
          <IconButton aria-label="ปิดหน้าต่างตั้งกระทู้" onClick={() => setOpen(false)}>
            <Iconify icon="ri:close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important', pb: 4 }}>
          <ThreadForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
