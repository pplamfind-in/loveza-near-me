export const DEFAULT_BRAND_OWNER_ACKNOWLEDGED = false;

export function getBrandOwnerNotice(acknowledged: boolean, compact = false) {
  if (acknowledged) {
    return compact
      ? 'LOVEZA HUNT เป็นเว็บไซต์ชุมชนที่เจ้าของแบรนด์รับทราบการดำเนินงานแล้ว แต่ยังไม่ใช่ช่องทางอย่างเป็นทางการ ข้อมูลพิกัดและสต็อกมาจากชุมชนและอาจไม่เป็นปัจจุบัน โปรดตรวจสอบกับร้านค้าก่อนเดินทาง'
      : 'LOVEZA HUNT เป็นเว็บไซต์ชุมชนสำหรับค้นหาและแบ่งปันพิกัดที่พบสินค้า LOVEZA เจ้าของแบรนด์รับทราบการดำเนินงานของเว็บไซต์แล้ว อย่างไรก็ตาม เว็บไซต์นี้ยังไม่ใช่ช่องทางอย่างเป็นทางการของ LOVEZA หรือ LOVE POTION ข้อมูลพิกัดและสต็อกมาจากชุมชน จึงอาจคลาดเคลื่อนหรือไม่เป็นปัจจุบัน โปรดตรวจสอบกับร้านค้าก่อนเดินทาง';
  }

  return compact
    ? 'LOVEZA HUNT ไม่ใช่เว็บไซต์อย่างเป็นทางการของ LOVEZA หรือ LOVE POTION ข้อมูลพิกัดและสต็อกมาจากชุมชนและอาจไม่เป็นปัจจุบัน โปรดตรวจสอบกับร้านค้าก่อนเดินทาง'
    : 'LOVEZA HUNT เป็นเว็บไซต์ชุมชนสำหรับค้นหาและแบ่งปันพิกัดที่พบสินค้า LOVEZA ไม่ใช่เว็บไซต์อย่างเป็นทางการของ LOVEZA หรือ LOVE POTION และไม่มีความเกี่ยวข้อง การรับรอง หรือการสนับสนุนจากเจ้าของแบรนด์ ข้อมูลพิกัดและสต็อกมาจากชุมชน จึงอาจคลาดเคลื่อนหรือไม่เป็นปัจจุบัน โปรดตรวจสอบกับร้านค้าก่อนเดินทาง';
}

export function getBrandOwnerStatusLabel(acknowledged: boolean) {
  return acknowledged
    ? 'COMMUNITY WEBSITE · BRAND OWNER ACKNOWLEDGED'
    : 'UNOFFICIAL COMMUNITY WEBSITE';
}
