# LifeMode Creator Guide

This guide is for you as the creator. The app has two main parts:

1. Frontend: what users see and click.
2. Backend: the source code that stores rules, returns data, and later connects to a database.

Right now LifeMode is a Next.js app. That means the frontend and backend live inside one project.

## Project Structure

```text
lifemode/
  src/
    app/
      page.tsx
      layout.tsx
      globals.css
      api/
        app-config/route.ts
        users/demo/route.ts
        opportunities/route.ts
        connect/can-use/route.ts
        safety/respect-lock/route.ts
        ai-buddy/route.ts
    lib/
      lifemode/
        types.ts
        data.ts
        safety.ts
        ai-buddy.ts
  docs/
    backend.md
    creator-guide.md
```

## How A Next.js App Works

`src/app/page.tsx` is the main screen. When someone opens the app, this file creates the page they see.

`src/app/layout.tsx` wraps the whole app. It is where we set the app name and metadata.

`src/app/globals.css` controls global styling.

`src/app/api/.../route.ts` files are backend API routes. These are URLs the frontend can call to get or save data.

`src/lib/lifemode/...` files are helper source files. They keep business logic away from the page design.

## Frontend Example

This is the basic idea behind a page:

```tsx
export default function Home() {
  return (
    <main>
      <h1>LifeMode</h1>
      <p>Build your life. Prove your progress. Find your people.</p>
    </main>
  );
}
```

The function returns JSX. JSX looks like HTML, but it is written inside TypeScript/JavaScript.

## Reusable Component Example

In `page.tsx`, we use a reusable `Panel` component:

```tsx
function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

This lets us write:

```tsx
<Panel title="Row 3: Modes" eyebrow="One app, many life modes">
  <p>Student, Gym, Career, Business, Law, Creator</p>
</Panel>
```

That is how you avoid repeating the same layout code again and again.

## Backend Example

This is a simple API route:

```ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    appName: "LifeMode",
    status: "working",
  });
}
```

If this file is saved as:

```text
src/app/api/app-config/route.ts
```

Then the app creates this backend URL:

```text
/api/app-config
```

When a browser or frontend asks for that URL, it gets JSON data back.

## Types

`src/lib/lifemode/types.ts` defines the shape of the app data.

Example:

```ts
export type UserProfile = {
  id: string;
  displayName: string;
  ageBand: "under_18" | "adult";
  activeMode: LifeModeId;
  interests: string[];
  skills: string[];
  proofScore: number;
};
```

Types help you avoid mistakes. If a user profile is missing `displayName`, TypeScript can warn you before the app breaks.

## Data

`src/lib/lifemode/data.ts` currently stores demo data.

Example:

```ts
export const opportunities = [
  {
    id: "opp_law_01",
    type: "internship",
    title: "Legal research intern",
    organization: "Practice Desk",
    location: "Hybrid",
    mode: "law",
  },
];
```

Later, this data will move into Supabase. For now, demo data helps us build the app fast.

## Business Logic

Business logic means app rules.

Example rule:

> Dating is only available for 18+ users.

That rule lives in `src/lib/lifemode/safety.ts`:

```ts
if (intent === "dating" && user.ageBand !== "adult") {
  return { allowed: false, reason: "Dating is only available for 18+ users." };
}
```

This is important. Rules should not be hidden inside button design. They should live in backend/helper code so they are harder to bypass later.

## AI Buddy Logic

`src/lib/lifemode/ai-buddy.ts` creates the first AI Buddy plan.

Right now it is not calling a real AI model yet. It returns a simple response:

```ts
return {
  buddyMode,
  message: `${buddyMode} is ready. We will focus on ${request.goal}.`,
  nextActions: [
    "Write one clear outcome for today.",
    "Create one proof item before the day ends.",
    "Review what blocked you and adjust tomorrow's plan.",
  ],
};
```

Later, this file can connect to OpenAI or another AI provider.

## How To Test Backend URLs

Open these in the browser:

```text
http://127.0.0.1:3000/api/app-config
http://127.0.0.1:3000/api/users/demo
http://127.0.0.1:3000/api/opportunities
http://127.0.0.1:3000/api/opportunities?mode=law
```

For POST routes like AI Buddy, we usually test from code or a tool.

## How To Build Another App Later

Use this same pattern:

1. Decide the app idea.
2. Create the user-facing page in `src/app/page.tsx`.
3. Define data shapes in `src/lib/your-app/types.ts`.
4. Add demo data in `src/lib/your-app/data.ts`.
5. Put rules in `src/lib/your-app/rules.ts`.
6. Create API routes in `src/app/api/.../route.ts`.
7. Test with `npm run lint` and `npm run build`.
8. Replace demo data with a real database.

## The Creator Mental Model

Every app can be understood as this loop:

```text
User clicks something
  -> frontend sends request
  -> backend checks rules
  -> backend reads or writes data
  -> backend returns response
  -> frontend updates the screen
```

For LifeMode:

```text
User chooses Dating
  -> frontend asks /api/connect/can-use
  -> backend checks age and mode rules
  -> backend returns allowed or blocked
  -> frontend shows the correct result
```

## Current Commands

Run the app:

```powershell
npm run dev
```

Check code quality:

```powershell
npm run lint
```

Check production build:

```powershell
npm run build
```

## What To Learn First

Learn in this order:

1. HTML basics
2. CSS basics
3. JavaScript basics
4. TypeScript basics
5. React components
6. Next.js pages and API routes
7. Database with Supabase
8. Authentication
9. Deployment with Vercel

You do not need to master all of it before building. Learn each part when LifeMode needs it.
