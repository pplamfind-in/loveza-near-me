import type { NavSectionProps } from 'src/components/nav-section';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

const navIcon = (name: string) => <Iconify icon={name} width={24} />;

export function getAdminNavData(pendingReportsCount = 0): NavSectionProps['data'] {
  const pendingLabel =
    pendingReportsCount > 99 ? '99+' : pendingReportsCount.toLocaleString('th-TH');

  return [
    {
      subheader: 'จัดการข้อมูล',
      items: [
        {
          title: 'ภาพรวม',
          path: '/admin',
          icon: navIcon('ri:dashboard-3-fill'),
        },
        {
          title: 'ตรวจสอบพิกัด',
          path: '/admin/reports',
          icon: navIcon('ri:map-pin-user-fill'),
          info:
            pendingReportsCount > 0 ? (
              <Label
                color="warning"
                variant="inverted"
                title={`${pendingReportsCount.toLocaleString('th-TH')} รายการรอตรวจสอบ`}
              >
                {pendingLabel}
              </Label>
            ) : undefined,
        },
        {
          title: 'พิกัดทั้งหมด',
          path: '/admin/locations',
          icon: navIcon('ri:map-2-fill'),
        },
        {
          title: 'รางวัลนักสำรวจ',
          path: '/admin/rewards',
          icon: navIcon('ri:gift-2-line'),
        },
        {
          title: 'เงื่อนไขรางวัล',
          path: '/admin/reward-rules',
          icon: navIcon('ri:list-check-3'),
        },
        {
          title: 'เลเวลนักสำรวจ',
          path: '/admin/explorer-levels',
          icon: navIcon('ri:bar-chart-box-line'),
        },
        {
          title: 'จัดการสินค้า',
          path: '/admin/products',
          icon: navIcon('ri:drinks-2-fill'),
        },
        {
          title: 'จัดการแบนเนอร์',
          path: '/admin/banners',
          icon: navIcon('ri:image-2-fill'),
        },
        {
          title: 'ร้านค้า',
          path: '/admin/store-types',
          icon: navIcon('ri:store-3-fill'),
        },
        {
          title: 'ผู้ใช้งาน',
          path: '/admin/users',
          icon: navIcon('ri:group-fill'),
        },
        {
          title: 'จัดการกระทู้',
          path: '/admin/forum',
          deepMatch: true,
          icon: navIcon('ri:chat-3-fill'),
        },
        {
          title: 'ข้อความติดต่อ',
          path: '/admin/messages',
          icon: navIcon('ri:mail-unread-fill'),
        },
        {
          title: 'สถิติการเข้าใช้งาน',
          path: '/admin/analytics',
          icon: navIcon('ri:line-chart-fill'),
        },
        {
          title: 'ตั้งค่าระบบ',
          path: '/admin/settings',
          icon: navIcon('ri:settings-3-fill'),
        },
        {
          title: 'คู่มือระบบ',
          path: '/admin/guide',
          icon: navIcon('ri:book-2-fill'),
        },
      ],
    },
  ];
}
