'use client';

import type { FormEvent, ChangeEvent } from 'react';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  ACTIVITY_PHOTO_TYPES,
  ACTIVITY_PHOTO_MAX_BYTES,
  ACTIVITY_PHOTO_FILE_ERROR,
} from 'src/lib/activity-photo';

import { Iconify } from 'src/components/iconify';

import { FlavorPollShare } from './flavor-poll-share';

type SelectedPhoto = { file: File; url: string; submissionId: string };

const photoFrameSx = {
  display: 'block',
  width: 'auto',
  height: 'auto',
  maxWidth: 'min(84%, 350px)',
  maxHeight: 'min(48dvh, 350px)',
  my: 1,
  border: '6px solid',
  borderColor: 'common.white',
  borderRadius: '16px',
  boxShadow: '0 8px 20px #0003',
  transform: 'rotate(-3deg)',
};

export function ActivityPhotoForm({
  activityId,
  title,
  preview,
}: {
  activityId: string;
  title: string;
  preview: boolean;
}) {
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [submittedImage, setSubmittedImage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [publishPhoto, setPublishPhoto] = useState(false);
  const sendingRef = useRef(false);
  const photoUrl = photo?.url;

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl]
  );

  useEffect(
    () => () => {
      if (submittedImage) URL.revokeObjectURL(submittedImage);
    },
    [submittedImage]
  );

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (
      !file.size ||
      file.size > ACTIVITY_PHOTO_MAX_BYTES ||
      !ACTIVITY_PHOTO_TYPES.includes(file.type)
    ) {
      setPhoto(null);
      setError(ACTIVITY_PHOTO_FILE_ERROR);
      return;
    }
    setError('');
    setPhoto({ file, url: URL.createObjectURL(file), submissionId: crypto.randomUUID() });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      if (preview) {
        setSubmittedImage(URL.createObjectURL(photo.file));
        return;
      }
      const data = new FormData();
      data.set('image', photo.file);
      data.set('submissionId', photo.submissionId);
      if (publishPhoto) data.set('publishPhoto', 'on');
      const response = await fetch(`/api/activities/${activityId}/photo`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? 'ส่งภาพไม่สำเร็จ กรุณาลองอีกครั้ง');
      }
      setSubmittedImage(URL.createObjectURL(await response.blob()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ส่งภาพไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  if (submittedImage) {
    return (
      <Stack
        alignItems="center"
        spacing={2}
        sx={{ textAlign: 'center' }}
        role="region"
        aria-label="ส่งภาพสำเร็จ"
      >
        <Typography component="h2" variant="h4">
          ขอบคุณที่ร่วมกิจกรรม!
        </Typography>
        <Typography>{title}</Typography>
        <Box component="img" src={submittedImage} alt="ภาพที่คุณส่ง" sx={photoFrameSx} />
        <FlavorPollShare
          flavor={title}
          imageUrl={submittedImage}
          isPhoto
          secondaryAction={
            <Button
              type="button"
              variant="contained"
              onClick={() => {
                setSubmittedImage('');
                setPhoto(null);
                setPublishPhoto(false);
              }}
              sx={{
                bgcolor: 'common.white',
                color: 'var(--activity-primary)',
                minHeight: 48,
                borderRadius: '14px',
                '&:hover': { bgcolor: 'common.white' },
              }}
            >
              ส่งภาพใหม่
            </Button>
          }
        />
      </Stack>
    );
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2} alignItems="center">
      {preview && (
        <Typography variant="body2">โหมดพรีวิว รูปที่เลือกจะแสดงให้ดูโดยไม่ส่งเข้าระบบ</Typography>
      )}
      {photo && <Box component="img" src={photo.url} alt="ตัวอย่างภาพที่เลือก" sx={photoFrameSx} />}
      {photo && (
        <FormControlLabel
          control={
            <Checkbox
              checked={publishPhoto}
              disabled={sending}
              onChange={(event) => setPublishPhoto(event.target.checked)}
            />
          }
          label="อนุญาตให้แสดงภาพ ชื่อ และอวาตาร์ของฉันในหน้ารวมภาพกิจกรรม"
          sx={{
            m: 0,
            px: 1.25,
            borderRadius: 1.5,
            bgcolor: 'common.white',
            color: 'text.primary',
          }}
        />
      )}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        spacing={1.25}
      >
        <Button
          component="label"
          disabled={sending}
          variant="contained"
          disableElevation
          startIcon={<Iconify icon="ri:image-add-line" />}
          sx={{
            minHeight: 48,
            borderRadius: '999px',
            px: 2,
            bgcolor: photo ? '#FFFFFFA6' : 'common.white',
            color: 'text.primary',
            '&:hover': { bgcolor: 'common.white', filter: 'brightness(.96)' },
            '&:focus-within': { outline: '2px solid var(--activity-primary)', outlineOffset: -4 },
          }}
        >
          {photo ? 'เลือกรูปใหม่' : 'เลือกรูปถ่าย'}
          <Box
            component="input"
            type="file"
            accept={ACTIVITY_PHOTO_TYPES.join(',')}
            onChange={selectPhoto}
            disabled={sending}
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              inset: 0,
              opacity: 0,
              cursor: 'inherit',
            }}
          />
        </Button>
        {photo && (
          <Button
            type="submit"
            variant="contained"
            loading={sending}
            sx={{
              minWidth: 120,
              minHeight: 48,
              borderRadius: '999px',
              px: 2.5,
              bgcolor: 'common.white',
              color: 'text.primary',
              '&:hover': { bgcolor: 'common.white' },
            }}
          >
            {sending ? 'กำลังส่งภาพ' : 'ส่งภาพ'}
          </Button>
        )}
      </Stack>
      {!photo && <Typography variant="body2">{ACTIVITY_PHOTO_FILE_ERROR}</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
