import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/app/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const initials = admin.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A";
  return (
    <div className="admin-shell min-h-screen lg:flex">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
      <aside className="admin-sidebar sticky top-0 z-40 bg-green text-cream lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">
        <AdminSidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="admin-topbar sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/85 px-4 py-3 backdrop-blur sm:px-8">
          <p className="text-sm text-muted">Welcome back</p>
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-semibold text-green-dark">{initials}</span>
            <span className="hidden font-medium text-green sm:inline">{admin.name}</span>
            <form action={logoutAdmin}><button type="submit" className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-green transition hover:border-green">Log out</button></form>
          </div>
        </header>
        <div className="mx-auto max-w-7xl overflow-x-auto p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
