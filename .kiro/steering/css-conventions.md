---
inclusion: always
---

# CSS Conventions

## Core rules

1. **CSS Modules for all component styles.** Every component has a co-located `.module.css` file. No style attributes, no global class names, no Tailwind.
2. **No styling directly on tags in module files.** Style via classes, not element selectors. Tag selectors belong only in `root.css` (the global reset) and `design-tokens.css`.
3. **Always use design tokens.** No hardcoded hex colours, px spacing, or transition values. Every value in `design-tokens.css` exists to prevent this.
4. **Never use `!important`.** If you feel you need it, the CSS structure needs fixing — a specificity conflict, a leaked global style, or a class that belongs in a different component. Fix the root cause instead.

---

## File structure

```
draft/app/
├── design-tokens.css        # All global custom properties — colours, spacing, radius, etc.
├── root.css                 # CSS reset + base html/body styles only
└── teams/components/
    ├── player-card.tsx
    └── player-card.module.css   # co-located, same name
```

---

## Naming: BEM concepts mapped to CSS Modules

CSS Modules scope class names automatically, so you don't need `__` or `--` separators. But the BEM concepts still apply — **block**, **element**, **modifier** — and naming should make these distinctions clear.

### Block

The root element of a component. Named after the component.

```css
/* player-card.module.css */
.playerCard { ... }
```

### Element

A meaningful part of the block. Standalone camelCase class — no nesting needed because CSS Modules already prevents collisions.

```css
/* parts of playerCard */
.playerName { ... }
.playerJersey { ... }
.jerseyNumber { ... }
.positionBadge { ... }
```

The key distinction: an element class **describes what the thing is**, not how it looks.

### Modifier

A variation or state applied **in addition to** the block or element class it modifies. Never used alone.

```css
/* modifiers on the block */
.playerCard.substitute { ... }
.playerCard.onLoan { ... }

/* modifier on an element */
.pointsDisplay.positive { ... }
.pointsDisplay.negative { ... }
```

In the TSX file this looks like:
```tsx
<div className={`${styles.playerCard} ${isSubstitute ? styles.substitute : ''}`}>
```

**The rule:** if a class only makes sense when applied alongside another class, it is a modifier. Name it after the variation it represents (`.substitute`, `.compact`, `.sorted`), not after a visual property (`.blue`, `.large`).

### When to use nested selectors

Avoid descendant selectors for styling elements — just give the element its own class. The one exception is when an element's style should change based on a modifier on the parent, which can't be expressed any other way:

```css
/* acceptable: element reacts to parent modifier */
.playerCard.onPitch .playerName {
    font-size: 10px;
}
```

---

## Tag selectors

Never target tags (`td`, `p`, `span`, etc.) in a module file. They bleed into child components and create invisible dependencies.

```css
/* bad */
.promotionRow td {
    border-bottom: 1px dashed green;
}

/* good */
.promotionRow .cell {
    border-bottom: 1px dashed green;
}
```

The only place tag selectors are acceptable is `root.css` for the global reset and base typography.

---

## Design tokens

All values come from `design-tokens.css`. The canonical token families are:

| Category | Prefix | Example |
|---|---|---|
| Colour | `--color-*` | `var(--color-gray-200)` |
| Spacing | `--spacing-*` | `var(--spacing-4)` |
| Font size | `--font-*` | `var(--font-sm)` |
| Font weight | `--font-weight-*` | `var(--font-weight-semibold)` |
| Border radius | `--radius-*` | `var(--radius-md)` |
| Shadow | `--shadow-*` | `var(--shadow-sm)` |
| Transition | `--transition-*` | `var(--transition-fast)` |
| Z-index | `--z-*` | `var(--z-modal)` |

**Avoid the alias tokens** defined at the bottom of `design-tokens.css` (`--space-X`, `--text-X`, `--font-bold`, `--font-medium`, `--font-normal`). They duplicate the canonical tokens with inconsistent names and will eventually be removed. Use the canonical forms above.

```css
/* bad — alias tokens */
padding: var(--space-2);
font-size: var(--text-sm);
font-weight: var(--font-bold);

/* good — canonical tokens */
padding: var(--spacing-2);
font-size: var(--font-sm);
font-weight: var(--font-weight-bold);
```

When a value doesn't have a token, use the closest token and propose adding a new one rather than hardcoding.

```css
/* bad */
padding: 2px 6px;
color: #ffffff89;
border: 1px solid #e5e7eb;

/* good */
padding: var(--spacing-1) var(--spacing-2);
color: var(--color-white);
border: 1px solid var(--color-gray-200);
```

---

## Specificity

Keep specificity as low as possible. A single class selector should be the default. Deep selector chains and `!important` are both symptoms of the same problem: something higher up is winning a specificity war that shouldn't exist.

**Rules:**
- Prefer single-class selectors. A selector like `.playerCard .playerName .text` should not exist.
- Two levels is the practical maximum, and only when an element genuinely reacts to a parent modifier (see *When to use nested selectors* above).
- Never fight specificity with `!important`. Trace why the unwanted style is winning and fix that rule instead — it almost always means a class is defined in the wrong place, or a modifier should be restructuring the component rather than overriding it.

```css
/* bad — specificity ladder */
.tableContainer .table tbody tr.rowSelected td {
    background-color: var(--color-primary-light) !important;
}

/* good — flat, low specificity */
.rowSelected {
    background-color: var(--color-primary-light);
}
```

---

## Transitions

Always name the property being transitioned. `transition: all` is a common shortcut that causes two real problems: it transitions properties that aren't animatable (wasting work), and it hides exactly what is changing, making bugs harder to spot.

The timing tokens (`--transition-fast`, `--transition-normal`, `--transition-slow`) define duration and easing — they are the second part of a transition declaration, not a replacement for specifying the property.

```css
/* bad */
transition: all 0.2s ease;
transition: all var(--transition-normal);

/* good */
transition: background-color var(--transition-fast), color var(--transition-fast);
transition: transform var(--transition-normal), box-shadow var(--transition-normal);
transition: opacity var(--transition-slow);
```

---

## No manual vendor prefixes

Do not write `-webkit-`, `-moz-`, or `-ms-` prefixes by hand. PostCSS with Autoprefixer runs as part of the build and adds them based on the project's browserslist targets. Hand-written prefixes create maintenance debt and can conflict with what Autoprefixer generates.

```css
/* bad */
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
-webkit-font-smoothing: antialiased;

/* good — write the standard property, PostCSS handles the rest */
line-clamp: 2;
```

The exception is `-webkit-font-smoothing` and `-moz-osx-font-smoothing` in `root.css`, which are intentional rendering hints with no standard equivalent.

---

## Responsive styles

Write mobile-first. Use `min-width` breakpoints. The canonical breakpoints are defined as tokens for reference:

```css
@media (min-width: 461px) { ... }  /* small — custom breakpoint used throughout */
@media (min-width: 768px) { ... }  /* md */
@media (min-width: 1024px) { ... } /* lg */
```

Keep media queries inside the module file, co-located with the classes they modify. Do not create separate responsive files.

---

## Common mistakes to avoid

| Mistake | Fix |
|---|---|
| `transition: all 0.2s ease` | Name the property: `transition: transform var(--transition-normal)` |
| `transition: all var(--transition-normal)` | Same — the token is the timing, not a fix for `all` |
| `!important` in a module file | Trace the specificity conflict and fix the source rule |
| `font-family: inherit !important` on tags | Already handled by `root.css` — don't repeat it |
| Hardcoded `rgba(0,0,0,0.1)` | Use a shadow token or add one to `design-tokens.css` |
| `.block .element { }` descendant selector to reach an element | Give the element its own class |
| Adding a new global class to `root.css` | Add a CSS module instead |
| Pixel values for spacing (`padding: 6px`) | Use `var(--spacing-1)` or `var(--spacing-2)` |
| `-webkit-` or `-moz-` vendor prefixes | Remove them — PostCSS/Autoprefixer handles this |
