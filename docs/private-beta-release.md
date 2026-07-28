# LifeMode Private Beta Release

Target: private beta for a small group of trusted testers.

## What Is Ready

- Account signup, login, logout, forgot password, and password reset pages.
- Supabase-backed user profile, goals, proof posts, opportunities, connection preferences, and AI Buddy history.
- Dashboard Life Loop: next action, latest proof, readiness score, and opportunity motion.
- Goal to proof flow: turn a completed goal into a proof post.
- Opportunity to goal flow: create a preparation goal from an opportunity.
- Proof Profile page for profile editing and proof review.
- Opportunities page for tracking status, notes, deadlines, and follow-ups.
- AI Buddy chat UI with provider support for OpenAI, Ollama, Gemini, and fallback mode.
- Private beta warnings for non-sensitive test data.

## Beta Rules

- Invite only trusted testers.
- Tell testers not to enter sensitive personal, medical, financial, legal, or password data.
- Use LifeMode as a planning and proof-building app, not as legal, medical, financial, or emergency advice.
- Keep AI keys only in `.env.local` or deployment secrets.
- Do not commit `.env.local` to GitHub.

## Tomorrow Test Script

1. Create an account.
2. Log out and log back in.
3. Add one goal.
4. Click `Proof` on that goal.
5. Confirm the proof appears in the Proof Timeline.
6. Save one opportunity.
7. Click `Add goal` on an opportunity.
8. Ask AI Buddy a harmless planning question.
9. Open Proof Profile and update bio/skills.
10. Open Opportunities and update status/notes.

## Not Ready For Public Launch Yet

- App Store and Play Store packaging.
- Payment system.
- Production AI privacy contracts.
- Real company opportunity partnerships.
- Full moderation/reporting system.
- Account deletion and data export.
- Legal privacy policy and terms of service reviewed by a professional.
- Production monitoring and backup policy.

## Tomorrow Release Decision

Release as private beta only if:

- Signup and login work.
- Dashboard loads for a fresh account.
- Goals, proof, and opportunities save correctly.
- AI Buddy does not expose keys or crash the app.
- Testers understand this is a beta and should not enter sensitive data.
