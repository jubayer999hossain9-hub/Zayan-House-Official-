import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { DEFAULT_PAGES, PAGE_KEYS, PAGE_TITLES, getSavedPages } from "@/lib/page-content";

export const metadata: Metadata = { title: "Website Pages" };
export const dynamic = "force-dynamic";

export default async function AdminPages() {
  const saved = await getSavedPages();
  const values = Object.fromEntries(PAGE_KEYS.map((k) => [k, saved[k] || DEFAULT_PAGES[k]]));
  return (
    <div>
      <PageHeader title="Website pages" subtitle="Edit the About, Shipping, Returns, Privacy and Terms pages. Please read each one and change anything that does not match how your shop really works." />
      <div className="mb-6 border border-gold/50 bg-gold/10 p-4 text-sm">
        <p><strong>How to format:</strong> leave a blank line between paragraphs. Start a line with <code>## </code> for a heading. Start lines with <code>- </code> for a bullet list.</p>
        <p className="mt-2">The texts below are standard starting versions, not legal advice. Check the delivery times, return days and fees especially.</p>
        <p className="mt-2 flex flex-wrap gap-x-4">{PAGE_KEYS.map((k) => <Link key={k} href={`/${k}`} target="_blank" className="underline">View {PAGE_TITLES[k]}</Link>)}</p>
      </div>
      <SettingsForm
        group="pages"
        title="Page text"
        description="To go back to the standard text of a page, clear its box and save."
        values={values}
        fields={PAGE_KEYS.map((k) => ({ name: k, label: PAGE_TITLES[k], kind: "textarea" as const, rows: 14 }))}
      />
    </div>
  );
}
