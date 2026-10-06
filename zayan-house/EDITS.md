# Zayan House v4: what to do with these files

Copy the `src` folder, `data` folder and `drizzle.config.ts` from this ZIP into your
project folder. Every file is NEW except `drizzle.config.ts`, which replaces yours
(only the `schema` line is different). Then do the steps below in order.

## 1. Check two assumptions

- All new files import the database as `import { db } from "@/db"`. If your other
  files import it differently, change that line in the new files.
- Open `src/lib/home/guard.ts` and make its import + call match the admin check
  your existing admin actions use (look at the top of any admin function in
  `src/app/actions/`). Never remove the check.

## 2. Kalpurush font

1. Download `Kalpurush.ttf` (free, from OmicronLab) and save it as
   `public/fonts/Kalpurush.ttf`.
2. Open `src/app/globals.css` and paste the whole content of
   `EDITS/globals-css-add.css` at the very bottom.

## 3. Create the new tables

```bash
npm run db:generate
npm run db:migrate
```

`db:generate` should list only six new tables (home_media, home_banners,
home_video, bd_districts, bd_thanas, bd_post_offices). If it wants to change or
drop anything else, stop and do not migrate.

## 4. Location data

Make `data/bd-locations.json` in the same format as
`data/bd-locations.sample.json` (one row per post office, built from one
Bangladesh postcode list). The Dhaka district must be spelled exactly as your
delivery logic expects, normally `Dhaka`. Then run:

```bash
npx tsx src/db/seed-locations.ts
```

## 5. Edit your homepage: `src/app/(store)/page.tsx`

Add at the top:

```tsx
import { HomeBanners } from "@/components/home/HomeBanners";
import { HomeVideoSlot } from "@/components/home/HomeVideoSlot";
```

Inside the page (section names are examples; keep your own components):

```tsx
<HomeBanners fallback={<YourCurrentTopBanner />} />
<HomeVideoSlot position="after_banner" />

<YourShopByCategory />
<HomeVideoSlot position="after_categories" />

<YourFeaturedCollections />
<HomeVideoSlot position="after_collections" />

<YourNewArrivals />
<HomeVideoSlot position="after_new_arrivals" />

<YourFeaturedProducts />
<HomeVideoSlot position="after_featured" />

<YourBestSellers />
<HomeVideoSlot position="after_best_sellers" />
```

Until you add a banner in the admin, the homepage looks the same as today.

## 6. Admin page

The ZIP puts the page at `src/app/admin/home/page.tsx`. If your admin `settings`
folder is inside a group folder (for example `src/app/admin/(panel)/settings`),
move the `home` folder next to `settings` so it gets the same sidebar.
The address is `/admin/home`.

## 7. Edit your checkout (two places)

**Form component:** remove your current district and address inputs and put this
in their place, inside the existing `<form>`:

```tsx
import { AddressFields } from "@/components/checkout/AddressFields";

<AddressFields
  districtFieldName="district"
  onDistrictChange={(name) => {/* update the live delivery charge here, if you show one */}}
  errors={{}}
/>
```

Use the `name` your action reads the district from today in `districtFieldName`.

**Server action:** add before the order is created:

```ts
import { resolveAddressFromForm } from "@/lib/address";

const addr = await resolveAddressFromForm(formData);
if (!addr.ok) {
  return { errors: addr.errors }; // use your action's own error shape
}
```

Then use `addr.address.district` where the district was read from the form, and
`addr.address.fullAddress` where the address text was read. If your existing Zod
schema requires the old address field, feed it `addr.address.fullAddress`.
No change to the orders table is needed.

## 8. Test, then deploy

1. `npm run typecheck` and fix any import path it reports.
2. `npm run dev`: test `/admin/home`, the homepage slider and video, and place a
   test order (try leaving each address field empty first). Check the Inside /
   Outside Dhaka charge.
3. Run steps 3 and 4 against the live database before pushing.
4. Commit and push. Do not upload `.env`.

## Known limits

- Video is added by link (hosted MP4 or YouTube), not uploaded.
- Banner and poster pictures: JPG, PNG or WebP, up to 3 MB each.
- This code has not been run against your project. Test locally first.
