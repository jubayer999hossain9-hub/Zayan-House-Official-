import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getTestimonials } from "@/lib/testimonials";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm, TestimonialsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const [s, testimonials] = await Promise.all([getSettings(), getTestimonials()]);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Changes appear on the website straight away." />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SettingsForm group="promo" title="Homepage offer banner" description="The green banner next to New Arrivals on the homepage. Only write an offer (for example a discount) that is really available." values={s.promo}
          fields={[{ name: "enabled", label: "Show this banner", kind: "checkbox" }, { name: "eyebrow", label: "Small heading" }, { name: "title", label: "Big heading" }, { name: "text", label: "Short text" }, { name: "button", label: "Button text" }, { name: "link", label: "Button link", hint: "Start with / for a page in your shop, e.g. /category/saree, or use a full https:// link." }]} />
        <SettingsForm group="hero" title="Homepage slider (3 slides)" description="The big banner at the top of the homepage. The coloured italic word is the last word of the heading." values={s.hero}
          fields={[1, 2, 3].flatMap((n) => [
            { name: `s${n}Eyebrow`, label: `Slide ${n}: small heading` },
            { name: `s${n}Title`, label: `Slide ${n}: heading` },
            { name: `s${n}Accent`, label: `Slide ${n}: coloured italic word` },
            { name: `s${n}Text`, label: `Slide ${n}: text`, kind: "textarea" as const },
            { name: `s${n}Button`, label: `Slide ${n}: button text` },
            { name: `s${n}Link`, label: `Slide ${n}: button link`, hint: "Start with / for a page in your shop, e.g. /shop?new=1" },
          ])} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsForm group="whatsapp" title="WhatsApp" description="Used by the floating WhatsApp button and the footer link." values={s.whatsapp}
          fields={[{ name: "number", label: "WhatsApp number", hint: "Country code first, digits only. Example: 8801XXXXXXXXX. Leave empty to hide the button." }, { name: "message", label: "Pre-filled message", kind: "textarea" }]} />
        <SettingsForm group="announcement" title="Announcement bar" description="The thin green bar at the very top of every page." values={s.announcement}
          fields={[{ name: "enabled", label: "Show the announcement bar", kind: "checkbox" }, { name: "text", label: "Text" }]} />
        <SettingsForm group="general" title="Shop details" values={s.general}
          fields={[{ name: "siteName", label: "Shop name" }, { name: "tagline", label: "Tagline" }, { name: "contactEmail", label: "Contact email" }, { name: "contactPhone", label: "Contact phone" }, { name: "address", label: "Address" }]} />
        <SettingsForm group="social" title="Social links" values={s.social}
          fields={[{ name: "facebook", label: "Facebook page link", hint: "Full link starting with https://" }, { name: "instagram", label: "Instagram link", hint: "Full link starting with https://" }]} />
        <SettingsForm group="payment" title="Payment" description="Cash on Delivery is the only payment method right now." values={s.payment}
          fields={[{ name: "codEnabled", label: "Accept orders with Cash on Delivery (turn off to pause ordering)", kind: "checkbox" }, { name: "codInstructions", label: "Instructions shown at checkout", kind: "textarea" }]} />
        <SettingsForm group="orders" title="Orders" values={s.orders}
          fields={[{ name: "orderPrefix", label: "Order number prefix", hint: "2 to 6 letters or numbers. Example: ZH gives ZH-AB12CD34." }]} />
        <SettingsForm group="inventory" title="Inventory" values={s.inventory}
          fields={[{ name: "lowStockThreshold", label: "Low stock warning level", kind: "number", hint: "Items with this many or fewer are shown as Low stock." }]} />
        <TestimonialsForm initial={testimonials} />
      </div>
    </div>
  );
}
