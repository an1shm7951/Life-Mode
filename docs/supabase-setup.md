# Supabase Setup

This is the next step after the app flow works.

The app currently uses Supabase Auth, but dashboard data is still stored locally in the browser. To make LifeMode work across laptop, phone, and future devices, we need real database tables.

## What This Adds

The migration file creates tables for:

- profiles
- goals
- proof posts
- opportunities
- opportunity actions
- connection preferences
- respect locks
- AI Buddy history
- finance transactions
- finance budgets
- finance goals

It also enables Row Level Security so users can only manage their own private data.

## File To Run

```text
supabase/migrations/0001_lifemode_core.sql
```

## How To Run It

1. Open Supabase.
2. Open your LifeMode project.
3. Go to SQL Editor.
4. Create a new query.
5. Copy all SQL from:

```text
supabase/migrations/0001_lifemode_core.sql
```

6. Paste it into Supabase SQL Editor.
7. Click Run.

## After It Runs

Check Supabase Table Editor. You should see:

- profiles
- goals
- proof_posts
- opportunities
- opportunity_actions
- connection_preferences
- respect_locks
- ai_buddy_history
- finance_transactions
- finance_budgets
- finance_goals

## Important

Do not paste your secret key into the app.

The frontend should only use:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Next Coding Step

After the SQL runs successfully, update the app pages to use Supabase tables instead of local storage.

Order:

1. Profiles
2. Goals
3. Proof posts
4. Opportunity actions
5. AI Buddy history
6. Finance tracker

