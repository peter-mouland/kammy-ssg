# Welcome to React Router!

- [React Router Docs](https://reactrouter.com/home)

## Development

From your terminal:

```sh
yarn dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
yarn build
```

Then run the app in production mode:

```sh
yarn start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in React Router app server is production-ready.

Make sure to deploy the output of `react-router build`

- `build/server`
- `build/client`

# Todo:

Complete Domain-Driven Iterative Plan
Phase 1: Extract Admin Components (6 steps)

- ✅ Create domain structure - /admin/, /scoring/, /draft/ etc.
- ✅ Extract Icons → /admin/components/icons/admin-icons.tsx
Extract UI Components → /admin/components/ui/ (ActionCard, StatusCard, NavButton)
Extract Admin Sections → /admin/components/sections/ (OverviewSection, DraftSection, etc.)
Move Admin CSS → /admin/styles/admin-dashboard.module.css
Create Admin Types → /admin/types/admin-types.ts

Phase 2: Extract Admin Server Logic (4 steps)

Break Down Action Handler → /admin/server/actions/ (draft-actions.ts, cache-actions.ts, points-actions.ts)
Extract Admin Services → /admin/server/services/ (admin-draft-service.ts, admin-cache-service.ts)
Create Admin Hooks → /admin/hooks/ (use-admin-fetcher.ts, use-cache-status.ts)
Clean Up Main Server File → Simplified /admin/server/admin-dashboard.server.ts

Phase 3: Extract Other Domains (6 steps)

Extract Scoring Domain → Move gameweek points logic to /scoring/
Extract Draft Domain → Move draft logic from /admin/ to /draft/
Extract Player Domain → Move player-related logic to /players/
Create Shared Components → /shared/components/ui/ for truly reusable stuff
Move External Integrations → Keep /lib/ for sheets, firestore, fpl
Extract Common Types → /shared/types/ for cross-domain types

Phase 4: URL-based Navigation (3 steps)

Add Nested Admin Routes → /admin/overview, /admin/draft, etc.
Create Admin Layout Component → Extract header/sidebar to layout wrapper
Convert Client State to URL State → Remove activeSection state, use router

Phase 5: Performance & Polish (5 steps)

Add Error Boundaries → Wrap admin sections in error boundaries
Add Loading States → Better UX during server actions
Optimize Bundle Size → Dynamic imports for heavy sections
Add Admin Route Guards → Protect admin routes
Add Admin Testing → Unit tests for extracted components

Total: 24 steps across 5 phases
You're right - this is much more realistic! The domain conversion actually multiplies the work because you're not just extracting components, you're also:

Creating proper domain boundaries
Extracting logic into multiple domains
Setting up shared infrastructure
Establishing import/dependency rules

Where are you currently in this process? Which phase/step would you like to tackle next?
