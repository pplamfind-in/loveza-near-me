create table if not exists public.explorer_rewards (
 id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check (char_length(name) between 2 and 70),
 character text not null check (character ~ '^p-[a-z0-9-]+[.]webp$'),
 condition text not null,
 metric text not null check (metric in ('uniqueStores','provinces')),
 target integer not null check (target between 1 and 9999 and (metric <> 'provinces' or target <= 77)),
 color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
 sort_order integer not null default 0 check (sort_order between 0 and 9999),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.explorer_rewards enable row level security;
grant select on public.explorer_rewards to anon, authenticated;
grant insert, update, delete on public.explorer_rewards to authenticated;
create policy explorer_rewards_public_read on public.explorer_rewards for select using (is_active or public.is_admin());
create policy explorer_rewards_admin_insert on public.explorer_rewards for insert to authenticated with check (public.is_admin());
create policy explorer_rewards_admin_update on public.explorer_rewards for update to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.explorer_rewards (id,name,character,condition,metric,target,color,sort_order,is_active) values
('first-pin','Jazz · หมุดแรกของฉัน','p-jazz.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 1 ร้าน','uniqueStores',1,'#FBE1EC',10,true),
('trail-buddy','Kard · เพื่อนร่วมทาง','p-kard.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 3 ร้าน','uniqueStores',3,'#FBF0CD',20,true),
('province-explorer','Korn · นักสำรวจต่างจังหวัด','p-korn.webp','มีพิกัดผ่านอนุมัติใน 2 จังหวัด','provinces',2,'#DDECF7',30,true),
('ten-discoveries','Sung · ผู้บุกเบิกความซ่า','p-sung.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 10 ร้าน','uniqueStores',10,'#DEF2E8',40,true),
('cheer-squad','Cheerleader · ทีมเชียร์นักล่า','p-cheerleader.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 2 ร้าน','uniqueStores',2,'#FCE4EE',50,true),
('little-explorer','Chibi · นักสำรวจตัวจิ๋ว','p-chibi-girl.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 5 ร้าน','uniqueStores',5,'#EAE2FA',60,true),
('heart-discovery','Kard Heart · ส่งต่อด้วยใจ','p-kard-heart.webp','มีพิกัดผ่านอนุมัติใน 3 จังหวัด','provinces',3,'#FCE3E5',70,true),
('soda-adventure','Soda Girl · ผจญภัยความซ่า','p-soda-girl.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 15 ร้าน','uniqueStores',15,'#DFF2F8',80,true),
('discovery-duo','Sung & Kard · คู่หูนักสำรวจ','p-sung-kard.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 25 ร้าน','uniqueStores',25,'#FBEAD8',90,true),
('potion-legend','Sung Potion · ตำนานความซ่า','p-sung-potion-soda.webp','มีร้านไม่ซ้ำที่ผ่านอนุมัติ 50 ร้าน','uniqueStores',50,'#DFF1D9',100,true)
on conflict (id) do nothing;
