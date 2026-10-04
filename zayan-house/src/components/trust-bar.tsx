import { BadgeCheck, PackageCheck, Truck, RotateCcw, Headset } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Quality Checked", text: "Every piece inspected" },
  { icon: PackageCheck, title: "Careful Packing", text: "Safe delivery to you" },
  { icon: Truck, title: "Fast Delivery", text: "Across Bangladesh" },
  { icon: RotateCcw, title: "Easy Exchange", text: "See our returns policy" },
  { icon: Headset, title: "Customer Support", text: "Chat with us on WhatsApp" },
];

export function TrustBar() {
  return (
    <section aria-label="Why shop with us" className="mt-16 border-y border-line bg-cream">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={`flex items-center gap-3 ${i === ITEMS.length - 1 ? "col-span-2 justify-center md:col-span-1 md:justify-start" : ""} md:border-r md:border-line md:last:border-r-0`}>
            <Icon size={30} strokeWidth={1.3} className="shrink-0 text-gold-dark" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-green">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
