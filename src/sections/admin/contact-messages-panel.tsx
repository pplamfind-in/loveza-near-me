'use client';

import type { ContactMessageStatus } from 'src/types/contact-message';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { buildContactReplyEmail } from 'src/lib/contact-reply-email';
import {
  useAdminMessagesQuery,
  useReplyToMessageMutation,
  useUpdateMessageStatusMutation,
} from 'src/app/admin/messages/use-admin-messages';

import { Iconify } from 'src/components/iconify';

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: 'ข้อความใหม่',
  read: 'อ่านแล้ว',
  resolved: 'ดำเนินการแล้ว',
};

type FilterValue = 'all' | ContactMessageStatus;

export function ContactMessagesPanel({
  replySender,
  replyConfigured,
  replySiteUrl,
}: {
  replySender: { name: string; address: string } | null;
  replyConfigured: boolean;
  replySiteUrl: string;
}) {
  const {
    data: messages = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminMessagesQuery();
  const updateStatus = useUpdateMessageStatusMutation();
  const sendReply = useReplyToMessageMutation();
  const [composing, setComposing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMessage = messages.find((message) => message.id === selectedId);

  const closeMessage = () => {
    if (sendReply.isPending) return;
    sendReply.reset();
    setComposing(false);
    setReplyText('');
    setSelectedId(null);
  };

  const visibleMessages =
    filter === 'all' ? messages : messages.filter((message) => message.status === filter);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(visibleMessages.length / rowsPerPage) - 1)
  );
  const pageMessages = visibleMessages.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );
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
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
              sx={{ borderRadius: '12px' }}
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
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table sx={{ minWidth: 920 }} aria-label="ข้อความติดต่อ">
            <TableHead>
              <TableRow>
                <TableCell>หัวข้อ / ข้อความ</TableCell>
                <TableCell>ผู้ติดต่อ</TableCell>
                <TableCell>วันที่ส่ง</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="right">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageMessages.map((message) => (
                <TableRow key={message.id} hover>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Button
                      variant="text"
                      color="inherit"
                      onClick={() => setSelectedId(message.id)}
                      sx={{
                        p: 0,
                        minHeight: 0,
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        fontWeight: message.status === 'new' ? 800 : 600,
                      }}
                    >
                      {message.subject}
                    </Button>
                    <Typography
                      noWrap
                      sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary', maxWidth: 320 }}
                    >
                      {message.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{message.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {message.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Intl.DateTimeFormat('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Bangkok',
                    }).format(new Date(message.created_at))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[message.status]}
                      color={
                        message.status === 'new'
                          ? 'primary'
                          : message.status === 'resolved'
                            ? 'success'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedId(message.id)}
                      startIcon={<Iconify icon="ri:mail-open-line" />}
                    >
                      อ่านข้อความ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visibleMessages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    ยังไม่มีข้อความในหมวดนี้
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            page={currentPage}
            count={visibleMessages.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            labelRowsPerPage="แสดงต่อหน้า"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} จาก ${count.toLocaleString('th-TH')}`
            }
            getItemAriaLabel={(type) =>
              ({
                first: 'ไปหน้าแรก',
                last: 'ไปหน้าสุดท้าย',
                next: 'ไปหน้าถัดไป',
                previous: 'ไปหน้าก่อนหน้า',
              })[type]
            }
            showFirstButton
            showLastButton
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-toolbar': {
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: 'flex-end',
              },
            }}
          />
        </TableContainer>
      )}
      <Dialog
        open={Boolean(selectedMessage)}
        onClose={closeMessage}
        fullWidth
        maxWidth="md"
        aria-labelledby="contact-message-title"
      >
        <DialogTitle id="contact-message-title">รายละเอียดข้อความ</DialogTitle>
        <DialogContent>
          {updateStatus.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatus.error.message}
            </Alert>
          )}
          {selectedMessage && (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontSize: 19, fontWeight: 900 }}>
                    {selectedMessage.subject}
                  </Typography>
                  <Chip
                    size="small"
                    color={
                      selectedMessage.status === 'new'
                        ? 'primary'
                        : selectedMessage.status === 'resolved'
                          ? 'success'
                          : 'default'
                    }
                    label={STATUS_LABELS[selectedMessage.status]}
                  />
                </Stack>
                <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 13 }}>
                  {selectedMessage.name} · {selectedMessage.email} ·{' '}
                  {new Intl.DateTimeFormat('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(selectedMessage.created_at))}
                </Typography>
                <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {selectedMessage.message}
                </Typography>
              </Box>

              <Stack spacing={1} sx={{ minWidth: { md: 180 } }}>
                <Button
                  onClick={() => {
                    sendReply.reset();
                    setComposing(true);
                  }}
                  disabled={composing}
                  variant="contained"
                  startIcon={<Iconify icon="ri:reply-fill" />}
                >
                  ตอบกลับทางอีเมล
                </Button>
                {selectedMessage.status === 'new' ? (
                  <Button
                    variant="outlined"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: selectedMessage.id, status: 'read' })}
                  >
                    ทำเครื่องหมายว่าอ่านแล้ว
                  </Button>
                ) : null}
                {selectedMessage.status !== 'resolved' ? (
                  <Button
                    color="success"
                    variant="outlined"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ id: selectedMessage.id, status: 'resolved' })
                    }
                  >
                    ดำเนินการแล้ว
                  </Button>
                ) : (
                  <Button
                    color="inherit"
                    variant="text"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: selectedMessage.id, status: 'read' })}
                  >
                    เปิดเรื่องอีกครั้ง
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
          {sendReply.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Gmail รับอีเมลตอบกลับแล้ว
            </Alert>
          )}
          {selectedMessage && composing && (
            <Stack
              component="form"
              spacing={2}
              sx={{ mt: 3 }}
              onSubmit={(event) => {
                event.preventDefault();
                if (!replyConfigured || sendReply.isPending || !replyText.trim()) return;
                sendReply.mutate(
                  { id: selectedMessage.id, text: replyText },
                  {
                    onSuccess: () => {
                      setReplyText('');
                      setComposing(false);
                    },
                  }
                );
              }}
            >
              <Box
                component="dl"
                sx={{
                  m: 0,
                  p: 2,
                  display: 'grid',
                  gridTemplateColumns: 'max-content minmax(0, 1fr)',
                  gap: 1,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  typography: 'body2',
                  '& dt': { fontWeight: 700 },
                  '& dd': { m: 0, overflowWrap: 'anywhere' },
                }}
              >
                <dt>จาก</dt>
                <dd>
                  {replySender
                    ? `${replySender.name} <${replySender.address}>`
                    : 'ยังไม่ได้ตั้งค่าอีเมลผู้ส่ง'}
                </dd>
                <dt>ถึง</dt>
                <dd>{selectedMessage.email}</dd>
                <dt>หัวข้อ</dt>
                <dd>Re: {selectedMessage.subject.replace(/[\r\n]+/g, ' ')}</dd>
              </Box>
              {!replyConfigured && (
                <Alert
                  severity="warning"
                  action={
                    <Button href="/admin/settings/" color="inherit" size="small">
                      ไปที่การตั้งค่า
                    </Button>
                  }
                >
                  ตั้งค่าบัญชี Gmail SMTP ก่อนส่งอีเมล
                </Alert>
              )}
              <TextField
                autoFocus
                required
                multiline
                minRows={4}
                label="ข้อความตอบกลับ"
                value={replyText}
                disabled={sendReply.isPending}
                onChange={(event) => setReplyText(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 5000 } }}
              />
              <Box
                component="details"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                }}
              >
                <Typography
                  component="summary"
                  variant="subtitle2"
                  sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
                >
                  ดูตัวอย่างอีเมล
                </Typography>
                <Box
                  component="iframe"
                  title="ตัวอย่างอีเมลตอบกลับ Loveza Hunt"
                  sandbox="allow-same-origin"
                  loading="lazy"
                  srcDoc={
                    buildContactReplyEmail({
                      name: selectedMessage.name,
                      subject: selectedMessage.subject,
                      message: replyText.trim() || 'ข้อความตอบกลับของคุณจะแสดงตรงนี้',
                      siteUrl: replySiteUrl,
                      assetBaseUrl: '',
                    }).html
                  }
                  sx={{
                    display: 'block',
                    width: 1,
                    height: { xs: 440, md: 520 },
                    border: 0,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              </Box>
              {sendReply.isError && <Alert severity="error">{sendReply.error.message}</Alert>}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  type="button"
                  disabled={sendReply.isPending}
                  onClick={() => {
                    sendReply.reset();
                    setComposing(false);
                    setReplyText('');
                  }}
                >
                  ยกเลิกการตอบกลับ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  loading={sendReply.isPending}
                  disabled={!replyConfigured || !replyText.trim()}
                >
                  ส่งอีเมล
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={sendReply.isPending} onClick={closeMessage}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
