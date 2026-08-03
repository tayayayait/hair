CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.designers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text NOT NULL DEFAULT 'DIRECTOR',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.designers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.designers TO authenticated;
GRANT ALL ON public.designers TO service_role;
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "designers_public_read" ON public.designers FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  designer_id uuid REFERENCES public.designers(id),
  store_name_snapshot text NOT NULL,
  designer_name_snapshot text NOT NULL,
  age_14_or_over text NOT NULL,
  privacy_consent_version text NOT NULL,
  privacy_consent_at timestamptz NOT NULL,
  guardian_name text,
  guardian_phone text,
  guardian_relationship text,
  guardian_consent_at timestamptz,
  customer_name text NOT NULL,
  gender text,
  birth_date date,
  phone text NOT NULL,
  address text,
  visit_source text[] NOT NULL DEFAULT '{}',
  introducer_name text,
  style_photo_plan text,
  preferred_designer_level text,
  interested_services text[] NOT NULL DEFAULT '{}',
  desired_image text[] NOT NULL DEFAULT '{}',
  priority_points text[] NOT NULL DEFAULT '{}',
  scalp_concerns text[] NOT NULL DEFAULT '{}',
  hair_concerns text[] NOT NULL DEFAULT '{}',
  homecare_purchase_history text[] NOT NULL DEFAULT '{}',
  answers_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'SUBMITTED',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.survey_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses_public_insert" ON public.survey_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "responses_admin_read" ON public.survey_responses FOR SELECT TO authenticated USING (true);

INSERT INTO public.stores (name, code) VALUES ('아이디헤어 강남점', 'GANGNAM'), ('아이디헤어 홍대점', 'HONGDAE');
INSERT INTO public.designers (store_id, name, level)
SELECT s.id, d.name, d.level FROM public.stores s
JOIN (VALUES
  ('GANGNAM','김지훈','DIRECTOR'),
  ('GANGNAM','이서연','SENIOR_CHIEF_DIRECTOR'),
  ('GANGNAM','박도현','VICE_DIRECTOR'),
  ('HONGDAE','최유진','DIRECTOR'),
  ('HONGDAE','정민석','OWNER_DIRECTOR'),
  ('HONGDAE','한소희','DIRECTOR')
) AS d(store_code, name, level) ON d.store_code = s.code;