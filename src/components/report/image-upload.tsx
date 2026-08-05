'use client';

import { useRef, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded';

import {
  MAX_PHOTO_SIZE_BYTES,
  ACCEPTED_PHOTO_TYPES,
} from 'src/validations/report.schema';

// ----------------------------------------------------------------------

type ImageUploadProps = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export function ImageUpload({ file, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';

    if (!selected) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(selected.type)) {
      setError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP');
      return;
    }

    if (selected.size > MAX_PHOTO_SIZE_BYTES) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5 MB');
      return;
    }

    setError(null);
    onChange(selected);
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" fontWeight={700}>
        รูปภาพ (ไม่บังคับ)
      </Typography>

      {previewUrl ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack
            component="img"
            src={previewUrl}
            alt="รูปภาพที่เลือก"
            sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} noWrap>
            {file?.name}
          </Typography>
          <IconButton onClick={() => onChange(null)} aria-label="ลบรูปภาพ">
            <CloseRounded />
          </IconButton>
        </Stack>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={<AddPhotoAlternateRounded />}
          sx={{ alignSelf: 'flex-start' }}
        >
          เพิ่มรูปภาพ
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(',')}
            hidden
            onChange={handleFileSelect}
          />
        </Button>
      )}

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
