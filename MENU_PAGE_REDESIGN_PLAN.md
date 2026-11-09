# Menu Page Redesign: Implementation Plan

**Scope:** `apps/customer`, plus two small backward-compatible API edits (`menu`, `app-config`).
**Basis:** `Customer_App_Menu_Page.html` (7 design boards) and the full repository, read from source.
**Date:** 7 November 2026.
**Related:** `CUSTOMER_APP_IMPLEMENTATION_PLAN_v2.md` (see section 2).

---

## 0. Status at a glance

| Phase | What | Effort (1 dev) | Status |
|---|---|---|---|
| M0 | Safety net: sheet crash, load states, tests | 0.5-1 day | **Done in code (this zip).** Still open on your machine: ESLint + DOM test (need install and lockfile), real `pnpm test`/`typecheck`, device check. See section 8 |
| M1 | Logic and data, no visual change | 1.5-2 days | **Done in code (this zip)** |
| M2 | Phone UI | 2.5-3 days | **Done in code (this zip).** Needs a device pass (TalkBack, safe areas, real Inter font) |
| M3 | Item sheet | 1-1.5 days | **Done in code (this zip).** Test on your minimum Android WebView and iOS version |
| M4 | Laptop layout | 2.5-3.5 days | **Done in code (this zip), assuming D3 = yes.** Revert by removing `AppNav`'s laptop branch |
| M5 | Verification matrix | 1 day | **Partly done:** browser matrix and contrast run here; device run and plan v2 correction still open |

Total: about **7-9 working days for the phone path, 10-13 with the laptop layout.** These are estimates, not measurements.

---

## 1. Summary

The design is good and most of it is adoptable. It upgrades a screen that already works as a one-screen board/focus menu, so this is a restyle plus three new components (`FreeDeliveryStrip`, `CartPanel`, `TopNav`), not a rebuild.

Reading the code against the design turned up problems that must be fixed first, otherwise the new UI would sit on a screen that breaks:

- **Opening the item sheet crashes the app.** A hook is called after an early return. Reproduced in a browser: the whole React tree unmounts to a blank page. *(Fixed in M0.)*
- **A failed or offline load says "Menu is empty right now."** There was no error state. *(Fixed in M0.)*
- **The add button's real tap target is 26px, not 44px.** The click handler is on the inner circle, not its 44px wrapper. *(M2.)*
- **The layout estimator disagrees with the design's dimensions**, so rows would clip silently near the mode boundary. *(M1.)*

The designer could not read the CSS or token files. Of the 12 assumptions listed in section 5, 8 are wrong, outdated or different in the repo, and 4 are confirmed. Most importantly, a dark theme already exists.

**One answer decides scope:** is the Vercel web build used by customers on laptops? If not, defer M4 (about 30% of the effort).

---

## 2. Relationship to plan v2

`CUSTOMER_APP_IMPLEMENTATION_PLAN_v2.md` marks Phases 0 to 5 done. Its verification list is typecheck, build and unit tests. None of those opens the screen, which is how F1 and F2 below survived. Read its "done" as "compiles and unit tests pass".

Two specific claims need correcting in plan v2 (task in M5):

- Item 2.4 (responsive columns) is only in the pure function and its tests. Nothing in the UI reads `columns` (F6).
- Its definition of done lists "lint passes", but no ESLint is installed or run in CI (F13).

---

## 3. How this was reviewed

- Unpacked the 7 boards and rendered them in headless Chromium: laptop, phone board, phone accordion, sheet and states, design system, critique, handoff.
- Read every file in `apps/customer/src` that touches the menu, the API's menu, app-config and orders code, both stylesheets, CI, and the Android config.
- Ran three experiments: reproduced the sheet crash, ran `chooseLayout.ts` against the design's dimensions, and computed WCAG contrast for the tokens to be mapped.
- **Not possible in the review environment:** running the real app (no network, so no install), testing on a device, and running React 18.3.1. The crash repro used React 19.2; the rule and the error are the same in 18 (minified error #310). Anything marked "check on device" needs a phone.

Severity: **P0** breaks the screen for everyone. **P1** wrong behaviour or blocks the design. **P2** quality and accessibility. **P3** tooling or adjacent.

---

## 4. Findings that change the plan

Line numbers refer to the files **before** the M0 patch.

| ID | Sev | Finding and evidence | Fix (phase) | Status |
|---|---|---|---|---|
| F1 | P0 | **Opening the item sheet crashes the app.** `ItemDetailSheet` calls `useRef` (line 113) after `if (!item) return null` (line 64). The first open changes the hook count and React throws "Rendered more hooks than during the previous render". There is no error boundary, so the app goes blank. The sheet is always mounted with `item={null}`, so every row tap and every options "+" hits it. *Reproduced:* root was empty after the first open; fixed file opens, closes and reopens cleanly. | Move `useRef` above the early return; add a render test (M0) | **Fixed** in M0. Permanent guard test: `screens/menu/hooks-order.spec.ts` (DOM test still optional) |
| F2 | P0 | **Failed or offline load shows the empty-menu message.** `MenuScreen` read only `isLoading`. On error `items` defaulted to `[]` and the code fell through to "Menu is empty right now." At cold start offline, TanStack Query v5 pauses the query (`isLoading` is false), same result. A failed categories request alone did it too. *Verified:* `MenuScreen.tsx` lines 436-447 and 559-611. | One derived state: loading, offline, error, empty, ready (M0) | **Fixed** in M0. Offline behaviour to confirm in DevTools |
| F3 | P1 | **Add button is 26px, not 44px.** `.addBtnWrap` is 44px but `onClick` is on the inner `.addBtn` (26x26), so the padding is not tappable. Icon is 13px, sold-out label 9px, item text 11-12px. *Verified:* `MenuScreen.module.css` lines 376-396 and 470. | The button itself is 44px (M2) | **Fixed** in M2 (44px `AddButton`; measured 44x44 on every row) |
| F4 | P1 | **Layout estimator does not match the design.** It assumes 28px category headers and no gaps. The design uses 44px (laptop) and 32px (phone) headers with 12-16px gaps, so it overstates row height by about 9-10px (1440x900: estimates 78px, real is about 69px). It also reads the column with more items, not the limiting column, overstating by up to 17px for some menus (555 of 7,776 shapes tried). Rows are `overflow: hidden` with `min-height: 0`, so a wrong estimate clips buttons instead of switching mode. *Reproduced* by running the function. | Chrome sizes from CSS variables, limiting column (M1) | **Fixed** in M1 (limiting-column estimate, 52/56px; estimate matches rendered rows within 1.5px) |
| F5 | P1 | **`?cat=` deep link is ignored.** `HomeScreen` navigates to `/menu?cat=<id>`; nothing in the app calls `useSearchParams`. | Support in both layouts (M1) | **Fixed** in M1/M2 (focus opens the category; board outlines it for 1.5s) |
| F6 | P1 | **Responsive columns are not wired.** `chooseLayout` returns `columns` (2, 3 or 4); nothing reads it and the focus grid is hard-coded to `1fr 1fr` (`MenuScreen.module.css` line 286). Plan v2 marks 2.4 done. | Wire it (M1, M2) | **Fixed** in M2 (`--focus-cols` from `chooseColumns`: 2 phone, 3 tablet, 4 laptop, all measured) |
| F7 | P2 | **Quantity cap mismatch.** The sheet stepper allows 50, the cart store has no cap, and the API rejects more than 20 per line (`@Max(20)`). A cart that looks valid fails at checkout with a 400. | One shared `MAX_LINE_QTY` (M1) | **Fixed** in M1/M3 (shared `MAX_LINE_QTY`, cart clamp, v3 migration, sheet stepper aware of what is already in the cart) |
| F8 | P2 | **Dark-mode banner is unreadable.** `ConnectionBanner` hard-codes white text on `--ok` and `--bad`, which turn light green and light red in dark theme: contrast 1.74:1 and 2.77:1. *Computed.* | `--on-success`, `--on-danger` (M2) | **Fixed** in M2 (solid + matching foreground tokens; contrast measured) |
| F9 | P2 | **Menu ignores the top safe area.** Every other screen pads with `--safe-top`; `MenuScreen` does not, and the Android project targets SDK 36, where edge-to-edge is enforced. *Verified in source; check on device.* | Fix in the new header (M2) | **Fixed** in M2 (`.page` pads `--safe-top`). Device check pending |
| F10 | P2 | **Sheet gaps.** No close button, no focus trap or focus return, sizes and add-ons are `aria-pressed` buttons, `max-height: 85dvh` is followed by `85vh` (the later one wins), and it is a full-width bottom sheet at any width. | M3 | **Fixed** in M3 (native `<dialog>`, close button, focus trap and return, radio group and checkboxes) |
| F11 | P2 | **Free-delivery rule lives in three places.** Server, `CartScreen`, and soon the strip. All use `>=`, while the design copy says "over". `CartScreen` falls back to hard-coded 100000 and 10000 if config fails, and `['app-config']` is an inline key in two files. | One `useAppConfig` and `computeDelivery` (M1) | **Mostly fixed.** Menu strip, cart screen and laptop panel share `computeDelivery`. Still open: `OrderDetailScreen` has its own fallback numbers, and `orders.service.ts` still uses unguarded `parseInt` |
| F12 | P2 | **`GET /menu` has no sort.** Item order inside a category is whatever MongoDB returns. | Sort by `createdAt`, `_id` (M1) | **Fixed** in M1 (sort by `createdAt`, `_id`) |
| F13 | P3 | **No lint, no component tests.** The `lint` script calls ESLint, which is not installed, and CI never runs it. There is no jsdom or Testing Library. That is how F1 got through. | M0 | Partly: hook-order guard test added (no new deps). ESLint and DOM tests still need a lockfile update |
| F14 | P3 | Adjacent, not in scope: `App.tsx` compares versions as strings, so `'1.10.0' > '1.9.0'` is false. | Separate ticket | Open |
| F15 | P0 | **Order detail screen has the same crash as F1.** Found by running the M0 hook-order checker over all customer screens. `OrderDetailScreen.tsx` calls its second `useQuery` (menu, line 70) after the `if (isLoading)` and `if (!order)` early returns. With no cached order, the first render runs 1 query hook and the render after the order loads runs 2, so React throws and the screen goes blank. *Reproduced* in headless Chromium with the real file: root had 1 child while loading, 0 after the order arrived, error "change in the order of Hooks". | Move the `useQuery<any[]>({ queryKey: ['menu'] ... })` block above `if (isLoading)` (about 5 lines, no behaviour change). Not done in M0 because the screen is outside the menu scope | **Fixed.** Reproduced in Chromium, fixed, guarded by `hooks-order.spec.ts` |

---

## 5. Where the handoff and the repo disagree

| # | Handoff says | The repo says | Verdict | Decision |
|---|---|---|---|---|
| 1 | Dark theme not designed, may not exist | `[data-theme='dark']` exists in `tokens.css` and is applied before React mounts | Wrong | Every new token is defined in both themes; M5 checks dark |
| 2 | `--dur-fast` may be undefined; `--surface` and `--bg-surface` clash | Both defined (160ms; `--surface` is a legacy alias) | Wrong | Not a bug. Leave the aliases |
| 3 | Tokens `--action-hover`, `--action-tint`, `--icon-well`, `--bg #F6F3EF` | Real names: `--action-bg-hover`, `--chip-bg` and `--chip-fg`, `--bg-page #FAFAF9` | Different | Map, do not rename (Appendix A). Only `--highlight` and `--on-success` are new |
| 4 | Add 124px bottom padding to the scroll area | The page never scrolls; a 64px cart slot (in flow) and a 56px nav spacer are already reserved | Wrong | No padding. Constants: slot 64 (not 52+8), nav 56 plus safe area |
| 5 | Offline copy: "Showing the last menu we loaded" | The query cache is not persisted and is garbage-collected after 5 minutes | Wrong | Use that copy only when data is present; otherwise the offline state |
| 6 | Reduced motion: drop rise, bump, accordion, pulse | `motion.css` already neutralises all animation and transition under reduce | Outdated | Nothing to build; new transitions inherit it |
| 7 | Skeleton pulse 1.4s | Existing shimmer is also 1.4s | Confirmed | Keep the shimmer |
| 8 | Pickup may need the fee row hidden | No pickup or order type exists; delivery and cash only | Wrong | Closed |
| 9 | Quick add path assumed to toast | Quick add: haptic and bump, no toast. Sheet add: toast | Confirmed | Matches the handoff's own table. Add a polite live region instead |
| 10 | Fonts: Bricolage Grotesque and Plus Jakarta Sans | The app uses Inter from the Google Fonts CDN; the APK bundles web assets | Different | Keep Inter for this pass (D1) |
| 11 | `ConnectionBanner` gets an `offlineMessage` prop | Correct. The banner is in flow, so it shrinks the menu by about 38px | Confirmed | Add the prop; test banner toggling at boundary heights |
| 12 | Strip reads `deliveryFeePaisa` and `freeDeliveryOverPaisa` from config | Correct, but a non-numeric env var gives `NaN`, which JSON turns into `null` | Confirmed | Keep the hide guard, test with `Number.isFinite` |

Three places to push back on the design itself:

- **Size cards wrap the price** ("Regular / Rs. / 350") at 390px on the sheet board. Use a grid with `minmax(140px, 1fr)` and no wrap on the price.
- **Photos.** The phone board drops thumbnails but the focus cards lean on a 96px image area, and the seed items have no photos. The emoji plate has to look finished on its own, so treat it as the default, not the fallback.
- **Name 16/700 next to price 15/700 compete.** The designer says so too. Start the price at 600.

---

## 6. Decisions

| # | Decision | Default (used unless you say otherwise) | Needed by |
|---|---|---|---|
| D1 | Typeface | Keep Inter. If you adopt the new fonts, do it app-wide and bundle with `@fontsource`, not the Google CDN (the APK must work offline) | M2 |
| D2 | Warm page ground `#F6F3EF` | Keep `--bg-page`. Changing it touches all 10 screens and the dark pair; do it as its own PR with before and after of every screen | M2 |
| D3 | Laptop scope | Is the web build used on laptops? If not, skip M4 | Before M4 |
| D4 | Row thresholds | Adopt 52 and 56px (44px button plus 4px padding); update the spec | M1 |
| D5 | Delivery copy | "Free delivery from Rs. 1,000", because the server uses `>=` | M2 |
| D6 | `/search` route | Leave it; Home still links to it | Later |
| D7 | Item order | `createdAt` then `_id`. A real per-item `sortOrder` is a separate admin feature | M1 |

---

## 7. Target structure

`CLAUDE.md` in the repo asks for surgical changes, so only what the redesign rewrites anyway is extracted.

| File | Action | Why |
|---|---|---|
| `screens/MenuScreen.tsx` (695 lines) | Keep as orchestrator: data, layout mode, handlers | Rows, add button and states move out |
| `screens/menu/MenuRow.tsx`, `AddButton.tsx`, `MenuStates.tsx` | New (extracted and rewritten) | Rewritten JSX; states get one home |
| `screens/menu/menu.types.ts` | New | `MenuItem` is exported from `MenuScreen` and imported back by the sheet (circular) |
| `screens/menu/menu.utils.ts` | **Created in M0** with `deriveMenuState`; grows in M1 | `isComplex`, `minDisplayPrice`, `showFrom`, `itemCaption`, `matchesQuery`. The match predicate is copy-pasted four times today |
| `hooks/useAppConfig.ts` | New | One query, `QK.appConfig`, typed; `computeDelivery(subtotal, cfg)` |
| `components/FreeDeliveryStrip.tsx` | New | Three states, hides on bad config. `CartScreen` reuses it |
| `components/CartPanel.tsx`, `TopNav.tsx`, `AppNav.tsx`, `hooks/useBreakpoint.ts` | New (M4) | Laptop only |
| `components/ConnectionBanner.tsx`, `CartBar.tsx` | Edit | Prop and token colours; move inline `<style>` keyframes to `motion.css` |
| `lib/chooseLayout.ts` and spec | Edit | Chrome input, limiting column, thresholds |
| `styles/tokens.css` | Edit, additive | Both themes |
| `packages/shared-types` | Edit | `MAX_LINE_QTY` |
| API `menu.service.ts`, `app-config.module.ts` | Edit | Sort; finite-number guard. Both backward compatible |

**Not touching:** admin, rider, auth, order logic, the Android project, `/search`, the global palette.

### Technical decisions to agree before coding

1. **Equal row heights in pure CSS.** Each category block gets `flex: var(--n) 1 var(--cat-h)` with rows at `flex: 1`; on laptop a cap of `max-height: calc(var(--cat-h) + var(--n) * var(--row-max))`. Today block height is proportional to items plus 0.6 with a fixed 28px header, so rows are close to equal but not equal.

   ```css
   .boardCatBlock {
     /* --n is set inline: style={{ '--n': items.length }} */
     flex: var(--n) 1 var(--cat-h);
     max-height: calc(var(--cat-h) + var(--n) * var(--row-max, 9999px));
   }
   .boardItemRow { flex: 1 1 0; min-height: 0; }
   ```

2. **One source for chrome sizes.** Category header height, card gap and padding live as CSS variables on `.menuArea`; `chooseLayout` reads them once with `getComputedStyle`. JS and CSS then cannot drift, which is exactly what F4 is. `chooseLayout` itself stays pure.
3. **`deriveMenuState({ cats, items })`** is a pure function returning one of five states. `MenuScreen` switches on it. *(Done in M0.)*
4. **`<dialog>` with `showModal()` for the sheet.** It gives a native focus trap, Escape, inert background and focus return for free. Test on the oldest WebView you support; the fallback is a trap hook of about 25 lines.
5. **`AppNav` renders both navs and CSS hides one by breakpoint.** No JS branching, and the hidden one leaves the accessibility tree. `BottomNav` is inline-styled today, which a media query cannot override; move it onto the existing but unused `.bottom-nav` classes in `globals.css`.
6. **Add button variants through one `data-variant`** (quick, options, in-cart, sold-out). Keep today's three aria-labels and add the count.

---

## 8. Phased plan

One PR per phase (M4 may be two). Each task reads as task -> how it is verified. Tick the boxes as you go.

### M0 Safety net (0.5-1 day): partly done

Delivered in this zip (the earlier `m0-safety-net.patch` was not applied to it, so everything was redone from the original).

- [x] Move `useRef` above the early return in `ItemDetailSheet` -> mounted the real original and fixed files in headless Chromium: original blanks the screen (root empty, hook-order error), fixed opens, closes on Escape, reopens, and Add to cart works, with no console errors. Change: 5 lines added, 1 removed.
- [x] Add `deriveMenuState` (`screens/menu/menu.utils.ts`) and plain error and offline states with a Try again button that refetches only the failed query (offline state has no button; TanStack resumes paused queries when the network returns) -> **15 table-driven tests** (`menu.utils.spec.ts`), including "categories fail, items succeed", "query paused offline", "offline beats error", "refetch failed but old data kept" and "categories still loading while items loaded" (which used to flash "Menu is empty"). A mutant with the old `isLoading`-only behaviour fails 9 of 15. Also verified in a browser against the real `MenuScreen`: loading, cold offline, error, retry then recovery, empty, ready, warm-cache-then-offline. 18/18 pass (original code: 6/12).
- [x] Add a permanent regression test for the sheet crash -> `screens/menu/hooks-order.spec.ts`: an AST check (uses the `typescript` package already in devDependencies, so **no package.json or lockfile change**) that fails if any hook is called after an early return in `ItemDetailSheet` or `MenuScreen`. Run against the original `ItemDetailSheet` it fails and names `useRef` at line 113. A jsdom + Testing Library render test is still a good addition later (see below); the AST check covers the same bug class meanwhile.
- [ ] Add ESLint (flat config) with `react-hooks` and `jsx-a11y`; fix only what it reports in the menu files; add a `lint` step to CI -> **still open**: needs network and a lockfile update, so it was not faked here. When done, `react-hooks/rules-of-hooks` supersedes `hooks-order.spec.ts`.
- [ ] (Optional) DOM render test: `pnpm --filter @fastfood/customer add -D jsdom @testing-library/react`, commit the lockfile, then render `ItemDetailSheet` with `item={null}` and rerender with an item.
- [ ] Confirm offline behaviour -> DevTools "Offline", cold-load `/menu`: offline state, not "Menu is empty". Then go online: menu loads without a manual retry.
- [ ] Run `pnpm --filter @fastfood/customer test` and `typecheck` once in your environment. Here, `menu.utils.ts`, both new specs, `ItemDetailSheet.tsx` and `MenuScreen.tsx` were typechecked with `tsc --strict` against hand-written stubs of the uninstalled packages (including TanStack v5's result union), not the real types.

**Done when:** the sheet opens in a real browser, and an airplane-mode cold start shows the offline state, not "Menu is empty".

### M1 Logic and data (no visual change): done

- [x] `useAppConfig`, `QK.appConfig`, `computeDelivery` (in `lib/delivery.ts`, pure, so it needs no React to test); `App.tsx` and `CartScreen` switched over -> 50 tests, 35 of them comparing against the old inline formula over a grid of subtotals and configs (totals unchanged). New: `null`, `NaN`, `Infinity`, negative and zero config values never reach the UI. `CartScreen`'s progress bar now uses the real threshold instead of a hard-coded 100000.
- [x] `MAX_LINE_QTY = 20` in shared-types (**source and the committed `dist/`**, which the API reads and CI does not rebuild), used by the DTO, the sheet stepper, the zod schema (was 50) and the cart store; persist version 3 clamps saved carts -> 11 new cart tests (a 21st add is refused; a stored quantity of 30 becomes 20; 0, negative and NaN become 1).
- [x] `menu.utils`: `showFrom` follows sizes only, `itemCaption`, `secondaryLine`, one `matchesQuery` (trims), `findMatch`, `countMatches`, `firstMatchingCategoryId`, `hasNoMatches`, `resolveCatParam`, `badgeLabel` -> 58 tests including an add-ons-only item with no "from". `MenuItem` moved to `menu.types.ts` (breaks the sheet <-> screen import cycle; `MenuScreen` still re-exports the type for Home and Search).
- [x] `chooseLayout`: 52/56 thresholds; limiting-column estimate with gaps, header and padding from the CSS (`boardChrome.ts` reads `--board-cat-h`, `--board-gap` and the area's padding); focus bars 56/60; `columns` consumed (`--focus-cols`) -> 34 tests, including the design-board device sizes and seeded property tests (the estimate equals an independent model of the CSS over 200 random menus; no mode flapping). *Deviation:* the "never exceeds a reference row height" property is covered by the model-equality test and, in a browser, by the rendered-row comparison.
- [x] `?cat=`: focus mode opens the category; board outlines it for 1.5s; unknown ids fall back to the first category.
- [x] API: `getMenu` sorts by `{ createdAt: 1, _id: 1 }`; `envInt`/`envFloat` guard in app-config -> 14 new API tests, all fail on the old behaviour.

### M2 Phone UI: done

- [x] Tokens: `--action-tint`, `--highlight`, `--highlight-fg`, `--on-success`, `--topnav-h` and the board layout variables, both themes; `check:tokens` green (115 tokens).
- [x] Header (title + 44px search, `--safe-top`), `FreeDeliveryStrip` (three states, hidden on bad config).
- [x] Board rows: no thumbnail on phone, two-line clamp, 44px `AddButton` x4, sold-out chip (it takes the price's place, so it shows on every layout; it was hidden on phones in the first draft), equal-row CSS capped at 76px.
- [x] Focus mode: image cards, 2/3/4 columns, bars 56/60, `grid-template-rows` height transition, closed-bar preview, collapsed panels `inert`.
- [x] States inside the board area (header, search and nav stay put): skeleton with `aria-busy`, error, offline, empty, "Nothing matches that" + Clear search.
- [x] Polite live region for cart count and match count (**a TalkBack pass on a device is still needed**).
- [x] `ConnectionBanner`: `offlineMessage` prop ("last menu", not "last orders"), solid tokens, and the leaked 2.2s timer fixed; `CartBar` keyframes moved to `motion.css`.
- *Deviations:* kept Inter (D1) instead of the design's display font; the page ground stays `--bg-page` (D2).

### M3 Item sheet: done

- [x] Native `<dialog>` with `showModal()`: focus moves in, Tab stays inside, Escape and scrim close it, focus returns to the opener, close button (new `close` icon). Always rendered, with the content in a keyed child, so hook order can never depend on `item`.
- [x] Size = radio group in a `fieldset`, add-ons = checkboxes, 52px rows, label over price (the first draft truncated "Regular"), centred 440px dialog from 900px, `85vh` then `85dvh` in the right order (the old CSS put the fallback last, so `dvh` never applied).
- [x] Stepper limited by `MAX_LINE_QTY` minus what that exact line already has in the cart; first size preselected; 60px swipe kept.
- *Not done:* a close animation (the dialog closes instantly).

### M4 Laptop layout (D3 assumed yes): done

- [x] `useIsLaptop` (900px); `AppNav` renders `TopNav` or `BottomNav`; Home, Menu, Search, Orders and Profile use it. `TopNav` is fixed, and `#root` reserves its height (padding on `body` made the page scroll by 64px; found by the browser run).
- [x] Board + 360px `CartPanel` (lines, stepper, subtotal, fee, total, Checkout), 24px padding, strip inside the panel, search in the top bar, thumbnails and secondary line on rows.
- [x] Row cap 76px, board top-aligned; hover and focus-visible states.
- *Known limitation:* in laptop focus mode (menus too long for the height, for example 18 items at 1280x720) the open category's cards are partly below the fold of their own scroll box. It follows the rule "only scroll when cards cannot fit", but a compact laptop card would be better.
- *Not laptop-ready (unchanged):* Home, Orders, Profile and Search still use phone layouts under the new top bar.

### M5 Verification: partly done

- [x] Browser matrix (headless Chromium): 390x844, 1440x900, 1366x768, 1280x720, 768x1024; light and dark; menus of 7, 18 and 30 items; states loading, error, offline cold, offline banner, back online, sold out, no match, empty. See Appendix D.
- [ ] Not run here: 360x640, 412x915, 1920x1080; menus of 0, 1, 40 items over 2 and 8 categories; Urdu or very long names; **the APK on a real Android 15/16 device**; TalkBack.
- [ ] Correct plan v2 (F6 and its definition of done).

---

## 9. Risks and rollout

- **Web and APK ship differently.** Vercel updates at once; the APK bundles `dist`, so users get UI changes only with a new build. Every API change here is additive.
- **Persisted carts.** Quantity clamping needs the version 3 migration, or old carts keep failing at checkout.
- **Mode flips near thresholds.** The offline banner removes about 38px of menu height. Hysteresis stays (52 in, 56 out), but test toggling at boundary heights.
- **Image weight.** `item.image` loads full-size files into 48px thumbnails. Image sizing is a separate task.
- **M4 reach.** It touches five screens. It is its own PR, guarded by a media query so phones are unaffected, and can be reverted alone.
- **`<dialog>` on old WebViews.** Test on your minimum supported Android WebView before committing to it.

---

## 10. Definition of done

- [x] The sheet opens without a crash (verified in a browser against the real file; permanent guard test added; device check still to do).
- [x] `OrderDetailScreen` crash (F15) fixed.
- [ ] Airplane mode: cold start shows the offline state; warm shows the banner and the data.
- [x] Every tappable control is at least 44px, measured in the browser (add buttons, row buttons, stepper buttons, Try again). Size-card and add-on rows are 52px. Header search clear button is 44px.
- [x] No row is clipped and the page never scrolls, in every viewport and mode run here (see M5 for what was not run).
- [x] Light and dark: 972 rendered text elements measured, all at or above WCAG AA (lowest 5.02:1).
- [ ] `lint`, `typecheck`, `check:tokens`, `test` and `build` are green in CI. (`check:tokens` is green here. The others need your machine: see Appendix D.)
- [x] Cart totals are identical before and after (35 equivalence tests on the delivery rule). The only money-adjacent changes are the quantity clamp and the free-delivery progress bar using the real threshold. Checkout and rider code were not touched.
- [ ] Plan v2 is corrected.

---

## Appendix A: Token map and contrast

Ratios are computed WCAG values. Dark chip background is approximated by alpha-blending on `--bg-surface`.

| Design token | Use this repo token | Light | Dark |
|---|---|---|---|
| `--action-bg` | `--action-bg` | white on it 5.18 | `--action-fg` on flame 6.24 |
| `--action-hover` | `--action-bg-hover` | n/a | n/a |
| `--icon-well`, options button tint | `--chip-bg` with `--chip-fg` | 6.38 (options icon on tint 4.52; UI needs 3) | 7.90 |
| `--bg #F6F3EF` | `--bg-page #FAFAF9` (decision D2) | n/a | n/a |
| `--text-muted #6B625C` | `--text-muted` | 7.30 on page | 13.26 |
| Caption line (12.5px) | `--text-muted`, not `--text-subtle` | `--text-subtle` is only 4.80 on white, 4.59 on page | 6.93 |
| `--highlight #FDE68A` | New `--highlight`; dark `rgba(251, 191, 36, 0.28)` | 14.0 with ink | check in M2 |
| Banner on `--ok` and `--bad` | New `--on-success`; existing `--on-danger` | 5.02 and 6.47 | today's white: 1.74 and 2.77; with `--on-success` and `--on-danger`: 10.04 and 6.32 |

## Appendix B: M0 verification log

What was run, so you can judge how much to trust the "done" marks.

| Check | Result |
|---|---|
| Original `ItemDetailSheet.tsx` bundled and mounted in headless Chromium, row tap | Root empty, error "Rendered more hooks than during the previous render." |
| Fixed `ItemDetailSheet.tsx`, same harness | Dialog opens with correct title, Escape closes, reopens, root not empty, no errors |
| `menu.utils.spec.ts` (11 tests) against the real implementation, via a stand-in for Vitest | 11 passed, 0 failed |
| Same spec against a mutant that mimics the old behaviour | 6 failed (offline and error cases), as intended |
| `node scripts/check-tokens.mjs --app customer` | All tokens defined (105 tokens, 48 files) |
| `MenuScreen.tsx` and `ItemDetailSheet.tsx` parsed as TSX | OK |
| `menu.utils.ts` under `tsc --strict` | OK |
| `git apply --check` on a fresh extract of the original zip, then applied | Applies cleanly; resulting tree identical to the working tree |

**Not run:** real Vitest, full app typecheck, any test against React 18.3.1 or TanStack Query itself, any device. The harness stubbed only the cart store and the toast library; `ItemDetailSheet.tsx` itself ran unmodified apart from the fix.

## Appendix C: M0 verification log (second pass, this zip)

| Check | Result |
|---|---|
| Original vs fixed `MenuScreen` + `ItemDetailSheet` + `cart.store`, bundled with esbuild, run in headless Chromium at 390x844 with React 19.2 and StrictMode (TanStack Query, router, zustand, toast and axios replaced by small stand-ins; everything else is the real source) | Original 6/12 scenarios pass (blank screen on row tap; offline, error and category-failure all show "Menu is empty"). Fixed 18/18 |
| `menu.utils.spec.ts` (15 tests) and `hooks-order.spec.ts` (6 tests) bundled with esbuild and run in Node with a stand-in for Vitest's `describe`/`it`/`it.each`/`expect` | 21 passed, 0 failed |
| Mutants: old `isLoading`-only `deriveMenuState`; original `ItemDetailSheet.tsx` swapped into the hook-order guard | 9 of 15 fail; guard fails and reports `useRef` at line 113 |
| `tsc --strict` on the 5 new or changed TS/TSX files against hand-written stubs; control run with deliberate type errors | Clean; both deliberate errors caught |
| `node scripts/check-tokens.mjs --app customer` | All tokens defined (105 tokens, 48 files) |
| Hook-order checker run over all 20 `.tsx` files in the customer app | Original: `ItemDetailSheet` (fixed in M0) and `OrderDetailScreen` (F15, reproduced in Chromium). Fixed tree: only F15 |
| Try again button measured in Chromium | 111x44px, light and dark theme |

**Not run, again:** real Vitest, real `tsc` on the whole app, `vite build`, real TanStack Query (paused-query behaviour is taken from its documented v5 semantics, modelled in the stand-in), React 18.3.1, any device.

## Appendix D: M1-M5 verification log (this zip)

| Check | Result |
|---|---|
| Unit tests, run with a stand-in for Vitest/Jest (real Vitest and Jest were not installable here): `chooseLayout` 34, `delivery` 50, `cart.store` 16, `menu.utils` 58, `hooks-order` 16, API `env` 8, `app-config` 3, `menu.service` 3 | 188 passed, 0 failed |
| Mutants (each puts back one original bug): `>=` to `>`, zero threshold accepted, `showFrom` = `isComplex`, `trim()` removed, any `?cat=` accepted, no cart cap, no v3 migration, old estimator, old 38/42 thresholds, no API sort, raw `parseInt` | every mutant fails at least one test |
| Real-browser suite (headless Chromium, React 19.2, StrictMode; only TanStack Query, router, zustand, toast and axios replaced by small stand-ins): states, geometry, estimator vs rendered rows, add button and count badge, 20-item limit, search, item sheet (focus, Escape, scrim, swipe, Tab trap, focus return), focus mode, `?cat=`, free-delivery strip, banner, laptop top bar, cart panel, dialog, breakpoints | 88 of 88 passed. Three real bugs it found during the build (clipped focus cards, sold-out chip hidden on phones, page scrolling 64px on laptop) are now covered by checks that fail on the old code |
| Text contrast measured from the rendered page | 972 elements, light and dark, phone and laptop, 10 scenes: all at or above AA, lowest 5.02:1 |
| `tsc --strict` on every new or changed TS/TSX file against hand-written stubs of the uninstalled packages | No errors in changed code. Remaining errors are stub gaps in untouched files (the original `cart.store.ts` gives the identical 15 under the same stubs) |
| `node scripts/check-tokens.mjs --app customer` | All tokens defined (115) |
| Hook-order scan of all 29 customer `.tsx` files | 0 violations |

**Not run, because there is no `node_modules` or network here:** real Vitest and Jest, real `tsc` on the whole workspace, `vite build`, ESLint (still not installed, F13), the Gradle/Capacitor build, React 18.3.1 (the browser run used 19.2), the Inter font (a fallback font was used, so text widths can differ slightly), any device or TalkBack, and iOS Safari. Run `pnpm install`, then `pnpm --filter @fastfood/customer test typecheck build` and `pnpm --filter @fastfood/api test typecheck`.

**Hand-edited build output:** `packages/shared-types/dist` now has `constants.js`, `constants.d.ts` and updated `index` and `schemas` files, written to match `tsc`'s output style, because the API reads `dist` and CI does not rebuild it. Running `pnpm --filter @fastfood/shared-types build` will regenerate them identically (apart from source maps).
