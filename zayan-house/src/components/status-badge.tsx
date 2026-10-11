import { STATUS_LABEL } from "@/lib/order-display";
import { PILL_BASE, STATUS_TONE, TONES } from "@/lib/status-tones";

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[STATUS_TONE[status] ?? "gray"];
  return <span className={`${PILL_BASE} ${tone}`}>{STATUS_LABEL[status] ?? status}</span>;
}
