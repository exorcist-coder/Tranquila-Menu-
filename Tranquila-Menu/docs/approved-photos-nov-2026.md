# Tranquila approved photo comparison and integration

Branch: `fix/tranquila-approved-photos-nov-2026`

Compared the supplied 36-photo set with both live 87-item menus on Main Hotel and Nest Kado. Reused 30 suitable photos across 14 galleries. The other six do not have a suitable menu match and are listed below. No new dishes, flavours, prices or options were added.

## Juice and tea presentation

Tea & Coffee, Fresh Juice and Smoothie use rounded square photos inside their list cards. Detail pages show a larger framed image with its full proportions preserved, optional thumbnail rows, and a full-screen photo viewer. Search and cart thumbnails use the same photo treatment. Wines, whiskey, beer and bottled-water cutout styling is unchanged.

## Data and administration

No database writes or schema changes. Original CMS galleries are upgraded on read for either branch. Custom staff galleries, custom covers, intentional empty arrays and availability remain intact. Branch-specific prices, extra options, visibility and publication flags are preserved. Original fallback catalog prices and metadata are checked by a frozen semantic hash.

## Photos held back

| Supplied photo | Reason |
| --- | --- |
| `akara-custard.webp` | Tranquila has custard under Cereal & Porridge but no Akara & Custard dish; retain its existing custard image. |
| `singapore-noodles-1.webp` | No Singapore Noodles item or option. |
| `singapore-noodles-2.webp` | No Singapore Noodles item or option. |
| `singapore-noodles-3.webp` | No Singapore Noodles item or option. |
| `orange-juice.webp` | Orange is absent from Tranquila’s Fresh Juice options. |
| `assorted-meat-red-soup.webp` | Red stew/soup does not clearly match the Pepper Soup broth. |

## Matching notes

- `chicken-sandwich-toasted.webp` contains chicken salad and belongs in the chicken salad gallery, not sandwiches.
- Mixed salad with egg is assigned to the house special salad; vegetable-only salad receives the vegetable photo.
- Assorted juice photography shows thick blended drinks, so it is assigned to Smoothie rather than Fresh Juice.
- The supplied chicken rice image resembles spiced rice/biryani; retained in the broad Rice gallery. Existing plain fried-rice and basmati photos are preserved.
- The supplied Milo image illustrates Hot Chocolate; no Milo option was added.
- There are no new dedicated tea, decaf, cucumber, pineapple or cranberry photos. Existing menu choices remain unchanged.

## Exact reused mappings

| Menu item | Photo keys |
| --- | --- |
| `eggs` | `scrambled-eggs-fries-plantain` |
| `swallow-soup` | `approved-egusi-assorted`, `approved-okra-seafood` |
| `pepper-soup` | `assorted-meat-pepper-soup`, `assorted-meat-soup` |
| `rice` | `approved-white-rice-stew`, `approved-chicken-fried-rice` |
| `spaghetti` | `approved-jollof-spaghetti`, `spaghetti-bolognese` |
| `indomie` | `indomie-sausage-boiled-eggs`, `indomie-special-fried-eggs`, `indomie-omelette` |
| `sides` | `fried-yam-pepper-sauce` |
| `caesar` | `approved-chicken-caesar-salad`, `approved-chicken-salad-grilled`, `approved-chicken-egg-salad`, `approved-chicken-sandwich-toasted` |
| `special-salad` | `approved-mixed-salad-egg` |
| `veg-salad` | `approved-mixed-vegetable-salad` |
| `club` | `approved-stacked-club-sandwich`, `approved-club-sandwich-toasted`, `approved-chicken-club-grilled`, `approved-chicken-sandwich-layered`, `approved-chicken-sandwich-grilled` |
| `hot-drinks` | `approved-latte-coffee`, `approved-black-coffee`, `approved-milk-coffee`, `approved-milo-hot` |
| `juice` | `approved-watermelon-juice` |
| `smoothie` | `approved-assorted-juice` |

## Validation

- 24 automated tests passed, including existing order and atomic admin workflow tests.
- TypeScript check and Next.js build passed.
- All 30 source images decode successfully and retain their exact supplied bytes.

## Coleslaw and Sileo follow-up

- The plain mixed vegetable salad image is now assigned to Coleslaw. On Tranquila, Coleslaw is a Sides option: search, option selection and cart thumbnails use that photo.
- Sileo 0.1.6 is pinned in the lockfile and mounted once at the root for all guest and admin routes.
- Item additions, cancellation with Undo, checkout validation, copying an order, admin results and authentication feedback use Sileo. Inline field errors and explicit destructive-action confirmations are retained.
- Juice, tea/coffee and smoothie photographs use bounded cards, preserved proportions in details and fullscreen viewing.
- No live database writes or production releases were performed.
