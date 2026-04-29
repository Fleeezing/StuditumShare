# fetch-garching-menu

Fetches the official Studierendenwerk München Oberbayern Mensa Garching menu,
predicts lightweight dish scores, and upserts the result into
`public.mensa_menu_daily`.

Deploy:

```bash
supabase functions deploy fetch-garching-menu --project-ref egocecoudqerewvurumh
```

The function expects Supabase's built-in Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Schedule it with `sql/supabase_mensa_menu_cron_setup.sql` after the function
is deployed and the database migration has run.
