'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type RoleCard = {
  icon: string;
  color: string;
  background: string;
  title: string;
  description: string;
};

const ROLE_CARDS: RoleCard[] = [
  {
    icon: 'ri:user-line',
    color: '#5c6b73',
    background: '#f1f4f5',
    title: 'ผู้เยี่ยมชม',
    description:
      'ดูหน้าแรก ค้นหาร้านใกล้ฉัน (/nearby) และดูแผนที่ซ่าทั่วไทย (/mapza) ได้โดยไม่ต้องล็อกอิน',
  },
  {
    icon: 'ri:google-fill',
    color: '#2574a9',
    background: '#edf7ff',
    title: 'ผู้ใช้ทั่วไป',
    description:
      'ล็อกอินด้วย Google เท่านั้น (ไม่มีอีเมล/รหัสผ่าน) เพื่อแจ้งพิกัด (/report) และดูประวัติรายงานของตนเอง (/account)',
  },
  {
    icon: 'ri:shield-check-fill',
    color: '#e21d75',
    background: '#fff0f6',
    title: 'แอดมิน',
    description: 'จัดการข้อมูลทั้งหมดใน /admin/* ตามสิทธิ์ที่อธิบายด้านล่าง',
  },
];

type FlowStep = { title: string; description: string };

const REPORT_FLOW: FlowStep[] = [
  {
    title: 'ผู้ใช้กรอกฟอร์มที่ /report',
    description:
      'ชื่อร้าน ประเภทร้าน จังหวัด/อำเภอ พิกัด GPS สถานะสินค้า รสชาติ รูปถ่าย และหมายเหตุ',
  },
  {
    title: 'ระบบตรวจสอบพิกัดซ้ำภายใน "ระยะตรวจร้านซ้ำ"',
    description:
      'เทียบกับร้านที่อนุมัติแล้ว และรายงานอื่นที่ยังรออนุมัติ พร้อมกัน (ระยะนี้ตั้งค่าแยกจากระยะค้นหาใน /admin/settings)',
  },
  {
    title: 'ชนกับร้านที่อนุมัติแล้ว → ถามยืนยันแทนการบล็อก',
    description:
      'ฟอร์มจะแสดงชื่อร้านและระยะห่างที่พบ ให้ผู้ใช้กด "ใช่ ร้านเดิม" (ผูกรายงานใหม่เข้ากับร้านเดิม เผื่อเป็นคนละคนมายืนยันซ้ำ) หรือ "ไม่ใช่ ร้านอื่น" (แก้ไขแล้วส่งใหม่)',
  },
  {
    title: 'ชนกับรายงานที่ยังรออนุมัติของคนอื่น → บล็อกทันที',
    description: 'ยังไม่มีร้านที่อนุมัติแล้วให้ผูก จึงกันการส่งซ้ำไว้ก่อนจนกว่าแอดมินจะตัดสินใจ',
  },
  {
    title: 'ผ่านการตรวจสอบ → ทำงานตามโหมดอนุมัติที่แอดมินเลือก',
    description:
      'ถ้าเลือก "รอแอดมินอนุมัติก่อนแสดง" รายงานจะเป็น pending ถ้าเลือก "อนุมัติและแสดงทันที" ระบบจะอนุมัติและเพิ่ม/อัปเดตร้านบนแผนที่ใน transaction เดียวกัน',
  },
];

const APPROVAL_FLOW: FlowStep[] = [
  {
    title: 'เลือกโหมดที่ /admin/settings',
    description:
      'ค่าเริ่มต้นคือ "รอแอดมินอนุมัติก่อนแสดง" หรือเปิดเป็น "อนุมัติและแสดงทันที" ได้ การเปลี่ยนโหมดมีผลกับรายงานใหม่เท่านั้น',
  },
  {
    title: 'โหมดรอตรวจ → อนุมัติ (Approve)',
    description:
      'ถ้ารายงานผูกกับร้านเดิมอยู่แล้ว (มาจากขั้นตอนยืนยันร้านซ้ำ) ระบบจะอัปเดตข้อมูลร้านเดิม ถ้าไม่ได้ผูก จะสร้างร้านใหม่ในระบบ',
  },
  {
    title: 'โหมดรอตรวจ → ปฏิเสธ (Reject)',
    description: 'เปลี่ยนสถานะรายงานเป็น "rejected" เท่านั้น ไม่กระทบข้อมูลร้านใดๆ',
  },
  {
    title: 'โหมดแสดงทันที → อนุมัติอัตโนมัติ',
    description:
      'รายงานใหม่จะเป็น approved และแสดงเป็นจุดขายทันที โดยยังผ่านการตรวจพิกัดซ้ำเหมือนเดิม รายงาน pending ที่มีอยู่ก่อนเปลี่ยนโหมดจะยังรอแอดมินตรวจต่อไป',
  },
];

const STOCK_UPDATE_FLOW: FlowStep[] = [
  {
    title: 'ผู้ใช้เปิดประวัติที่ /account',
    description:
      'ปุ่ม "อัปเดตสถานะสินค้า" จะแสดงเฉพาะรายงานของผู้ใช้ที่อนุมัติแล้วและเชื่อมกับร้านในระบบเรียบร้อย',
  },
  {
    title: 'กรอกสถานะ เพิ่มหลักฐาน และตรวจ GPS',
    description:
      'ผู้ใช้เลือก มีสินค้า/เหลือน้อย/สินค้าหมด/ไม่แน่ใจ ระบุจำนวน หมายเหตุ และแนบรูปหลักฐานได้ แล้วต้องตรวจตำแหน่งปัจจุบันให้อยู่ในระยะร้าน',
  },
  {
    title: 'สร้างรายงานใหม่สำหรับร้านเดิม',
    description:
      'ระบบไม่แก้ทับประวัติเก่า และนำรายงานใหม่เข้าสู่โหมดรออนุมัติหรืออนุมัติทันทีตามค่าที่ /admin/settings',
  },
];

type ReferenceCard = {
  icon: string;
  color: string;
  background: string;
  title: string;
  href: string;
  description: string;
};

const REFERENCE_CARDS: ReferenceCard[] = [
  {
    icon: 'ri:map-pin-user-fill',
    color: '#d97706',
    background: '#fff7e6',
    title: 'ตรวจสอบพิกัด',
    href: '/admin/reports',
    description: 'ตรวจข้อมูลร้าน รูปภาพ ผู้แจ้ง และเลือกอนุมัติหรือปฏิเสธรายงานที่รอตรวจสอบ',
  },
  {
    icon: 'ri:radar-fill',
    color: '#e5007e',
    background: 'rgba(239,35,130,.10)',
    title: 'ตั้งค่าระบบ',
    href: '/admin/settings',
    description:
      'เลือกโหมดอนุมัติรายงาน ปรับระยะตรวจร้านซ้ำ ระยะค้นหาร้านใกล้ฉัน และช่วงสีจำนวนจุดขายบนแผนที่จังหวัด',
  },
  {
    icon: 'ri:store-2-fill',
    color: '#e5007e',
    background: '#fff0f7',
    title: 'ประเภทร้าน',
    href: '/admin/store-types',
    description: 'จัดการประเภทร้าน โลโก้ ลำดับการแสดง และสถานะเปิดใช้งานที่ใช้ในฟอร์มแจ้งพิกัด',
  },
  {
    icon: 'ri:drinks-2-fill',
    color: '#6d3b8c',
    background: '#f6effa',
    title: 'จัดการสินค้า',
    href: '/admin/products',
    description: 'CRUD รสชาติ Loveza (ชื่อ สี ไอคอนผลไม้ คำอธิบาย รูปภาพ) ที่แสดงบน Landing page',
  },
  {
    icon: 'ri:image-2-fill',
    color: '#e5007e',
    background: '#fff0f7',
    title: 'จัดการแบนเนอร์',
    href: '/admin/banners',
    description:
      'CRUD ภาพ Hero บน Landing แยก Desktop/Mobile กำหนด Alt text ลำดับ และเปิดหรือซ่อนแต่ละ Banner ได้',
  },
  {
    icon: 'ri:bar-chart-box-fill',
    color: '#6d3b8c',
    background: '#f6effa',
    title: 'สถิติการเข้าใช้งาน',
    href: '/admin/analytics',
    description:
      'ดูจำนวนเปิดหน้า ผู้เข้าชม แนวโน้มรายวัน หน้ายอดนิยม แหล่งที่มา และอุปกรณ์จาก Vercel Web Analytics',
  },
  {
    icon: 'ri:group-fill',
    color: '#2574a9',
    background: '#edf7ff',
    title: 'ผู้ใช้งาน',
    href: '/admin/users',
    description:
      'แสดงสถิติผู้ใช้แต่ละคน (รายงานอนุมัติ/รออนุมัติ/ปฏิเสธ) และตั้งผู้ใช้ทั่วไปให้เป็น Admin ได้จากปุ่มจัดการสิทธิ์',
  },
  {
    icon: 'ri:map-2-fill',
    color: '#008f84',
    background: '#e9fbf8',
    title: 'พิกัดทั้งหมด',
    href: '/admin/locations',
    description: 'รายการร้านทั้งหมดในระบบ รวมร้านที่ปิดใช้งานแล้ว (read-only)',
  },
  {
    icon: 'ri:fullscreen-fill',
    color: '#d97706',
    background: '#fff7e6',
    title: 'ภาพรวมเต็มจอ',
    href: '/admin/network',
    description:
      'จอนับสถิติแบบเรียลไทม์ (ไม่อยู่ใน sidebar หลัก เข้าผ่านปุ่ม "เปิดภาพรวมเต็มจอ" ที่หน้า /admin)',
  },
];

const CHECKLIST_ITEMS = [
  'รัน Supabase migration ทั้งหมดตามลำดับ (0001–0019) บนโปรเจกต์ production',
  'ตั้งค่า Environment Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID, NEXT_PUBLIC_SITE_URL',
  'ถ้าต้องการหน้า Web Analytics ให้ตั้งค่า VERCEL_TOKEN, VERCEL_ANALYTICS_PROJECT_ID และ VERCEL_ANALYTICS_TEAM_ID',
  'เพิ่มโดเมน production ใน Authorized origins/redirect ของ Google OAuth client',
  'แอดมินคนแรกยังต้องตั้งผ่าน Supabase Dashboard จากนั้นสามารถตั้งผู้ใช้คนอื่นเป็น Admin ได้ที่ /admin/users',
  'ตรวจสอบ Storage bucket "report-images" เปิด public read และจำกัดชนิด/ขนาดไฟล์ตามที่ migration กำหนด',
  'เลือกโหมดอนุมัติรายงาน และปรับ "ระยะตรวจร้านซ้ำ" กับ "ระยะค้นหาร้านใกล้ฉัน" ที่ /admin/settings ให้เหมาะกับการใช้งานจริง',
];

function FlowList({ steps }: { steps: FlowStep[] }) {
  return (
    <Stack spacing={2}>
      {steps.map((step, index) => (
        <Stack key={step.title} direction="row" spacing={1.75} alignItems="flex-start">
          <Box
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(229,0,126,.10)',
              color: '#e5007e',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {index + 1}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>{step.title}</Typography>
            <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13.5, lineHeight: 1.6 }}>
              {step.description}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function AdminGuide() {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
          LOVEZA HUNT ADMIN
        </Typography>
        <Typography component="h1" sx={{ mt: 0.75, fontSize: { xs: 30, md: 38 }, fontWeight: 900 }}>
          คู่มือระบบ
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'text.secondary', maxWidth: 680 }}>
          สรุปการทำงานของระบบ Loveza Hunt ทั้งหมดในหน้าเดียว สำหรับทีม Admin ใช้อ้างอิงก่อนขึ้น
          Production
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 900 }}>บทบาทผู้ใช้งาน</Typography>
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {ROLE_CARDS.map((role) => (
            <Box key={role.title} sx={{ p: 2, borderRadius: 2.5, bgcolor: role.background }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  color: role.color,
                  display: 'grid',
                  borderRadius: 2,
                  placeItems: 'center',
                  bgcolor: '#fff',
                }}
              >
                <Iconify icon={role.icon} width={22} />
              </Box>
              <Typography sx={{ mt: 1.5, fontWeight: 900 }}>{role.title}</Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 13, lineHeight: 1.6 }}>
                {role.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="ri:route-fill" width={22} sx={{ color: '#e5007e' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
            Flow การแจ้งพิกัด (/report)
          </Typography>
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <FlowList steps={REPORT_FLOW} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="ri:map-pin-user-fill" width={22} sx={{ color: '#e5007e' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 900 }}>Flow การอนุมัติและเผยแพร่</Typography>
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <FlowList steps={APPROVAL_FLOW} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="ri:refresh-line" width={22} sx={{ color: '#00a99d' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
            Flow อัปเดตสถานะสินค้าจากประวัติ
          </Typography>
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <FlowList steps={STOCK_UPDATE_FLOW} />
        </Box>
      </Paper>

      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 900, mb: 2 }}>หน้าอื่นๆ ในระบบ</Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {REFERENCE_CARDS.map((card) => (
            <Paper
              key={card.title}
              component={Link}
              href={card.href}
              elevation={0}
              sx={{
                p: 2.5,
                color: 'text.primary',
                borderRadius: 3,
                textDecoration: 'none',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 14px 32px rgba(52,78,82,.10)',
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  color: card.color,
                  display: 'grid',
                  borderRadius: 2,
                  placeItems: 'center',
                  bgcolor: card.background,
                }}
              >
                <Iconify icon={card.icon} width={23} />
              </Box>
              <Typography sx={{ mt: 1.5, fontWeight: 900 }}>{card.title}</Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 13, lineHeight: 1.6 }}>
                {card.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: '2px solid #d97706', bgcolor: '#fff7e6' }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="ri:alert-fill" width={22} sx={{ color: '#d97706' }} />
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
            ข้อควรระวังเรื่องสิทธิ์แอดมิน
          </Typography>
        </Stack>
        <Typography sx={{ mt: 1.5, fontSize: 13.5, lineHeight: 1.75 }}>
          หน้า /admin/* และ API ทั้งหมดใน /api/admin/* เช็คสิทธิ์แอดมินจาก{' '}
          <Chip label="user.app_metadata.role" size="small" sx={{ fontWeight: 800 }} /> เท่านั้น
          ส่วนฝั่งฐานข้อมูล (RLS และฟังก์ชัน is_admin()) ยอมรับทั้ง app_metadata.role และ{' '}
          <Chip label="profiles.role" size="small" sx={{ fontWeight: 800 }} /> ปุ่มตั้งเป็น Admin
          ที่ /admin/users จะอัปเดตทั้งสองค่าให้ตรงกันอัตโนมัติ
        </Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="ri:rocket-2-fill" width={22} sx={{ color: '#00a99d' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
            เช็คลิสต์ก่อนขึ้น Production
          </Typography>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>
          {CHECKLIST_ITEMS.map((item) => (
            <Stack key={item} direction="row" spacing={1.5} alignItems="flex-start">
              <Iconify
                icon="ri:checkbox-blank-circle-line"
                width={16}
                sx={{ mt: 0.4, flexShrink: 0, color: '#00a99d' }}
              />
              <Typography sx={{ fontSize: 13.5, lineHeight: 1.7 }}>{item}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
