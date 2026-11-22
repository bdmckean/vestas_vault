# vestas_vault → platform_v integration checklist

Checked against platform_v `main` (0a95512) on 2026-10-16. Companion to `PLATFORM_V_DEPLOY_EVALUATION.md`.
App identifier: **`rethlamap`** (decided 2026-11-10). It is the platform-facing name used for `signup_app`, `TRIAL_DAYS`, `grant-entitlement --app`, the entitlement check and the database name. It is a free-form string, independent of the repo name. The repo (`bdmckean/vestas_vault`) appears only in the deploy config (repo slug, SSH URL, deploy key and webhook names), so a later rename means updating that config.
Domain: **rethlamap.com** (reserved 2026-10-19; vestasvault.com was dropped because of a market conflict). Staging at `staging.rethlamap.com`.
Scope: invite-only feedback testers, demo data only, encrypted at rest, no billing.

## What platform_v already gives us (no work needed)

- Shared Coolify host, Let's Encrypt TLS, Porkbun DNS automation, and staging auto-deploy on push to `main`.
- Self-hosted GoTrue (`auth.schengenlog.com`) with SMTP wired to Resend (`smtp.resend.com:587`). The sender is `noreply@rethlasoftlabs.com`. Because the sender domain is the platform's, `rethlamap.com` needs no mail setup of its own.
- Continuous wal-g backups of `platform_data`, encrypted at rest, 14-day retention, with a weekly restore drill.
- A `grant-entitlement` CLI that gives a user free access to an app, or revokes it, by email. This is our invite-only gate.
- PostHog, uptime monitoring and `workflow_events` telemetry.

## Gaps and gotchas found (these shape the checklist)

1. **GoTrue is shared with schengenlog.** `GOTRUE_DISABLE_SIGNUP` is hardcoded `"false"` in `cli_provision_gotrue.py`. Closing signup would break schengenlog, and any schengenlog user can already get a valid JWT. So **"invite-only" must be enforced by the vestas_vault backend**, using an entitlement check or an allowlist. It can't be a GoTrue setting.
2. **`grant-entitlement` only accepts registered apps.** The app must appear in `PLAN_MODES` or `TRIAL_DAYS` in `services/billing/.../trials.py` or `plans.py`. Registering `rethlamap` in `TRIAL_DAYS` (even with a long value) is the simplest way to use `grant-entitlement`. The default `--app` is `schengen_calc`, so always pass `--app rethlamap`.
3. **All auth email is SchengenLog-branded, and the requirement is per-app branding for all email (decided 2026-11-11).** GoTrue has one SMTP sender name and address (`noreply@rethlasoftlabs.com`), one set of templates (confirmation, recovery and magic link, hardcoded SchengenLog in `email_templates.py`), and no invite template. Verification links also point at `auth.schengenlog.com`. See the Email branding decision below.
4. **`app_contract.py` is single-app.** `APP_ORIGINS`, `REDIRECT_URLS` and the PostgREST and billing CORS lists only cover schengenlog. The allow-list and CORS need rethlamap's origins.
5. **Deploy tooling is static-site only.** `deploy-schengen-*` is hardcoded to `schengen_calc` (a static SPA). The guide's own TODO asks for a generic per-app config. For a FastAPI and Postgres app, the closest template is `cli_deploy_billing_service.py` (dockerfile build pack).
6. **Disk encryption: resolved.** Platform_v put both Postgres data directories (production and staging) on LUKS-encrypted Hetzner volumes, live since 2026-11-10 (`provision-db-encryption`, `docs/host-rebuild-runbook.md`). A new database in the same instance is covered automatically. See section D.
7. **Shared-DB model mismatch.** The platform's `platform_data` uses PostgREST and RLS. A SQLAlchemy and Alembic backend filtering by `user_id` doesn't fit that model. I recommend a separate database on the same Postgres instance (so the same backup job covers it). This is still to be decided. **Decided 2026-11-11: separate database** (see the Database decision above).

## Database decision (2026-11-11)

**A separate database per app on the shared Postgres instance** (not a schema inside `platform_data`, and not a Postgres container per app).

- **Why:** `platform_data` holds `auth.users`, billing and schengenlog's tables, so a separate database plus its own role keeps financial data away from credentials. Alembic works best owning its own database. Wiping, dumping or dropping one app's data (and its staging copy) is a single operation. It also stays clear of the PostgREST and RLS model.
- **Costs:** a small per-database overhead and more connection pools on the shared `cpx22` (keep the pool small). No cross-database joins are needed, because the backend identifies users by the JWT `sub`, not a foreign key to `auth.users`.
- **Backups:** wal-g archiving is physical, so it should cover every database in the instance. Point-in-time restore is for the whole instance either way. Restoring one app alone means a logical `pg_dump`, which is easier with its own database.
- **Convention for every app:** database named for the app identifier (`rethlamap`), an app role (`rethlamap_app`) and a migrator role that runs Alembic.
- **Rejected:** a Postgres container per app. It needs its own backup chain and is overkill for now.

## Email branding decision (2026-11-11)

**Requirement:** every email a user receives from an app (invite, confirmation, password reset, magic link, feedback replies) carries that app's name, logo and colors, is sent from that app's own domain, and has links on that app's own domain. No SchengenLog or auth.schengenlog.com in rethlamap email.

**Findings**
- Only GoTrue sends product email today. The billing service sends none (Stripe's own receipts are configured in the Stripe account).
- GoTrue's SMTP sender, subjects and templates are instance-wide. Templates can read user metadata, but the From name and address cannot vary, and verification links use the GoTrue host. Template branching alone therefore can't meet the requirement.
- Browser-initiated flows (`signUp`, `resetPasswordForEmail`) make GoTrue send the email itself, so doing it in the app backend would not catch them.

**Recommended approach: GoTrue's Send Email Hook + a small platform mailer service**
1. In `provision-gotrue`, enable the hook (`GOTRUE_HOOK_SEND_EMAIL_*`, an HTTP endpoint with a shared secret). GoTrue then stops sending and instead posts the user, the action type (signup, invite, recovery, magic link, email change) and the token hash. **Verify the exact env names and payload against GoTrue v2.196.0 before building.**
2. A mailer service (deployed like the billing service) picks the brand from `user_metadata.signup_app` (legacy fallback `schengen_calc`, as the billing service does), renders the template, and sends through the Resend API.
3. A per-app brand registry in platform_v (display name, From address, logo URL, colors, footer, link base URL). It replaces the hardcoded SchengenLog constants and templates in `email_templates.py`. Add a regression test that the schengen output stays identical.
4. Links point to the app's own domain with `token_hash` and `type` (for example `https://staging.rethlamap.com/auth/confirm`), and the app verifies with `verifyOtp`. This keeps `auth.schengenlog.com` out of the email.
5. Admin invites must set `data: {signup_app: 'rethlamap'}` so the invite is branded correctly.

**Per-app one-time setup**
- [ ] Verify `rethlamap.com` as a sending domain in Resend (SPF, DKIM, return-path, DMARC records in Porkbun). Check whether platform_v automates this or it is manual.
- [ ] Sender address `noreply@rethlamap.com`. Reply-to and the feedback and support address is `support@rethlasoftlabs.com` (decided 2026-11-13). Set it as the Reply-To header on every rethlamap email, and use it in the UI feedback link and the Terms and Privacy contact line. Confirm that mailbox exists and is monitored.
- [ ] Brand entry, logo and colors for rethlamap (the Rethlasoft branding guide applies to the app UI; decide what the email brand is).
- [ ] Add a test-send step to the invite script, run against a staging address before real testers.

**Alternatives rejected**
- One shared GoTrue with branching templates: leaks the From name and auth host.
- A separate GoTrue per app: fully branded but breaks shared identity and multiplies the operational load.

## A. vestas_vault repo

- [ ] Production backend Dockerfile: no `--reload`, non-root user, installs from `uv.lock`, dev dependencies split out.
- [ ] Production frontend: `npm run build`, with `dist/` served by nginx or Caddy (SPA fallback, `/api` proxied to the backend).
- [ ] Production compose or Coolify app definition: no bind mounts, no published ports, no `db` service.
- [ ] Copy the repo-root `data/*.json` into the backend image (they are missing from the `backend/` build context today).
- [ ] Config from the environment: CORS origins, `DATABASE_URL`, `ENVIRONMENT`, the GoTrue JWT secret. The frontend uses a relative `/api/v1` in production.
- [ ] Alembic migrations replace `create_all` and the inline `ALTER TABLE`s.
- [ ] Auth: validate GoTrue HS256 JWTs in FastAPI (`sub` is the user id, `aud` is `authenticated`).
- [ ] Authorization gate: call the billing service's `GET /entitlements/me?app=rethlamap` with the user's token, and allow only users whose entitlement is active. Fail closed for writes.
- [ ] `user_id` column on all 9 tables, with every repository query filtered by it. Existing rows go to the owner account. Add cross-user isolation tests.
- [ ] Login UI via `@rethlasoft-platform/auth` or `supabase-js`, using `signup_app: 'rethlamap'`.
- [ ] Endpoint or script to delete all of a user's data.
- [ ] Terms and Privacy pages. Privacy must state the demo-data policy and how data is stored and deleted. Add a feedback link or email.
- [ ] Platform requirements: `CLAUDE.md`, `.env.example`, Rethlasoft branding assets, `robots.txt`, `sitemap.xml`, meta tags. PostHog can follow the first tester round.
- [ ] Optional: demo or seed data so testers don't have to type in numbers.
- [ ] Make sure `backend/app.db` and `test.db` are not copied into the image.

## B. platform_v repo

- [ ] Add `rethlamap` to `TRIAL_DAYS` (or `PLAN_MODES`) in `services/billing`, then re-run `uv run deploy-billing-service` (no auto-deploy).
- [ ] Add the app's origins to `app_contract.py` (`APP_ORIGINS`, so the GoTrue allow-list and PostgREST CORS pick them up). Also add the origins to `CORS_ALLOWED_ORIGINS` on the billing Coolify app. Re-run `provision-gotrue`, and `provision-data-postgres` if PostgREST CORS is needed.
- [ ] Deploy tooling: write `cli_deploy_rethlamap` (or a generic per-app config) modeled on `cli_deploy_billing_service.py`. It covers the backend and frontend containers, env vars and health checks.
- [ ] Register a read-only deploy key on `bdmckean/vestas_vault`, and wire the staging webhook (auto-deploy on push to `main`). Production stays manual and tagged.
- [ ] Pick the new domain and add DNS: `staging.rethlamap.com` and the apex. The domain is reserved; confirm it is in the Porkbun account that platform_v's API key controls (or move or transfer it there), since DNS automation only works on that account.
- [ ] Database (see the Database decision above): extend `cli_provision_data_postgres.py` (it hardcodes `POSTGRES_DB = "platform_data"`) or add a sibling step that creates the `rethlamap` database, the `rethlamap_app` role and a `rethlamap_migrator` role. The app role must have no access to `platform_data` (auth, billing, schengenlog tables).
- [ ] Verify the wal-g archive covers the new database (physical archiving should cover the whole instance, but this has not been checked), and add a rethlamap heartbeat to the weekly restore drill, which only checks `platform_data` today.
- [ ] Secrets in Coolify only: `DATABASE_URL`, the JWT secret, and any API keys.
- [ ] Per-app email branding: see the Email branding decision. This replaces the earlier "optional sender name and INVITE template" idea.
- [ ] Add uptime monitoring and the PostHog proxy domain. Update `sdlc.md` and the domain table.

## C. Invite flow (depends on the per-app email path)

1. Create the tester's account, either by having them sign up, or with GoTrue's admin `/invite` endpoint, passing `data: {signup_app: 'rethlamap'}`. The invite email is sent by the per-app mailer (Email branding decision), not GoTrue's default template.
2. Run `uv run grant-entitlement grant --app rethlamap --email <tester> --until <date> --reason "feedback tester" --staging`.
3. The backend admits only users with an active `rethlamap` entitlement. Revoke with `grant-entitlement revoke`.
4. Optionally, a small script reads a CSV of tester emails and does steps 1 and 2 (dry run by default).

## D. Encryption at rest (resolved: verify only)

- Live Postgres data is on LUKS-encrypted Hetzner volumes (production and staging), live since 2026-11-10. Backups are wal-g encrypted. The new `rethlamap` database inherits both.
- [ ] Run `uv run provision-db-encryption check --production` and `--staging`, and confirm the new database's data directory is on the encrypted volume after it is created.
- Limit to state in the Privacy page: the LUKS keyfiles live on the host's root disk, so this protects against a detached or snapshotted volume, not against a compromise of the running host. Recovery passphrases are in the password manager.

## E. Suggested order

1. Build the per-app email path (Email branding decision) in parallel with the vestas_vault work. It gates the first invites.
2. vestas_vault production containers, config, data files and Alembic.
3. Platform side: billing registration, `app_contract.py` origins, DB, deploy tooling, DNS.
4. First **staging** deploy, with no testers, behind basic auth.
5. Auth, `user_id` and isolation tests, then the entitlement gate.
6. Terms, Privacy and feedback link, then grant the first testers and invite them.
7. Production only after tester feedback.

## Open questions

- Optional later: rename the GitHub repo to `rethlamap` and update the repo slug in the deploy config. Not required for launch.
- Email branding: confirm the Send Email Hook approach and its exact env names against GoTrue v2.196.0, and decide where the mailer service lives.
- Support mailbox: `support@rethlasoftlabs.com` is shared across apps, so testers' replies will arrive without an app label. Put the app name in the subject line or a header, or accept it for the tester phase.
