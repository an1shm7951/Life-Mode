# LifeMode Device Rollout

LifeMode should eventually work everywhere, but it should not be built everywhere at the same time.

## Phase 1: Web App

Devices:

- Laptop
- Desktop
- iPhone browser
- Android browser
- iPad browser
- Android tablet browser

Technology:

- Next.js
- Responsive CSS
- Supabase
- Vercel

Goal:

Make the core product useful everywhere through the browser.

Why first:

- Fastest release path.
- One codebase.
- No App Store review.
- Easy to share with early users.

## Phase 2: Installable Web App

Devices:

- iPhone home screen
- Android home screen
- Tablet home screen

Technology:

- Web manifest
- App icon
- Mobile responsive layout

Goal:

Make LifeMode feel closer to an app before native development.

Current status:

- Manifest exists.
- App icon exists.
- App can be added to home screen from the browser.

Needed:

- Better mobile spacing.
- Better tablet layout.
- Offline-friendly empty states.
- More native-feeling navigation.

## Phase 3: Native iOS And Android

Devices:

- iPhone
- Android phone

Technology:

- Expo / React Native
- Supabase
- Shared backend

Goal:

Add native behavior after web users prove the product is worth using daily.

Native-only advantages:

- Push notifications
- Native camera proof
- Better auth session handling
- App Store presence
- Smoother mobile navigation

Release requirement before starting:

- Users return daily or weekly.
- Dashboard data is saved in Supabase.
- The web app has a strong core workflow.
- There is a clear reason native improves retention.

## Phase 4: Tablet

Devices:

- iPad
- Android tablet

Goal:

Use bigger screens for dashboards, profile editing, opportunity review, and AI Buddy.

Design direction:

- Two-column or three-column dashboard.
- Side navigation.
- More visible timelines and opportunity lists.

## Phase 5: Smartwatch

Devices:

- Apple Watch
- Wear OS

Goal:

Only quick actions.

Watch features:

- View today's top goal.
- Mark goal done.
- Add quick proof text.
- Receive streak reminders.
- Receive AI Buddy nudge.

Not suitable for watch:

- Full dashboard.
- Opportunities browsing.
- Dating or networking.
- Long AI chats.

## Phase 6: Other Devices

Only build for other devices after there is a real user need.

Possible future devices:

- Desktop app
- Browser extension
- Voice assistant
- Car display
- TV dashboard

Rule:

Do not add a device just because it is possible. Add it when the user behavior makes sense.

