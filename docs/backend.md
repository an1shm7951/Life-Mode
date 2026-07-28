# LifeMode Backend

This is the first backend source for LifeMode. It uses Next.js API routes so the frontend and backend live in one project while the product is still young.

## Current API Routes

- `GET /api/app-config` returns modes, platform plan, and safety rules.
- `GET /api/users/demo` returns demo user profiles.
- `GET /api/opportunities` returns all opportunity listings.
- `GET /api/opportunities?mode=law` filters opportunities by mode.
- `GET /api/connect/can-use?userId=user_creator&mode=gym&intent=dating` checks age and mode rules.
- `GET /api/safety/respect-lock?actorUserId=a&targetUserId=b` checks whether a Respect Lock exists.
- `POST /api/safety/respect-lock` creates a platform-wide Respect Lock.
- `POST /api/ai-buddy` creates a starter AI Buddy plan.

## Next Backend Steps

1. Add Supabase for real authentication and database storage.
2. Replace demo arrays with database tables.
3. Add row-level security so users can only access their own private data.
4. Add real AI Buddy responses through an AI API.
5. Add matching logic for Vibe Alerts without exposing private preferences.
