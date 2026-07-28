# LifeMode Source Map

This file explains the source code like a map.

## User Screen

File:

```text
src/app/page.tsx
```

Purpose:

This is the first screen users see. It contains the six product rows:

- Today Widgets
- Personal Widgets
- Modes
- Connect
- Opportunities
- AI Buddy + Safety

Main code ideas:

- Arrays store repeated content.
- `.map()` turns arrays into repeated UI.
- `Panel` is a reusable layout component.
- `Metric` is a reusable small stats component.

## App Wrapper

File:

```text
src/app/layout.tsx
```

Purpose:

This wraps every page in the app. It sets the app title and description.

## Styling

File:

```text
src/app/globals.css
```

Purpose:

This sets global colors, fonts, and base page behavior.

Most design classes are written directly in `page.tsx` using Tailwind CSS.

## App Config Backend

File:

```text
src/app/api/app-config/route.ts
```

URL:

```text
/api/app-config
```

Purpose:

Returns the app name, tagline, platform plan, safety rules, and modes.

## Demo Users Backend

File:

```text
src/app/api/users/demo/route.ts
```

URL:

```text
/api/users/demo
```

Purpose:

Returns temporary demo users before we connect real authentication.

## Opportunities Backend

File:

```text
src/app/api/opportunities/route.ts
```

URLs:

```text
/api/opportunities
/api/opportunities?mode=law
```

Purpose:

Returns jobs, internships, freelance gigs, scholarships, competitions, and startup roles.

## Connection Rules Backend

File:

```text
src/app/api/connect/can-use/route.ts
```

Example URL:

```text
/api/connect/can-use?userId=user_creator&mode=gym&intent=dating
```

Purpose:

Checks whether a user can use a connection type in a mode.

Example:

Dating is allowed in Gym mode only if the user is 18+.

## Respect Lock Backend

File:

```text
src/app/api/safety/respect-lock/route.ts
```

URLs:

```text
GET /api/safety/respect-lock
POST /api/safety/respect-lock
```

Purpose:

Creates or checks a Respect Lock. If one user says Not Interested, contact is blocked across the platform.

## AI Buddy Backend

File:

```text
src/app/api/ai-buddy/route.ts
```

URL:

```text
POST /api/ai-buddy
```

Purpose:

Creates a simple AI Buddy plan. Later this can connect to a real AI model.

## Types

File:

```text
src/lib/lifemode/types.ts
```

Purpose:

Defines what a user, mode, opportunity, AI Buddy request, and Respect Lock look like.

## Demo Data

File:

```text
src/lib/lifemode/data.ts
```

Purpose:

Stores temporary users, modes, opportunities, and Respect Locks.

## Safety Rules

File:

```text
src/lib/lifemode/safety.ts
```

Purpose:

Stores important rules like:

- Dating is only for adults.
- Modes decide which connection types are allowed.
- Respect Lock blocks future contact.

## AI Buddy Rules

File:

```text
src/lib/lifemode/ai-buddy.ts
```

Purpose:

Chooses the right buddy mode and creates a starter plan.
