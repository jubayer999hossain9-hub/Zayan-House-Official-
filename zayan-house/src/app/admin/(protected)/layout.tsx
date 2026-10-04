import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <aside className="bg-green text-cream lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="flex items-center gap-3">
            <Image unoptimized src="/logo-mark.png" alt="" width={36} height={36} className="h-9 w-auto" />
            <span className="font-serif text-xl">Zayan Admin</span>
          </Link>
        </div>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-line bg-cream px-5 py-3">
          <Link href="/" target="_blank" className="text-sm text-green underline">View storefront</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">{admin.name}</span>
            <form action={logoutAdmin}><button type="submit" className="font-semibold text-green underline">Log out</button></form>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
