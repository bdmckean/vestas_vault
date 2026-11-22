# Deploying vestas_vault on platform_v: evaluation

Recovered from the 2026-10-09 session transcript. Part 1 is the initial evaluation. Part 2 is the revision after deciding on multi-user feedback trials with no billing.

---

## Part 1: Initial evaluation

vestas_vault can't deploy on platform_v as it stands. Platform_v's deploy tooling only handles static sites and a few one-off services, and vestas_vault is a dev-mode Docker Compose app with no auth. Here's what has to change on each side. I only read both repos and changed nothing.

## What each side looks like now

**vestas_vault**
- It has a FastAPI backend (SQLAlchemy, Postgres 16) and a React/Vite frontend.
- `docker-compose.yml` is dev-only. It bind-mounts source, runs `uvicorn --reload` and `npm run dev`, and publishes ports 8005 and 3005.
- It has no authentication. The models have no `user_id` and nothing in the code mentions auth, so it's a single-user app holding personal financial data.
- The frontend calls `/api/v1` through a Vite dev proxy. A production build falls back to `http://localhost:8005`.
- CORS is hard-coded to `http://localhost:3005`.
- The tax and return JSON files are read from `/app/data` in the container. That directory is mounted from the repo-root `data/`, and `backend/data/` is empty.
- Schema setup is `Base.metadata.create_all` plus ad-hoc `ALTER TABLE ... IF NOT EXISTS` calls in `main.py`.

**platform_v**
- Apps run as Coolify projects on a shared Hetzner host. Staging auto-deploys on push to `main`, and production is a manual, git-tagged trigger.
- `infrastructure/deploy` is hardcoded to `schengen_calc`, which is a static SPA built with `railpack`. The only Dockerfile-based deploy is `cli_deploy_billing_service.py`, and that's the closest template.
- The guide's own TODO says to generalize it into a per-app config.
- Auth is self-hosted GoTrue with a shared `platform_data` Postgres behind PostgREST. The `@rethlasoft-platform/auth` SDK is TypeScript, so a Python backend has to validate the GoTrue HS256 JWT itself.
- Billing and entitlements are built only partly, and the PRD gives vestas_vault a 30-day trial, then $10/month or $96/year.
- `APP_INTEGRATION_GUIDE.md` also requires:
  - `CLAUDE.md` and `.env.example`;
  - Terms and Privacy pages;
  - Rethlasoft branding, SEO files and PostHog;
  - a read-only deploy key on the repo.

## Changes needed in vestas_vault

**Required to deploy at all**
1. **Production containers.** Add a backend image with no `--reload` that runs as a non-root user. Build the frontend with `npm run build` and serve `dist/` from nginx, with an SPA fallback and `/api` proxied to the backend. Alternatively, Coolify can serve the backend and frontend as two apps on separate domains.
2. **Compose file.** Either add a production `docker-compose.prod.yml` for Coolify's dockercompose build pack, or drop Compose and deploy the backend as a Dockerfile app. Remove the bind mounts and published ports, and drop the `db` service because it moves to platform_v.
3. **Data files.** Copy the repo-root `data/*.json` into the backend image, for example into `backend/data/`. Right now `COPY . .` with `backend/` as the build context won't include them, so the tax and projection endpoints would break.
4. **Config from the environment.** Make CORS origins an env var instead of `localhost:3005`, and set `API_V1_PREFIX`, `DATABASE_URL` and `ENVIRONMENT` from Coolify. The frontend should always use the relative `/api/v1` in production, not `localhost:8005`.
5. **Schema migrations.** Replace `create_all` and the inline `ALTER`s with Alembic. `create_all` at import time is risky on a shared database, and your uncommitted changes to `holding.py` and `scenario.py` suggest the schema is still changing.
6. **Backend dependencies.** Put `pytest`, `httpx` and the other dev packages in a dev extra, and have the Dockerfile install from `uv.lock`. It currently hard-codes pip installs, so the image can drift from the lockfile.
7. **Repo hygiene.** Add `CLAUDE.md` and keep `.env.example` current. `.env` is gitignored, which is good, but check that `backend/app.db` and `test.db` don't end up in the image.

**Required to join the platform**
8. **Auth.** Add JWT validation in FastAPI against the GoTrue shared secret, then a `user_id` column on every table with a migration. Existing rows get assigned to your account. Add sign-in and sign-out to the frontend, either through `@rethlasoft-platform/auth` or plain `supabase-js`. This is the biggest piece of work, and without it anyone who reaches the URL can read your holdings.
9. **Database.** Decide between a separate database on the shared Postgres host and tables in `platform_data` (see the questions below). The platform's RLS layer expects PostgREST access, but a FastAPI backend would filter by `user_id` itself.
10. **Guide requirements.** Terms and Privacy pages, branding assets, SEO files, PostHog, and `workflow_events` telemetry.
11. **Billing and entitlement.** Gate the API on an active entitlement, per PRD Phase 3. This depends on the platform's billing service being finished.

## Changes needed in platform_v

1. **Generic deploy.** Generalize `infrastructure/deploy` into a per-app config (repo, domains, build pack, base directory, env vars), as the guide's TODO already says. Short of that, add `cli_deploy_vestas_*`, modeled on `cli_deploy_billing_service.py` (`build_pack: dockerfile`). It needs a Dockerfile or compose variant, because the schengen flow only handles static sites.
2. **Domains and DNS.** Pick domains such as `vault.<domain>` and `staging-vault.<domain>`, and add the Porkbun records. Every current domain sits under `schengenlog.com`, so a non-schengen app is new ground.
3. **Auth config.** Extend `app_contract.py` so GoTrue's `GOTRUE_URI_ALLOW_LIST` and PostgREST CORS include vestas_vault's origins and callbacks. Today they're built only from `APP_ORIGINS` for schengenlog.
4. **Database provisioning.** Add a new database or schema and a role for the app on the shared Postgres. Include it in the `provision-db-backups` (wal-g) setup, because this is real financial data with no recovery story yet.
5. **Per-app setup.** Register a deploy key on `bdmckean/vestas_vault`, set up the staging auto-deploy webhook, and keep production manual and tagged.
6. **Secrets.** The `DATABASE_URL` and the JWT secret go in Coolify, not in the app repo.
7. **Other loose ends.** Add the app to uptime monitoring and the PostHog proxy domain, and update `sdlc.md` and the domain table.

## Suggested order

1. Production Docker setup, data-file fix, env-driven config and Alembic in vestas_vault.
2. Generic deploy config in platform_v, then a staging deploy with no auth. Keep staging private, for example behind Coolify basic auth, until step 3 is done.
3. Auth and `user_id` migration, plus the DB and auth wiring on the platform side.
4. Legal pages, branding and analytics, then the production deploy.
5. Billing and entitlement gating, once the platform's billing service is ready.

## Questions for you

1. **Is this a multi-user product or still just yours?** The PRD plans $10/month, but the app has no user model. If it's only for you for now, I'd skip auth and billing and run it as a private deploy behind basic auth. That cuts the list above to items 1–7 plus the platform's deploy generalization.
2. **Separate Postgres or the shared `platform_data`?** I'd lean toward a separate database on the same host, because SQLAlchemy plus Alembic doesn't fit the PostgREST/RLS model.

I can start on the vestas_vault side (production Dockerfiles, compose, config, data files) whenever you say.

---

## Part 2: Revised for multi-user feedback trials

Free trials for a few feedback users change my earlier plan. Several people will be entering their own financial data, so the app needs real multi-user support. It doesn't need billing, though.

## What this changes

**Billing moves out of scope.** Platform_v's new card-free trial mechanism (`POST /trials`, commit `2d9e4f6`) is built for schengenlog, isn't deployed yet, and routes only by `signup_app`. You don't need it for a handful of testers. Skip entitlement gating entirely. Make the app invite-only instead, so the trial is simply that you've invited someone. When you later want the PRD's 30-day trial and $10/month plan, you can wire in `POST /trials` and add `vestas_vault` to its routing.

**Per-user isolation becomes the critical piece.** My earlier items 8 and 9 are now blockers:
- Auth is required, and I'd use the platform's GoTrue so these testers become real platform users.
- A `user_id` column goes on all 9 tables, and every repository query filters on it. A missed filter would show one tester's holdings to another, so it needs tests that check isolation.
- Your existing data gets assigned to your own user ID.
- Without self-signup, only people you invite can create accounts.

**Other changes**
- Add a short Terms and Privacy page. Testers are handing over sensitive data, so a plain "this is not financial advice, here's how your data is stored and deleted" is the minimum.
- Add a way to delete a user's data on request.
- Platform_v's backups (`provision-db-backups`) must cover the app's database before any outside data goes in.
- Branding, SEO and PostHog can wait. Add a feedback link or email in the UI, since feedback is the point.
- A seed or demo mode would help testers who don't want to type in real numbers right away. That's optional.

## Revised minimum path

**vestas_vault**
1. Production Dockerfiles and compose, data files in the image, env-driven CORS and API URL, and Alembic.
2. GoTrue JWT validation in FastAPI, then `user_id` on every table and every query, with isolation tests.
3. Login UI, a Terms/Privacy page, and a feedback link.

**platform_v**
4. Per-app deploy config (or a one-off `cli_deploy_vestas`), a domain with DNS, a database with backups, and the deploy key and staging webhook.
5. Add vestas_vault's origins to the GoTrue redirect allow-list in `app_contract.py`, and turn off open signup (or use invite-only).

Use the staging environment as the tester environment at first, and skip production until you have feedback.

## Questions

1. **How do testers sign up?** I'd recommend that you create their accounts and send invites or magic links. Sign-up stays closed and you can add people one by one. The alternative is open signup with an allowlist.
2. **Domain?** I need to know where it should live, such as a `vault.` subdomain of a domain you own. Every platform domain today is under schengenlog.com.
3. **Is the data they enter real or demo?** If it's real, I'd also add encryption at rest, or at least confirm the Hetzner volume is encrypted.

Once you answer, I'll start on step 1 and 2 in vestas_vault.

---

## Decisions (2026-10-16)

- **Domain:** vestasvault.com (new). Staging at `staging.vestasvault.com`. Needs its own DNS zone and records.
- **Data:** testers enter demo data only. Everything must still be encrypted at rest (Hetzner volume encryption confirmed or enabled, plus encrypted wal-g backups).
- **Signup:** invite-only. Invitation emails go out to an initial tester list, with open signup disabled.

### Implications
- GoTrue invites need working SMTP. Use a transactional provider (Resend, Postmark or SES) with SPF, DKIM and DMARC on vestasvault.com. Without them invites land in spam.
- Add `staging.vestasvault.com` and `vestasvault.com` to `GOTRUE_URI_ALLOW_LIST` in `app_contract.py`. Set `GOTRUE_DISABLE_SIGNUP=true`.
- Invites are sent through the GoTrue admin `/invite` endpoint, driven by a script that reads a tester list (CSV) and is dry-run by default.

### Update (2026-10-19)

- **Domain changed to rethlamap.com.** vestasvault.com was dropped because of a market conflict. Staging is `staging.rethlamap.com`. Read the Decisions section above with that substitution.
- The email notes above are superseded by `PLATFORM_V_INTEGRATION_CHECKLIST.md`: platform_v already sends GoTrue mail through Resend from `noreply@rethlasoftlabs.com`, so no new email provider is needed for the new domain. Invite-only is enforced by the backend using `grant-entitlement`, because `GOTRUE_DISABLE_SIGNUP` can't be set on the GoTrue instance shared with schengenlog.
