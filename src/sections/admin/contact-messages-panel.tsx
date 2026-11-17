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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMessage = messages.find((message) => message.id === selectedId);

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
        onClose={() => setSelectedId(null)}
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
                  component="a"
                  href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`}
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
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setSelectedId(null)}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
