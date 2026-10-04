import type { Metadata } from "next";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { whatsappUrl } from "@/components/whatsapp-link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Zayan House on WhatsApp, phone or email for help with orders, sizes and returns.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = whatsappUrl(s.whatsapp.number, s.whatsapp.message);
  const items = [
    s.general.contactPhone && { icon: Phone, label: "Phone", value: s.general.contactPhone, href: `tel:${s.general.contactPhone.replace(/[^+\d]/g, "")}` },
    s.general.contactEmail && { icon: Mail, label: "Email", value: s.general.contactEmail, href: `mailto:${s.general.contactEmail}` },
    s.general.address && { icon: MapPin, label: "Address", value: s.general.address, href: null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl text-green sm:text-5xl">Contact Us</h1>
      <p className="mb-8 mt-3 text-muted">Questions about an order, a size or a return? We are happy to help. The fastest way to reach us is WhatsApp.</p>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary mb-8">
          <MessageCircle size={18} /> Chat on WhatsApp
        </a>
      )}
      {items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="border border-line bg-cream p-5">
              <Icon size={22} strokeWidth={1.4} className="text-gold-dark" />
              <h2 className="mt-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted">{label}</h2>
              {href ? <a href={href} className="mt-1 block text-green underline">{value}</a> : <p className="mt-1">{value}</p>}
            </li>
          ))}
        </ul>
      ) : !wa ? (
        <p className="border border-line bg-cream p-6 text-muted">Contact details will be available soon.</p>
      ) : null}
    </article>
  );
}
