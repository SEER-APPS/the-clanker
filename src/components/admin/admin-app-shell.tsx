"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV_GROUPS, ADMIN_SUPER_NAV_ITEM } from "@/lib/admin-nav";
import { useGetMeQuery } from "@/store/admin-api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LiveClock } from "@/components/admin/live-clock";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import {
  Activity,
  BarChart3,
  Banknote,
  Bell,
  BookOpenText,
  Briefcase,
  CreditCard,
  Database,
  LayoutDashboard,
  MessageSquareText,
  PhoneCall,
  ReceiptText,
  Settings,
  ShieldAlert,
  Ticket,
  Users,
  Wallet,
  Loader2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const SIDEBAR_WIDTH_PX = 220;

const PATH_LABEL_OVERRIDES: Record<string, string> = {
  "/services/analytics/logs": "Analytics / Logs",
  "/services/analytics/failures": "Analytics / Failures",
  "/services/hubtel/transactions": "Hubtel / Transactions",
  "/services/hubtel/tests": "Hubtel / Tools",
};

const NAV_ICON_BY_HREF: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/users": Users,
  "/threat-alerts": ShieldAlert,
  "/services/hubtel/transactions": ReceiptText,
  "/conversations": MessageSquareText,
  "/notifications": Bell,
  "/balances": Wallet,

  "/settings": Settings,
  "/features": Settings,
  "/services/tests": Activity,
  "/services/analytics": BarChart3,

  "/services/prepaid": CreditCard,
  "/services/airtime": PhoneCall,
  "/services/school-fees": Banknote,
  "/services/tickets": Ticket,
  "/services/passport": BookOpenText,
  "/services/permit": Briefcase,
  "/services/hubtel": MessageSquareText,
  "/services/data-catalogue": Database,

  "/staff/admins": Users,
};

function isPathActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/dashboard" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function getActiveNavHref(pathname: string): string | null {
  const allItems = [
    ...ADMIN_NAV_GROUPS.flatMap((g) => g.items),
    ADMIN_SUPER_NAV_ITEM,
  ];

  const match = allItems
    .filter((i) => isPathActive(pathname, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.href ?? null;
}

function buildBreadcrumbItems(pathname: string): { label: string; href?: string }[] {
  if (pathname === "/dashboard") {
    return [{ label: "Dashboard" }];
  }

  const overrides = PATH_LABEL_OVERRIDES[pathname];
  if (overrides) {
    return [{ label: "Dashboard", href: "/dashboard" }, { label: overrides }];
  }

  const allItems = [
    ...ADMIN_NAV_GROUPS.flatMap((g) => g.items),
    ADMIN_SUPER_NAV_ITEM,
  ];

  const match = allItems
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const baseLabel = match?.label ?? "Admin";
  const isDetail = Boolean(match && pathname.startsWith(`${match.href}/`));
  const suffix = isDetail ? " / Details" : "";

  return [{ label: "Dashboard", href: "/dashboard" }, { label: `${baseLabel}${suffix}` }];
}

export function AdminAppShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const { data: me } = useGetMeQuery();
  const activeHref = getActiveNavHref(pathname);
  const [signingOut, setSigningOut] = useState(false);

  async function logout(): Promise<void> {
    try {
      setSigningOut(true);
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      window.location.href = "/login";
    } catch {
      setSigningOut(false);
    }
  }

  const adminName = me?.admin.name ?? "Admin";
  const adminEmail = me?.admin.email ?? "…";
  const initial = (adminName?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <SidebarProvider
      className="min-h-svh"
      style={
        {
          ["--sidebar-width" as never]: `${SIDEBAR_WIDTH_PX}px`,
        } as React.CSSProperties
      }
    >
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-[18px] py-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="The Seer"
              className="h-[30px] w-[30px] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sidebar-foreground text-[14px] font-semibold tracking-[0.02em]">
                The Seer
              </div>
              <div className="text-sidebar-foreground/60 text-[9px] font-semibold uppercase tracking-[0.12em]">
                Admin Console
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {ADMIN_NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label} className="px-3 py-0">
              <SidebarGroupLabel className="px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    {(() => {
                      const Icon = NAV_ICON_BY_HREF[item.href];
                      return (
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={Boolean(activeHref && item.href === activeHref)}
                      className="text-[13px] font-normal"
                    >
                      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                      {item.label}
                    </SidebarMenuButton>
                      );
                    })()}
                  </SidebarMenuItem>
                ))}

                {group.label === "System" && me?.admin.is_super_admin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href={ADMIN_SUPER_NAV_ITEM.href} />}
                      isActive={Boolean(activeHref && ADMIN_SUPER_NAV_ITEM.href === activeHref)}
                      className="text-[13px] font-normal"
                    >
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {ADMIN_SUPER_NAV_ITEM.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
          <div className="mb-2 flex items-center gap-2.5">
            {me?.admin.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.admin.profile_photo}
                alt={adminName}
                className="h-8 w-8 shrink-0 border border-sidebar-border object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-sidebar-border bg-sidebar-accent text-[12px] font-bold text-sidebar-foreground">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <strong className="block truncate text-[11px] font-semibold text-sidebar-foreground">
                {adminName}
              </strong>
              <span className="block truncate text-[10px] text-sidebar-foreground/60">
                {adminEmail}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={signingOut}
            aria-busy={signingOut}
            className="w-full bg-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-gray-700 rounded-none"
            onClick={() => {
              void logout();
            }}
          >
            {signingOut ? (
              <>
                <Loader2
                  className="mr-2 inline size-4 animate-spin"
                  aria-hidden="true"
                />
                Signing out…
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex min-h-svh flex-col bg-background">
        <header className="bg-background flex h-12 shrink-0 items-center justify-between border-b px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <AdminBreadcrumb items={buildBreadcrumbItems(pathname)} />
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-7">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
