'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { flavorPollPublicationLabel } from 'src/lib/flavor-poll-schedule';
import { deleteFlavorPoll, setFlavorPollActive } from 'src/app/admin/flavor-polls/actions';

import { Iconify } from 'src/components/iconify';

const adminPath = '/admin/flavor-polls/';
const feedback = {
  invalid: {
    severity: 'error',
    text: 'ข้อมูลกิจกรรมไม่ถูกต้อง',
  },
  error: { severity: 'error', text: 'บันทึกกิจกรรมไม่สำเร็จ' },
  created: { severity: 'success', text: 'สร้างและเผยแพร่กิจกรรมแล้ว' },
  'draft-saved': { severity: 'success', text: 'บันทึกแบบร่างแล้ว' },
  scheduled: { severity: 'success', text: 'สร้างกิจกรรมและบันทึกกำหนดเผยแพร่แล้ว' },
  closed: { severity: 'success', text: 'ปิดกิจกรรมแล้ว' },
  updated: { severity: 'success', text: 'อัปเดตกิจกรรมแล้ว' },
  deleted: { severity: 'success', text: 'ลบกิจกรรมแล้ว' },
  'confirm-delete': { severity: 'warning', text: 'กรุณายืนยันก่อนลบกิจกรรม' },
} as const;

type Poll = {
  id: string;
  title: string;
  type: 'poll' | 'matching';
  active: boolean;
  status: keyof typeof flavorPollPublicationLabel;
  startsAt: string | null;
  endsAt: string | null;
  options: { label: string; votes: number }[];
};

type FlavorPollsPanelProps = {
  polls: Poll[];
  status?: string;
  pollsError: boolean;
  totalsError: boolean;
};

export function FlavorPollsPanel({
  polls,
  status,
  pollsError,
  totalsError,
}: FlavorPollsPanelProps) {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const selectedId = searchParams.get('id');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(polls.length / rowsPerPage) - 1));
  const selected = polls.find((poll) => poll.id === selectedId);
  const selectedVoteTotal = selected?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0;
  const notice =
    status && Object.hasOwn(feedback, status) ? feedback[status as keyof typeof feedback] : null;
  const closeDialog = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    url.searchParams.delete('id');
    window.history.replaceState(null, '', url);
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            จัดการกิจกรรม
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการโพลและเกมจับคู่บนหน้าแรก
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`${adminPath}new/`}
          scroll={false}
          variant="contained"
          startIcon={<Iconify icon="ri:add-line" />}
        >
          เพิ่มกิจกรรม
        </Button>
      </Stack>


      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
        <Table sx={{ minWidth: 680 }} aria-label="รายการกิจกรรม">
          <TableHead>
            <TableRow>
              <TableCell>กิจกรรม</TableCell>
              <TableCell align="center">ตัวเลือก</TableCell>
              <TableCell align="center">ผลโหวตรวม</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {polls.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage).map((poll) => (
              <TableRow key={poll.id} hover>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}
                >
                  {poll.title}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {poll.type === 'matching' ? 'เกมจับคู่' : 'โพล'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {poll.options.length}
                  {poll.type === 'matching' ? ' คู่' : ''}
                </TableCell>
                <TableCell align="center">
                  {totalsError || poll.type === 'matching'
                    ? '—'
                    : poll.options
                        .reduce((sum, option) => sum + option.votes, 0)
                        .toLocaleString('th-TH')}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={
                      poll.status === 'published'
                        ? 'success'
                        : poll.status === 'upcoming'
                          ? 'info'
                          : 'default'
                    }
                    label={flavorPollPublicationLabel[poll.status]}
                  />
                  {poll.status === 'published' && (
                    <Typography
                      display="block"
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {poll.type === 'matching'
                        ? poll.active
                          ? 'เล่นได้'
                          : 'ปิดเกม'
                        : poll.active
                          ? 'เปิดโหวต'
                          : 'ปิดโหวต'}
                    </Typography>
                  )}
                  {(poll.startsAt || poll.endsAt) && (
                    <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                      {poll.startsAt && (
                        <Typography variant="caption" color="text.secondary">
                          เริ่ม {poll.startsAt} น.
                        </Typography>
                      )}
                      {poll.endsAt && (
                        <Typography variant="caption" color="text.secondary">
                          สิ้นสุด {poll.endsAt} น.
                        </Typography>
                      )}
                    </Stack>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end">
                    {[
                      {
                        action: 'results',
                        icon: 'ri:bar-chart-box-line',
                        label: 'ดูผลโหวต',
                        color: 'default',
                      },
                      { action: 'edit', icon: 'ri:edit-2-line', label: 'แก้ไข', color: 'default' },
                      {
                        action: 'delete',
                        icon: 'ri:delete-bin-6-line',
                        label: 'ลบ',
                        color: 'error',
                      },
                    ].map((item) => (
                      <Tooltip
                        key={item.action}
                        title={
                          item.action === 'results' && poll.type === 'matching'
                            ? 'ดูข้อมูลเกม'
                            : item.label
                        }
                      >
                        <IconButton
                          component={Link}
                          href={
                            item.action === 'edit'
                              ? `${adminPath}${encodeURIComponent(poll.id)}/edit/`
                              : `${adminPath}?action=${item.action}&id=${encodeURIComponent(poll.id)}`
                          }
                          prefetch={false}
                          scroll={false}
                          onClick={(event) => {
                            if (
                              item.action === 'edit' ||
                              event.metaKey ||
                              event.ctrlKey ||
                              event.shiftKey ||
                              event.altKey
                            )
                              return;
                            event.preventDefault();
                            const url = new URL(window.location.href);
                            url.searchParams.set('action', item.action);
                            url.searchParams.set('id', poll.id);
                            window.history.replaceState(null, '', url);
                          }}
                          aria-label={`${item.action === 'results' && poll.type === 'matching' ? 'ดูข้อมูลเกม' : item.label} ${poll.title}`}
                          color={item.color === 'error' ? 'error' : 'default'}
                        >
                          <Iconify icon={item.icon} />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!polls.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  {pollsError
                    ? 'โหลดรายการกิจกรรมไม่สำเร็จ'
                    : 'ยังไม่มีกิจกรรม กด “เพิ่มกิจกรรม” เพื่อเริ่มต้น'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={polls.length}
          page={currentPage}
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
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': { flexWrap: 'wrap' },
          }}
        />
      </TableContainer>

      <Dialog
        open={action === 'results' && Boolean(selected)}
        transitionDuration={{ exit: 100 }}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="activity-results-title"
      >
        <DialogTitle id="activity-results-title">
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.lighter',
                color: 'primary.dark',
                flexShrink: 0,
              }}
            >
              <Iconify icon="ri:bar-chart-box-line" width={22} />
            </Box>
            <span>{selected?.type === 'matching' ? 'เกมจับคู่' : 'ผลโหวตกิจกรรม'}</span>
          </Stack>
        </DialogTitle>
        {selected && (
          <>
            <DialogContent>
              <Stack spacing={1.25} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ overflowWrap: 'anywhere' }}>
                  {selected.title}
                </Typography>
                <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                  <Chip
                    size="small"
                    color={selected.status === 'published' ? 'success' : 'default'}
                    label={flavorPollPublicationLabel[selected.status]}
                  />
                  {selected.status === 'published' && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        selected.type === 'matching'
                          ? selected.active
                            ? 'เล่นได้'
                            : 'ปิดเกม'
                          : selected.active
                            ? 'เปิดโหวต'
                            : 'ปิดโหวต'
                      }
                    />
                  )}
                </Stack>
              </Stack>
              {selected.type === 'matching' ? (
                <Typography variant="body2" color="text.secondary">
                  เกมนี้มีการ์ดทั้งหมด {selected.options.length} คู่
                </Typography>
              ) : totalsError ? (
                <Alert severity="error">โหลดผลโหวตไม่สำเร็จ</Alert>
              ) : (
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.lighter',
                      color: 'primary.dark',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">คะแนนโหวตรวม</Typography>
                      {!selectedVoteTotal && (
                        <Typography variant="caption" color="text.secondary">
                          ยังไม่มีผู้โหวต
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      variant="h5"
                      component="span"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {selectedVoteTotal.toLocaleString('th-TH')}
                    </Typography>
                  </Stack>
                  <Stack component="ul" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                    {selected.options.map(({ label, votes }) => {
                      const share = selectedVoteTotal ? (votes / selectedVoteTotal) * 100 : 0;
                      return (
                        <Stack
                          key={label}
                          component="li"
                          spacing={0.75}
                          sx={{
                            p: 1.25,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="baseline"
                            spacing={1}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
                            >
                              {label}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {votes.toLocaleString('th-TH')} โหวต ·{' '}
                              {share.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={share}
                            aria-hidden="true"
                            sx={{
                              height: 5,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { borderRadius: 1 },
                            }}
                          />
                        </Stack>
                      );
                    })}
                  </Stack>
                </Stack>
              )}
            </DialogContent>
            <DialogActions
              sx={{ borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}
            >
              <Button color="inherit" onClick={closeDialog}>
                ปิดหน้าต่าง
              </Button>
              {(selected.status === 'published' ||
                selected.status === 'upcoming' ||
                selected.status === 'closed') && (
                <form action={setFlavorPollActive.bind(null, selected.id, !selected.active)}>
                  <Button
                    type="submit"
                    variant="outlined"
                    color={selected.active ? 'warning' : 'primary'}
                  >
                    {selected.type === 'matching'
                      ? selected.active
                        ? 'ปิดเกม'
                        : 'เปิดเกมอีกครั้ง'
                      : selected.active
                        ? 'ปิดโหวต'
                        : 'เปิดโหวตอีกครั้ง'}
                  </Button>
                </form>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={action === 'delete' && Boolean(selected)}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        aria-labelledby="activity-delete-title"
      >
        <DialogTitle id="activity-delete-title">ลบกิจกรรมนี้ใช่ไหม?</DialogTitle>
        {selected && (
          <Box component="form" action={deleteFlavorPoll.bind(null, selected.id)}>
            <DialogContent>
              <Typography sx={{ mb: 2, fontWeight: 800 }}>{selected.title}</Typography>
              <Typography component="label" variant="body2">
                <input type="checkbox" name="confirmDelete" required />{' '}
                ยืนยันลบกิจกรรมนี้และผลโหวตทั้งหมด
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button type="button" color="inherit" onClick={closeDialog}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="contained" color="error">
                ลบกิจกรรม
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Stack>
  );
}
