-- Run manually with a privileged database role before a fresh demo.
-- This intentionally keeps stores, designers, admin profiles, and kiosk sessions.
delete from public.survey_responses
where survey_version = 'PROTOTYPE_V1';
