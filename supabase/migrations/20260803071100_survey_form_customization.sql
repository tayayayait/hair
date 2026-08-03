-- Revisioned survey-form customization with immutable kiosk-session snapshots.

create table public.survey_form_configs (
  id text primary key default 'default' check (id = 'default'),
  revision integer not null default 1 check (revision > 0),
  config jsonb not null check (
    jsonb_typeof(config) = 'object'
    and jsonb_typeof(config->'fields') = 'array'
  ),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.survey_form_configs (id, revision, config)
values (
  'default',
  1,
  $json${"fields":[{"id":"customer_name","key":"customer_name","section":"basic","type":"SHORT_TEXT","label":"성함","helpText":"예: 김아이","required":true,"locked":true,"builtin":true},{"id":"gender","key":"gender","section":"basic","type":"SINGLE_CHOICE","label":"성별","helpText":"","required":false,"builtin":true,"options":[{"code":"MALE","label":"남성"},{"code":"FEMALE","label":"여성"},{"code":"NO_ANSWER","label":"응답하지 않음"}]},{"id":"birth_date","key":"birth_date","section":"basic","type":"DATE","label":"생년월일","helpText":"","required":false,"builtin":true},{"id":"phone","key":"phone","section":"basic","type":"PHONE","label":"연락처","helpText":"","required":true,"locked":true,"builtin":true},{"id":"address","key":"address","section":"basic","type":"SHORT_TEXT","label":"주소","helpText":"시/구/동까지만 입력해도 됩니다.","required":false,"builtin":true},{"id":"visit_source","key":"visit_source","section":"preference","type":"MULTI_CHOICE","label":"방문동기","helpText":"","required":true,"builtin":true,"options":[{"code":"NEARBY","label":"거주지 근처"},{"code":"NAVER_SEARCH","label":"네이버 검색"},{"code":"INTRODUCTION","label":"지인소개"},{"code":"BLOG_INSTAGRAM","label":"블로그/인스타그램"},{"code":"GOOGLE_SEARCH","label":"구글 검색"}]},{"id":"style_photo_plan","key":"style_photo_plan","section":"preference","type":"SINGLE_CHOICE","label":"원하는 스타일 사진","helpText":"","required":false,"builtin":true,"options":[{"code":"HAS_PHOTO","label":"유"},{"code":"NO_PHOTO","label":"무"},{"code":"DESIGNER_RECOMMENDATION","label":"상담 디자이너가 추천"}]},{"id":"preferred_designer_level","key":"preferred_designer_level","section":"preference","type":"SINGLE_CHOICE","label":"시술담당 희망 직급","helpText":"직급별 차등 금액","required":false,"builtin":true,"options":[{"code":"DIRECTOR","label":"실장"},{"code":"SENIOR_CHIEF_DIRECTOR","label":"선임수석실장"},{"code":"VICE_DIRECTOR","label":"부원장"},{"code":"OWNER_DIRECTOR","label":"원장"},{"code":"NO_PREFERENCE","label":"관계없음"}]},{"id":"interested_services","key":"interested_services","section":"preference","type":"MULTI_CHOICE","label":"관심 있는 메뉴","helpText":"","required":true,"builtin":true,"options":[{"code":"STYLING","label":"스타일링"},{"code":"CUT","label":"컷"},{"code":"PERM","label":"펌"},{"code":"COLOR","label":"컬러"},{"code":"SCALP_CARE","label":"두피관리"},{"code":"HAIR_CARE","label":"모발케어"},{"code":"DECIDE_AFTER_CONSULTATION","label":"상담 후 선택","exclusive":true}]},{"id":"desired_image","key":"desired_image","section":"preference","type":"MULTI_CHOICE","label":"원하는 이미지","helpText":"","required":true,"builtin":true,"options":[{"code":"LUXURIOUS","label":"고급스러운"},{"code":"NATURAL","label":"자연스러운"},{"code":"UNIQUE","label":"유니크한"},{"code":"YOUNGER","label":"어려 보이는"},{"code":"REFINED","label":"세련된"},{"code":"TRENDY","label":"유행하는"},{"code":"PERSONALIZED","label":"나에게 맞춤 추천"}]},{"id":"priority_points","key":"priority_points","section":"preference","type":"MULTI_CHOICE","label":"가장 신경 써야 할 포인트","helpText":"","required":true,"builtin":true,"options":[{"code":"DESIGN_CUT","label":"디자인컷"},{"code":"HAIR_DAMAGE","label":"모발손상"},{"code":"VOLUME_BANGS","label":"볼륨 & 앞머리"},{"code":"EASY_MAINTENANCE","label":"손질이 편한"},{"code":"FAST_SERVICE","label":"신속진행"},{"code":"CURL_ELASTICITY","label":"컬의 탄력"},{"code":"SENSITIVE_SCALP","label":"예민한 두피"},{"code":"DETAILED_SERVICE","label":"꼼꼼한 시술"}]},{"id":"scalp_concerns","key":"scalp_concerns","section":"condition","type":"MULTI_CHOICE","label":"두피 고민","helpText":"","required":false,"builtin":true,"options":[{"code":"ITCHY","label":"가려움"},{"code":"OILY","label":"기름진"},{"code":"DRY","label":"건조한"},{"code":"STINGING","label":"따가운"},{"code":"SCALP_BUMPS","label":"뾰루지"},{"code":"HAIR_LOSS","label":"탈모"},{"code":"NOT_SURE","label":"잘 모르겠음","exclusive":true}]},{"id":"hair_concerns","key":"hair_concerns","section":"condition","type":"MULTI_CHOICE","label":"모발 고민","helpText":"","required":false,"builtin":true,"options":[{"code":"THINNING","label":"얇아진 모발"},{"code":"AGING","label":"에이징 모발"},{"code":"FRIZZY_DRY","label":"부스스하고 건조한 모발"},{"code":"NO_VOLUME","label":"볼륨이 없는"},{"code":"PARTIAL_CURL","label":"부분적 곱슬모발"},{"code":"PREVIOUS_DAMAGE","label":"이전 시술 후 손상된 모발"}]},{"id":"homecare_purchase_history","key":"homecare_purchase_history","section":"condition","type":"MULTI_CHOICE","label":"홈케어 구매 이력","helpText":"","required":false,"builtin":true,"options":[{"code":"EXPERT_RECOMMENDED","label":"전문가의 추천제품"},{"code":"SNS_POPULAR","label":"SNS 후기 인기제품"},{"code":"HOME_SHOPPING_BULK","label":"홈쇼핑 대량구매"},{"code":"OFFLINE_STORE","label":"오프라인 구매(마트, 백화점, 올리브영)"},{"code":"NO_INTEREST","label":"관심없음(잘 모름)","exclusive":true}]}]}$json$::jsonb
);

alter table public.survey_form_configs enable row level security;
revoke all on public.survey_form_configs from public, anon, authenticated;
grant select on public.survey_form_configs to authenticated;
grant all on public.survey_form_configs to service_role;

create policy "survey_form_configs_admin_read"
on public.survey_form_configs
for select
to authenticated
using ((select private.is_admin()));

create or replace function public.save_survey_form_config(
  p_config jsonb,
  p_expected_revision integer
)
returns table (revision integer, config jsonb)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if p_config is null
     or jsonb_typeof(p_config) <> 'object'
     or jsonb_typeof(p_config->'fields') <> 'array'
     or jsonb_array_length(p_config->'fields') not between 1 and 100
     or octet_length(p_config::text) > 65536 then
    raise exception 'Invalid survey form configuration' using errcode = '22023';
  end if;
  if not (p_config->'fields' @> '[{"key":"customer_name","required":true,"locked":true}]'::jsonb)
     or not (p_config->'fields' @> '[{"key":"phone","required":true,"locked":true}]'::jsonb) then
    raise exception 'Protected system fields are required' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_config->'fields') field
    where jsonb_typeof(field) <> 'object'
       or coalesce(field->>'key', '') !~ '^[a-z][a-z0-9_]{1,63}$'
       or coalesce(field->>'label', '') = ''
       or field->>'section' not in ('basic', 'preference', 'condition')
       or field->>'type' not in (
         'SHORT_TEXT', 'DATE', 'PHONE', 'SINGLE_CHOICE', 'MULTI_CHOICE'
       )
       or (
         field->>'type' in ('SINGLE_CHOICE', 'MULTI_CHOICE')
         and (
           jsonb_typeof(field->'options') <> 'array'
           or jsonb_array_length(field->'options') < 2
         )
       )
  ) then
    raise exception 'Invalid survey field definition' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_config->'fields') field
    group by field->>'key'
    having count(*) > 1
  ) then
    raise exception 'Survey field keys must be unique' using errcode = '22023';
  end if;

  return query
  update public.survey_form_configs as sfc
  set config = p_config,
      revision = sfc.revision + 1,
      updated_by = (select auth.uid()),
      updated_at = clock_timestamp()
  where sfc.id = 'default'
    and sfc.revision = p_expected_revision
  returning sfc.revision, sfc.config;

  if not found then
    raise exception 'Survey form was updated by another administrator'
      using errcode = '40001';
  end if;
end;
$$;

revoke execute on function public.save_survey_form_config(jsonb, integer)
from public, anon, authenticated;
grant execute on function public.save_survey_form_config(jsonb, integer)
to authenticated;

alter table public.kiosk_sessions
add column survey_config_snapshot jsonb;

update public.kiosk_sessions ks
set survey_config_snapshot = (
  select sfc.config || jsonb_build_object('revision', sfc.revision)
  from public.survey_form_configs sfc
  where sfc.id = 'default'
)
where ks.survey_config_snapshot is null;

alter table public.kiosk_sessions
alter column survey_config_snapshot set not null;

create or replace function private.set_kiosk_survey_config_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.survey_config_snapshot is null then
    select sfc.config || jsonb_build_object('revision', sfc.revision)
    into new.survey_config_snapshot
    from public.survey_form_configs sfc
    where sfc.id = 'default';
  end if;
  return new;
end;
$$;

create trigger kiosk_sessions_freeze_survey_config
before insert on public.kiosk_sessions
for each row execute function private.set_kiosk_survey_config_snapshot();

drop function public.get_kiosk_context(text);
create function public.get_kiosk_context(p_kiosk_token text)
returns table (
  store_name text,
  designer_name text,
  survey_version text,
  survey_config jsonb,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_kiosk_token is null or p_kiosk_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid kiosk token' using errcode = '22023';
  end if;

  return query
  select
    s.name,
    d.name,
    ks.survey_version,
    ks.survey_config_snapshot,
    ks.expires_at
  from public.kiosk_sessions ks
  join public.stores s on s.id = ks.store_id and s.is_active
  join public.designers d
    on d.id = ks.designer_id
   and d.store_id = ks.store_id
   and d.is_active
  where ks.token_hash = encode(extensions.digest(p_kiosk_token, 'sha256'), 'hex')
    and ks.ended_at is null
    and ks.expires_at > clock_timestamp();
end;
$$;

revoke execute on function public.get_kiosk_context(text)
from public, anon, authenticated;
grant execute on function public.get_kiosk_context(text)
to anon, authenticated;

create or replace function private.validate_survey_config_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_snapshot jsonb;
begin
  if new.kiosk_session_id is null then
    return new;
  end if;
  select ks.survey_config_snapshot
  into v_snapshot
  from public.kiosk_sessions ks
  where ks.id = new.kiosk_session_id;

  if v_snapshot is null
     or new.answers_snapshot->'survey_config' is distinct from v_snapshot
     or jsonb_typeof(new.answers_snapshot->'custom_answers') <> 'object' then
    raise exception 'Survey form snapshot does not match kiosk session'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger survey_responses_validate_form_snapshot
before insert on public.survey_responses
for each row execute function private.validate_survey_config_snapshot();
