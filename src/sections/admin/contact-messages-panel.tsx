'use client';

import type { ContactMessageStatus } from 'src/types/contact-message';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import {
  useAdminMessagesQuery,
  useUpdateMessageStatusMutation,
} from 'src/app/admin/messages/use-admin-messages';

import { Iconify } from 'src/components/iconify';

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: 'ข้อความใหม่',
  read: 'อ่านแล้ว',
  resolved: 'ดำเนินการแล้ว',
};

type FilterValue = 'all' | ContactMessageStatus;

export function ContactMessagesPanel() {
  const {
    data: messages = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminMessagesQuery();
  const updateStatus = useUpdateMessageStatusMutation();
  const [filter, setFilter] = useState<FilterValue>('all');

  const visibleMessages =
    filter === 'all' ? messages : messages.filter((message) => message.status === filter);
  const newCount = messages.filter((message) => message.status === 'new').length;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
          ข้อความติดต่อ
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
          ข้อความจากแบบฟอร์มหน้าเว็บไซต์ · มีข้อความใหม่ {newCount} รายการ
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {(
            [
              ['all', 'ทั้งหมด'],
              ['new', 'ข้อความใหม่'],
              ['read', 'อ่านแล้ว'],
              ['resolved', 'ดำเนินการแล้ว'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="small"
              variant={filter === value ? 'contained' : 'outlined'}
              onClick={() => setFilter(value)}
              sx={{ borderRadius: 99 }}
            >
              {label}
            </Button>
          ))}
        </Stack>

        <Button
          size="small"
          color="inherit"
          variant="text"
          disabled={isFetching}
          onClick={() => refetch()}
          startIcon={
            isFetching ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="ri:refresh-line" />
            )
          }
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          {isFetching ? 'กำลังอัปเดต' : 'อัปเดตข้อมูล'}
        </Button>
      </Stack>

      {isError || updateStatus.isError ? (
        <Alert severity="error">
          {updateStatus.error?.message ?? error?.message ?? 'โหลดข้อความไม่สำเร็จ'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Stack spacing={2}>
          {visibleMessages.map((message) => (
            <Paper
              key={message.id}
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                border: '1px solid',
                borderColor: message.status === 'new' ? 'primary.main' : 'divider',
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ fontSize: 19, fontWeight: 900 }}>
                      {message.subject}
                    </Typography>
                    <Chip
                      size="small"
                      color={
                        message.status === 'new'
                          ? 'primary'
                          : message.status === 'resolved'
                            ? 'success'
                            : 'default'
                      }
                      label={STATUS_LABELS[message.status]}
                    />
                  </Stack>
                  <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 13 }}>
                    {message.name} · {message.email} ·{' '}
                    {new Intl.DateTimeFormat('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(message.created_at))}
                  </Typography>
                  <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {message.message}
                  </Typography>
                </Box>

                <Stack spacing={1} sx={{ minWidth: { md: 180 } }}>
                  <Button
                    component="a"
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                    variant="contained"
                    startIcon={<Iconify icon="ri:reply-fill" />}
                  >
                    ตอบกลับทางอีเมล
                  </Button>
                  {message.status === 'new' ? (
                    <Button
                      variant="outlined"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: message.id, status: 'read' })}
                    >
                      ทำเครื่องหมายว่าอ่านแล้ว
                    </Button>
                  ) : null}
                  {message.status !== 'resolved' ? (
                    <Button
                      color="success"
                      variant="outlined"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: message.id, status: 'resolved' })}
                    >
                      ดำเนินการแล้ว
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      variant="text"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: message.id, status: 'read' })}
                    >
                      เปิดเรื่องอีกครั้ง
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}

          {visibleMessages.length === 0 ? (
            <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
              <Iconify icon="ri:inbox-2-line" width={48} sx={{ color: 'text.disabled' }} />
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                ยังไม่มีข้อความในหมวดนี้
              </Typography>
            </Paper>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}
