import { STATUS_LABEL } from "@/lib/order-display";

const COLORS: Record<string, string> = {
  pending: "bg-gold/20 text-gold-dark",
  confirmed: "bg-green/10 text-green",
  processing: "bg-green/10 text-green",
  shipped: "bg-green/15 text-green",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/10 text-danger",
  paid: "bg-success/15 text-success",
  failed: "bg-danger/10 text-danger",
  refunded: "bg-muted/15 text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${COLORS[status] ?? "bg-line text-charcoal"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
