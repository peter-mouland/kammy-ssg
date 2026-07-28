---
inclusion: always
---

# AI Contribution Rules

These rules apply to all contributors — human and AI alike. They exist to keep the codebase coherent as non-engineers start contributing with AI assistance.

---

## Scope discipline

### Confirm the goal before starting

Before writing any code, restate the goal in one sentence. If the request is ambiguous, ask one clarifying question — not several.

### Make the smallest change that achieves the goal

Do not refactor adjacent code. Do not fix unrelated issues. Do not improve things that weren't broken. The diff should contain only what is necessary for the stated goal.

### Label every out-of-scope observation

If you notice something outside the current task while working — a bug, a code quality issue, technical debt — you must label it, describe it briefly, and not act on it unless explicitly asked. Use exactly these labels so contributors know what action to take:

- **[Required for your goal]** — Blocking the stated task. Must be included.
- **[Separate problem found]** — Something broken or risky outside the current scope. Needs a new task.
- **[Will slow down future work]** — Technical debt. Not urgent, not broken, but will cause friction later. Belongs in a backlog.
- **[Polish]** — Code quality improvement with no functional impact. Lowest priority.

### Never expand scope without acknowledgment

If completing the task correctly requires touching something outside the stated scope, stop and explain why before doing it. Do not assume permission to expand.

---

## Code Structure Rules

### New features belong in their domain folder

A new feature lives entirely within its domain folder — route file, components, types, lib, server logic. Do not scatter pieces across unrelated domains.

```
# Good — scoring feature in scoring domain
draft/app/scoring/lib/new-calculation.ts
draft/app/scoring/types/new-types.ts

# Bad — scoring logic leaked into _shared
draft/app/_shared/lib/new-calculation.ts
```

### Shared code earns its place in `_shared/`

Only move code to `_shared/` if it is genuinely used by two or more separate domains and contains no domain-specific business logic. FPL API access, cache utilities, and Google Sheets clients belong there. Team roster logic does not.

### Types live in the domain that owns the concept

Each domain has a `types/` folder. Types defined there can be imported by other domains, but the definition stays with the owning domain.

```
# Good
import type { TransferType } from '../transfers/types/transfer-types'

# Bad — duplicating the type in another domain's types folder
```

Concepts the **whole league** shares — `DivisionId`, `ManagerId`, `CustomPosition`, `PositionSlotKey` — are not owned by any one domain. They live in `_shared/types/league-types.ts`, the shared kernel. That file explains what earns a place in it; adding to it needs a note in `.kiro/backlog.md`.

### A domain is reached only through its public API

Each domain exposes an `index.ts`. That is what other domains import.

Everything else — `components/`, `server/`, internal helpers — is **private**. Reaching past the index couples one domain's page structure and data loading to another's, and it is what makes a feature impossible to change without breaking something unrelated.

```ts
// Good — the draft domain decided to expose this
import { getDraftStates } from '../draft';

// Bad — reaching into another domain's internals
import { readDraftState } from '../draft/server/draft.server';
```

**A domain has two entry points, and the split matters.**

| File | For | Safe to import from a component? |
|---|---|---|
| `index.ts` | types, rules, pure logic | ✅ yes |
| `index.server.ts` | operations touching Firebase, Sheets or `process.env` | ❌ no |

They are separate because several server modules do work **at import time** — `firebase.realtime-admin` parses a service account from `process.env` at module scope. Re-exporting anything that reaches it from `index.ts` would make the whole public API unsafe to import from a component, and the failure would be a `process is not defined` crash in the browser rather than a build error.

So: if it touches Firebase, Google Sheets or `process.env`, it goes in `index.server.ts`. If a component could reasonably import it, it goes in `index.ts`. `draft/` is the worked example.

This exists because **`admin` orchestrates other domains** — that is its job — and previously had no legal way to do it, so it reached into their server code. An index lets a domain say *"this operation is for others to call"* without exposing everything behind it.

**Transitional:** importing another domain's `types/` and `lib/` is still accepted while indexes are introduced (see P2.7 in the backlog). Prefer the index for anything new.

This rule is enforced by `draft/app/architecture.test.ts`, not by good intentions. If you need to break it, the failure message tells you the three ways to fix it properly.

### Do not change the data layer without documenting the cache impact

Every data read is cached. If you change what a loader fetches, or add a new data source, update `cache-config.ts` with the appropriate TTL and invalidation rule. Undocumented cache behaviour causes stale data bugs.

---

## Coding Standards

### Do not nest medium, large, or pure helpers

Where possible, medium-to-large functions — and any function that is pure or can easily be made pure — must not be nested inside another function. Define them at module scope (or extract to a util) and pass dependencies as arguments. Nested one-liners and tiny closures that only close over adjacent locals are fine; anything substantial enough to name or reuse is not.

### TypeScript is non-negotiable

All new files are TypeScript. No `any` unless there is an explicit comment explaining why. Prefer narrow types over wide ones.

### Biome is the linter and formatter

Run `yarn check:fix` before committing. The pre-commit hook runs Biome automatically. Do not introduce ESLint or Prettier config — Biome replaces both.

### CSS Modules for all styles

All component styles use CSS Modules (`.module.css`). No inline styles, no global class names, no Tailwind. Shared design tokens live in `design-tokens.css`.

### React component structure

Do not define `renderSomething()` helpers inside React components. If a JSX section is large enough to name, extract it into a real component so React can treat it as part of the component tree and future memoization remains possible.

Pure or near-pure helpers should live outside components and receive their dependencies as arguments. Keep component bodies focused on state, effects, event handlers, and composition.

Use named constants for repeated string comparisons, especially UI state values such as steps, modes, and tabs. Avoid scattering magic strings through branch logic.

### React Router loaders own data fetching

All server-side data fetching happens in React Router loader functions (`.route.tsx` files). Components do not fetch data directly on the server. Client-side re-fetching uses TanStack Query.

### Do not add new dependencies lightly

Check whether an existing library already solves the problem. If adding a new dependency, use an exact or pinned version. Flag it in the PR description with a justification.

---

## Domain Knowledge for New Contributors

### The points system is custom, not FPL's

This app uses its own position-based scoring system, not Fantasy Premier League's default points. Rules are defined in `scoring/lib/rules.ts`. Midfielders, wide attackers, and centre attackers score differently from defenders and goalkeepers. When working on scoring, always read `POSITION_RULES` first.

### Google Sheets is the source of truth for league decisions

Player ownership, transfer approvals, division assignments, and draft picks all live in Google Sheets. The app reads from Sheets and caches aggressively. If data looks stale, the cache TTL or invalidation rule is the first place to look.

### The draft is division-scoped

Each division runs its own snake draft independently. A player can only be owned once within a division. The draft state is tracked in both Google Sheets and Firebase Realtime Database — a sync comparison mechanism exists to catch drift between the two.

### Transfers go through an approval workflow

Managers submit transfers via the UI. They start as `PENDING` in Google Sheets. An admin approves or rejects them via `/admin/transfers`. Only `APPROVED` transfers are applied to rosters.

### There are three divisions with promotion and relegation

`premierLeague` > `championship` > `leagueOne`. Season-end: each division's winner is promoted, loser is relegated. Features that touch standings or end-of-season logic need to account for all three divisions.
