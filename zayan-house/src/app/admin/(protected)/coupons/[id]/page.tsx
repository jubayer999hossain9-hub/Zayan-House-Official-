import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { toLocalInput } from "@/lib/datetime";
import { PageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata: Metadata = { title: "Edit Coupon" };
export const dynamic = "force-dynamic";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [c] = await db.select().from(coupons).where(eq(coupons.id, Number(id))).limit(1);
  if (!c) notFound();
  const n = (v: number | null) => (v == null ? "" : String(v));
  return (
    <div>
      <PageHeader title={`Edit ${c.code}`} subtitle={`Used ${c.usedCount} time${c.usedCount === 1 ? "" : "s"}`} />
      <CouponForm key={c.updatedAt.getTime()} initial={{
        id: c.id, code: c.code, description: c.description ?? "", discountType: c.discountType, discountValue: String(c.discountValue),
        minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "", maxDiscountAmount: n(c.maxDiscountAmount),
        startsAt: toLocalInput(c.startsAt), expiresAt: toLocalInput(c.expiresAt), isActive: c.isActive, usageLimit: n(c.usageLimit), perCustomerLimit: n(c.perCustomerLimit),
      }} />
    </div>
  );
}
