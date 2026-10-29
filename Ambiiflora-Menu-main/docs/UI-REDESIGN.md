# Tranquila Hotels and Suites: Menu UI Redesign

**Document type:** Design and engineering handover
**Scope:** Visual redesign of the guest ordering app (home, category navigation, dish and drink cards, detail sheets, cart access, welcome screen) and a new menu catalogue built from `FOOD_AND_DRINKS_MENU_with_VAT.PDF`
**Architecture:** Unchanged (Next.js App Router, one client `MenuApp`, bottom-sheet item and cart flows, WhatsApp order hand-off, Supabase CMS)

---

## 1. Summary of the brief and how it was met

| Request | What was done | Where |
|---|---|---|
| New UI based on the reference app screens | Ivory ground, white surfaces, deep green and brushed gold, rounded cards, hero banner, round icon category rail | `globals.css`, `MenuApp.tsx`, `Card.tsx` |
| **No navy bar underneath** | The floating bottom order bar (`Dock`) is removed entirely. The cart now lives in the sticky top toolbar as a round button with a count badge. The item sheet footer is flat and light, with no dark bar. | `Dock.tsx` deleted, `MenuApp.tsx`, `ItemSheet.tsx` |
| Same architecture | Same files, same data model, same sheet flow, same cart store, same order API and WhatsApp message builder | see section 4 |
| Icons for categories, like the reference | Ten stroke icons in round tiles; active tile fills deep green with a gold icon | `icons.tsx` (`CatIcon`), `MenuApp.tsx` |
| Wine images in the wine section | The supplied J. Bouchon bottle is cut out to a transparent PNG and used on every wine card and wine detail page | `public/images/bouchon.png`, `Media.tsx` (`Bottle`) |
| Wine UI in the wine and drinks sections, including water and juice | Wine-list rows (bottle standing out of a white pill card) and a "Product details" page for all five drink categories: Wines, Spirits, Beers, Soft & Hot, Water & Juice | `Card.tsx`, `ItemSheet.tsx` |
| Same in the detail pages | Drink detail page: top bar with title, bottle panel on the left, name, description and **Details** list on the right, price at the bottom left with a black **Add to cart** button | `ItemSheet.tsx` |
| Same flow, better UI | Browse, tap, choose options, add, review cart, send via WhatsApp. No step added or removed. | unchanged logic |
| Menu content | 87 items built from the PDF (278 raw rows consolidated, duplicates merged) | `src/lib/catalog.ts` |
| Brand | Tranquila logo supplied; mark and full logo cut to transparent PNGs | `public/images/` |

---

## 2. Design system

### 2.1 Colour tokens (`:root` in `globals.css`)

| Token | Value | Use |
|---|---|---|
| `--mist` | `#F3F1E8` | Page ground (warm ivory) |
| `--paper` | `#FFFFFF` | Cards, sheets, search field |
| `--forest` | `#0E3A29` | Primary: cart button, active category, CTA, hero banner, cart sheet |
| `--forest-2` | `#154B36` | Hover state for primary |
| `--accent` | `#B8913B` | Brushed gold taken from the logo: badges, labels, secondary CTA |
| `--accent-hi` | `#C9A44F` | Gold on dark surfaces |
| `--sage` / `--sage-2` | `#D7DDCB` / `#ECEFE3` | Quiet fills: chips, steppers, image placeholders |
| `--ok` | `#2F7A55` | Drink prices (matches the reference's green price) and "open" status |
| `--ink` | `#0A0A0A` | Text and the black **Add to cart** button on drinks |

Gold is only used for small, meaningful moments (badge, "Calm, served well", detail labels), never as a large fill. Deep green carries the weight.

### 2.2 Typography

- **Display:** Bodoni Moda Variable (kept from the original build; no new font dependency, so no install or licensing change). Used for the brand name, section titles, dish names in drink rows, detail titles.
- **UI and body:** Figtree Variable (kept). Used for prices, labels, buttons, food card names.
- Scale: section title 30 to 40px (fluid), drink row title 21px, food card name 15.5px semi-bold, price 16 to 21px bold with tabular numerals so figures align.

### 2.3 Shape and elevation

- Radii: pill (search, buttons) 99px; drink rows 30px; food cards 24px; sheets 32px; hero banner 28px. Radii step down with the size of the object.
- Shadows are green-tinted (`rgba(14,58,41,.4 to .55)`) rather than grey, so depth feels part of the palette.

### 2.4 Iconography

Ten 24px stroke icons (1.7px stroke, rounded caps) in one family: breakfast (cup), soups (steaming bowl), rice and pasta (grain), mains and grills (cloche), light bites (sandwich), wines (glass), spirits (tumbler), beers (mug), soft and hot (cup with straw), water and juice (drop). They are keyed by category id in `CAT` inside `icons.tsx`. An unknown category (for example one created in the CMS) falls back to the cloche icon, so nothing breaks.

---

## 3. Screen-by-screen

### 3.1 Welcome
Centred full logo, one line of copy, open or closed status, and a green **View the menu** pill with a gold arrow. One entrance (logo settles in, rest follows) and one exit (panel slides up while the app rises). Reduced-motion users get a static screen. The previous lotus petal animation and SplitText word reveal were removed because the brand mark changed.

### 3.2 Home
1. **Header:** logo mark, "Tranquila", "Hotels and Suites" in gold, and the Open, Closed or Paused status pill.
2. **Sticky toolbar:** search field and the round green **cart button** with a gold count badge (springs in and out). Below it, the icon rail.
3. **Icon rail:** round tiles with labels beneath. Tapping scrolls to the section; scrolling updates the active tile (same IntersectionObserver logic as before) and the rail re-centres the active tile.
4. **Hero banner:** deep green card, "Good food. Fine wine. Quiet moments.", **Explore the menu** button, dish photo fading in from the right. Hidden while searching.
5. **Sections:** food categories use a two-column photo grid; drink categories use full-width wine rows.
6. **Footer:** logo and "Prices include VAT."

### 3.3 Food card
Square photo, name, one-line description (or up to three option chips when a dish has a short single choice), price bottom left, round green **+** bottom right. Dishes without a photo show a tinted category icon instead of a wrong photo.

### 3.4 Drink row (Wines, Spirits, Beers, Soft & Hot, Water & Juice)
White pill card; name in Bodoni, style and country beneath, green price (with "from" when options change the price). The bottle stands out of the card's top edge with a soft drop shadow, as in the reference. Wines use the supplied bottle photo. Other drink categories show a green-tinted icon medallion in the same slot, because only a wine bottle photo was supplied. Drop in more photos later (section 7).

### 3.5 Drink detail ("Product details")
Top bar with title and close button. Left: bottle on a soft radial panel. Right: name, description, **Details** list (Brand, Country, Style, shown only when known). Below: option choices (size, age, vintage, flavour), special request, allergen note. Footer: **Total** price on the left, compact quantity stepper, black **Add to cart** button. The same sheet drag, focus trap and Escape behaviour as before.

### 3.6 Food detail
Same gallery and option pills as before. Selected pills are now deep green. The footer is a flat light bar with a stepper and a green **Add to order** button showing the total in gold. No dark bar.

### 3.7 Cart
Opens from the toolbar cart button. It remains the dark green sheet (modal, not a persistent bar), with gold primary buttons. Cancel-order is available inside the sheet header, as it was before. The separate confirm-cancel popup that was only reachable from the old bar is no longer mounted from `MenuApp`; the component file is left in place and still imported nowhere else.

---

## 4. What did not change (architecture guarantees)

- `useCart` store, selection model, `pricing.ts` (`unitPrice`, `normalize`, `missingGroups`, `priceRange`)
- Option groups with `absolute` and `addon` modes and conditional `when` rules
- `/api/menu`, `/api/order`, admin routes, Supabase migration, WhatsApp message builder and server-side re-pricing
- `Sheet` (drag, lock, focus trap), `Toast`, hours logic
- CMS override: if Supabase is configured, the published menu is loaded after first paint exactly as before

Renamed for the new brand: the WhatsApp message header ("Tranquila Hotels and Suites"), order reference prefix (`TRQ-`), cart storage key (`tranquila.cart.v1`), welcome-skip key logic in `layout.tsx` kept as-is, page title and favicon, admin sidebar label.

---

## 5. Menu catalogue (from the PDF)

### 5.1 Prices and VAT
The PDF has three price columns: base, 7.5% VAT inclusive, 10% VAT inclusive.

- **Shelf price (what guests see, add to the cart and pay):** the **10% VAT-inclusive** column, computed as `Math.round(base × 1.10)`. These match the PDF exactly (for example 32,000 becomes 35,200). The 7.5% column is ignored for display.
- **Receipt (cart summary and the WhatsApp order message):** the 10% total is split into **Subtotal (excl. VAT)** and **7.5% VAT inclusive** using `net = round(total ÷ 1.075)` and `VAT = total − net`. The total never changes. Example: ₦11,000 shows as ₦10,233 + ₦767 VAT = ₦11,000.

```ts
// src/lib/catalog.ts
export const VAT_RATE = 0.1;           // shelf price
export const RECEIPT_VAT_RATE = 0.075; // receipt breakdown
// src/lib/pricing.ts -> vatBreakdown(total)
```

### 5.2 Categories

| Category | Items | Notes |
|---|---|---|
| Breakfast | 8 | English, Nigerian, Kids, eggs by style, cereal, porridge, pastries |
| Soups | 2 | Swallow & Soup (swallow + soup + optional protein, priced additively) and Pepper Soup |
| Rice & Pasta | 4 | Rice (12 styles), Spaghetti, Pasta, Indomie |
| Mains & Grills | 7 | Steak, burger, pizza, grilled fish, peppered dishes, chef's sauces, sides, buffets |
| Light Bites | 7 | Salads, club sandwich, vegetable sandwich, shawarma |
| Wines | 23 | One card per bottle, including champagne |
| Spirits | 22 | Whisky by age, cognac, vodka, liqueurs, cocktails |
| Beers | 5 | Lagers, stouts, others, Smirnoff Ice, Origin bitters (brand picked in the sheet) |
| Soft & Hot | 3 | Soft drinks, malt, tea and coffee |
| Water & Juice | 4 | Bottled water, fresh juice, smoothie, chapman |

### 5.3 Consolidation rules applied
- Duplicates in the PDF merged (for example "Chicken Club Sandwiched" appears twice; "Fresh Okra" and "Fresh Okro"; the three "Complimentary" rows).
- Non-menu operational rows excluded: conference halls, corkage, tray charge, take-away plate, extra cost, complimentary items.
- Near-identical rows became one item with a choice group, so guests choose instead of scrolling past 6 copies of a card.
- Obvious typos corrected in display names (for example "Veuve Clieqout" to Veuve Clicquot).

### 5.4 Things to check before launch
1. **Style, country and brand details on drinks** were added only where well known. Rows without a confident answer are blank and simply do not show. Please review them.
2. **A few PDF names are unclear** (for example "The Observatory", "B & G", "Chamdor", "Giacondi", "Eisberg"). They are listed under their general type with minimal details.
3. **Escudo Rojo** is treated as a wine; **Martinelli's Apple Cider** is a sparkling juice listed with the wines because it is on the wine shelf.
4. **Soups** include swallow prices as add-ons, which the PDF lists separately (for example pounded yam 2,000). Confirm that is how the kitchen charges.
5. No ratings, review counts or "bestseller" badges were added, since there is no real data behind them.

---

## 6. Assets

| File | Source | Treatment |
|---|---|---|
| `public/images/bouchon.png` | J. Bouchon bottle image | The upload had a checkerboard baked into the background. It was removed by flood-fill from the edges, softened, cropped and resized (520 × 900, transparent). |
| `public/images/logo.png` | Tranquila logo | Cropped, white removed to transparent, so it sits on the ivory ground |
| `public/images/mark.png` | Tranquila logo | Wave mark only, for the header and favicon |

Reference screenshots (the Taste Haven screen and the wine app mock-up) were used for layout, not copied into the app.

---

## 7. How to extend

- **More bottle photos:** place a transparent PNG in `public/images/`, then either set `imageUrl` on the item (CMS or catalog) or extend `bottleOf()` in `Media.tsx` to map categories or item ids to files. Drink cards and the detail page pick it up automatically.
- **New drink category:** add its id to `DRINK_CATEGORIES` in `catalog.ts` to get the wine-style UI, and add an icon path to `CAT` in `icons.tsx`.
- **Rating stars:** the reference shows stars. Add a `rating` field to `Item` only when you have real data, then render it in `Card.tsx` and `ItemSheet.tsx`.
- **Colours:** change the six tokens in `:root`; everything inherits.

---

## 8. Quality notes

- **Accessibility:** visible keyboard focus kept; cart button has a descriptive label with count and total; icon-only controls have labels; images have alt text or are decorative; reduced motion respected (welcome, reveals, hero).
- **Touch targets:** cart 50px, category tiles 56px, steppers 36 to 46px, primary buttons 46 to 66px.
- **Performance:** no new dependencies; one new CSS block appended; images lazy-loaded; the bottle PNG is about 170 KB and cached.
- **Responsive:** one column of drink rows on phones, two columns from 720px; food grid two to three columns as before.
- **Known limits:** the original data had no photos for most new dishes, so they show icon tiles. The CMS, if connected to a live Supabase project, will keep serving its stored published menu until it is reset to the built-in template (Admin, "Templates & reset") or re-published.

---

## 9. Run and verify

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pricing, hours and order tests (rewritten for the new catalogue)
```

This redesign was assembled without network access, so dependencies were not installed and the app was not built or opened in a browser here. The catalogue was validated (87 items, unique ids, valid categories, unique option ids) and the TypeScript was checked for logic errors; remaining compiler messages were only missing-package type noise. Please run the commands above and do a visual pass on a phone-width viewport. Likely tweaks, if any, are spacing values in the `Tranquila redesign` block at the end of `globals.css`.

---

## 10. First-release image policy (supersedes the placeholder notes in 3.3, 3.4 and 8)

- **Every drink** (Wines, Spirits, Beers, Soft & Hot, Water & Juice) uses the supplied J. Bouchon bottle image, on the list rows, the detail page and the cart thumbnail. Set in `bottleOf()` in `Media.tsx`.
- **Food photos are assigned by dish.** `src/lib/catalog.ts` lists only images that match the item; the photo keys resolve through `src/lib/photos.ts` to assets in `public/images/`. Menus loaded from the CMS keep their configured photo keys and do not receive random images.
- Items without a matching photo, and images that fail to load, show a category icon placeholder rather than an unrelated dish.
