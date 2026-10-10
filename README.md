# Wahaj Store

Wahaj is a production-oriented modular monolith e-commerce app for handmade concrete decor. It supports product colors with real variant images, dashboard-managed add-ons, persistent carts, cash on delivery checkout, order tracking, and an admin dashboard.

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

3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Apply the database schema and seed demo data:

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

1. Sign in at `/admin/login`.
2. Open dashboard overview at `/admin`.
3. Manage orders at `/admin/orders`.
4. Create products at `/admin/products/new`.
5. Manage categories, colors, add-ons, and settings from the admin sidebar.

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

The current implementation stores uploaded admin images under `public/uploads` for local development. The code keeps upload handling isolated in `src/lib/files.ts`, so production can replace this with S3, Cloudflare R2, Vercel Blob, or another object storage provider without changing product logic.

Images are rendered through Next Image where practical and use modern formats through Next image configuration.

## Localization

The project includes an initial localization scaffold in `src/lib/i18n.ts` with Arabic and English locale metadata. The current visible UI is mostly English with Arabic brand text, and the layout is ready to expand to full RTL Arabic routes.

## Notifications

`NotificationEvent` stores future notification work for WhatsApp, SMS, email, and push. Version 1 intentionally does not connect WhatsApp Business API; order creation records the architecture hook without sending messages.

## Deployment

Recommended deployment:

1. Provision PostgreSQL.
2. Configure environment variables on the host.
3. Run migrations:

```bash
npm run db:deploy
```

4. Seed the first admin:

```bash
npm run db:seed
```

5. Build and start:

```bash
npm run build
npm run start
```

For Vercel, use a managed PostgreSQL provider and object storage for uploaded images.

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
- 9 Vitest tests passed
- Production build passed
- Production dependency audit found 0 vulnerabilities

Database-backed browser flows were not run in this environment because Docker, `psql`, and a running PostgreSQL service were not available on the machine. The app includes `docker-compose.yml`, migrations, and seed data so those flows can be run as soon as PostgreSQL is available.

## Recommended Next Features

- Replace local uploads with object storage.
- Add full Arabic translations and locale routes.
- Add admin edit forms for existing categories, colors, and add-ons.
- Add coupons and delivery by governorate.
- Add Playwright end-to-end tests once PostgreSQL is available in CI.
- Add WhatsApp Business API notifications.
