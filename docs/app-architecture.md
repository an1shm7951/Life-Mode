# LifeMode App Architecture

LifeMode should be built as one product with multiple life modes. The architecture must support many features without becoming messy.

## Product Layers

1. User identity
2. Life modes
3. Daily workspace
4. Proof system
5. Opportunities
6. Connect and safety
7. AI Buddy
8. Finance
9. Admin and operations
10. Device clients

## Current Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Authentication: Supabase Auth
- Current persistence: local storage for dashboard interactions
- API routes: Next.js route handlers
- Deployment target: Vercel
- Database target: Supabase Postgres

## Target Stack

- Next.js web app for browser, laptop, tablet, and PWA.
- Supabase Auth for identity.
- Supabase Postgres for app data.
- Supabase Row Level Security for private user data.
- Next.js API routes for business rules.
- Vercel for hosting.
- Expo / React Native later for iOS and Android.

## Frontend Structure

Recommended structure:

```text
src/
  app/
    page.tsx
    login/page.tsx
    signup/page.tsx
    dashboard/page.tsx
    opportunities/page.tsx
    profile/page.tsx
    settings/page.tsx
    api/
  components/
    layout/
    dashboard/
    auth/
    opportunities/
    safety/
    ui/
  lib/
    lifemode/
    supabase/
    storage/
    validation/
```

Current pages:

- `/` landing/product overview
- `/signup` account creation
- `/login` account login
- `/dashboard` main app workspace

Near-term pages:

- `/opportunities`
- `/profile`
- `/settings`
- `/admin/opportunities`

## Core Database Tables

### profiles

Stores public and private user profile details.

Fields:

- id
- user_id
- display_name
- age_band
- active_mode
- bio
- is_public
- created_at
- updated_at

### goals

Stores user goals by mode.

Fields:

- id
- user_id
- mode
- title
- done
- due_date
- created_at
- updated_at

### proof_posts

Stores proof timeline items.

Fields:

- id
- user_id
- mode
- text
- media_url
- visibility
- created_at

### opportunities

Stores jobs, internships, freelance gigs, scholarships, competitions, and startup roles.

Fields:

- id
- type
- title
- organization
- location
- mode
- tags
- source
- verified
- apply_url
- created_at

### opportunity_actions

Stores whether a user saved or applied to an opportunity.

Fields:

- id
- user_id
- opportunity_id
- status
- notes
- created_at
- updated_at

### connection_preferences

Stores the user intent settings.

Fields:

- id
- user_id
- mode
- intent
- enabled
- created_at
- updated_at

### respect_locks

Stores Not Interested, Block, and Report boundaries.

Fields:

- id
- actor_user_id
- target_user_id
- reason
- created_at

### ai_buddy_history

Stores AI Buddy plans and reflections.

Fields:

- id
- user_id
- mode
- buddy_mode
- prompt
- message
- next_actions
- created_at

### finance_transactions

Stores income, expenses, transfers, and payment-linked records.

Fields:

- id
- user_id
- type
- amount
- currency
- category
- note
- payment_method
- payment_reference
- occurred_at
- created_at

### finance_budgets

Stores monthly category budgets.

Fields:

- id
- user_id
- month
- category
- limit_amount
- created_at
- updated_at

### finance_goals

Stores savings goals.

Fields:

- id
- user_id
- title
- target_amount
- current_amount
- target_date
- created_at
- updated_at

## Safety Architecture

Safety rules must be enforced in both frontend and backend.

Rules:

- Dating is only available for 18+ users.
- Dating is always opt-in.
- Not Interested creates a platform-wide Respect Lock.
- Block and Report are stronger than Not Interested.
- Exact location is never shown before mutual consent.
- Under-18 users have restricted social discovery and no dating.
- Mode rules decide where partners are useful.

Backend safety functions should answer:

- Can this user use this connection intent?
- Can this user message that user?
- Does a Respect Lock exist?
- Is this feature allowed for this age band?

## AI Buddy Architecture

Version 1:

- Rule-based AI Buddy plans.
- Mode-specific roles.
- Saved history.

Version 2:

- Real AI API response.
- Weekly review.
- Better prompts based on goals and proof.

Version 3:

- Long-term memory with user control.
- Voice support.
- Notifications.

## Opportunities Architecture

Version 1:

- Seeded opportunities.
- Save/apply status.

Version 2:

- Admin-managed opportunities.
- Company submission form.
- Verified company flag.
- Application tracker.

Version 3:

- Partner portals.
- External APIs where legally and commercially allowed.
- Better matching from proof and profile.

## Finance Architecture

Version 1 after launch:

- Manual income and expense tracking.
- Categories.
- Monthly summaries.
- Savings goals.

Version 2 after launch:

- Payment provider integration planning.
- UPI support where legally and technically available.
- Tap-to-pay support where device, provider, and region rules allow it.
- Payment history linked to expenses.

Important:

Payments are regulated. The app must use approved payment providers and follow legal, banking, and app store rules.

## Device Architecture

Use one web app first.

Why:

- Faster to build.
- Works on laptop, iPhone, Android, iPad, and Android tablet.
- Easier to deploy and fix.

Native apps come later after the product is proven.

Native plan:

- Expo / React Native for iOS and Android.
- Shared API and database.
- Shared design language.
- Push notifications.
- Native camera for proof posts.

Watch plan:

- Only quick actions:
  - check goal
  - add proof note
  - streak reminder
  - AI Buddy nudge

## Release Architecture Order

1. Finish web dashboard.
2. Move local storage to Supabase tables.
3. Add premium responsive UI.
4. Add admin opportunity tools.
5. Deploy to Vercel.
6. Test with real users.
7. Build native apps after retention is proven.
