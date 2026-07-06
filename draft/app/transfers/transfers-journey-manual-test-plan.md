# Manual test plan: transfer journey by transaction type

Manual QA checklist for the staged transfers UX: hub landing view and full-screen step journey.

Test at **414px viewport** (mobile-first). Use the **current gameweek** with deadline **Open** unless a case says otherwise. Pick a manager with a realistic squad and, for loan flows, at least one active or pending loan where possible.

---

## Setup (once per session)

| # | Check |
|---|--------|
| S1 | Open `/transfers`, select a manager, confirm hub shows: user, deadline, gameweek, entry buttons, transfers list, loan status |
| S2 | Confirm both entry buttons are enabled when a user is selected |
| S3 | Confirm browse-only exit: start either journey, do **not** select a player, go back — `TransferTypeSelector` never appears |
| S4 | Confirm journey reset: start a journey, return to hub, change user or gameweek — re-entering journey starts fresh |

---

## Journey mechanics (all types)

Verify once on any flow, then spot-check on others:

| # | Check |
|---|--------|
| J1 | `TransferTypeSelector` hidden until first player is selected |
| J2 | After first selection, type selector appears **above Continue** in sticky footer; default is **Transfer** |
| J3 | Continue disabled until required player selected on current step |
| J4 | Back from step 1 returns to hub; back from step 2/3 preserves prior selections |
| J5 | Review step shows type, player out, player in, comment field, submit button |
| J6 | Successful submit: toast, return to hub, new entry appears in transfers list (pending) |

---

## Test data cheat sheet

| Type | Player out | Player in | Notes |
|------|------------|-----------|-------|
| **TRANSFER** | Your squad player | Free agent (unowned) | Same position slot preferred |
| **SWAP** | Your squad player A | Your squad player B | Both on your roster; sub ↔ main swap is a good case |
| **LOAN_START (borrow)** | Free agent on your squad | Player owned by another manager | Review shows loan-from details |
| **LOAN_START (lend)** | Your owned player | Free agent | Select borrowing manager on review |
| **LOAN_END** | Loaned player (or squad player) | Player in your `on_loan_0` slot | Returning an active loan |
| **TRADE** | Your squad player | Free agent (unowned) | Treated like transfer for ownership |
| **NEW_PLAYER** | Your squad player | Marked **New** in player list | Filter by Status → New |

---

## 1. TRANSFER (standard)

### 1A — Team-first (`out → in → review`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Hub → **Start with My Team** | Step 1: squad selector |
| 2 | Select a squad player | Type selector + Continue appear; default **Transfer** |
| 3 | Continue | Step 2: player-in list |
| 4 | Select a **free agent** (eligible, same position) | Continue enabled |
| 5 | Continue → Review | Type = TRANSFER; correct out/in; no loan panel |
| 6 | Submit | Success toast; return to hub; pending transfer in list |

### 1B — Player-list-first (`in → out → review`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Hub → **Start with Player List** | Step 1: player-in list |
| 2 | Select a free agent | Type selector + Continue appear |
| 3 | Change type to **Transfer** (if not already) → Continue | Step 2: squad selector |
| 4 | Select squad player to drop | Continue enabled |
| 5 | Review → Submit | Same as 1A |

### 1C — Negative (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Pick owned player as player in | Ineligible styling / blocking message on review |
| 2 | Submit after deadline closed | “Missed the Deadline” on review; submit blocked |

---

## 2. SWAP

### 2A — Team-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start with My Team → select squad player A | Type selector appears |
| 2 | Set type to **Swap** → Continue | Step 2: player-in list |
| 3 | Select **another squad player B** (not A) | Continue enabled |
| 4 | Review → Submit | Type = SWAP; both players from your squad |

**Tip:** Try sub ↔ main midfielder swap if available.

### 2B — Player-list-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start with Player List → select squad player B from list | Type selector appears |
| 2 | Set type to **Swap** → Continue | Step 2: squad selector |
| 3 | Select different squad player A | Review shows both squad players |
| 4 | Submit | Success |

For swap, the first-selected “player in” should still be a player on your roster (owned by you), not a free agent.

### 2C — Negative (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Swap two main-squad same-position players (invalid combo) | Ineligible / validation blocks submit on review |

---

## 3. LOAN_START

### 3A — Borrowing (team-first)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Team-first → select **free agent** from squad as player out | Type selector appears |
| 2 | Set type to **Loan Start** → Continue | Step 2 shows loan context banner on player-in list |
| 3 | Select player **owned by another manager** | Continue enabled |
| 4 | Review | **Loan Agreement** panel; shows loan-from manager; no borrowing-manager picker needed |
| 5 | Submit | Success; loan fields submitted |

### 3B — Borrowing (player-list-first)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player-list-first → select **owned player** | Type selector appears |
| 2 | Set type to **Loan Start** → Continue | Step 2: squad selector |
| 3 | Select free agent from squad as player out | Review shows borrow scenario |
| 4 | Submit | Success |

### 3C — Lending (team-first)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Team-first → select **your owned player** | Type selector appears |
| 2 | Set type to **Loan Start** → Continue | Step 2: select free agent as player in |
| 3 | Review | Loan panel: “loan your player to another manager”; **borrowing manager** dropdown |
| 4 | Select borrowing manager → Submit | Success with `onLoanTo` set |

### 3D — Lending (player-list-first)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player-list-first → select free agent | Type → **Loan Start** → Continue |
| 2 | Squad step → select your owned player as player out | Review shows lend scenario + manager picker |
| 3 | Select borrower → Submit | Success |

### 3E — Type change after first selection

| Step | Action | Expected |
|------|--------|----------|
| 1 | Select first player, set **Loan Start**, then change back to **Transfer** | Loan panel absent on review; loan state cleared |
| 2 | Re-select **Loan Start** before Continue | Loan state recalculates correctly on review |

---

## 4. LOAN_END

### 4A — Team-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Team-first → select squad player (player out) | Type selector appears |
| 2 | Set type to **Loan End** → Continue | Player-in list shows “return from loan” context |
| 3 | Select player currently in **`on_loan_0`** slot | Continue enabled |
| 4 | Review | **Loan End** panel (not Loan Start); correct players |
| 5 | Submit | Success |

### 4B — Player-list-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player-list-first → select loaned player (in `on_loan_0`) | Type → **Loan End** |
| 2 | Continue → select matching squad player out | Review correct |
| 3 | Submit | Success |

### 4C — Negative (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player in **not** in loan slot | Ineligible on review; submit blocked |

---

## 5. TRADE

### 5A — Team-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Team-first → select squad player | Type selector appears |
| 2 | Set type to **Trade** → Continue | Step 2: player-in list |
| 3 | Select **free agent** (unowned) | Continue enabled |
| 4 | Review → Submit | Type = TRADE; no loan panel |

### 5B — Player-list-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player-list-first → select free agent | Type → **Trade** |
| 2 | Continue → select squad player out | Review → Submit | Success |

### 5C — Negative (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Select owned player as player in | Blocked on review (ownership) |

---

## 6. NEW_PLAYER

### 6A — Team-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Team-first → select squad player to drop | Type selector appears |
| 2 | Set type to **New Player Request** → Continue | Step 2: player-in list |
| 3 | Filter Status → **New**; select a new player | Continue enabled |
| 4 | Review → Submit | Type = NEW_PLAYER |

### 6B — Player-list-first

| Step | Action | Expected |
|------|--------|----------|
| 1 | Player-list-first → filter New → select new player | Type → **New Player Request** |
| 2 | Continue → select squad player out | Review → Submit | Success |

### 6C — Negative (optional)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit when gameweek new-player quota already used | Server/toast error (if applicable in your league state) |

---

## Full matrix checklist

Use this as a sign-off grid (12 core flows + negatives):

| Type | Team-first | Player-list-first |
|------|:----------:|:-----------------:|
| TRANSFER | ☐ | ☐ |
| SWAP | ☐ | ☐ |
| LOAN_START (borrow) | ☐ | ☐ |
| LOAN_START (lend) | ☐ | ☐ |
| LOAN_END | ☐ | ☐ |
| TRADE | ☐ | ☐ |
| NEW_PLAYER | ☐ | ☐ |

---

## Suggested test order

1. Hub smoke (S1–S4) + journey mechanics (J1–J6)
2. **TRANSFER** both paths — baseline
3. **SWAP** both paths
4. **LOAN_START** borrow + lend, both paths (4 flows)
5. **LOAN_END** both paths
6. **TRADE** and **NEW_PLAYER** both paths
7. Negatives and deadline-closed spot check

---

## What to record per test

For each flow, note:

- Manager used
- Players selected (out / in)
- Path (team-first or player-list-first)
- Pass / fail
- Screenshot or brief note if fail (step, expected vs actual)
