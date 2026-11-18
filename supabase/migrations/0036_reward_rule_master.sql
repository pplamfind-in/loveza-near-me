create table public.explorer_reward_rules (
 id text primary key check(id ~ '^[a-zA-Z][a-zA-Z0-9_-]*$'),
 name text not null check(char_length(name) between 2 and 80),
 source text not null check(source in ('uniqueStores','provinces','approvedReports','explorationDays')),
 unit text not null check(char_length(unit) between 1 and 20),
 description text not null default '' check(char_length(description)<=300),
 max_target integer not null default 9999 check(max_target between 1 and 9999 and (source <> 'provinces' or max_target<=77)),
 sort_order integer not null default 0 check(sort_order between 0 and 9999),
 is_active boolean not null default true
);
alter table public.explorer_reward_rules enable row level security;
grant select on public.explorer_reward_rules to anon, authenticated;
grant insert,update,delete on public.explorer_reward_rules to authenticated;
-- Disabled rules still describe and evaluate existing rewards; only new selection is disabled.
create policy reward_rules_read on public.explorer_reward_rules for select using(true);
create policy reward_rules_admin on public.explorer_reward_rules for all to authenticated using(public.is_admin()) with check(public.is_admin());
insert into public.explorer_reward_rules(id,name,source,unit,description,max_target,sort_order) values
('uniqueStores','ร้านไม่ซ้ำที่ผ่านอนุมัติ','uniqueStores','ร้าน','นับร้านไม่ซ้ำจากพิกัดที่ผ่านอนุมัติ',9999,10),
('provinces','จังหวัดที่มีพิกัดผ่านอนุมัติ','provinces','จังหวัด','นับจังหวัดไม่ซ้ำจากพิกัดที่ผ่านอนุมัติ',77,20),
('approvedReports','การแจ้งพิกัดที่ผ่านอนุมัติ','approvedReports','ครั้ง','นับจำนวนการแจ้งที่ผ่านอนุมัติ ร้านซ้ำนับเพิ่ม',9999,30),
('explorationDays','วันที่ออกสำรวจ','explorationDays','วัน','นับวันไม่ซ้ำตามเวลาไทยจากพิกัดที่ผ่านอนุมัติ',9999,40);
alter table public.explorer_rewards drop constraint explorer_rewards_metric_check;
alter table public.explorer_rewards add constraint explorer_rewards_metric_fkey foreign key(metric) references public.explorer_reward_rules(id) on update restrict on delete restrict;
create function public.validate_reward_rule_usage() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_TABLE_NAME='explorer_rewards' then
   if not exists(select 1 from explorer_reward_rules where id=NEW.metric and NEW.target<=max_target) then
     raise check_violation using message='Reward target exceeds rule maximum';
   end if;
 else
   if exists(select 1 from explorer_rewards where metric=OLD.id and (NEW.source<>OLD.source or target>NEW.max_target)) then
     raise check_violation using message='Cannot change evaluator or lower maximum below existing targets';
   end if;
 end if;
 return NEW;
end $$;
create trigger validate_reward_rule_target before insert or update on public.explorer_rewards for each row execute function public.validate_reward_rule_usage();
create trigger validate_used_reward_rule before update on public.explorer_reward_rules for each row execute function public.validate_reward_rule_usage();
