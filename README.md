# LifeMode

**LifeMode is an AI-assisted Personal Operating System** for bringing goals, daily plans, progress and personal growth into one considered space.

Production site: https://lifemode.vercel.app

## Product direction

LifeMode is built around three connected pillars:

1. **Intelligence** — AI assistance that helps people think through plans and next steps.
2. **Integration** — a connected home for goals, planning, proof of progress and personal workflows.
3. **Growth** — tools that make progress visible and help people reflect and keep moving.

LifeMode is in early access. Product capabilities, integrations and policies may change as the service develops.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Authentication and Postgres
- Tailwind CSS 4
- Vercel deployment

## Local development

Requirements: Node.js compatible with the installed Next.js release and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run test:smoke
npm run build
```

## Environment variables

Configure project secrets in the hosting provider. Never commit secrets or expose service-role keys through `NEXT_PUBLIC_*` variables.

Common configuration includes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; only where an audited server route requires it)
- AI provider keys used by enabled server-side features

See `docs/public-deployment.md` for the deployment checklist.

## SEO and public routes

The public sitemap is generated at `/sitemap.xml`; crawler rules are generated at `/robots.txt`. Only public informational pages belong in the sitemap. Authenticated app routes and account flows are marked noindex.

See `docs/SEO_LAUNCH_CHECKLIST.md` for Search Console and Webmaster Tools setup.

## Privacy, terms and licensing

The privacy notice and terms are early-access summaries, not final legal agreements. Before broad public release, complete `docs/LEGAL_REVIEW_CHECKLIST.md` with qualified counsel and the actual service operator.

The project source is intended to be proprietary. See `LICENSE` and `docs/THIRD_PARTY_LICENSES.md`. Third-party package licenses remain separate from the LifeMode source license.
