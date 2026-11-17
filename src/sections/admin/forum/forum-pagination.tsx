'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import TablePagination from '@mui/material/TablePagination';

export function ForumPagination({
  page,
  count,
  rowsPerPage,
}: {
  page: number;
  count: number;
  rowsPerPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigate = (nextPage: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage + 1));
    params.set('pageSize', String(size));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return (
    <TablePagination
      component="div"
      page={page - 1}
      count={count}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50]}
      onPageChange={(_, nextPage) => navigate(nextPage, rowsPerPage)}
      onRowsPerPageChange={(event) => navigate(0, Number(event.target.value))}
      labelRowsPerPage="แสดงต่อหน้า"
      labelDisplayedRows={({ from, to, count: total }) =>
        `${from}–${to} จาก ${total.toLocaleString('th-TH')}`
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
          px: { xs: 1, sm: 2 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          justifyContent: 'flex-end',
        },
        '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
      }}
    />
  );
}
