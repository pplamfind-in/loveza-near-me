import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';
import { formatAnnouncementDate } from 'src/lib/announcements';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

import { Iconify } from 'src/components/iconify';

import { DeleteAnnouncementButton } from './delete-button';

export default async function AdminAnnouncementsPage() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;

  const { data, error } = await supabase
    .from('system_announcements')
    .select('id, title, publish_at')
    .order('publish_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .order('id');
  if (error) throw new Error('โหลดรายการประกาศไม่สำเร็จ');
  const now = new Date().getTime();

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            ประกาศจากระบบ
          </Typography>
          <Button
            href="/admin/announcements/new"
            variant="contained"
            startIcon={<Iconify icon="ri:add-line" />}
          >
            สร้างประกาศ
          </Button>
        </Stack>
        <Card variant="outlined" sx={{ borderRadius: '16px' }}>
          <TableContainer>
            <Table aria-label="รายการประกาศ" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>หัวข้อ</TableCell>
                  <TableCell>วันที่เผยแพร่</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell align="right">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      ยังไม่มีประกาศ
                    </TableCell>
                  </TableRow>
                )}
                {data.map(({ id, title, publish_at: publishAt }) => {
                  const published = publishAt && Date.parse(publishAt) <= now;
                  return (
                    <TableRow key={id}>
                      <TableCell>{title}</TableCell>
                      <TableCell>{publishAt ? formatAnnouncementDate(publishAt) : '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={published ? 'success' : 'default'}
                          label={published ? 'เผยแพร่แล้ว' : publishAt ? 'ตั้งเวลาไว้' : 'แบบร่าง'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end">
                          <Button size="small" href={`/admin/announcements/${id}/edit`}>
                            แก้ไข
                          </Button>
                          <DeleteAnnouncementButton id={id} title={title} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
