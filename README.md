# Wahaj Store

Wahaj is a production-oriented modular monolith e-commerce app for handmade concrete decor. It supports product colors with real variant images, dashboard-managed add-ons, coupons, governorate-based shipping, persistent carts, cash on delivery checkout, order tracking, wishlist, product reviews, Arabic/English RTL localization, and an admin dashboard with sales analytics.

## Stack

- Next.js 16 with TypeScript and App Router
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Cookie backed sessions with hashed session tokens
- bcrypt password hashing
- Zod validation
- Vitest unit tests

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start the bundled PostgreSQL (no system install; binaries and data live in the project):

```bash
npm run db:start
```

Leave it running in a separate terminal. The data directory is `.pgdata/` (git-ignored).

4. Apply the database schema and seed demo data (in another terminal):

```bash
npm run db:deploy
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wahaj_store?schema=public"
APP_URL="http://localhost:3000"
SESSION_SECRET="replace-with-at-least-32-random-characters"
ADMIN_EMAIL="admin@wahaj.local"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_NAME="Wahaj Admin"
UPLOAD_MAX_MB="5"
NEXT_PUBLIC_DEFAULT_LOCALE="ar"
```

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` are used by the seed script to create the first admin user. Change them before seeding a shared or deployed environment.

## Main Flows

Customer flow:

1. Browse products at `/products`.
2. Open a product page.
3. Select a color. The visible product image changes to the uploaded image for that product color.
4. Select add-ons. The displayed price changes immediately.
5. Add to cart.
6. Checkout with cash on delivery.
7. Receive an order number like `WAH-20261006-0001`.
8. Track the order through the secure tracking link or from the account page.

Admin flow:

1. Sign in at `/admin/login` (seeded admin: `admin@wahaj.local` / `ChangeMe123!` — change after first login environment setup).
2. Open dashboard overview at `/admin` (date-filtered revenue chart, best sellers, top colors/add-ons, AOV).
3. Manage orders at `/admin/orders`.
4. Create products at `/admin/products/new`.
5. Manage categories, colors, add-ons (create, edit, delete with usage guards) from the admin sidebar.
6. Manage coupons at `/admin/coupons` (percent/fixed, min subtotal, usage limits, dates) and shipping rates per governorate at `/admin/settings`.
7. Moderate product reviews at `/admin/reviews`.

## Architecture

The app is organized as a modular monolith:

- `src/app` contains routes, server actions, and API handlers.
- `src/components/storefront` contains customer UI.
- `src/components/admin` contains dashboard UI.
- `src/components/ui` contains shared UI building blocks.
- `src/lib` contains data access, auth, pricing, validation, settings, orders, files, SEO, and security helpers.
- `prisma/schema.prisma` contains the relational data model.
- `prisma/seed.ts` creates roles, permissions, settings, categories, colors, add-ons, admin user, and five demo products.

## Database Structure

Core entities:

- Customers: `User`, `Address`, `CustomerSession`
- Admin: `AdminUser`, `AdminSession`, `Role`, `Permission`, `RolePermission`, `AuditLog`
- Catalog: `Product`, `Category`, `ProductImage`, `Color`, `ProductColor`, `Addon`, `ProductAddon`
- Cart: `Cart`, `CartItem`, `CartItemAddon`
- Orders: `Order`, `OrderItem`, `OrderItemAddon`, `OrderStatusHistory`
- Settings and future integrations: `StoreSetting`, `NotificationEvent`

Important modeling choices:

- Product colors are stored per product in `ProductColor`, so the same global color can have a different additional price and image for each product.
- Add-ons are assigned per product through `ProductAddon`.
- Orders store historical snapshots of product name, SKU, selected color, selected add-ons, base price, color price, final unit price, quantity, and image reference.
- Admin roles and permissions are data driven.

## Pricing

The frontend shows live price updates for a good user experience, but order creation recalculates everything from the database:

```text
Final unit price = base product price + selected color additional price + selected add-on prices
Subtotal = final unit price * quantity
Grand total = subtotal + configured shipping rate
```

The server does not trust client supplied prices.

## Security Measures

- Admin dashboard requires authenticated admin sessions.
- Admin API routes require permissions.
- Customer order pages require either the matching account or a secure tracking token.
- Passwords are hashed with bcrypt.
- Session cookies are HTTP only, same site, secure in production, and stored server side as hashes.
- Zod validates inputs on the server.
- Prisma parameterized queries protect against SQL injection.
- Product image uploads are admin only and check MIME type, extension, file size, and basic dimensions for JPEG/PNG.
- Security headers are configured in `next.config.ts`.
- Audit logs record sensitive admin actions.
- `npm audit --omit=dev` reports zero production vulnerabilities after dependency updates.

## Image Storage

The implementation stores uploaded admin images under `public/uploads` for local development. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (Vercel/production), uploads go to the configured Supabase Storage bucket instead and the product logic does not change. The switch lives in `src/lib/files.ts`.

Images are rendered through Next Image where practical and use modern formats through Next image configuration.

## Localization

The project ships with a full Arabic (default, RTL) + English (LTR) dictionary in `src/lib/i18n.ts`. The locale is stored in the `wahaj_locale` cookie and switched from the header toggle; `src/app/layout.tsx` renders the matching `lang`/`dir`. Storefront chrome, homepage, product listing/detail, cart, and checkout are translated. The admin dashboard stays in English.

## Notifications

`NotificationEvent` stores future notification work for WhatsApp, SMS, email, and push. Version 1 intentionally does not connect WhatsApp Business API; order creation records the architecture hook without sending messages.

## Deployment (Vercel + Supabase)

Vercel's filesystem is ephemeral, so production uses Supabase for both the database and image storage. The code switches automatically based on environment variables.

### 1. Create the Supabase project

1. Sign up at `https://supabase.com` and create a new project.
2. Open **Project Settings → Database** and copy:
   - **Connection string (pooler, port 6543)** in the form `postgresql://postgres.[ref]:[password]@...:6543/postgres?pgbouncer=true` → this is `DATABASE_URL`.
   - **Connection string (direct, port 5432)** → this is `DIRECT_URL` (used for migrations).
3. Open **Storage** and create a **public** bucket named `wahaj-images` (or set `SUPABASE_STORAGE_BUCKET` to your name).
4. Open **Project Settings → API** and copy the **Project URL** (`SUPABASE_URL`) and the **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`, server-side only, never expose it).

### 2. Create the production database schema and admin (from your machine)

```bash
DATABASE_URL="<direct-5432-url>" DIRECT_URL="<direct-5432-url>" \
  ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="<strong-password>" \
  npm run db:deploy
DATABASE_URL="<direct-5432-url>" DIRECT_URL="<direct-5432-url>" \
  ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="<strong-password>" \
  npm run db:seed
```

### 3. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Set these environment variables in Vercel (**Production**):
   - `DATABASE_URL` = pooler URL (port 6543, with `?pgbouncer=true`)
   - `DIRECT_URL` = direct URL (port 5432)
   - `APP_URL` = `https://your-store.vercel.app`
   - `SESSION_SECRET` = random 32+ characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (only needed if you seed again)
   - `UPLOAD_MAX_MB` = `5`
   - `NEXT_PUBLIC_DEFAULT_LOCALE` = `ar`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` = `wahaj-images`
3. Deploy. The build runs `prisma generate && next build`; no database writes happen at build time.

### Local development (bundled Postgres)

```bash
npm run db:start   # project-local PostgreSQL, data in .pgdata/ (git-ignored)
npm run db:deploy
npm run db:seed
npm run dev
```

## Verification

Completed locally:

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
```

Results:

- Prisma schema valid
- Lint passed
- TypeScript passed
- 16 Vitest tests passed (pricing, validators, coupons/shipping)
- Production build passed
- Production dependency audit found 0 vulnerabilities

End-to-end browser verification against the bundled Postgres (all passed):

- Homepage renders in Arabic RTL with locale toggle
- Product page: color switch updates image + price (350 → 365 EGP)
- Add to cart, cart coupon `WELCOME10` (−10%)
- Checkout with governorate select + live shipping preview
- COD order `WAH-20261010-0001` created with server-side snapshot (subtotal 365, discount 36.50, Cairo shipping 65, total 393.50)
- Order tracking page with timeline
- Admin login + dashboard analytics reflecting the test order (test order removed afterwards)

## Recommended Next Features

- Replace local uploads and embedded Postgres with managed PostgreSQL + object storage in production.
- Add Playwright end-to-end tests (the flows above were verified manually in-browser).
- Add WhatsApp Business API notifications.
