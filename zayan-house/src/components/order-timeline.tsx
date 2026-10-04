import { ORDER_STEPS, STATUS_LABEL } from "@/lib/order-display";

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">This order was cancelled.</p>;
  }
  const current = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-green" : "bg-line"}`} />
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[0.65rem] font-bold ${done ? "border-green bg-green text-cream" : "border-line bg-cream text-muted"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === ORDER_STEPS.length - 1 ? "opacity-0" : i < current ? "bg-green" : "bg-line"}`} />
            </div>
            <span className={`mt-2 text-[0.65rem] sm:text-xs ${done ? "font-semibold text-green" : "text-muted"}`}>{STATUS_LABEL[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
