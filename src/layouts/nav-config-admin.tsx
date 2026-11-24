import type { NavSectionProps } from 'src/components/nav-section';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

const navIcon = (name: string) => <Iconify icon={name} width={24} />;

export function getAdminNavData(pendingReportsCount = 0): NavSectionProps['data'] {
  const pendingLabel =
    pendingReportsCount > 99 ? '99+' : pendingReportsCount.toLocaleString('th-TH');

  return [
    {
      subheader: 'ภาพรวม',
      items: [
        {
          title: 'ภาพรวม',
          path: '/admin',
          icon: navIcon('ri:dashboard-3-line'),
        },
        {
          title: 'สถิติการเข้าใช้งาน',
          path: '/admin/analytics',
          icon: navIcon('ri:line-chart-line'),
        },
        {
          title: 'ประกาศจากระบบ',
          path: '/admin/announcements',
          deepMatch: true,
          icon: navIcon('ri:megaphone-line'),
        },
        {
          title: 'กิจกรรม',
          path: '/admin/flavor-polls',
          deepMatch: true,
          icon: navIcon('ri:bar-chart-box-line'),
        },
      ],
    },
    {
      subheader: 'พิกัดและร้านค้า',
      items: [
        {
          title: 'ตรวจสอบพิกัด',
          path: '/admin/reports',
          icon: navIcon('ri:map-pin-user-line'),
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
          icon: navIcon('ri:map-2-line'),
        },
        {
          title: 'ร้านค้า',
          path: '/admin/store-types',
          icon: navIcon('ri:store-3-line'),
        },
        {
          title: 'บัญชีผู้ประกอบการ',
          path: '/admin/merchants',
          icon: navIcon('ri:building-4-line'),
        },
      ],
    },
    {
      subheader: 'นักสำรวจและรางวัล',
      items: [
        {
          title: 'เลเวลนักสำรวจ',
          path: '/admin/explorer-levels',
          icon: navIcon('ri:medal-line'),
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
          title: 'ประวัติดาวน์โหลดการ์ด',
          path: '/admin/reward-downloads',
          icon: navIcon('ri:download-2-line'),
        },
      ],
    },
    {
      subheader: 'สินค้าและแบนเนอร์',
      items: [
        {
          title: 'จัดการสินค้า',
          path: '/admin/products',
          icon: navIcon('ri:shopping-bag-3-line'),
        },
        {
          title: 'จัดการแบนเนอร์',
          path: '/admin/banners',
          icon: navIcon('ri:image-2-line'),
        },
      ],
    },
    {
      subheader: 'ผู้ใช้และชุมชน',
      items: [
        {
          title: 'ผู้ใช้งาน',
          path: '/admin/users',
          icon: navIcon('ri:group-line'),
        },
        {
          title: 'จัดการกระทู้',
          path: '/admin/forum',
          deepMatch: true,
          icon: navIcon('ri:discuss-line'),
        },
        {
          title: 'ข้อความติดต่อ',
          path: '/admin/messages',
          icon: navIcon('ri:mail-line'),
        },
      ],
    },
    {
      subheader: 'ระบบ',
      items: [
        {
          title: 'ตั้งค่าระบบ',
          path: '/admin/settings',
          icon: navIcon('ri:settings-3-line'),
        },
        {
          title: 'คู่มือระบบ',
          path: '/admin/guide',
          icon: navIcon('ri:book-open-line'),
        },
      ],
    },
  ];
}
