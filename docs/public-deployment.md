# Public Deployment Plan

`http://127.0.0.1:3000` only works on the developer laptop. Other people cannot use the app from that address.

To let everyone use LifeMode, deploy the app to a public host and connect the same Supabase project.

## Recommended First Deployment

Use Vercel for the first public/private-beta web deployment because this is a Next.js app.

## Environment Variables

Add these variables in the hosting provider dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_gemini_key_if_available
GEMINI_MODEL=gemini-2.5-flash-lite
OPENAI_API_KEY=optional_later
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_SERVICE_ROLE_KEY=server_only_for_account_deletion
OLLAMA_BASE_URL=optional_later
OLLAMA_MODEL=optional_later
```

Never expose server secrets with `NEXT_PUBLIC_` unless the provider explicitly says the key is safe for browsers.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Add it in Vercel, never in browser code and never with a `NEXT_PUBLIC_` prefix.

## Database Migrations

Run the SQL files in order in the Supabase SQL Editor:

1. `supabase/migrations/0001_lifemode_core.sql`
2. `supabase/migrations/0002_public_launch_hardening.sql`
3. `supabase/migrations/0003_remove_demo_data.sql`
4. `supabase/migrations/0004_subscriptions.sql`
5. `supabase/migrations/0005_remove_profile_placeholders.sql`

## Supabase Settings

After deployment, update Supabase Auth URL settings:

- Site URL: the deployed LifeMode URL.
- Redirect URLs:
  - `https://your-domain.com/reset-password`
  - `https://your-domain.com/dashboard`
  - local development URLs can remain for testing.

## What Users Will Use

Local development:

```text
http://127.0.0.1:3000
```

Public/private beta:

```text
https://your-lifemode-domain.vercel.app
```

Custom brand domain later:

```text
https://lifemode.app
```

## Release Order

1. Local testing on laptop.
2. Vercel early-access URL for trusted testers.
3. Custom domain.
4. iOS and Android wrappers after the web app is stable.
5. Native mobile/watch apps only after the product loop is proven.
