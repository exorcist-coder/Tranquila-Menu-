# Tranquila Hotels and Suites · Ordering

Mobile-first food ordering for hotel guests. Guests browse the menu, build an order, and hand it to the front desk over WhatsApp. Nothing is "placed" until the guest taps Send.

## Run
```
npm install
npm run dev        # http://localhost:3000
npm test           # pricing, option rules, hours, order validation
npm run build
```

## Deploy (Vercel)
To put this in a **new** project (leaves any existing one untouched):
```
npm i -g vercel
vercel --name ambiiflora-ordering-v2 --prod
```
First run asks to create the project; answer `y`. Then in the Vercel dashboard, Settings → Deployment Protection, choose what guests can open without logging in.

Other options:
```
npm i -g vercel
vercel --prod
```
Or push to GitHub and import the repo at vercel.com/new. No build settings needed.

## Environment variables (all optional)
| Name | Default | Purpose |
|---|---|---|
| `WHATSAPP_NUMBER` | `2348160784818` | Front-desk number, country code, digits only |
| `ORDERING_OPEN` / `ORDERING_CLOSE` | `08:00` / `22:00` | Daily hours in Lagos time. Overnight windows work (`18:00`–`02:00`) |
| `ORDERING_PAUSED` | unset | Set to `1` to stop orders instantly |

## How it's built
- `src/lib/catalog.ts` is the menu. Each meal carries its own option groups (swallow → soup → protein). A group or option can depend on an earlier pick via `when`, so Seafood Okra skips protein and fried rice never offers beef.
- `src/lib/pricing.ts` and `src/lib/order.ts` are pure functions with tests.
- `POST /api/order` recomputes every price, option and the opening hours on the server. The browser only sends item ids and choices, so prices cannot be tampered with.
- The cart lives in `localStorage`. There are no accounts and no database.

## Not built yet
- Photos live in `public/images/` and are mapped to matching dishes in `src/lib/catalog.ts` via `src/lib/photos.ts`. Items without a matching photo show a category placeholder rather than an unrelated dish.
- Order history. Orders live in WhatsApp.

## Admin CMS and WhatsApp-first ordering

- Hotel chooser: `/`
- Tranquila Hotel menu: `/?branch=tranquila`
- Tranquila Nest menu: `/?branch=tranquila-nest`
- Staff CMS: `/admin`
- Both branches use the same staff login. Switch hotels inside the admin panel; menus, opening hours, pause state, and WhatsApp numbers are stored separately per branch.
- Stock switches apply immediately per branch. Sold-out items remain visible to guests with a Sold out label, cannot be added to the cart, and are rechecked when an order is submitted.
- WhatsApp remains the primary ordering channel. Opening WhatsApp is not treated as proof that the guest sent the message.
- The admin CMS supports menu items, prices, descriptions, visibility/publication, categories, option-group JSON, service hours and the configured WhatsApp number. Menu changes are draft until published; stock switches are immediate.
- The starter menu remains in the source as the initial fallback template. Download a JSON backup before loading the starter menu into the editor.

### Enable persistent CMS

1. Create a Supabase project.
2. Run `supabase/migrations/202610130001_ambiiflora_cms.sql`, then `supabase/migrations/202610270001_branch_support.sql` in the Supabase SQL editor. The branch migration copies the existing menu and settings into both hotels so they can be managed independently afterward.
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key server-only; never prefix it with `NEXT_PUBLIC_`.
4. Restart the Next.js server.
5. Create staff users in Supabase Authentication. Add each user's UUID to `public.ambiiflora_staff` with `role='admin'` or `role='staff'` and `active=true`. Only administrators can edit hotel settings.
6. Sign in at `/admin`, switch between Tranquila Hotel and Tranquila Nest, configure each branch's WhatsApp number and hours, then edit and publish each branch's menu.

The migration creates a public image bucket named `ambiiflora-menu`; image uploads are restricted by the server to supported image types and 5 MB. The server uses the service-role key only after checking the signed-in user's active staff profile. If Supabase is not configured, the guest menu uses the local starter catalog and the admin login explains that setup is required.

### CMS behaviour

- Save draft stores menu edits without changing the published guest menu.
- Publish menu makes the current CMS menu available to guests and to server-side order validation.
- The branch menu chooser displays each property's name and address. Branch-specific links can be encoded into each property's QR code.
- Item availability is stored separately from the menu draft for each branch. Switching an item off does not hide or delete it; guests see Sold out until staff mark it available again.
- Category and item availability is read from the published menu.
- The Templates & reset screen can load the original starter menu into the editor and export a JSON backup of the current menu. Publishing is a separate action.
- Uploaded images are stored in Supabase Storage and referenced by their public URL.

Before deploying publicly, configure Supabase, create staff accounts, test the full guest-to-WhatsApp flow, and verify the production build and security settings.
