-- PHASE 2: prototype-only data boundary, kiosk tokens, idempotent submission, and admin RLS.
-- Customer PII is writable only through public.submit_survey_response().

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  store_id uuid references public.stores(id) on delete restrict,
  role text not null default 'DEMO_ADMIN',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_profiles_display_name_check
    check (char_length(btrim(display_name)) between 2 and 50),
  constraint admin_profiles_role_check
    check (role = 'DEMO_ADMIN')
);

grant select on public.admin_profiles to authenticated;
grant all on public.admin_profiles to service_role;
alter table public.admin_profiles enable row level security;

create policy "admin_profiles_self_read"
on public.admin_profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and is_active
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = (select auth.uid())
      and ap.is_active
      and ap.role = 'DEMO_ADMIN'
  );
$$;

create or replace function private.can_access_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = (select auth.uid())
      and ap.is_active
      and ap.role = 'DEMO_ADMIN'
      and (ap.store_id is null or ap.store_id = p_store_id)
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function private.can_access_store(uuid) from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.can_access_store(uuid) to authenticated, service_role;

drop policy if exists "stores_public_read" on public.stores;
drop policy if exists "designers_public_read" on public.designers;

revoke all on public.stores from anon, authenticated;
revoke all on public.designers from anon, authenticated;
grant select on public.stores to authenticated;
grant select on public.designers to authenticated;

create policy "stores_admin_read"
on public.stores
for select
to authenticated
using (is_active and (select private.can_access_store(id)));

create policy "designers_admin_read"
on public.designers
for select
to authenticated
using (is_active and (select private.can_access_store(store_id)));

alter table public.designers
  add constraint designers_id_store_id_key unique (id, store_id);

create table public.kiosk_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  designer_id uuid not null,
  survey_version text not null default 'PROTOTYPE_V1',
  expires_at timestamptz not null default (now() + interval '8 hours'),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint kiosk_sessions_designer_store_fkey
    foreign key (designer_id, store_id)
    references public.designers(id, store_id)
    on delete restrict,
  constraint kiosk_sessions_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint kiosk_sessions_version_check
    check (survey_version = 'PROTOTYPE_V1'),
  constraint kiosk_sessions_expiry_check
    check (expires_at > created_at),
  constraint kiosk_sessions_ended_check
    check (ended_at is null or ended_at >= created_at)
);

create index kiosk_sessions_created_by_idx on public.kiosk_sessions(created_by);
create index kiosk_sessions_store_id_idx on public.kiosk_sessions(store_id);
create index kiosk_sessions_active_idx
  on public.kiosk_sessions(expires_at)
  where ended_at is null;

grant select on public.kiosk_sessions to authenticated;
grant all on public.kiosk_sessions to service_role;
alter table public.kiosk_sessions enable row level security;

create policy "kiosk_sessions_admin_read"
on public.kiosk_sessions
for select
to authenticated
using ((select private.can_access_store(store_id)));

alter table public.survey_responses
  add column survey_version text not null default 'PROTOTYPE_V1',
  add column kiosk_session_id uuid references public.kiosk_sessions(id) on delete restrict,
  add column idempotency_key uuid;

alter table public.survey_responses
  add constraint survey_responses_version_check
    check (survey_version = 'PROTOTYPE_V1'),
  add constraint survey_responses_idempotency_pair_check
    check (
      (kiosk_session_id is null and idempotency_key is null)
      or (kiosk_session_id is not null and idempotency_key is not null)
    ),
  add constraint survey_responses_designer_store_fkey
    foreign key (designer_id, store_id)
    references public.designers(id, store_id)
    on delete restrict;

create unique index survey_responses_session_idempotency_key
  on public.survey_responses(kiosk_session_id, idempotency_key)
  where kiosk_session_id is not null and idempotency_key is not null;
create index survey_responses_store_submitted_idx
  on public.survey_responses(store_id, submitted_at desc);
create index survey_responses_designer_submitted_idx
  on public.survey_responses(designer_id, submitted_at desc);

drop policy if exists "responses_public_insert" on public.survey_responses;
drop policy if exists "responses_kiosk_insert" on public.survey_responses;
drop policy if exists "responses_admin_read" on public.survey_responses;

revoke all on public.survey_responses from anon, authenticated;
grant select on public.survey_responses to authenticated;

create policy "responses_admin_read"
on public.survey_responses
for select
to authenticated
using ((select private.can_access_store(store_id)));

create or replace function private.jsonb_text_array(p_value jsonb, p_field text)
returns text[]
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_result text[];
begin
  if p_value is null then
    return array[]::text[];
  end if;

  if jsonb_typeof(p_value) <> 'array' then
    raise exception '% must be an array', p_field using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_value) item
    where jsonb_typeof(item) <> 'string'
  ) then
    raise exception '% must contain only strings', p_field using errcode = '22023';
  end if;

  select coalesce(array_agg(value), array[]::text[])
  into v_result
  from jsonb_array_elements_text(p_value) value;

  if cardinality(v_result) > 20 then
    raise exception '% has too many values', p_field using errcode = '22023';
  end if;

  return v_result;
end;
$$;

revoke execute on function private.jsonb_text_array(jsonb, text)
from public, anon, authenticated;
grant execute on function private.jsonb_text_array(jsonb, text) to service_role;

create or replace function public.create_kiosk_session(
  p_store_id uuid,
  p_designer_id uuid,
  p_expires_in_minutes integer default 480
)
returns table (
  kiosk_token text,
  session_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_session_id uuid;
  v_expires_at timestamptz;
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  if not (select private.can_access_store(p_store_id)) then
    raise exception 'Store access is denied' using errcode = '42501';
  end if;

  if p_expires_in_minutes not between 15 and 720 then
    raise exception 'Session lifetime must be between 15 and 720 minutes'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.stores s
    join public.designers d
      on d.store_id = s.id
     and d.id = p_designer_id
     and d.is_active
    where s.id = p_store_id
      and s.is_active
  ) then
    raise exception 'Active store and designer combination was not found'
      using errcode = '22023';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := clock_timestamp() + make_interval(mins => p_expires_in_minutes);

  insert into public.kiosk_sessions (
    token_hash,
    created_by,
    store_id,
    designer_id,
    survey_version,
    expires_at
  ) values (
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    (select auth.uid()),
    p_store_id,
    p_designer_id,
    'PROTOTYPE_V1',
    v_expires_at
  )
  returning id into v_session_id;

  return query select v_token, v_session_id, v_expires_at;
end;
$$;

revoke execute on function public.create_kiosk_session(uuid, uuid, integer)
from public, anon, authenticated;
grant execute on function public.create_kiosk_session(uuid, uuid, integer)
to authenticated;

create or replace function public.get_kiosk_context(p_kiosk_token text)
returns table (
  store_name text,
  designer_name text,
  survey_version text,
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
  select s.name, d.name, ks.survey_version, ks.expires_at
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

create or replace function public.end_kiosk_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_count integer;
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  update public.kiosk_sessions ks
  set ended_at = coalesce(ks.ended_at, clock_timestamp())
  where ks.id = p_session_id
    and (select private.can_access_store(ks.store_id));

  get diagnostics v_updated_count = row_count;
  return v_updated_count = 1;
end;
$$;

revoke execute on function public.end_kiosk_session(uuid)
from public, anon, authenticated;
grant execute on function public.end_kiosk_session(uuid) to authenticated;

create or replace function public.submit_survey_response(
  p_kiosk_token text,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.kiosk_sessions%rowtype;
  v_store_name text;
  v_designer_name text;
  v_customer_name text;
  v_phone text;
  v_age text;
  v_gender text;
  v_birth_date date;
  v_address text;
  v_introducer_name text;
  v_style_photo_plan text;
  v_preferred_designer_level text;
  v_guardian_name text;
  v_guardian_phone text;
  v_guardian_relationship text;
  v_visit_source text[];
  v_interested_services text[];
  v_desired_image text[];
  v_priority_points text[];
  v_scalp_concerns text[];
  v_hair_concerns text[];
  v_homecare_purchase_history text[];
  v_response_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if p_kiosk_token is null or p_kiosk_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid kiosk token' using errcode = '22023';
  end if;
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required' using errcode = '22023';
  end if;
  if p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or octet_length(p_payload::text) > 32768 then
    raise exception 'Invalid survey payload' using errcode = '22023';
  end if;
  if p_payload->>'survey_version' <> 'PROTOTYPE_V1' then
    raise exception 'Unsupported survey version' using errcode = '22023';
  end if;

  select ks, s.name, d.name
  into v_session, v_store_name, v_designer_name
  from public.kiosk_sessions ks
  join public.stores s on s.id = ks.store_id and s.is_active
  join public.designers d
    on d.id = ks.designer_id
   and d.store_id = ks.store_id
   and d.is_active
  where ks.token_hash = encode(extensions.digest(p_kiosk_token, 'sha256'), 'hex')
    and ks.ended_at is null
    and ks.expires_at > v_now;

  if v_session.id is null then
    raise exception 'Kiosk session is invalid or expired' using errcode = '22023';
  end if;

  v_customer_name := btrim(coalesce(p_payload->>'customer_name', ''));
  v_phone := regexp_replace(coalesce(p_payload->>'phone', ''), '[^0-9]', '', 'g');
  v_age := p_payload->>'age_14_or_over';
  v_gender := nullif(p_payload->>'gender', '');
  v_address := nullif(btrim(coalesce(p_payload->>'address', '')), '');
  v_introducer_name := nullif(btrim(coalesce(p_payload->>'introducer_name', '')), '');
  v_style_photo_plan := nullif(p_payload->>'style_photo_plan', '');
  v_preferred_designer_level := nullif(p_payload->>'preferred_designer_level', '');

  if char_length(v_customer_name) not between 2 and 50
     or v_customer_name !~ '^[[:alpha:]가-힣·ㆍ -]+$'
     or v_customer_name !~ '[[:alpha:]가-힣]' then
    raise exception 'Invalid customer name' using errcode = '22023';
  end if;
  if v_phone !~ '^0[0-9]{9,10}$' then
    raise exception 'Invalid phone number' using errcode = '22023';
  end if;
  if v_age not in ('YES', 'NO') then
    raise exception 'Invalid age response' using errcode = '22023';
  end if;
  if coalesce((p_payload->>'privacy_consent')::boolean, false) is not true then
    raise exception 'Privacy consent is required' using errcode = '22023';
  end if;
  if v_gender is not null and v_gender not in ('MALE', 'FEMALE', 'NO_ANSWER') then
    raise exception 'Invalid gender code' using errcode = '22023';
  end if;
  if v_address is not null and char_length(v_address) > 200 then
    raise exception 'Address is too long' using errcode = '22023';
  end if;

  if nullif(p_payload->>'birth_date', '') is not null then
    if p_payload->>'birth_date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'Invalid birth date' using errcode = '22023';
    end if;
    v_birth_date := (p_payload->>'birth_date')::date;
    if v_birth_date > current_date or v_birth_date < current_date - interval '120 years' then
      raise exception 'Invalid birth date' using errcode = '22023';
    end if;
    if (v_age = 'YES' and v_birth_date > (current_date - interval '14 years')::date)
       or (v_age = 'NO' and v_birth_date <= (current_date - interval '14 years')::date) then
      raise exception 'Birth date and age response do not match' using errcode = '22023';
    end if;
  end if;

  v_guardian_name := nullif(btrim(coalesce(p_payload->>'guardian_name', '')), '');
  v_guardian_phone := regexp_replace(coalesce(p_payload->>'guardian_phone', ''), '[^0-9]', '', 'g');
  v_guardian_relationship := nullif(btrim(coalesce(p_payload->>'guardian_relationship', '')), '');

  if v_age = 'NO' then
    if v_guardian_name is null
       or char_length(v_guardian_name) not between 2 and 50
       or v_guardian_name !~ '^[[:alpha:]가-힣·ㆍ -]+$'
       or v_guardian_phone !~ '^0[0-9]{9,10}$'
       or v_guardian_relationship is null
       or char_length(v_guardian_relationship) not between 2 and 30
       or coalesce((p_payload->>'guardian_consent')::boolean, false) is not true then
      raise exception 'Valid guardian consent is required' using errcode = '22023';
    end if;
  else
    v_guardian_name := null;
    v_guardian_phone := null;
    v_guardian_relationship := null;
  end if;

  v_visit_source := private.jsonb_text_array(p_payload->'visit_source', 'visit_source');
  v_interested_services := private.jsonb_text_array(
    p_payload->'interested_services',
    'interested_services'
  );
  v_desired_image := private.jsonb_text_array(p_payload->'desired_image', 'desired_image');
  v_priority_points := private.jsonb_text_array(p_payload->'priority_points', 'priority_points');
  v_scalp_concerns := private.jsonb_text_array(p_payload->'scalp_concerns', 'scalp_concerns');
  v_hair_concerns := private.jsonb_text_array(p_payload->'hair_concerns', 'hair_concerns');
  v_homecare_purchase_history := private.jsonb_text_array(
    p_payload->'homecare_purchase_history',
    'homecare_purchase_history'
  );

  if cardinality(v_visit_source) = 0
     or not (v_visit_source <@ array[
       'NEARBY', 'NAVER_SEARCH', 'INTRODUCTION', 'BLOG_INSTAGRAM', 'GOOGLE_SEARCH'
     ]::text[]) then
    raise exception 'Invalid visit source' using errcode = '22023';
  end if;
  if 'INTRODUCTION' = any(v_visit_source) then
    if v_introducer_name is null
       or char_length(v_introducer_name) not between 2 and 50
       or v_introducer_name !~ '^[[:alpha:]가-힣·ㆍ -]+$' then
      raise exception 'Valid introducer name is required' using errcode = '22023';
    end if;
  else
    v_introducer_name := null;
  end if;

  if v_style_photo_plan is not null
     and v_style_photo_plan not in ('HAS_PHOTO', 'NO_PHOTO', 'DESIGNER_RECOMMENDATION') then
    raise exception 'Invalid style photo plan' using errcode = '22023';
  end if;
  if v_preferred_designer_level is not null
     and v_preferred_designer_level not in (
       'DIRECTOR', 'SENIOR_CHIEF_DIRECTOR', 'VICE_DIRECTOR', 'OWNER_DIRECTOR', 'NO_PREFERENCE'
     ) then
    raise exception 'Invalid preferred designer level' using errcode = '22023';
  end if;

  if cardinality(v_interested_services) = 0
     or not (v_interested_services <@ array[
       'STYLING', 'CUT', 'PERM', 'COLOR', 'SCALP_CARE', 'HAIR_CARE',
       'DECIDE_AFTER_CONSULTATION'
     ]::text[])
     or ('DECIDE_AFTER_CONSULTATION' = any(v_interested_services)
         and cardinality(v_interested_services) > 1) then
    raise exception 'Invalid interested services' using errcode = '22023';
  end if;

  if cardinality(v_desired_image) = 0
     or not (v_desired_image <@ array[
       'LUXURIOUS', 'NATURAL', 'UNIQUE', 'YOUNGER', 'REFINED', 'TRENDY', 'PERSONALIZED'
     ]::text[]) then
    raise exception 'Invalid desired image' using errcode = '22023';
  end if;

  if cardinality(v_priority_points) = 0
     or not (v_priority_points <@ array[
       'DESIGN_CUT', 'HAIR_DAMAGE', 'VOLUME_BANGS', 'EASY_MAINTENANCE',
       'FAST_SERVICE', 'CURL_ELASTICITY', 'SENSITIVE_SCALP', 'DETAILED_SERVICE'
     ]::text[]) then
    raise exception 'Invalid priority points' using errcode = '22023';
  end if;

  if not (v_scalp_concerns <@ array[
       'ITCHY', 'OILY', 'DRY', 'STINGING', 'SCALP_BUMPS', 'HAIR_LOSS', 'NOT_SURE'
     ]::text[])
     or ('NOT_SURE' = any(v_scalp_concerns) and cardinality(v_scalp_concerns) > 1) then
    raise exception 'Invalid scalp concerns' using errcode = '22023';
  end if;

  if not (v_hair_concerns <@ array[
       'THINNING', 'AGING', 'FRIZZY_DRY', 'NO_VOLUME', 'PARTIAL_CURL', 'PREVIOUS_DAMAGE'
     ]::text[]) then
    raise exception 'Invalid hair concerns' using errcode = '22023';
  end if;

  if not (v_homecare_purchase_history <@ array[
       'EXPERT_RECOMMENDED', 'SNS_POPULAR', 'HOME_SHOPPING_BULK', 'OFFLINE_STORE',
       'NO_INTEREST'
     ]::text[])
     or ('NO_INTEREST' = any(v_homecare_purchase_history)
         and cardinality(v_homecare_purchase_history) > 1) then
    raise exception 'Invalid homecare purchase history' using errcode = '22023';
  end if;

  insert into public.survey_responses (
    store_id,
    designer_id,
    store_name_snapshot,
    designer_name_snapshot,
    survey_version,
    kiosk_session_id,
    idempotency_key,
    age_14_or_over,
    privacy_consent_version,
    privacy_consent_at,
    guardian_name,
    guardian_phone,
    guardian_relationship,
    guardian_consent_at,
    customer_name,
    gender,
    birth_date,
    phone,
    address,
    visit_source,
    introducer_name,
    style_photo_plan,
    preferred_designer_level,
    interested_services,
    desired_image,
    priority_points,
    scalp_concerns,
    hair_concerns,
    homecare_purchase_history,
    answers_snapshot,
    status,
    submitted_at
  ) values (
    v_session.store_id,
    v_session.designer_id,
    v_store_name,
    v_designer_name,
    'PROTOTYPE_V1',
    v_session.id,
    p_idempotency_key,
    v_age,
    'PROTOTYPE_V1',
    v_now,
    v_guardian_name,
    nullif(v_guardian_phone, ''),
    v_guardian_relationship,
    case when v_age = 'NO' then v_now else null end,
    v_customer_name,
    v_gender,
    v_birth_date,
    v_phone,
    v_address,
    v_visit_source,
    v_introducer_name,
    v_style_photo_plan,
    v_preferred_designer_level,
    v_interested_services,
    v_desired_image,
    v_priority_points,
    v_scalp_concerns,
    v_hair_concerns,
    v_homecare_purchase_history,
    p_payload,
    'SUBMITTED',
    v_now
  )
  on conflict (kiosk_session_id, idempotency_key)
    where kiosk_session_id is not null and idempotency_key is not null
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_response_id;

  return v_response_id;
end;
$$;

revoke execute on function public.submit_survey_response(text, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.submit_survey_response(text, uuid, jsonb)
to anon, authenticated;

comment on function public.submit_survey_response(text, uuid, jsonb) is
  'Intentional public prototype endpoint. Validates opaque kiosk token, payload, and idempotency key before inserting one response.';
