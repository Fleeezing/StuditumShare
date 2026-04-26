# Deploy

The official deploy target is GitHub Pages, not GitLab Pages.

Use:

- `docs/GITHUB_PAGES_DEPLOY.md` for one-time setup
- `scripts/sync-pages.ps1` before each push
- `.github/workflows/deploy-pages.yml` for automatic deployment

Supabase settings required before inviting users:

- Authentication > Sign In / Providers > Confirm email: off
- Authentication > Sign In / Providers > Allow new users to sign up: on

Do not commit or share Supabase secret keys.
