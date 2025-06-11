Domain-Driven Admin Dashboard Refactoring Plan
Progress Status: ✅ Phase 1 Complete!
Phase 1: Extract Admin Components (6 steps) ✅ COMPLETE

✅ DONE - Create domain structure → /admin/, /scoring/, /draft/ etc.
✅ DONE - Extract Icons → /admin/components/icons/admin-icons.tsx
✅ DONE - Extract UI Components → /admin/components/ui/

Created: ActionCard, StatusCard, NavButton, DataCount, SystemHealthBadge, DraftCard, GameweekPointsButton, GameweekPointsStatus, CacheStatusDisplay, RefreshButton
All with individual CSS modules and barrel exports


✅ DONE - Extract Admin Sections → /admin/components/sections/

Created: OverviewSection, DraftSection, DataManagementSection, PointsScoringSection, SettingsSection, QuickActionsSection, FirebaseSyncSection
All with shared layout components (AdminSection, AdminGrid, AdminMessage)


✅ DONE - Extract Layout Components → /admin/components/layout/

Created: AdminSection, AdminGrid, AdminMessage, AdminContainer, TwoColumnLayout (composition), AppShell, NavGroup, ActionBar
ZERO custom CSS - fully reusable component system


✅ DONE - Create Admin Types → /admin/types/admin-types.ts

400+ lines of comprehensive TypeScript types
Type guards, component props, data structures, action types
Full type safety across entire admin domain

Phase 2: Extract Admin Server Logic (4 steps)

✅ DONE - Break Down Action Handler → /admin/server/actions/ (draft-actions.ts, cache-actions.ts, points-actions.ts)
✅ DONE - Extract Admin Services → /admin/server/services/ (admin-draft-service.ts, admin-cache-service.ts)
✅ DONE - Create Admin Hooks → /admin/hooks/ (use-admin-fetcher.ts, use-cache-status.ts)
✅ DONE - Clean Up Main Server File → Simplified /admin/server/admin-dashboard.server.ts

Phase 3: Extract Other Domains (6 steps)

✅ DONE - Extract Scoring Domain → Move gameweek points logic to /scoring/
TODO - Extract Draft Domain → Move draft logic from /admin/ to /draft/
TODO - Extract Player Domain → Move player-related logic to /players/
TODO - Create Shared Components → /shared/components/ui/ for truly reusable stuff
TODO - Move External Integrations → Keep /lib/ for sheets, firestore, fpl
TODO - Extract Common Types → /shared/types/ for cross-domain types

Phase 4: URL-based Navigation (3 steps)

✅ DONE - Add Nested Admin Routes → /admin/overview, /admin/draft, etc.
✅ DONE - Create Admin Layout Component → Extract header/sidebar to layout wrapper
✅ DONE - Convert Client State to URL State → Remove activeSection state, use router

Phase 5: Performance & Polish (5 steps)

TODO - Add Error Boundaries → Wrap admin sections in error boundaries
TODO - Add Loading States → Better UX during server actions
TODO - Optimize Bundle Size → Dynamic imports for heavy sections
TODO - Add Admin Route Guards → Protect admin routes
TODO - Add Admin Testing → Unit tests for extracted components
