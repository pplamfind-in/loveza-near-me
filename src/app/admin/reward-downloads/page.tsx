import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

export const metadata = { title: 'ประวัติดาวน์โหลดการ์ด | Loveza Admin' };

const pageSize = 50;
const dateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'Asia/Bangkok',
});

export default async function RewardDownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;

  const { page } = await searchParams;
  const requestedPage = typeof page === 'string' ? Number(page) : 1;
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1_000_000
      ? requestedPage
      : 1;
  const offset = (currentPage - 1) * pageSize;

  const { data, count, error } = await supabase
    .from('admin_reward_download_history')
    .select('*', { count: 'exact' })
    .order('downloaded_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize - 1);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={2.5}>
        <div>
          <Typography component="h1" variant="h4">
            ประวัติดาวน์โหลดการ์ด
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            บันทึกเมื่อระบบส่งไฟล์ PNG สำหรับดาวน์โหลด · เวลาไทย
          </Typography>
        </div>
        {error ? (
          <Alert severity="error">โหลดประวัติดาวน์โหลดไม่สำเร็จ</Alert>
        ) : (
          <>
            <Typography variant="body2">
              ดาวน์โหลดทั้งหมด {(count ?? 0).toLocaleString('th-TH')} ครั้ง
            </Typography>
            <Card>
              <TableContainer>
                <Table size="small" aria-label="ประวัติดาวน์โหลดการ์ด" sx={{ minWidth: 760 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ผู้ดาวน์โหลด</TableCell>
                      <TableCell>การ์ด</TableCell>
                      <TableCell align="right">โหลดใบนี้</TableCell>
                      <TableCell align="right">โหลดรวมทุกใบ</TableCell>
                      <TableCell>วันและเวลา (ไทย)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((event) => (
                      <TableRow key={event.id} hover>
                        <TableCell component="th" scope="row">
                          {event.display_name}
                          <Typography display="block" variant="caption" color="text.secondary">
                            {event.user_id}
                          </Typography>
                        </TableCell>
                        <TableCell>{event.reward_name}</TableCell>
                        <TableCell align="right">
                          {Number(event.user_reward_downloads).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell align="right">
                          {Number(event.user_downloads).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell>{dateTime.format(new Date(event.downloaded_at))}</TableCell>
                      </TableRow>
                    ))}
                    {!data?.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          ไม่มีรายการในหน้านี้
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
            <Stack direction="row" spacing={1}>
              {currentPage > 1 && <Button href={`?page=${currentPage - 1}`}>ก่อนหน้า</Button>}
              {offset + pageSize < (count ?? 0) && (
                <Button href={`?page=${currentPage + 1}`}>ถัดไป</Button>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </DashboardContent>
  );
}
