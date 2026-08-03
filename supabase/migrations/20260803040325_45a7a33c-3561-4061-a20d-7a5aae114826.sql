DROP POLICY "responses_public_insert" ON public.survey_responses;
CREATE POLICY "responses_kiosk_insert" ON public.survey_responses
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'SUBMITTED'
  AND length(customer_name) BETWEEN 2 AND 50
  AND phone ~ '^0[0-9]{9,10}$'
  AND privacy_consent_version <> ''
  AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.is_active)
  AND EXISTS (SELECT 1 FROM public.designers d WHERE d.id = designer_id AND d.store_id = survey_responses.store_id AND d.is_active)
);