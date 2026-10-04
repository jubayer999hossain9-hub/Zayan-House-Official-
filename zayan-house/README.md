# Zayan House: Women's Fashion E-commerce

A complete online shop built from scratch with Next.js, TypeScript, Tailwind CSS, PostgreSQL and Drizzle ORM.

**What it includes**

- Customer website: premium homepage with hero slider, shop with search / filters / sorting, product pages with working size and colour options, cart, checkout (Cash on Delivery), coupons, delivery charges, order confirmation, customer accounts (orders, addresses, profile)
- Admin panel: dashboard, products (variants, photo upload), categories, orders, customers, inventory, coupons, delivery, website pages, settings
- SEO: page titles and descriptions, sitemap, robots.txt, product and shop structured data
- Security: hashed passwords, signed sessions, server-side price / stock / coupon / delivery checks, rate limiting

---

## Where you are now (progress checklist)

Use this to continue exactly where you stopped. Tick off what you have already done:

- [x] Step 1: Node.js installed
- [x] Step 2: PostgreSQL database created
- [x] Step 3: Project unzipped, `npm install` done
- [x] Step 4: `.env` file filled in
- [x] Step 5: `npm run db:migrate` and `npm run db:seed` done (and optionally `npm run db:seed:demo`)
- [x] Step 6: Admin account created with `npm run admin:create`
- [x] Step 7: Website running with `npm run dev`
- [ ] **Step 7b (do this now): apply the new design update, see "Updating your running copy" below**
- [ ] Step 8: Set up the shop from the admin panel (section 7 below): Settings, Delivery, Pages, Categories, Products, Coupons
- [ ] Step 9: Place a test order and manage it in Admin > Orders
- [ ] Step 10: Pre-launch checklist, then go live (section 9)

## Updating your running copy to the new design (version 2)

This version changes only how the website LOOKS (new header, homepage, cards and colours) and adds a few things you can edit in the admin. **No new database tables are needed and your products, orders, customers, admin account and `.env` stay exactly as they are.**

1. Stop the running website: click the terminal where it runs and press `Ctrl + C`.
2. Extract the new ZIP. Copy everything from the new folder into your existing project folder and choose **Replace** when asked. **Do not delete your old folder and do not replace your `.env` file** (the new ZIP does not contain one).
3. Open a terminal in the project folder and run:
```bash
npm install
npm run db:migrate
npm run dev
```
(`db:migrate` will say it is already applied. That is fine.)
4. Open http://localhost:3000 and press `Ctrl + F5` to refresh the page fully.

### What is new in version 2

- Premium homepage: a 3-slide hero banner with brand artwork, "Shop by Category" cards, "Featured Collections" tiles with real product counts, New Arrivals beside an offer banner, Featured and Best Sellers, brand story, reviews, newsletter, and a trust bar.
- New header: top bar with your announcement, social icons and delivery notes; navigation with Collections and Shop drop-down menus and the current page highlighted; an "Order on WhatsApp" button.
- Soft, rounded product cards with New / Best Seller / discount badges; pill-shaped buttons throughout.
- **Editable from Admin > Settings:** the 3 hero slides (headings, text, button text and links) and the homepage offer banner (turn it on or off, change its text and link).
- **Editable from Admin > Categories:** an optional photo for each category. Without a photo, a decorative card is used. If you add a photo, use a wide (4:3) one.
- Your product photos and real photography make the shop look best. The hero and category artwork is a built-in illustration, not a photograph.

### Notes about the design

- The reference screenshot shows many product types (men's fashion, watches, perfume, gifts). Zayan House sells women's fashion, so the layout and style follow the screenshot while the content stays women's fashion.
- I did not copy claims from the screenshot that are not true for your shop (for example "Trusted by 10,000+ customers", "Free delivery above ৳2000", "Up to 30% off"). The offer banner and the announcement bar are yours to fill in with real offers.
- The wishlist (heart) icon from the screenshot is not included because wishlist is not built.

---

## 1. Requirements

- **Node.js 20 or newer** (check with `node -v`)
- **PostgreSQL 14 or newer** with an empty database for this project (a free hosted database such as Neon works fine)

## 2. Install

Open a terminal in the project folder and run:

```bash
npm install
```

## 3. Environment setup

```bash
cp .env.example .env        # on Windows Command Prompt: copy .env.example .env
```

Open `.env` and fill in your own NEW values:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string, e.g. `postgresql://postgres:PASSWORD@localhost:5432/zayan_house` |
| `DATABASE_SSL` | `true` only if your database host requires SSL (Neon, Supabase, etc.), otherwise `false` |
| `AUTH_SECRET` | A long random secret. Create one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; your real website address when live (no trailing slash) |
| `WHATSAPP_NUMBER` | Number with country code, digits only, e.g. `8801XXXXXXXXX`. Only a starting value; change it later in Admin > Settings |

Never share or upload the `.env` file.

## 4. Database setup (migrate and seed)

```bash
npm run db:migrate      # creates all tables
npm run db:seed         # categories, delivery zones, default settings
```

`db:seed` is safe for a real shop and can be run more than once. It creates 6 starting categories (Three Piece, Kurti, Saree, Party Wear, Casual Wear, New Collection), the two delivery zones (Inside Dhaka ৳70, Outside Dhaka ৳130) and default settings.

**Optional, for trying the shop with sample data:**

```bash
npm run db:seed:demo    # adds 8 DEMO products (SKU starts with DEMO-), coupon DEMO10 and 3 DEMO reviews
npm run db:remove-demo  # removes all of the demo data again
```

Remove the demo data before you launch.

## 5. Create your admin account

There is no default admin and no default password.

```bash
npm run admin:create
```

It asks for your name, email and a password of at least 12 characters (nothing shows on screen while you type the password). Running it again with the same email resets that admin's password.

## 6. Run

```bash
npm run dev             # development: http://localhost:3000
```

Production build and run:

```bash
npm run build
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 7. How to configure things (all from the admin panel)

**WhatsApp number:** Admin > Settings > WhatsApp. Updates the floating button and the footer link straight away.

**Delivery charges:** Admin > Delivery. Customers whose district is Dhaka pay "Inside Dhaka"; every other district pays "Outside Dhaka". You can also set an order amount above which delivery is free. Charges are always calculated on the server.

**Categories:** Admin > Categories > fill in the form > Add category. You can edit, re-order, hide or delete them.

**Products:** Admin > Products > Add product.
1. Enter the name, SKU, category and prices (a sale price is optional).
2. Under "Sizes, colours and stock" click *Add variant* for each size/colour combination. Each row has its own SKU and stock. A product with no sizes or colours uses the single stock box instead.
3. Set the status to **Active** so it shows in the shop (Draft and Archived are hidden).
4. Click *Create product*. On the next screen upload photos (JPG, PNG or WebP, up to 3 MB). The first photo is the main one; use the arrows or star to re-order.

**Coupons:** Admin > Coupons > New coupon. Choose percentage or fixed amount, an optional minimum order, maximum discount, start and expiry date (Bangladesh time), a total usage limit and a per-customer limit (matched by phone number). Coupons are checked on the server at checkout.

**Orders:** Admin > Orders. Search by order number, name, phone or email; filter by status. Open an order to change the order status and payment status and to add private notes.
- Cancelling an order returns its items to stock and frees the coupon use. A cancelled order cannot be reopened.
- Marking a Cash on Delivery order *Delivered* also marks it *Paid*, unless you set the payment status yourself in the same save.

**Inventory:** Admin > Inventory lists every variant with its stock level and lets you type in a new number. "Low stock" means this many or fewer, which you can change in Settings.

**Website pages:** Admin > Pages edits About, Shipping, Returns, Privacy and Terms. **These start with standard text. Please read every page and change anything that does not match how your shop really works (delivery times, return days, fees).** They are not legal advice.

**Homepage look:** Admin > Settings has "Homepage slider (3 slides)" and "Homepage offer banner". Admin > Categories lets you add a photo to each category card.

**Other settings:** Admin > Settings: announcement bar, shop details and contact info, social links, Cash on Delivery on/off, order number prefix, low-stock level, homepage customer reviews (only add real reviews; with none, the section is hidden).

## 8. Updating to a newer version

Replace the project files with the new ones (keep your own `.env`), then run:

```bash
npm install
npm run db:migrate
```

## 9. Going live (not tested by the builder)

The usual route is GitHub + Vercel (website) + Neon (database). In Vercel, add the five variables from section 3 as Environment Variables (use your real domain for `NEXT_PUBLIC_APP_URL`, and `DATABASE_SSL=true`). From your own computer, point `.env` at the live database and run `npm run db:migrate`, `npm run db:seed` and `npm run admin:create` once. Then remove demo data with `npm run db:remove-demo` if you used it. This deployment route was not tested while building; all testing was done on a local machine. Use HTTPS on your domain (Vercel does this automatically).

## What is not included

- Online payment (bKash, Nagad, card). The database and checkout are prepared for it, but only Cash on Delivery is available.
- Wishlist, product reviews, a contact-form inbox (the Contact page uses WhatsApp, phone and email), automatic emails or SMS, and customer self-cancellation of orders.
- Changing a customer's email address (they contact you).
- Extra delivery zones beyond Inside / Outside Dhaka.

## Security in this build

- Passwords hashed with bcrypt (cost 12); login timing does not reveal whether an email exists
- Signed, httpOnly session cookies; admin and customer sessions are separate; admin sessions expire after 8 hours; changing a password logs out all other devices
- Every protected page and every admin action re-checks the user in the database
- Login, registration, admin login, orders, cart pricing and newsletter sign-up are rate limited (stored in the database, so it works on serverless hosting)
- All input validated with Zod; all database queries parameterised
- Prices, stock, delivery charges and coupons are always decided on the server; order creation is one database transaction with locked stock, so two people cannot buy the last item
- Uploaded photos are checked by their real file type, limited to 3 MB, and served with safe headers
- Page text from the admin is shown as plain text (no HTML is ever interpreted)
- Security headers set in `next.config.ts`; `.env` is git-ignored
- Not included: a Content-Security-Policy header and two-factor login for admins

## Project layout

```
src/app/(store)/      customer-facing pages (header + footer)
src/app/admin/        admin login and admin panel
src/app/actions/      server actions (login, cart, checkout, account, admin)
src/components/       header, footer, product cards, forms, admin components
src/db/schema.ts      the complete database schema
src/db/seed.ts        seed script (run with --demo for sample data)
src/lib/              auth, sessions, pricing, orders, settings, validation
drizzle/              generated SQL migrations
```
