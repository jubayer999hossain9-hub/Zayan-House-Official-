import type { Metadata } from "next";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm, EMPTY_PRODUCT } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New Product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.displayOrder);
  return (
    <div>
      <PageHeader title="Add product" subtitle="Save the product first, then you can upload its photos." />
      <ProductForm initial={EMPTY_PRODUCT} variants={[]} categories={cats} />
    </div>
  );
}
