---
inclusion: manual
---

# Self-review before asking for review

Run this on your own branch **before** you request a review. It is the checklist a reviewer will use, built from what reviews in this repo have actually caught, so the reviewer's time goes on judgement rather than on things a search would have found.

`.claude/agents/self-review.md` runs it for you: ask Claude Code to "self-review this branch". Doing it by hand works the same way.

Each step says what to run, what you are looking for, and the miss it exists to catch.

---

## 0. Review the right diff

```bash
git fetch origin
git log --oneline origin/master..HEAD          # only your commits?
git diff origin/master...HEAD --stat            # three dots: your changes only
```

- If the log shows commits that aren't yours, you are stacked on another branch, or behind master. Say which in the first line of the PR description, and rebase onto master once the parent lands.
- Never compare against a local `master`; it is usually behind.

*Caught:* #200 carried identical copies of #199's three commits, so reviewing it meant re-reviewing #199.

## 1. Did you change what a domain concept means?

List every concept whose meaning your diff touches: a status value, "is this player new", "does this row count", "which gameweek", "who owns this player". For each one, find **every** consumer of the raw field, not just the ones you edited:

```bash
git grep -n "<raw field or old helper>" -- draft/app
```

For each hit, decide whether it should follow the new meaning. If it should, route it through one named function in the owning domain's `lib/` (see *One domain concept, one definition* in `ai-contribution-rules.md`).

*Caught:*
- Cup rows marked `'N'` (rejected) were skipped by resolution and standings, but autopick still treated them as submitted and the reuse ban still treated their players as used. A manager with only a rejected row could be neither resolved nor autopicked.
- "Draw entry" was defined twice, with different exclusion rules.

## 2. Follow the rule to where it is consumed

A rule is rarely used in one place. Trace your change through every path that runs it:

| you changed | also check |
|---|---|
| a transfer validator | `validateTransfers` (sequential, **applies what passes**), which feeds `/admin/transfers` and the transfer page's rosters. Try it with two managers. |
| a cup submission rule | resolve, autopick, the reuse ban (`findUsedPlayers`), the bracket display, standings |
| a default gameweek | every loader that defaults to it (homepage, leagues, transfers, admin) |
| a sheet column's meaning | the sheet module's parser, and every reader of the parsed field |

*Caught:* treating another manager's pending draw request as "not ownership" fixed the manager's view, but made admin recommend APPROVE for every entry in the draw, and applied all of them to the rosters.

## 3. Fix the pattern, not the instance

If your change fixes a bug, search for the same expression elsewhere:

```bash
git grep -nE "<the expression that crashed>" -- draft/app
```

Then check whether a helper for it already exists before writing another one.

*Caught:* the unknown-club crash was fixed in two transfer components. `teams/components/all-teams-table.tsx` and `wishlist/components/wishlist-details.tsx` still do `teamsByCode[code].name`, and `Team ${code}` fallbacks now exist in four places.

## 4. Text a manager reads

- Does every result you can now display have a message written for a manager? Search the validators' `message:` strings for anything you're newly showing.
- Is the sentence written once, at its source? Formatters may swap ids for names and shorten; they must not rebuild the sentence.
- Does any code match on message text (`=== 'Owned by…'`, `.startsWith(…)`)? Match on `ruleId` and `details` instead.

*Caught:* switching review to `fullMessage` put "end loan of play NOT in loan slot. questionable." in front of managers. The formatter also rebuilt "Owned by…" itself, so the sentence lived in two places.

## 5. Time, types and magic strings

```bash
git diff origin/master...HEAD -U0 -- draft/app | grep -nE "^\+.*(new Date\(\)|Date\.now\(\))"
git diff origin/master...HEAD -U0 -- draft/app | grep -nE "^\+.*(=== '|!== ')[A-Za-z]{1,3}'"
```

- `new Date()` at a decision site, display text included, should be `now()` from `_shared/lib/clock`. Cache age and TTL maths is the one exception.
- A raw sheet value compared outside its sheet module (`status === 'N'`) should be a typed union, converted when the row is parsed.
- A new name for an existing gameweek: use the vocabulary in `architecture.md` (*Gameweeks — one vocabulary*). Don't add a new `currentGameweek`.

## 6. Tests

- **Red first:** revert your fix (or stash the source changes), run the new tests, and watch them fail. Then say so in the PR.
- **Consumer test:** at least one test drives the path from step 2, not only the unit.
- **Comment or test?** If you wrote a comment explaining an ordering or an edge case ("X comes before Y so that…"), there should be a test that fails when X and Y are swapped.
- No `vi.mock`, and no `vi.spyOn` on app modules. Stubbing a DOM API that happy-dom lacks is allowed, with a comment.
- Time: `setNow()` for decisions, `vi.setSystemTime()` only for cache TTL. See the table in `testing-conventions.md`.
- A visual-only fix with no possible test: before/after screenshots at 375px in the PR.

```bash
git diff origin/master...HEAD -U0 -- '*.test.*' | grep -nE "^\+.*(vi\.mock|vi\.spyOn|setSystemTime|useFakeTimers)"
yarn test && yarn ratchet
```

## 7. Domain boundaries

- New code lives in the domain it belongs to. `_shared/` only for code that two or more domains use and that holds no domain rules.
- Other domains are reached through their `index.ts` / `index.server.ts`. `architecture.test.ts` enforces this; run it.
- Types live with the concept's owner, in a `types/` file, not exported from a component.
- Test factories for another domain's data shape belong to that domain. Ask it to export one rather than building its shape yourself with `as unknown as`.
- Did you change what a loader fetches? Then update `cache-config.ts` and say what the TTL and invalidation are.

## 8. CSS

```bash
git diff origin/master...HEAD -U0 -- '*.css' | grep -nE "^\+.*([0-9]+px|!important|transition: all|#[0-9a-fA-F]{3,8}\b|-webkit-|-moz-)"
```

- Tokens only, and only the 461 / 768 / 1024 breakpoints.
- A moved stylesheet brings its old violations with it. Fix them, or label them.

## 9. Comments and docs

- Read every comment in the diff after the code was finished. Is it still true? In this repo comments carry the design reasoning, so a stale one misleads more than usual.
- A comment that says a rule "never blocks" next to `severity: 'blocking'` means the vocabulary has drifted. Say so in the PR.
- Did a route, sheet, env var or domain concept change? Then update `architecture.md`.

## 10. The PR description

- First line: stacked on what, if anything.
- What a manager sees now, in their words.
- **Not in this PR:** what you knowingly left, labelled with the four labels from `ai-contribution-rules.md`.
- Screenshots at 375px for anything visual.
- "All new tests failed before the change" (step 6).

---

## Output when the agent runs this

Write it the way a reviewer would, in this order:

1. **Verdict + scope**: ready or not, and what was reviewed (commits, stacked parent, behind master).
2. **What it does**: two or three sentences in the codebase's own terms.
3. **Blocking**: file, the concrete failure scenario (inputs → wrong result), the fix.
4. **Should fix**: same structure.
5. **Nits**: one line each.
6. **Tests**: what they prove, and the missing case.
7. **DDD / conventions**: a plain rating for boundaries, model and conventions, with each crack named.
