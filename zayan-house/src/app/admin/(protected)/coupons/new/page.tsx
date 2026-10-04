import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata: Metadata = { title: "New Coupon" };

export default function NewCouponPage() {
  return (
    <div>
      <PageHeader title="New coupon" />
      <CouponForm initial={{ code: "", description: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxDiscountAmount: "", startsAt: "", expiresAt: "", isActive: true, usageLimit: "", perCustomerLimit: "" }} />
    </div>
  );
}
