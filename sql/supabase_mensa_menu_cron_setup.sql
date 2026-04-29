-- Seat Happens Garching mensa menu cron setup.
-- This file is intentionally not part of generated migrations because it needs
-- project-specific Vault secrets. Run it manually after deploying the Edge Function.

-- 1) Enable required extensions in Supabase SQL Editor if they are not enabled yet.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- 2) Store secrets once in Supabase Vault.
-- Replace YOUR_PUBLISHABLE_OR_ANON_KEY with the same public key used by the frontend.
-- If a secret name already exists, update it in Dashboard > Vault instead of re-running create_secret.
select vault.create_secret('https://egocecoudqerewvurumh.supabase.co', 'seat_happens_project_url');
select vault.create_secret('YOUR_PUBLISHABLE_OR_ANON_KEY', 'seat_happens_anon_key');

-- 3) Replace any older job with the same name, then schedule weekday refreshes.
select cron.unschedule(jobid)
from cron.job
where jobname = 'seat-happens-fetch-garching-menu';

select cron.schedule(
  'seat-happens-fetch-garching-menu',
  '30 7,9 * * 1-5',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'seat_happens_project_url') || '/functions/v1/fetch-garching-menu',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'seat_happens_anon_key')
      ),
      body := jsonb_build_object('source', 'supabase-cron', 'time', now())
    ) as request_id;
  $$
);
