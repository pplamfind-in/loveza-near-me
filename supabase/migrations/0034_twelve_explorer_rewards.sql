-- Add the two remaining character illustrations without changing existing rewards.
insert into public.explorer_rewards (id,name,character,condition,metric,target,color,sort_order,is_active) values
('sunshine-soda','Love Zay · สดใสไปด้วยกัน','p-love-zay-soda.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 7 ร้าน','uniqueStores',7,'#FFF0C7',110,true),
('colorful-team','Loveza Team · แก๊งนักสำรวจ','p-group-colorful.webp','มีพิกัดผ่านอนุมัติใน 5 จังหวัด','provinces',5,'#F6E2F1',120,true)
on conflict (id) do nothing;
