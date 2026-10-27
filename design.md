# FastFood Platform: Design Guide

**Version 1.0 · 26 Oct 2026**
**Covers:** Customer app · Rider app · Restaurant panel (admin) · Presentation deck

This file explains the whole design of the FastFood platform: colors, type, spacing, components, layout, responsive rules for laptop and phone, animation, and the rules we follow when we write text. It is meant to be used on the real project.

## How to read this file

Every value in this file is marked in one of two ways:

| Label | Meaning |
|---|---|
| **From code** | The value is written in your demo files (`customer-demo.html`, `Rider-Demo.html`, `Restaurant-Admin-Demo.html`) or in the new presentation (`FastFood-Presentation-v2.html`). I read it there. |
| **Recommended** | It is my advice for the real project. It is not in the demos yet. |

If a value has no label, it is **From code**.

Before sending this file I checked the quoted texts, sizes, breakpoints, keyframes and timings in it against the demo files a second time, and corrected what did not match.

## Contents

1. [Design principles](#1-design-principles)
2. [The four surfaces](#2-the-four-surfaces)
3. [Foundations: color, type, spacing, shape, motion tokens](#3-foundations)
4. [Components](#4-components)
5. [Layout and responsive design (laptop and phone)](#5-layout-and-responsive-design)
6. [Animation in the apps](#6-animation-in-the-apps)
7. [Theming: light, dark, system](#7-theming)
8. [Accessibility](#8-accessibility)
9. [Content and voice](#9-content-and-voice)
10. [The presentation deck design system](#10-the-presentation-deck-design-system)
11. [Using this in the real project](#11-using-this-in-the-real-project)
12. [Quick reference](#12-quick-reference)

---

## 1. Design principles

These are not written in the demos as rules. They are what the demos do again and again, so I wrote them down.

1. **One order, one language.** The same status words and the same colors are used in all three apps. A customer, a cook and a rider must never see different names for the same step.
2. **Calm for busy people.** Cooks are busy and riders are outside. Screens show one clear next action, with big buttons and little decoration.
3. **Big targets, short words.** Buttons are at least 44px high. Labels are short ("Accept", "Mark ready", "Slide to confirm pickup").
4. **Honest screens.** The apps say "Total (est.)", "Demo map", "You're offline". They never hide a problem. Errors say what happened and what to do next.
5. **Light and dark are equal.** Both themes are designed, and both pass contrast checks (see 3.1).
6. **Motion explains, it does not decorate.** In the apps, animation only shows that something changed (a toast appears, a sheet opens, a step becomes current). Decorative motion is used only in the presentation deck.
7. **Accessible by default.** Visible focus ring, labels for every control, text that does not rely on color alone, and a reduced-motion mode.

---

## 2. The four surfaces

| Surface | Used by | Device | Design width | Default theme | Input |
|---|---|---|---|---|---|
| **Customer app** | Customers ordering food | Phone | 390px, fluid 320–480px | Light (dark switch in Profile) | Touch |
| **Rider app** | Delivery riders | Phone, used outside, often one-handed | 390px, fluid 320–560px | Follows the phone (system), can be set to light or dark | Touch, vibration, sound |
| **Restaurant panel** | Owner, cashier, kitchen | Laptop first, also tablet and phone | Fluid, content max 1440px | Dark (light switch in the avatar menu) | Mouse and keyboard, also touch |
| **Presentation deck** | You, when you meet restaurant owners | Laptop, projector, or the owner's phone | Fluid | Dark | Keyboard, click, swipe |

**From code:** the customer and rider demos draw a phone frame on a desktop screen. On a real phone the frame disappears and the app fills the screen. The frame, the toolbar above it, the fake status bar and the side panel in the rider demo are **demo scaffolding**. Do not build them into the real app.

---

## 3. Foundations

### 3.1 Color

The system is called **Ember**. It is one orange (the "flame") on warm gray ("stone"). Orange is used for actions and the current state. Everything else is gray.

#### Palette

| Token | Hex | Used for |
|---|---|---|
| `--ember-50` | `#FFF7ED` | Very light orange tint |
| `--ember-100` | `#FFEDD5` | Chip background, light tint |
| `--ember-200` | `#FED7AA` | Food tile background (demo) |
| `--ember-400` | `#FB923C` | Hover in dark theme, links in dark theme |
| `--flame` | `#F97316` | Brand orange. Button in dark theme. Charts. Pulse |
| `--ember-700` | `#C2410C` | Button and link in light theme |
| `--ember-800` | `#9A3412` | Button hover in light theme, tint text |
| `--ember-900` | `#7C2D12` | Darkest orange |
| `--stone-0` | `#FFFFFF` | Surface (light) |
| `--stone-50` | `#FAFAF9` | Page (light), text (dark) |
| `--stone-100` | `#F5F5F4` | Sunken area (light) |
| `--stone-200` | `#E7E5E4` | Border (light) |
| `--stone-300` | `#D6D3D1` | Muted text (dark) |
| `--stone-400` | `#A8A29E` | Subtle text (dark) |
| `--stone-500` | `#78716C` | Strong border, subtle text (light) |
| `--stone-600` | `#57534E` | Muted text (light) |
| `--stone-700` | `#44403C` | Border (dark) |
| `--stone-800` | `#292524` | Raised surface (dark) |
| `--stone-900` | `#1C1917` | Text (light), surface (dark) |
| `--stone-950` | `#0C0A09` | Page (dark) |

**Why two different action colors?** White text on `#F97316` has a contrast of only **2.8 : 1**, which fails. So in the light theme the button is darker (`#C2410C`, contrast **5.18 : 1** with white). In the dark theme the button is the bright flame and the text on it is dark (`#1C1917`, contrast **6.24 : 1**). Never put white text on `#F97316`.

#### Semantic tokens (use these in code, not the palette)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-page` | `#FAFAF9` | `#0C0A09` | Screen background |
| `--bg-surface` | `#FFFFFF` | `#1C1917` | Cards, inputs, bars |
| `--bg-raised` | `#FFFFFF` | `#292524` | Sheets, dialogs, drawers, menus |
| `--bg-sunken` | `#F5F5F4` | `#141210` | Wells, table headers, segmented control track |
| `--bg-overlay` | `rgb(12 10 9 / .5)` | `rgb(0 0 0 / .6)` | Scrim behind sheets |
| `--text` | `#1C1917` | `#FAFAF9` | Main text |
| `--text-muted` | `#57534E` | `#D6D3D1` | Secondary text |
| `--text-subtle` | `#78716C` | `#A8A29E` | Hints, captions |
| `--border` | `#E7E5E4` | `#44403C` | Card and divider lines |
| `--border-strong` | `#78716C` | `#78716C` | Input borders, secondary buttons |
| `--action-bg` | `#C2410C` | `#F97316` | Primary button |
| `--action-bg-hover` | `#9A3412` | `#FB923C` | Primary button hover |
| `--action-fg` | `#FFFFFF` | `#1C1917` | Text on primary button |
| `--link` | `#C2410C` | `#FB923C` | Links, ghost buttons |
| `--focus` | `#1D4ED8` | `#93C5FD` | Focus ring (blue on purpose, so it never looks like an orange action) |
| `--success` / `--success-bg` | `#15803D` / `#F0FDF4` | `#4ADE80` / `rgb(34 197 94 / .16)` | Success |
| `--warning` / `--warning-bg` | `#B45309` / `#FFFBEB` | `#FBBF24` / `rgb(245 158 11 / .16)` | Warning |
| `--danger` / `--danger-bg` | `#B91C1C` / `#FEF2F2` | `#F87171` / `rgb(239 68 68 / .16)` | Error, destructive action |
| `--danger-solid` / `--on-danger-solid` | `#B91C1C` / `#FFFFFF` | `#F87171` / `#1C1917` | Solid red button |
| `--info` / `--info-bg` | `#1D4ED8` / `#EFF6FF` | `#60A5FA` / `rgb(59 130 246 / .16)` | Information |
| `--tint-bg` / `--tint-fg` | `#FFEDD5` / `#9A3412` | `rgb(249 115 22 / .16)` / `#FB923C` | Soft orange highlight |
| `--toast-bg` / `--toast-fg` | `#1C1917` / `#FFFFFF` | `#F5F5F4` / `#1C1917` | Toast (always the opposite of the theme) |

#### Status tones (badges and trackers)

Ten tone pairs. Each has a text color (`fg`) and a soft background (`bg`).

| Tone | Light fg / bg | Dark fg / bg |
|---|---|---|
| blue | `#1D4ED8` / `#EFF6FF` | `#93C5FD` / `rgb(59 130 246 / .16)` |
| indigo | `#4338CA` / `#EEF2FF` | `#A5B4FC` / `rgb(99 102 241 / .16)` |
| amber | `#92400E` / `#FEF3C7` | `#FCD34D` / `rgb(245 158 11 / .16)` |
| teal | `#0F766E` / `#F0FDFA` | `#5EEAD4` / `rgb(20 184 166 / .16)` |
| purple | `#7E22CE` / `#FAF5FF` | `#D8B4FE` / `rgb(168 85 247 / .16)` |
| orange | `#9A3412` / `#FFEDD5` | `#FDBA74` / `rgb(249 115 22 / .16)` |
| green | `#15803D` / `#F0FDF4` | `#86EFAC` / `rgb(34 197 94 / .16)` |
| stone | `#44403C` / `#F5F5F4` | `#D6D3D1` / `rgb(168 162 158 / .16)` |
| red | `#B91C1C` / `#FEF2F2` | `#FCA5A5` / `rgb(239 68 68 / .16)` |
| rose | `#9F1239` / `#FFF1F2` | `#FDA4AF` / `rgb(244 63 94 / .16)` |

#### The order status vocabulary (one list for all apps)

The platform has ten statuses. Use these exact names in code and data.

| Status code | Customer app label | Tone | Tracker step |
|---|---|---|---|
| `PLACED` | Order placed | blue | 1 Placed |
| `ACCEPTED` | Accepted | indigo | 2 Accepted |
| `PREPARING` | Preparing | amber | 3 Preparing |
| `READY` | Ready · finding a rider | teal | 3 Preparing |
| `RIDER_ASSIGNED` | Rider on the way to restaurant | purple | 4 On the way |
| `PICKED_UP` | On the way to you | orange | 4 On the way |
| `DELIVERED` | Delivered | green | 5 Delivered |
| `CANCELLED` | Cancelled | stone | none |
| `REJECTED` | Rejected (label from the panel) | red | none |
| `DELIVERY_FAILED` | Delivery failed (label from the panel) | rose | none |

Notes:
- The first eight rows are the customer demo's status map (`ST`). Each entry also has an icon (clipboard, check, chef, package, bike, nav, check, ban) and one sentence of explanation, for example "Your food is being cooked."
- `REJECTED` and `DELIVERY_FAILED` are in the **restaurant panel's** map (red `#B91C1C` on `#FEF2F2`, rose `#9F1239` on `#FFF1F2`, each with a dark-theme version). The **customer demo's map does not have them**. Add them there with the same tones, so a customer whose order was rejected sees a proper status.
- The panel's board groups the statuses into four columns: **New** (`PLACED`), **Preparing** (`ACCEPTED`, `PREPARING`), **Ready** (`READY`), **With rider** (`RIDER_ASSIGNED`, `PICKED_UP`). The action button on a card follows the status: Accept → Start preparing → Mark ready → Dispatch → Track. The wording can be different by role; the status **code** and the **tone** must stay the same.
- Always show a status as **icon + text + color**, never color alone.

#### Contrast results (WCAG 2.x, calculated from the hex values)

AA needs **4.5 : 1** for normal text and **3 : 1** for large text and UI parts.

| Theme | Pair | Ratio | Pass |
|---|---|---|---|
| Light | `--text` `#1C1917` on page `#FAFAF9` | 16.74 | AAA |
| Light | `--text-muted` `#57534E` on page | 7.30 | AAA |
| Light | `--text-subtle` `#78716C` on white | 4.80 | AA |
| Light | white on `--action-bg` `#C2410C` | 5.18 | AA |
| Light | `--link` `#C2410C` on page | 4.96 | AA |
| Light | `--danger` `#B91C1C` on `#FEF2F2` | 5.91 | AA |
| Light | `--success` `#15803D` on `#F0FDF4` | 4.79 | AA |
| Light | amber tone `#92400E` on `#FEF3C7` | 6.37 | AA |
| Light | white on flame `#F97316` | **2.80** | **Fail, never use** |
| Dark | `--text` `#FAFAF9` on page `#0C0A09` | 18.92 | AAA |
| Dark | `--text-muted` `#D6D3D1` on surface `#1C1917` | 11.74 | AAA |
| Dark | `--text-subtle` `#A8A29E` on surface | 6.93 | AA |
| Dark | `#1C1917` on `--action-bg` `#F97316` | 6.24 | AA |
| Dark | `--link` `#FB923C` on page | 8.73 | AAA |
| Dark | `--danger` `#F87171` on surface | 6.32 | AA |
| Dark | `--success` `#4ADE80` on surface | 10.04 | AAA |

#### Color rules

1. Orange means **action** or **"this is current"**. Do not use orange for decoration in the apps.
2. Use semantic tokens (`--text`, `--action-bg`), never raw hex, in components. Then dark mode works by itself.
3. One accent per screen: one primary button per view.
4. Red is only for errors and destructive actions.
5. Charts use a single color: `--chart` = `#EA580C` (light) and `#F97316` (dark). **From code** (restaurant panel).

### 3.2 Typography

**Font:** Inter. **Fallback:** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
**Numbers:** `font-variant-numeric: tabular-nums` on the whole page, so money and times line up in columns. **From code** (all three apps).

#### App type scale

| Style | Size / line | Weight | Used for |
|---|---|---|---|
| Display | 32 / 40 | 800 | Big numbers, hero values |
| H1 | 24 / 32 | 700 | Page title (20 / 28 in the customer header and on admin mobile) |
| H2 | 20 / 28 | 700 | Section title, dialog title |
| H3 | 17 / 24 | 600 | Card title, menu item name |
| Body | 15 / 22 | 400 | Normal text (customer, rider). The restaurant panel uses 14 / 20 because it has more data on screen |
| Small | 13 / 18 | 400 | Helper text, meta |
| Caption | 12 / 16 | 500 | Badges, small labels |
| Overline | 12 / 16 | 600, uppercase, +.04em | Table headers, section labels |
| KPI number | `clamp(22px, 2.2vw, 32px)` / 40 | 800 | Panel stat tiles (22 / 32 on phone) |
| Delivery code (OTP) | 40 / 48 (customer shows it); 28 / 36 (rider types it in) | 800, monospace in the customer app, +.4em spacing | The delivery code the customer shows to the rider |

Rules:
- Body text never goes below **13px**. Captions at 12px are only for badges and labels.
- Form fields use **16px** text. Below 16px, iPhones zoom the page when the field gets focus. The admin panel forces `font-size:16px` on inputs on phones.
- Do not use more than **three** sizes on one phone screen.
- Money format: `Rs. 1,200` (comma for thousands, one space after `Rs.`). The rider demo stores money as whole **paisa** (Rs. 1,350 is `135000`) and formats it on screen. Keep doing this to avoid decimal errors.

### 3.3 Spacing, size, shape

#### Spacing scale (4px grid)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48` as `--space-1` … `--space-12`. The standard screen padding on a phone is **16px**. Gap between cards is **12px**. **From code.**

#### Touch and click targets

| Element | Height | Where |
|---|---|---|
| Standard button | **44px** (min) | Customer, rider |
| Large full-width button | 52px (customer), **56px** (rider "XL") | Checkout, "Place order", rider main action |
| Icon button | 44px (customer, admin), 48px (rider) | Header, close, back |
| Text input / search | 48px (customer search), **52px** (rider input) | Customer, rider |
| Option row (radio, size, add-on) | 56px | Customer product page, rider choices |
| Cart bar | 52px | Customer |
| Segmented control button | 40px (inside a 4px padded track) | Active / Past |
| Bottom nav item | 56px (customer, panel on phone), **60px** (rider tab bar) | |
| Switch | 44 × 28px (customer), **68 × 40px** (rider, bigger for outdoor use) | Settings, availability |
| Slide to confirm (rider) | 60px high, 52px thumb | Pickup and delivery |
| Filter chip | 36px (customer, tappable), 32px (rider info chip, not tappable) | |
| Avatar | 56px (customer, rider), 40px (rider, small) | |
| Panel button / search | 40px; nav item, icon button and "Live" button 44px | Panel on laptop (mouse) |

Rule: **44px minimum on anything a finger can touch.** The panel's 40px controls are fine for a mouse, but on a touch tablet use 44px. **Recommended:** `@media (pointer: coarse) { .btn, .srch { min-height: 44px } }`.

#### Corner radius

| Token | Size | Used for |
|---|---|---|
| `--radius-xs` | 4px | Keyboard hint `kbd` |
| `--radius-sm` | 8px | Text areas, segmented buttons |
| `--radius-md` | 12px | Buttons, inputs, nav items, toasts |
| `--radius-lg` | 16px | Cards, panels, dialogs |
| `--radius-xl` | 24px | Bottom sheets (top corners only) |
| `--radius-pill` | 999px | Badges, chips, cart bar, icon buttons in the customer app |

#### Elevation (shadows)

| Level | Light | Dark |
|---|---|---|
| 1, cards | `0 1px 2px rgb(28 25 23 / .06), 0 1px 1px rgb(28 25 23 / .04)` | none (the card border does the work) |
| 2, floating (toast, popover) | `0 4px 12px rgb(28 25 23 / .08)` | a 1px ring: `0 0 0 1px #44403C` |
| 3, sheets and dialogs | `0 12px 32px rgb(28 25 23 / .16)` | black shadow `0 12px 32px rgb(0 0 0 / .5)` or the 1px ring |

In dark theme, shadows are almost invisible, so **borders** show the layers.

#### Layers (z-index)

The demos use these numbers. **Recommended:** keep them as tokens.

| Layer | z-index |
|---|---|
| Sticky bars, bottom nav, sticky footer | 20 (25 for the admin mobile nav) |
| Scrim (dark background behind sheets) | 30 (35 in the panel) |
| Drawer (panel) | 36 |
| Bottom sheet | 40 |
| Toast | 50 |
| Full-screen preview / overlay | 60 |

### 3.4 Icons and images

- **Icons:** stroke icons, 20 × 20px, stroke width 1.9, round caps and joins, `currentColor`. They take the color of the text. Add an `aria-label` when an icon has no text.
- **Food pictures:** a 4 : 3 tile (`aspect-ratio: 4/3`). The demos use emoji on a tinted background (`--ember-200`) as placeholders.
  **Recommended for the real product:** real photos, 4 : 3, compressed (WebP, about 800px wide), with `alt` text, and a skeleton while loading.
- **Avatars:** circle with the first letter. Sizes 56px and 40px (small, rider app).
- **Maps:** the demos draw an SVG with tokens `--map-bg`, `--map-road`, `--map-park`, `--map-water`, and pins `--pin-store`, `--pin-home`, `--pin-rider` (rider demo). These are **demo only** and say "Demo map". The real product needs a real map. The customer demo's pin colors are: store `#9A3412` (dark orange), home `#1D4ED8` (blue), rider `#7E22CE` (purple, the same purple as the `RIDER_ASSIGNED` tone). Use **one** set of three pin colors in both apps.

### 3.5 Motion tokens

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 100ms | Button press (`scale(.98)`) |
| `--dur-fast` | 160ms | Hover, switch, color change |
| `--dur-base` | 240ms | Toast, sheet, drawer, scrim |
| `--dur-slow` | 400ms | Progress bar, map pin move |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | Most movement |
| `--ease-enter` | `cubic-bezier(0, 0, 0, 1)` | Things that appear (decelerate) |
| `--ease-exit` | `cubic-bezier(.3, 0, 1, 1)` | Things that leave (accelerate) |

---

## 4. Components

Sizes are **From code** unless marked.

### 4.1 Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `--action-bg` fill, `--action-fg` text | The one main action on a screen |
| Secondary | `--bg-surface` fill, 1px `--border-strong`, `--text` | Second action |
| Ghost | Transparent, `--link` text | Low-priority action ("Back to menu") |
| Danger | `--danger-solid` fill | Delete, reject, cancel order |
| Danger outline | Transparent, red border and text | Softer destructive action |
| Link danger | Red text, 48px high, full width | "Can't deliver…" in the rider app |

Spec: phone apps `min-height 44px`, radius 12px, font 600 15px, `gap 8px` between icon and text. The panel's button is `min-height 40px`, `padding 0 16px`, radius 12px, 1px `--border-strong`. Large: 52px (customer) or 56px (rider "XL"), full width, 16px text. Hover: darker/lighter `--action-bg-hover`. Press: `transform: scale(.98)`, 100ms. Disabled and busy: `opacity .55`, `cursor: not-allowed`; a busy button also gets `aria-busy="true"` and changes its label ("Accepting…", "Reporting…").

### 4.2 Inputs

Height 48px (customer) or 52px (rider), border 1px `--border-strong`, radius 12px, text 16px. Error: in the rider app the border becomes **2px** `--danger`; the message is red text under the field, with `aria-invalid="true"`. Helper text 13px `--text-subtle`. Notes fields are limited to 200 characters (`maxlength`).

### 4.3 Cards, badges, chips

- **Card:** `--bg-surface`, 1px `--border`, radius 16px, `shadow-1`, padding 16px (20px in the panel), gap 12px between cards.
- **Status badge:** min-height 24px, padding 3px 10px, pill, 12 / 16 600 text, tone `fg` on tone `bg`, with a small icon.
- **Filter chip (customer):** pill, height 36px, padding 0 14px, 14px 600 text, 1px `--border-strong`. Selected: `--chip-bg` + `--chip-fg` (light `#FFEDD5` / `#9A3412`; dark `rgb(249 115 22 / .18)` / `#FDBA74`).
- **Info chip (rider):** pill, height 32px, `--tint-bg` / `--tint-fg`, 13px 600.
- **Active job card (rider):** a normal card with a 3px `--flame` bar on the left edge.
- **Tag "Sold out":** dark pill `#1C1917` with white 12 / 16 600 text, padding 2px 8px, top-left of the food tile.

### 4.4 Navigation

| Component | Spec |
|---|---|
| **Customer bottom nav** | 4 equal tabs: Home, Menu, Orders, Profile. Icon 20px + 12px label, tab height 56px. Top border 1px. Bottom padding `env(safe-area-inset-bottom)`. Active tab (`aria-current="page"`): `--link` color, weight 700, and a 3px bar on top edge. A small dot on "Orders" (`aria-label="Active order"`) shows a live order. |
| **Rider bottom nav** | 3 tabs: Jobs, Earnings, Profile. Tab height 60px, same active style (3px bar on the top edge, `--link` color). A 10px flame dot marks something new. |
| **Panel sidebar** | 248px wide on large screens, sticky, full height. 6 items: Dashboard, Orders, Menu, Riders, Customers, Analytics. Items 44px high, radius 12px, icon + label. Active (`aria-current="page"`): `--sunken` fill and `--link` color. |
| **Panel top bar** | Sticky, min-height 64px, padding 8px 24px. Search (40px high, max 320px, `/` shortcut), "Live" indicator, new-order sound toggle, bell with new orders, avatar menu (theme Light / Dark, Preview mobile view, Sign out). |

### 4.5 Order components

- **Tracker (stepper):** 5 steps in a row: Placed, Accepted, Preparing, On the way, Delivered. Done steps are orange filled, the current step has a pulsing ring, next steps are gray. Under it a gray box explains the step in one sentence ("Your food is being cooked.").
- **Delivery code card (OTP):** centered, dashed 2px `--flame` border, radius 16px. Code in 40px monospace. A line under it: "Show this code to the rider at delivery. Don't share it with anyone else."
- **Cart bar:** floating pill above the bottom nav: item count · "View cart" · total. `--action-bg`, 52px, `shadow-3`. It rises in (`rise`).
- **Sticky footer (checkout):** a bar at the bottom with the main button. Padding `12px 16px calc(12px + env(safe-area-inset-bottom))`, top border, `shadow-2`.
- **Order card (panel board):** order number, status, items, total, and one action button that follows the status: "Accept", "Start preparing", "Mark ready", "Dispatch", "Track". A `…` menu holds "Reject…" (only for a new order) and "Cancel order…" (while new, accepted or preparing). Both open a dialog that asks for a reason.
- **Slide to confirm (rider):** a full-width pill track, 60px high, with a 52px round thumb. Done at **85%** of the travel; otherwise it snaps back in 220ms. It also works with the **Enter** key. Its accessible label ends with "Drag to the end, or press Enter."
- **Delivery request sheet (rider):** a bottom sheet that does **not** close when you tap outside it (closing it counts as Decline). It shows "New delivery request", the order number (for example `#FD-1042`), pickup and drop-off distance, cash to collect, the rider's earning, a **30-second** countdown ring (`role="timer"`), and two full-width 56px buttons: Accept (primary) and Decline (secondary). The phone vibrates (200-100-200 ms) and beeps when it opens, and a screen-reader announcement says "New delivery request. Cash to collect Rs. …". When a request ends, a toast says one of: "Request expired.", "Request declined.", "Order was cancelled.", "Another rider took this order."

### 4.6 Overlays and feedback

| Component | Spec |
|---|---|
| **Bottom sheet** | Radius 24px on top corners, padding `12px 16px calc(16px + safe-area)`, `shadow-3`, scrim `--bg-overlay`, A 40 × 4px grab handle sits at the top. Enter animation: see `rise` in 6.1. Closes with the scrim or a button; the rider's delivery request is the exception (see 4.5). The rider sheet has `max-height: 92%` and scrolls inside. |
| **Dialog (panel)** | Max width 420px, `calc(100% - 32px)` on phone, radius 16px, padding 24px. Title, explanation, optional reason list, two buttons. |
| **Drawer (panel)** | Opens from the right edge. Width `min(480px, 100%)`, slides in 240ms, scrim behind. Shows order details with the actions at the bottom. |
| **Toast** | **Customer:** at the top inside the phone (12px from the top, 16px from the sides), dark `#292524` with light text in both themes, radius 12px, can hold one action button; hides after 3s (4s with an action); one at a time. **Rider:** one at a time, hides after 3s (5s for errors); `role="status"`, or `role="alert"` for errors. **Panel:** bottom right on laptop, `--raised` surface with a 1px border, hides after 3.5s, and several can stack; at ≤380px wide it sits above the bottom nav, 16px from the sides (see finding 14 in 11.4). |
| **Banner** | A full-width box with an icon and a bold title. The rider app shows the connection state: "You're offline. Showing your last data." and "Back online" (hides after 2.2 seconds). The customer app shows "You’re offline — showing your last orders". |
| **Skeleton** | Gray shapes with a moving shine (`1.2s`, customer and rider apps). Shown while the menu or jobs load. |

### 4.7 Data components (panel)

- **KPI tile:** a card with a small label (for example "Revenue today", "Active orders", "Cash to settle"), a big number (800 weight, the `.big` style) and one line of context. The grid is `repeat(auto-fit, minmax(200px, 1fr))` with 16px gap.
- **Order board:** 4 columns (New, Preparing, Ready, With rider), each at least 230px wide, in a `--sunken` column with 16px radius and 12px padding. A Board / Table switch shows the same orders as a list.
- **Table:** sticky header (12px uppercase, `--bg-sunken`), 16px cell padding, row actions on the right. On phone the table becomes stacked cards (see 5.6).
- **Chart:** an area chart in one color. The last value is labelled. A "View as table" button gives the same data in a table. Bars for busiest hours: the busiest bar is full flame, the others are a dim flame.

---

## 5. Layout and responsive design

### 5.1 Strategy

| App | Strategy | Why |
|---|---|---|
| Customer | **Phone first.** One column. | Customers order on their phone. |
| Rider | **Phone first.** One column. | Riders only use a phone. |
| Restaurant panel | **Laptop first**, then it adapts down to tablet and phone. | Staff work on a laptop or tablet at the counter, but the owner also checks it on a phone. |
| Deck | **Fluid.** Built for a laptop screen, adapts to big screens and phones. | You present on a laptop, the owner may open it on a phone. |

### 5.2 Breakpoints

| Where | Width | What changes | Source |
|---|---|---|---|
| Customer app | **≤ 480px** | The phone frame is removed. The app fills the screen. | From code |
| Rider app | **≤ 560px** | Frame, fake status bar and demo side panel are removed. App is full screen (`100dvh`). | From code |
| Rider app | 561–899px | Side panel goes under the phone (one column). | From code (demo only) |
| Rider app | ≥ 900px | Phone and side panel side by side. | From code (demo only) |
| Panel | **≥ 1280px** | Full sidebar (248px) with labels. | From code |
| Panel | **768–1279px** | Sidebar becomes an icon rail (72px). Two-column grids become one column. | From code |
| Panel | **≤ 767px** | Sidebar becomes a **bottom nav** (56px). One column. Tables become cards. Board scrolls sideways. | From code |
| Panel | ≤ 380px | Only the active nav item shows its label. Drawer is full width. Toasts move above the nav. | From code |
| Panel | ≤ 340px | KPI tiles become one column. | From code |
| Deck | ≤ 900px | All two-column slides become one column. | From code |
| Deck | 901–1100px | The screenshot gets less width, the text more. | From code |
| Deck | height ≤ 800px, ≤ 740px | Slightly smaller text and gaps, so a slide fits on a laptop screen. | From code |
| Deck | ≤ 560px | Slide dots are hidden, only "5 / 14" shows. | From code |

**Recommended names** for the real project, so all apps agree:

| Name | Width | Typical device |
|---|---|---|
| `xs` | 0–479px | Small and normal phones |
| `sm` | 480–767px | Large phones, phones in landscape |
| `md` | 768–1279px | Tablets, small laptops |
| `lg` | 1280px and up | Laptops and desktops |

### 5.3 Phone layout (customer and rider)

```
┌────────────────────────┐  ← 390px design width, fluid 320–480px
│ Header (title, icons)  │  44px icon buttons, h1 20px
├────────────────────────┤
│                        │
│  Scrolling screen      │  padding 16px, gap 16px (rider) / 12px (customer)
│  (cards, lists)        │  overscroll-behavior: contain
│                        │
│                        │
├────────────────────────┤
│ Cart bar (floating)    │  52px pill, margin 0 16px 8px  (customer, when cart has items)
├────────────────────────┤
│ Bottom nav (4 tabs)    │  + env(safe-area-inset-bottom)
└────────────────────────┘
```

Rules 3, 5, 7, 9 and 10 are **Recommended**; the others are what the demos already do.

1. **Height:** use `100dvh`, not `100vh`. On a phone, `100vh` is taller than the visible area when the browser toolbar shows.
2. **Safe areas:** every bar at the bottom adds `env(safe-area-inset-bottom)` (the iPhone home bar). This only works with `viewport-fit=cover`, which all three demos already have: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Keep it.
3. **Scrolling:** only the middle area scrolls. Headers, footers and nav stay. Use `overscroll-behavior: contain` so a scroll does not pull the page behind.
4. **Padding:** 16px at the sides. Never smaller on phones.
5. **One thumb:** put the main action in the lower half (sticky footer or bottom sheet). Keep close and back buttons at the top left.
6. **Keyboard:** when the keyboard opens, the focused field must stay visible. Footers with buttons should not cover the field (test on iOS and Android). The rider demo's viewport tag adds `interactive-widget=resizes-content`, which makes Android Chrome shrink the page when the keyboard opens, so fixed bars move above the keyboard. Keep it, and test it.
7. **Food cards (Recommended):** one column on phones; 2 columns from 480px and 3 from 768px.
8. **Long text:** clamp item names to 2 lines (`-webkit-line-clamp: 2`).
9. **Text zoom:** use `-webkit-text-size-adjust: 100%` and relative layout, so large system fonts do not break the screen.
10. **Landscape (recommended to check):** a sticky footer plus bottom nav can take half of a landscape phone. Test it, and hide the bottom nav when the keyboard is open.

**Rider-specific:** riders use the phone in sunlight, with one hand, often while standing. So: 56px main buttons, light theme with strong contrast, big money numbers, vibration and sound for new jobs, and a clear red/green connection banner.

### 5.4 Laptop layout (restaurant panel)

```
≥ 1280px
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │ Top bar (sticky, 64px): title · search · Live │
│ 248px    │ · sound · bell · avatar                       │
│ sticky   ├──────────────────────────────────────────────┤
│          │ Main  padding 24px, max-width 1440px          │
│ Dashboard│  ┌──────┐┌──────┐┌──────┐┌──────┐  KPI tiles  │
│ Orders   │  └──────┘└──────┘└──────┘└──────┘  4 columns  │
│ Menu     │  ┌───────────────────┐┌───────────┐            │
│ Riders   │  │ Chart (3fr)       ││ Side list │  grid 3fr  │
│ Customers│  │                   ││ (2fr)     │  + 2fr     │
│ Analytics│  └───────────────────┘└───────────┘            │
│          │  ┌───────────────────────────────┐            │
│          │  │ Orders (board or table)       │            │
└──────────┴──────────────────────────────────────────────┘
                                         Details drawer → opens from the right (480px)
```

Rules 7, 8 and 9 are **Recommended**; the others are what the demo does.

1. **Grid:** `.app { grid-template-columns: 248px minmax(0, 1fr) }`. `minmax(0, 1fr)` is important: it lets wide tables scroll inside the card instead of stretching the page.
2. **Content width:** the main area is fluid but never wider than **1440px**, so lines do not become too long on a big monitor.
3. **KPI tiles:** `repeat(auto-fit, minmax(200px, 1fr))`, 16px gap. They flow from 4 across to 2 and 1 by themselves.
4. **Two-column areas:** `3fr 2fr` for "chart + live orders", 16px gap.
5. **Order board:** `repeat(4, minmax(230px, 1fr))`. On a small laptop the board scrolls sideways inside its container.
6. **Search:** press `/` to focus. A `kbd` hint shows the shortcut.
7. **Common laptop sizes to check:** 1280 × 720, 1366 × 768 (the most common cheap laptop), 1440 × 900, 1536 × 864, 1920 × 1080.
8. **Mouse extras:** hover states on rows and nav items, keyboard shortcuts, tooltips on icon buttons (`title`).
9. **Counters and live data:** the new-order badge, the Live dot (pulses), and the sound alert always stay visible in the top bar.

### 5.5 Tablet and in-between

- **Panel, 768–1279px:** the sidebar becomes a 72px icon rail (labels hidden, count badges move to the corner of the icon). Two-column grids become one column. This is the common iPad-at-the-counter layout. Use 44px targets here (see 3.3).
- **Customer and rider on tablet:** the demos only show a centered phone. **Recommended:** keep the same single column, centered, with `max-width: 480px`, on a calm page background. For the customer menu you can use 3 or 4 card columns above 768px.

### 5.6 How each component adapts (restaurant panel)

| Component | Laptop (≥ 1280) | Tablet (768–1279) | Phone (≤ 767) |
|---|---|---|---|
| Navigation | Sidebar 248px, icon + label | Icon rail 72px | **Bottom nav**, 56px, 6 items, label 12px |
| Top bar | One row | One row | Wraps; the search drops to its own full-width row |
| Page padding | 24px | 24px | 16px (88px at the bottom for the nav) |
| KPI tiles | 4 columns | 2–4 columns | **2 columns**; 1 column at ≤ 340px |
| Chart + side list | 3fr / 2fr | Stacked | Stacked |
| Order board | 4 columns | 4 columns, scroll sideways | Columns are **85% wide** and **snap** while scrolling sideways |
| Filter chips | Wrap | Wrap | One row, scroll sideways, no wrap |
| Table | Normal table | Normal table | **Cards:** header hidden; each cell becomes a row `Label … Value`, using the `data-l` attribute for the label; actions at the end |
| Order details | Drawer 480px from the right | Drawer 480px | Drawer 480px; **full width** when the screen is narrower than 480px |
| Dialog | 420px | 420px | `calc(100% - 32px)` |
| Toasts | Bottom right | Bottom right | Above the bottom nav at ≤380px (**in the demo, between 381 and 767px they still sit over the nav bar: see finding 14**) |
| Inputs | 14–15px | 14–15px | **16px** (no zoom on iPhone) |

### 5.7 Test matrix

Test every screen at these sizes. Use real devices for at least one phone and one laptop.

| Group | Sizes (width × height) |
|---|---|
| Small phone | 320 × 568, 360 × 640 |
| Normal phone | 375 × 667, 390 × 844, 412 × 915 |
| Large phone | 414 × 896, 430 × 932 |
| Tablet | 768 × 1024, 820 × 1180, 1024 × 768 |
| Laptop | 1280 × 720, 1366 × 768, 1440 × 900, 1536 × 864 |
| Desktop | 1920 × 1080, 2560 × 1440 |

Also test: browser zoom 200%, large system font, landscape phone, slow network (skeletons), offline mode, light and dark, reduced motion, and **keyboard only**. Browsers: Chrome (Android and desktop), Safari (iPhone), Edge, Firefox.

A quick automatic check that I used on the deck: load the page at each size and compare `scrollWidth` to `clientWidth`. If it is bigger, something overflows sideways.

### 5.8 Responsive do and don't

| Do | Don't |
|---|---|
| Use `minmax(0, 1fr)` in grids that hold tables or images | Let a wide child stretch the grid |
| Use `dvh` for full-screen heights | Use `100vh` on mobile |
| Design the smallest screen first, add space for bigger | Hide important actions on phone |
| Keep the same status colors and words everywhere | Change colors per screen size |
| Use logical properties (`margin-inline-start`, `inset-inline-end`) | Use `left` / `right` for layout (breaks RTL) |
| Test with long names and big numbers (Rs. 1,234,567) | Test only with short sample data |

---

## 6. Animation in the apps

Rule: **animate only what changes, and only `transform` and `opacity`** where possible. Keep it short (100–400ms). Rule 1 below is in the demos' code; rules 2–5 are **Recommended**, they describe how the demos behave but are not written there as rules.

### 6.1 Catalogue

| Name | What it does | Time | Where |
|---|---|---|---|
| Press | `scale(.98)` | 100ms | Buttons (`:active`) |
| Hover / color | Background, color or switch-thumb change | 160ms | Buttons, nav items, rows, switches |
| `rise` (customer) | Fades in while moving up 16px | 240ms | Toast, cart bar, bottom sheet |
| `rise` (rider) | The sheet slides up from the bottom edge (`translateY(100%)` → 0) | 240ms | Bottom sheets |
| `fade` (rider) | Opacity 0 → 1 | 240ms | Scrim behind a sheet |
| `drop` (rider) | Fades in while moving down 16px | 240ms | Toasts and banners at the top |
| `in` (panel) | Fades in while moving down 12px | 240ms | Panel toasts |
| Drawer (panel) | `translateX(100%)` → 0 | 240ms | Order details |
| Map pin | `left` / `top` transition (uses a `--dur-*` token) | token | Pin moves when the user drags |
| Tracker pulse (customer) | A soft ring grows around the current step (`box-shadow` 0 → 6px, 25% orange) | 2s, repeats | Current tracker step, live dot |
| Online pulse (rider) | A green ring expands (`box-shadow` 0 → 8px, fading out) | 2s, repeats | Online dot |
| Radar (rider) | `ping` scales .45 → 1.35 while fading out (2.4s); `rpulse` scales .6 → 1.5 while fading out (2s) | repeats | "Looking for jobs" radar |
| Live dot (panel) | Opacity 1 → .35 → 1 | 2s, repeats | The "Live" indicator |
| Skeleton shine | A light band moves across the gray shape | 1.2s, repeats | Customer and rider loading placeholders |
| Slide snap-back | The slide-to-confirm thumb returns to the start | 220ms | Rider, when released before 85% |

### 6.2 Rules

1. **Reduced motion:** when the user turns on "reduce motion", switch **all** animations and transitions off. **From code:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after { animation: none !important; transition: none !important; }
   }
   ```
2. A status change should be shown by **text and color first**. Motion is only extra.
3. Never block the user while an animation plays. Buttons stay clickable.
4. Do not loop animations except: the tracker's current step, the Live and online dots, skeletons, the rider radar, and the countdown.
5. **Sound and vibration** are part of motion design for staff: a chime for a new order (the panel has a sound toggle), vibration and a beep for a new rider job. Always give a way to turn sound off.

---

## 7. Theming

- **Switch:** the attribute `data-theme="light"` or `data-theme="dark"` on `<html>`. Each theme sets the same token names, so components do not change.
- **Color scheme:** also set `color-scheme: light` or `dark`, so scrollbars and form controls match.
- **Rider app, three choices:** System, Light, Dark. The choice is saved in `localStorage` under the key `ff-rider-theme`. In System mode, a `matchMedia('(prefers-color-scheme: dark)')` listener updates the theme live.
- **Customer app:** light by default, a "Dark theme" switch in Profile. **Panel:** dark by default, Light and Dark in the avatar menu. **Recommended:** make all three behave like the rider app (System by default), and save the choice per user.
- **Differences between themes:**
  - Action color changes (see 3.1).
  - Shadows are replaced by borders in dark.
  - Tone badges use a soft transparent background in dark (`rgb(... / .16)`) and a lighter text color.
  - Toasts: the rider token set flips them (`--toast-bg`: dark in light theme, light in dark theme). The customer toast is a fixed dark `#292524` in both themes. The panel toast uses the raised surface with a border. Pick one behavior for the real project.
  - Maps and chart colors have their own dark values.

---

## 8. Accessibility

| Area | Rule | Source |
|---|---|---|
| Focus | Every interactive element shows a **2px** ring in `--focus` with a 2px offset (`:focus-visible`). | From code |
| Targets | 44px minimum for touch | From code |
| Text contrast | AA or better (see table in 3.1) | From code |
| Color | Status uses icon + text + color. Errors use an icon and a sentence. | From code |
| Labels | Icon buttons have `aria-label`. Inputs have visible labels. Switches use `role="switch"` and `aria-checked`. Tabs use `aria-selected`. Pressed filters use `aria-pressed`. | From code |
| Live updates | The toast container is `role="status"` (polite). Errors use `role="alert"`. The rider app announces "New delivery request. Cash to collect…" with an `aria-live` region. | From code |
| Forms | On error, set `aria-invalid="true"` and move focus to the first wrong field. | From code |
| Gestures | Slide-to-confirm also works with Enter / Space. Every drag has a keyboard or tap alternative. | From code |
| Motion | Reduced-motion switch (see 6.2) | From code |
| Skip content | Visually hidden helper class `.sr-only` / `.sr` for screen-reader-only text. | From code |
| Zoom | Text must stay readable at 200% zoom with no sideways scrolling. | Recommended |
| Language | Set `<html lang="en">`. For Urdu use `lang="ur" dir="rtl"`. | Recommended |

**Urdu and right-to-left (Recommended):** the panel already uses logical CSS properties (`inset-inline-end`, `margin-inline-start`, `border-inline-start`), which is the right base for RTL. The phone demos still use `left` / `right` in some places (customer toast and tracker line, rider switch and slider), so those need a pass. When you add Urdu, use a font that has Urdu letters (for example Noto Nastaliq Urdu or Noto Naskh Arabic). Inter does not include them. Set `dir="rtl"` so the layout mirrors (the order tracker then runs right to left, from first step to last), and keep phone numbers, order numbers and money left-to-right inside the text.

---

## 9. Content and voice

### 9.1 Voice

- **Simple English, short sentences.** Many of our readers do not use English every day.
- **Say what happened, then what to do.** "Couldn't cancel. Check your connection and try again."
- **Be honest about limits.** "Total (est.)", "Final price confirmed by the restaurant", "Demo map".
- **Use the person's words.** "Where is my food?" not "Order status inquiry".
- **No blame.** "That code doesn't match. Ask the customer to read it again."
- **Buttons say what they do.** "Place order · Rs. 1,200", "Mark ready", "Settle cash".

### 9.2 Examples from the apps

| Situation | Text |
|---|---|
| Waiting for the restaurant | "Waiting for the restaurant to accept your order." |
| Cooking | "Your food is being cooked." |
| Delivery code | "Show this code to the rider at delivery. Don't share it with anyone else." |
| Cash on delivery | "Cash on delivery" · "Pay Rs. 1,200 to the rider" |
| Offline (customer) | "You’re offline — showing your last orders" |
| Offline (rider) | "You're offline. Showing your last data." |
| Reject (panel) | "Reject order #1043? The customer will see the reason. They haven't been charged, payment is cash on delivery." |
| Customer cancels (sheet) | "Cancel this order?" · "The restaurant will be told right away." |
| After cancelling | "Order cancelled" · "You haven’t been charged — payment is cash on delivery." |
| Wrong code (rider) | "That code doesn't match. Ask the customer to read it again." |
| Empty feed | "No new orders yet." |

### 9.3 Formats

| Item | Format |
|---|---|
| Money | `Rs. 1,200` |
| Order number | Demos: `FD-1042` (customer, rider; the rider's request sheet shows `#FD-1042`) and `#1043` (panel, number only). **Recommended:** one format, `FD-1042`, everywhere |
| Phone | `0301 2223344` (the rider demo's sample login) |
| Time | `3:10 pm` (lower-case am/pm), `Just now` |
| Date range | `8–14 Oct` (rider earnings) |
| Distance | `1.2 km` |
| Sample city | Lahore (Gulberg, Iqbal Town…) in demos only |

---

## 10. The presentation deck design system

This part describes `FastFood-Presentation-v2.html`, the 14-slide deck for restaurant owners. Use it when you change the deck or build another one.

### 10.1 What it is

One self-contained HTML file (about 1.5 MB). Everything is inside it: styles, scripts, the Inter font (Latin subset, 4 weights), 17 screenshots (WebP), and the three working demo apps (as Base64 text, opened in `iframe srcdoc`). It works offline. The only thing that needs internet is the Inter font link that is inside the admin demo itself (it falls back to a system font).

### 10.2 Deck tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0C0A09` | Page. Over it, two soft orange glows (radial gradients) |
| `--card` | `#1C1917` | Cards |
| `--card2` | `#292524` | Raised parts, inactive number circles |
| `--bd` | `#44403C` | Borders |
| `--tx` | `#FAFAF9` | Text |
| `--mu` | `#D6D3D1` | Body text (13.26 : 1) |
| `--sub` | `#A8A29E` | Notes (7.83 : 1) |
| `--ac` | `#F97316` | Main orange |
| `--ac2` | `#FB923C` | Lighter orange (borders, highlights) |
| `--ac3` | `#FDBA74` | Orange text on dark (tags, editable text) |
| `--ok` | `#4ADE80` | Check marks, good |
| `--bad` | `#F87171` | Crossed-out problems |
| `--warn` | `#FBBF24` | Warnings |
| `--h` | `clamp(300px, 64vh, 740px)` | The **height of a phone** in the deck. Almost everything else is sized from it (see 10.4) |

On the deck, text on an orange button or CTA is `#1C1917` (6.24 : 1), the same rule as the dark theme in the apps.

### 10.3 Deck type scale

| Style | Size | Weight | Notes |
|---|---|---|---|
| Body | 17 / 26 | 400 | |
| H1 | `clamp(34px, 5.4vw, 84px)`, line 1.04 | 800 | letter-spacing −.025em; slides 1 and 14 only |
| H2 | `clamp(27px, 3.9vw, 58px)`, line 1.1 | 800 | letter-spacing −.015em. At height ≤ 740px: `clamp(26px, 3.4vw, 44px)` |
| H3 | `clamp(18px, 1.6vw, 22px)` | 700 | |
| Lead | `clamp(16px, 1.6vw, 24px)`, line 1.5, max width 640px | 400 | Gray `--mu` |
| Tag | 12 / 18, uppercase, +.08em, in an orange-tint pill | 700 | The small label above every H2 |
| List text | `clamp(15px, 1.4vw, 20.5px)` | 400 | Check-mark lists |
| Note | 13 / 19 | 400 | With a small "i" icon; says "Real screens from the demo app…" |

**Highlight words in headings:** wrap one phrase in `<span class="gr">`. It is an orange-to-yellow gradient that slowly shines (5s loop).

### 10.4 Deck layout system

**Slide shell**
- Each slide is `<section class="s">`. All slides are stacked with `position:absolute`. Only the one with class `on` is visible.
- Slide area: the whole window except a **56px** bottom bar (`inset: 0 0 56px`).
- Padding: `clamp(12px, 2.6vh, 40px)` top and bottom, `clamp(18px, 5vw, 88px)` left and right.
- Inside, one `<div class="w">`: width 100%, **max 1480px**, centered with `margin-block:auto`.
  **Why `margin-block:auto` and not `justify-content:center`:** with `justify-content:center`, a slide that is taller than the screen gets its top cut off and cannot be scrolled to. With `margin-block:auto` it centers when there is space and scrolls correctly when there is not.
- A slide that is too tall scrolls (`overflow:auto`). No horizontal scroll (`overflow-x:hidden`).

**Column layouts** (`.two` is a grid with `gap: clamp(20px, 4vw, 64px)`, items vertically centered)

| Class | Columns | Used on |
|---|---|---|
| `.two` | 1fr 1fr | Slides 2, 5, 6 |
| `.two.t1` | 1fr 1.12fr | Slide 1 (title) |
| `.two.wide2` | 1fr 1.15fr | Slide 4 (steps + stage) |
| `.two.wide` | `minmax(0, (--h − 30px) × 1.6)` and `1fr` | Slides 7, 8 (browser screenshot + text). The first column is exactly as wide as the browser frame needs, so no space is wasted |
| ≤ 900px | all become **one column** | |
| 901–1100px | `.wide` becomes 1.3fr / 1fr and the frame fills its column | |

**The `--h` sizing system**
- `--h` is the height of one phone. A browser frame is sized so that its height is about the same: width = `(--h − 30px) × 1.6` (30px is the title bar; 1.6 is the screenshot ratio).
- Default `--h`: `clamp(300px, 64vh, 740px)`. On ≤ 900px: `clamp(260px, 44vh, 430px)`.
- Slide overrides, because those slides hold more content: slide 7 `min(58vh, 700px)`, slide 8 `min(52vh, 660px)`, slide 9 (rider) `min(44vh, 520px)`. The fan of phones on slide 5 has its own `--fh` (`min(300px, 36vh)` on phone).
- Result: the deck needs **no overflow** at 1366 × 768, 1536 × 864, 1920 × 1080 and 1024 × 768 (I checked). At 1280 × 720 slides 3 only scrolls by 3px.

### 10.5 Frames and highlights

**Phone frame `.dev`**
- Ratio `aspect-ratio: 390 / 820`, height `var(--h)`.
- Outer radius `16% / 7.6%` (percent of width / percent of height, so the corners stay round at any size).
- Bezel: a dark gradient `145deg #2f2a27 → #0a0908`, 1px outline `#57534E`, a deep shadow and a very soft orange glow.
- The screenshot is placed **inside with `position:absolute; left:2.2%; top:2.2%; width:95.6%; height:95.6%`**, inner radius `13% / 6.2%`.
  **Lesson:** do not use `padding: 2.4%` for the bezel. CSS percentage padding is calculated from the **parent's width**, not the element's own width. In a wide parent it made the bezel huge and cropped the screenshot. Using absolute positioning makes the percentages relative to the phone itself.

**Browser frame `.br`**
- Radius 14px, a 30px title bar (three dots red/amber/green, and a small pill with the page name, such as "Restaurant panel"), the screenshot below.
- The pill shows the **name of the screen, never a fake web address.** A fake address would look like a real site.

**Viewport `.vp`**
- A box with `aspect-ratio: 1.6` that holds several screenshots stacked (`.lay`) and cross-fades between them (opacity 0.5s). Used on slide 8.
- Tall screenshots (the analytics page, ratio 1.153) are shown **whole**, centered, with dark side bars that match the screenshot's own background, so nothing is cut.

**Highlight boxes `.hl`**
- An orange 2px outline with a soft fill and a 23px numbered circle at the top-left corner.
- Positions are saved in **percent of the screenshot** (`left`, `top`, `width`, `height`), so they stay on the right button at any size. I measured them from the real page with Playwright (`getBoundingClientRect` divided by the viewport size) and added a small padding.
- When a slide cycles, the active box is full and pulses (`ring`, 1.7s); the others are dimmed to 40%.

### 10.6 Slide by slide

| # | Slide | Layout | Main animation |
|---|---|---|---|
| 1 | Welcome | `.two.t1`; the right side is a composition of a tilted browser frame (perspective 1500px, −9° / 3°) with two overlapping phones | Items reveal in order; phones float (`bob`); a "New order #1043" notification pops in and out every 8s; food emoji float |
| 2 | An example evening | `.two`; text on the left; six message cards on the right at hand-placed positions and small angles | Cards drop in one after another (0.6s apart) with a little overshoot; the phone icon shakes |
| 3 | Problems solved | A 2-column comparison; 7 rows: red "problem" box → orange arrow → green "solution" box with a small tag of the app | Each problem is **struck out** by a line that draws itself; then its solution slides in from the right |
| 4 | How it works | `.two.wide2`; a 5-step list and a stage that cross-fades between 5 real screens | **Cycle** (5 steps, 4.8s each) with a progress bar in the active step |
| 5 | Customer app | `.two`; a fan of 3 phones (side phones 86% height, rotated ∓6°, overlapping by 13%) | Phones zoom in one by one, then float at different speeds |
| 6 | Live tracking | `.two`; a 3-step list and one phone that changes screen | **Cycle** (3 steps, 4.2s) |
| 7 | Restaurant panel | `.two.wide`; a browser frame with 4 numbered highlight boxes, and a 4-item list | **Cycle** (4 items, 3.6s) lights one item and its box |
| 8 | Run the business | `.two.wide`; tab buttons, a browser frame with 4 screens, a text box | **Cycle** (4 tabs, 6.2s) cross-fades the screen and the text; tabs are clickable |
| 9 | Rider app | A row of 4 phones with numbered circles joined by a dashed line | Phones zoom in in order, then float one after another |
| 10 | Try it yourself | Full area; tab buttons and an `iframe` | The three demo apps are linked (see 10.9) |
| 11 | Benefits | 3 × 2 card grid (2 columns ≤ 1000px, 1 column ≤ 620px) | Cards zoom in in order; a card lifts 4px on hover |
| 12 | The honest part | Two boxes: green "what you can count on", amber "what to keep in mind" | Left box slides in from the left, right box from the right |
| 13 | How we start | 4 circles on a line | The line fills (3.2s) and each circle lights up in turn |
| 14 | Thank you | Centered; editable contact in an orange button | Pulsing button, floating emoji |

### 10.7 Deck animation system

#### Slide change
- The old slide fades out (opacity .45s) while the new one fades in and grows from `scale(.97)` to 1 (.55s, `cubic-bezier(.2,.7,.2,1)`).
- Slides that are not visible have their animations **paused** (`.s:not(.on) * { animation-play-state: paused !important }`), so they use no power.

#### Reveal (the main effect)
- Add class `rv` to any element, and `style="--i:N"` for its order.
- Time: **.8s**, easing `cubic-bezier(.2,.7,.2,1)`, delay = `i × 0.12s + 0.12s`.
- Direction variants: default = up 28px; `rl` = from the left 46px; `rr` = from the right 46px; `zin` = up 18px and from 88% size.
- The keyframe uses CSS variables, so one animation covers all variants:
  ```css
  @keyframes up { from { opacity:0; transform: translate(var(--dx,0), var(--dy,28px)) scale(var(--sc,1)) } to { opacity:1; transform:none } }
  ```

#### Other effects

| Name | What | Time |
|---|---|---|
| `bob` | Float up and down 12px (uses `translate`) | 6–6.5s, repeats, each phone has a different delay |
| `flt` | Emoji floats 26px and rotates | 6s, repeats |
| `pls` | A ring expands from the logo and the CTA button | 2s, repeats |
| `shn` | Gradient text shine | 5s, repeats |
| `ring` | Pulse on the active highlight box | 1.7s, repeats |
| `strike` | A red line draws across the problem text | .8s, after 1s + .12s per row |
| `drop` | Message card falls in with overshoot (`cubic-bezier(.2,.9,.3,1.2)`) | .7s, .6s between cards |
| `shake` | The phone icon rocks ±14° | 1.1s, repeats |
| `pop` | The "New order" notification appears and leaves | 8s loop |
| `fill` | A progress bar grows from 0 to 100% | = the slide's `--ms` |
| `fillp`, `lit` | Slide 13 line and circles | 3.2s; .8s between circles |
| Cross-fade | Stage layers change opacity (and scale .95 → 1 for phones) | .5–.6s |

#### The cycle engine (slides 4, 6, 7, 8)
- Put `data-cy="COUNT,MS"` on the `<section>`, for example `data-cy="5,4800"`, and `style="--ms:4.8s"` so the progress bar matches.
- Mark parts with `data-k="0"`, `data-k="1"`, … (steps, screens, text, highlight boxes). A small script gives class `on` to everything with the current number and removes it from the rest. The timer starts when the slide opens and stops when it closes.
- Add `data-pick` to anything the viewer can click (a step, a tab, a list item). A click jumps to that number and restarts the timer.
- To add a cycling slide: create the section, add `data-cy`, add `data-k` parts, style `.on`. No new JavaScript is needed.

#### Rules we followed
1. **Never put two animations on one element's `transform`.** A reveal and a float on the same element fight, and one wins. Put the reveal on the wrapper and the float on the child, or use the individual properties `translate`, `rotate` and `scale` for the float (these do not clash with `transform`). Individual transform properties work in current Chrome and Edge (104+), Safari (14.1+) and Firefox (72+).
2. Hover lift also uses `translate`, because a finished animation with `fill-mode: both` keeps its last `transform`, and that would block a `transform` hover.
3. Mostly animate `transform` and `opacity`. The exceptions (pulse `box-shadow`, progress `width`) are small.
4. `prefers-reduced-motion: reduce` turns everything to almost zero time (`.01ms`) and one run.
5. Do not animate numbers to look like results. The deck never counts up fake statistics.

### 10.8 Deck controls

| Input | Action |
|---|---|
| → · Page Down · Space · Enter | Next slide |
| ← · Page Up | Previous slide |
| Home / End | First / last slide |
| F | Full screen |
| D | Open the live demo |
| Swipe left / right | Next / previous (not on the demo slide, not on the rider phone row) |
| Dots at the bottom | Jump to a slide (hover shows the name; hidden ≤ 560px) |
| Top bar | Progress |
| Editable text | Click "Your Restaurant" on slide 1 and the contact on slide 14 and type. Keys do not change slides while you type. |

### 10.9 How the live demo works

1. The three demo files are saved inside the deck as Base64 and opened in three `iframe` elements.
2. A timer (every 700ms) reads the customer app's orders. When a **new** order appears, the deck creates the same order in the restaurant panel (`mk(...)`, `chime()`, a toast) and shows a note "Order FD-1043 just reached the restaurant" with a button to jump there.
3. When the cook moves the order forward in the panel, the deck copies the new status to the customer app, so the tracking screen updates.
4. When the order becomes **Ready**, the deck presses the rider demo's "Send a delivery request" button, and a job appears in the rider app.
5. The rider demo is **signed in and online automatically** when the deck loads (phone `0301 2223344`, a sample password). The rider demo sends itself a sample request about 5 seconds after going online; the deck dismisses it, so the real job is the one for your order.
6. The slide says in a note: "The three demos are separate sample apps. This presentation links them…". This is true and honest: in the demo files the apps are not connected; the deck connects them.

### 10.10 How the screenshots were made (to repeat them)

I used Playwright (Chromium) on copies of the demo files.

| App | Viewport | Scale | What I captured |
|---|---|---|---|
| Customer | **520 × 900** | 2× | The `.phone` element only |
| Rider | **700 × 900** | 2× | The `.phone` element only |
| Panel | **1280 × 800** (analytics: 1280 × 1110) | 1.75× | The whole viewport |

Lessons (these will save you time):
1. **Pick a viewport wider than the app's breakpoint.** The customer app goes full width at ≤ 480px and the rider at ≤ 560px. My first captures at 430px were 430px wide instead of 390px, and the phone frame cropped them. At 520 and 700px the phone is exactly 390px (780px image at 2×).
2. **Remove demo scaffolding before capture** with injected CSS: hide the demo toolbar, the fake status bar and the side panel; set `.phone` radius to 0, remove its border and shadow; force the height to 820px.
3. **Drive the app through its own functions** (`A.next()`, `A.nav('stats')`, `openD()`), not only clicks, so you can reach every state (placed, preparing, on the way, delivered) quickly. Wait for animations (about 400–500ms) before each shot, and clear the toast first.
4. **Wait for live data.** The panel adds a new order after 9 seconds, so wait 10 seconds if you want a "New" order in the shot.
5. **Measure highlight boxes in the same session** as the screenshot and store them in percent.
6. **Compress:** phones resized to 1400px high, panel to 1700px wide, WebP quality 82–84. All 17 images together are about 1 MB.
7. **Avoid screens that show demo-only text.** The rider login shows "Demo: any phone or email…" and the customer profile shows a developer note. I did not use them.

### 10.11 How to edit the deck

| I want to… | Do this |
|---|---|
| Change the restaurant name or contact | Click the dotted text on slide 1 or 14 and type. (It is not saved when you close the file. Type it again, or edit the text in the HTML.) |
| Change a slide's words | Open the HTML in a text editor and search for the words. They are plain HTML. |
| Replace a screenshot | Screenshots are inside the script as `IMG = { "c-menu": "data:image/webp;base64,…", … }`. Replace the value with a new WebP data URL of the **same aspect ratio** (390 × 820 for phones, 1.6 for panel pages). |
| Move a highlight box | Edit `left`, `top`, `width`, `height` in percent on the `<i class="hl" style="…">`. |
| Change the time of a cycle | Edit `data-cy="5,4800"` and `--ms:4.8s` together. |
| Add a slide | Copy a `<section class="s" data-n="Name">` block, keep the `.w` wrapper, give each animated item `class="rv"` and `style="--i:N"`. Slide numbers and dots update by themselves. |
| Remove a slide | Delete its `<section>`. |

The build template and build script I used are not in the file you have. If you want to rebuild the deck from sources, ask me and I will package them.

### 10.12 Rules for honest sales copy

These are the rules I used to write the deck. Keep them.

1. **Every claim must be visible in a screen.** If the product cannot do it in the demo, we do not say it.
2. **No invented numbers.** No "30% more sales", no counters. Say *how* it helps ("fewer wrong orders because the customer types the order"), not *how much*.
3. **Label what is a demo.** Sample data, illustrative maps, placeholder food icons. Say it on the slide.
4. **Say what it does not do.** Cash only, it does not bring customers, it does not supply riders, it needs internet.
5. **Do not promise price or timing.** Say they are agreed separately.
6. **Use the owner's problems first** (missed calls, wrong orders, "where is my food?") and the product second.
7. **No fake logos, reviews, or names of real restaurants.**

---

## 11. Using this in the real project

### 11.1 The three demos use different token names

The look is the same, but the CSS names are not. When you build the real apps, pick **one** naming. **Recommended:** the rider demo's names, because it is the most complete.

| Meaning | Customer demo | Rider demo (use this) | Panel demo |
|---|---|---|---|
| Page background | `--bg-page` | `--bg-page` | `--bg` |
| Card background | `--bg-surface` | `--bg-surface` | `--surface` |
| Raised surface | `--bg-raised` | `--bg-raised` | `--raised` |
| Sunken surface | `--bg-sunken` | `--bg-sunken` | `--sunken` |
| Main text | `--text` | `--text` | `--text` |
| Muted text | `--text-muted` | `--text-muted` | `--muted` |
| Subtle text | `--text-subtle` | `--text-subtle` | `--subtle` |
| Border | `--border` | `--border` | `--border` |
| Strong border | `--border-strong` | `--border-strong` | `--strong` |
| Primary action | `--action-bg` | `--action-bg` | `--action` |
| Text on action | `--action-fg` | `--action-fg` | `--action-fg` |
| Radius medium | `--r-md` | `--radius-md` | (written as `12px`) |
| Motion easing | `--ease` | `--ease-standard` | `--ease` |
| Success / danger | `--success` / `--danger` | `--success` / `--danger` | `--ok` / `--bad` |

### 11.2 Copy-paste token file (Recommended)

Based on the rider demo (the most complete), plus layer tokens from section 3.3.

```css
:root {
  --font: 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* space (4px grid) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* shape */
  --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-pill: 999px;

  /* motion */
  --dur-press: 100ms; --dur-fast: 160ms; --dur-base: 240ms; --dur-slow: 400ms;
  --ease-standard: cubic-bezier(.2, 0, 0, 1);
  --ease-enter:    cubic-bezier(0, 0, 0, 1);
  --ease-exit:     cubic-bezier(.3, 0, 1, 1);

  /* layers (recommended) */
  --z-sticky: 20; --z-scrim: 30; --z-drawer: 36; --z-sheet: 40; --z-toast: 50; --z-overlay: 60;

  /* palette */
  --ember-50: #FFF7ED; --ember-100: #FFEDD5; --ember-200: #FED7AA; --ember-400: #FB923C;
  --flame: #F97316; --ember-700: #C2410C; --ember-800: #9A3412; --ember-900: #7C2D12;
  --stone-0: #FFFFFF; --stone-50: #FAFAF9; --stone-100: #F5F5F4; --stone-200: #E7E5E4; --stone-300: #D6D3D1;
  --stone-400: #A8A29E; --stone-500: #78716C; --stone-600: #57534E; --stone-700: #44403C;
  --stone-800: #292524; --stone-900: #1C1917; --stone-950: #0C0A09;

  /* semantic: light */
  color-scheme: light;
  --bg-page: var(--stone-50);  --bg-surface: var(--stone-0);  --bg-raised: var(--stone-0);  --bg-sunken: var(--stone-100);
  --bg-overlay: rgb(12 10 9 / .5);
  --text: var(--stone-900);  --text-muted: var(--stone-600);  --text-subtle: var(--stone-500);
  --border: var(--stone-200);  --border-strong: var(--stone-500);
  --action-bg: var(--ember-700);  --action-bg-hover: var(--ember-800);  --action-fg: #FFFFFF;
  --link: var(--ember-700);  --focus: #1D4ED8;
  --success: #15803D;  --success-bg: #F0FDF4;
  --warning: #B45309;  --warning-bg: #FFFBEB;
  --danger: #B91C1C;   --danger-bg: #FEF2F2;  --danger-solid: #B91C1C;  --on-danger-solid: #FFFFFF;
  --info: #1D4ED8;     --info-bg: #EFF6FF;
  --tint-bg: var(--ember-100);  --tint-fg: var(--ember-800);
  --toast-bg: var(--stone-900); --toast-fg: #FFFFFF;
  --shadow-1: 0 1px 2px rgb(28 25 23 / .06), 0 1px 1px rgb(28 25 23 / .04);
  --shadow-2: 0 4px 12px rgb(28 25 23 / .08);
  --shadow-3: 0 12px 32px rgb(28 25 23 / .16);

  /* status tones: light */
  --tone-blue-fg:   #1D4ED8; --tone-blue-bg:   #EFF6FF;
  --tone-indigo-fg: #4338CA; --tone-indigo-bg: #EEF2FF;
  --tone-amber-fg:  #92400E; --tone-amber-bg:  #FEF3C7;
  --tone-teal-fg:   #0F766E; --tone-teal-bg:   #F0FDFA;
  --tone-purple-fg: #7E22CE; --tone-purple-bg: #FAF5FF;
  --tone-orange-fg: #9A3412; --tone-orange-bg: #FFEDD5;
  --tone-green-fg:  #15803D; --tone-green-bg:  #F0FDF4;
  --tone-stone-fg:  #44403C; --tone-stone-bg:  #F5F5F4;
  --tone-red-fg:    #B91C1C; --tone-red-bg:    #FEF2F2;
  --tone-rose-fg:   #9F1239; --tone-rose-bg:   #FFF1F2;
}

[data-theme='dark'] {
  color-scheme: dark;
  --bg-page: var(--stone-950); --bg-surface: var(--stone-900); --bg-raised: var(--stone-800); --bg-sunken: #141210;
  --bg-overlay: rgb(0 0 0 / .6);
  --text: var(--stone-50);  --text-muted: var(--stone-300);  --text-subtle: var(--stone-400);
  --border: var(--stone-700);  --border-strong: var(--stone-500);
  --action-bg: var(--flame);  --action-bg-hover: var(--ember-400);  --action-fg: var(--stone-900);
  --link: var(--ember-400);  --focus: #93C5FD;
  --success: #4ADE80;  --success-bg: rgb(34 197 94 / .16);
  --warning: #FBBF24;  --warning-bg: rgb(245 158 11 / .16);
  --danger: #F87171;   --danger-bg: rgb(239 68 68 / .16);  --danger-solid: #F87171;  --on-danger-solid: #1C1917;
  --info: #60A5FA;     --info-bg: rgb(59 130 246 / .16);
  --tint-bg: rgb(249 115 22 / .16);  --tint-fg: var(--ember-400);
  --toast-bg: var(--stone-100); --toast-fg: var(--stone-900);
  --shadow-1: none; --shadow-2: none; --shadow-3: 0 12px 32px rgb(0 0 0 / .5);

  --tone-blue-fg:   #93C5FD; --tone-blue-bg:   rgb(59 130 246 / .16);
  --tone-indigo-fg: #A5B4FC; --tone-indigo-bg: rgb(99 102 241 / .16);
  --tone-amber-fg:  #FCD34D; --tone-amber-bg:  rgb(245 158 11 / .16);
  --tone-teal-fg:   #5EEAD4; --tone-teal-bg:   rgb(20 184 166 / .16);
  --tone-purple-fg: #D8B4FE; --tone-purple-bg: rgb(168 85 247 / .16);
  --tone-orange-fg: #FDBA74; --tone-orange-bg: rgb(249 115 22 / .16);
  --tone-green-fg:  #86EFAC; --tone-green-bg:  rgb(34 197 94 / .16);
  --tone-stone-fg:  #D6D3D1; --tone-stone-bg:  rgb(168 162 158 / .16);
  --tone-red-fg:    #FCA5A5; --tone-red-bg:    rgb(239 68 68 / .16);
  --tone-rose-fg:   #FDA4AF; --tone-rose-bg:   rgb(244 63 94 / .16);
}

/* base */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; min-height: 100dvh; font: 400 15px/22px var(--font); color: var(--text); background: var(--bg-sunken);
       font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Status badge pattern (works with the tones above):

```css
.status-badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px;
  border-radius: var(--radius-pill); font: 600 12px/1 var(--font); white-space: nowrap;
  background: var(--tone-bg); color: var(--tone-fg); }
.status-badge[data-tone='blue']   { --tone-bg: var(--tone-blue-bg);   --tone-fg: var(--tone-blue-fg); }
.status-badge[data-tone='amber']  { --tone-bg: var(--tone-amber-bg);  --tone-fg: var(--tone-amber-fg); }
/* …same for indigo, teal, purple, orange, green, stone, red, rose */
```

### 11.3 Build order (Recommended)

1. Put the token file in one shared place that all three apps import.
2. Self-host Inter (variable WOFF2, Latin subset, `font-display: swap`). Do not depend on Google Fonts.
3. Build the shared parts first: Button, Input, Card, Badge, Sheet, Toast, Banner, Skeleton.
4. Build the status vocabulary once (code → label, tone, icon) and use it in all three apps.
5. Build the phone apps at **390px** and then check 320px and 430px.
6. Build the panel at **1366px** and then check 1280px, 1920px, 1024px and 390px.
7. Add dark theme at the same time as light, not later.
8. Add the reduced-motion rule on day one.

### 11.4 Things I found in the demos that you should fix or remove for production

| # | Finding | What to do |
|---|---|---|
| 1 | Token names differ in the three demos (see 11.1). | Use one naming (rider's). |
| 2 | Default theme differs: panel is dark, customer is light, rider follows the phone. | Make System the default everywhere. |
| 3 | The panel loads Inter from Google Fonts; the other two do not load a font at all, so a phone without Inter uses a system font and the layout changes a little. | Self-host Inter in all apps. |
| 4 | The customer **Profile** screen shows a developer note: "Saved addresses, settings and help are hidden until they are built, as the design system advises." | Remove the note, or build those items. |
| 5 | The rider **login** screen shows demo help text ("Demo: any phone or email with an 8+ character password works…"). | Remove for production. |
| 6 | Phone frames, the demo toolbar, the fake status bar, the rider side panel and the panel's "Preview mobile view" are scaffolding. The customer app uses `height: calc(100dvh - 64px)` to make room for its demo toolbar. | Remove; the app should use the full `100dvh`. |
| 7 | Maps are an illustration (SVG) marked "Demo map". | Add a real map and keep the pin colors. |
| 8 | Food images are emoji. | Use real 4:3 photos, with alt text and skeletons. |
| 9 | Panel buttons and search are 40px high. | Use 44px on touch screens (`pointer: coarse`). |
| 10 | The panel uses `100vh` for the sidebar and page height. | Switch to `100dvh` (tablets with browser toolbars). |
| 11 | The customer demo's status map has no `REJECTED` or `DELIVERY_FAILED` entry (the panel has them). | Copy the panel's labels and red / rose tones into the shared status list (see 3.1). |
| 12 | There is no tablet design for the customer and rider apps. | Add the centered 480px column rule (see 5.5). |
| 13 | The demos only support English and left-to-right. | If you plan Urdu, add RTL and an Urdu font early (see section 8). |
| 14 | In the panel, the rule that lifts toasts above the bottom nav is inside the `max-width: 380px` block. On phones 381–767px wide the toast sits over the nav bar (`z-index` 50 against 25). | Move that rule to the `max-width: 767px` block. |
| 15 | The customer demo hard-codes some colors instead of tokens: toast `#292524`, avatar `#DDD6FE`, map pins `#1D4ED8` / `#9A3412` / `#7E22CE`, "Sold out" tag `#1C1917`. | Turn them into tokens so they follow the theme. |
| 16 | Order numbers are written three ways (`FD-1042`, `#FD-1042`, `#1043`). | Use one format everywhere (see 9.3). |

### 11.5 Release checklist

**Visual**
- [ ] Light and dark both checked on every screen
- [ ] Only semantic tokens used (search the code for raw `#` colors)
- [ ] One primary button per screen
- [ ] Statuses use the shared vocabulary, with icon, text and color

**Responsive**
- [ ] All sizes in 5.7 checked, no sideways scrolling
- [ ] Bottom bars respect the safe area
- [ ] Inputs are 16px; no zoom on iPhone
- [ ] Tables become cards on phone; the board snaps sideways
- [ ] Long names and big numbers do not break layouts

**Motion**
- [ ] Reduced-motion mode turns everything off
- [ ] No animation blocks a button
- [ ] Sound and vibration can be turned off

**Accessibility**
- [ ] Keyboard only: everything reachable, focus ring always visible
- [ ] Screen reader: labels on icon buttons, toasts announced
- [ ] Contrast: 4.5 : 1 for text, 3 : 1 for UI parts, both themes

**Content**
- [ ] No demo text left ("Demo map", developer notes, helper text)
- [ ] Money, time and phone formats follow section 9.3
- [ ] Errors say what happened and what to do next

---

## 12. Quick reference

| Thing | Value |
|---|---|
| Brand orange | `#F97316` (flame). Light-theme button `#C2410C` |
| Page (light / dark) | `#FAFAF9` / `#0C0A09` |
| Text (light / dark) | `#1C1917` / `#FAFAF9` |
| Font | Inter, tabular numbers |
| Body size | 15 / 22 (apps), 14 / 20 (panel), 17 / 26 (deck) |
| Spacing step | 4px; screen padding 16px |
| Minimum touch target | 44px |
| Main buttons | 44px (normal), 52–56px (large) |
| Input height / text | 48px / 16px |
| Radius | 8 · 12 · 16 · 24 · pill |
| Phone design width | 390px (fluid 320–480) |
| Panel sidebar | 248px → 72px rail → bottom nav (≥1280 / 768–1279 / ≤767) |
| Panel content max width | 1440px |
| Motion times | 100 · 160 · 240 · 400ms |
| Main easing | `cubic-bezier(.2, 0, 0, 1)` |
| Focus ring | 2px `--focus`, offset 2px |
| Deck slide area | window minus 56px bar; content max 1480px |
| Deck phone height | `--h` = `clamp(300px, 64vh, 740px)` |
| Deck reveal | .8s, delay `i × .12s + .12s` |
| Deck cycle | `data-cy="count,ms"`, parts use `data-k` |

---

*This guide was written from the code in `customer-demo.html`, `Rider-Demo.html`, `Restaurant-Admin-Demo.html` and `FastFood-Presentation-v2.html`. The contrast ratios were calculated from the hex values. Anything marked **Recommended** is advice and has not been built or tested in your demos. I tested the deck in Chromium only, at several laptop, big-screen and phone sizes. I did not test it on Safari, iPhone or Android devices.*
