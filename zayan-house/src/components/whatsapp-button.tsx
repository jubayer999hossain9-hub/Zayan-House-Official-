import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { whatsappUrl } from "./whatsapp-link";

/** Floating WhatsApp button. The number comes from Admin > Settings (or WHATSAPP_NUMBER until set). */
export async function WhatsAppButton() {
  const settings = await getSettings();
  const href = whatsappUrl(settings.whatsapp.number, settings.whatsapp.message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle size={28} />
    </a>
  );
}
