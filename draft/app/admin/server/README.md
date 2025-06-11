# Overview of Services Classification

Here's what I've classified as "services" and the logic behind it:

## AdminDraftService
**Purpose**: Data aggregation and business logic for draft management

- getDraftAdminData() - Combines data from multiple sheets (divisions, teams, orders, state)
- isDivisionReady() - Business logic to determine if division can start draft
- getDivisionDraftStatus() - Aggregates status info for a division
- getAllDivisionsWithStatus() - Combines division data with computed status

**Why it's a service**: This handles complex data aggregation and business rules that multiple parts of the admin system need.

## AdminCacheService
**Purpose**: Cache health monitoring and management operations

- getCacheStatus() - Aggregate view of cache health across all collections
- getCacheMetrics() - Performance metrics and analytics
- healthCheck() - System health validation with issue reporting
- preloadCommonData() - Orchestrates cache warming operations
- Wraps the lower-level FirestoreClearService and GameweekPointsService

**Why it's a service**: Cache management is complex enough to warrant its own abstraction layer, and this provides a unified interface for admin operations.

# What I DIDN'T classify as services:

Actions (/actions/) - These are pure request handlers:

- draft-actions.ts - Handles form submissions for draft operations
- cache-actions.ts - Handles form submissions for cache operations
- points-actions.ts - Handles form submissions for points operations

**Why they're not services**: Actions are thin wrappers that validate input, call services/external libs, and format responses. They're request-specific, not reusable business logic.
Hooks (/hooks/) - These are React state management:

- use-admin-fetcher.ts - Manages form submission state
- use-cache-status.ts - Manages cache monitoring state

**Why they're not services**: These are client-side state management, not business logic.
**The Pattern**:
```
Route → Action → Service → External Lib
```

- Route: Receives request, delegates to action
- Action: Validates input, calls service, formats response
- Service: Business logic, data aggregation, complex operations
- External Lib: Raw data access (sheets, firestore, APIs)

This gives you:

- ✅ Actions: Thin, focused on request/response
- ✅ Services: Reusable business logic
- ✅ Clean separation: Server logic separate from client
- ✅ Testable: Each layer has single responsibility

The main server file went from 400+ lines to ~80 lines - it's now just a router that delegates to the appropriate action handlers!
