"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, ADMIN_SUPER_NAV_ITEM } from "@/lib/admin-nav";
import { useGetMeQuery } from "@/store/admin-api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

function isPathActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  if (href !== "/dashboard" && pathname.startsWith(`${href}/`)) {
    return true;
  }
  return false;
}

export function AdminAppShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const { data: me } = useGetMeQuery();

  async function logout(): Promise<void> {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.href = "/login";
  }

  return (
    <SidebarProvider className="min-h-svh">
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <p className="text-sidebar-foreground text-sm font-semibold tracking-tight">
            Seer Admin
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {ADMIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isPathActive(pathname, item.href)}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {me?.admin.is_super_admin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={ADMIN_SUPER_NAV_ITEM.href} />}
                    isActive={isPathActive(pathname, ADMIN_SUPER_NAV_ITEM.href)}
                  >
                    {ADMIN_SUPER_NAV_ITEM.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              void logout();
            }}
          >
            Log out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex min-h-svh flex-col bg-[var(--background)]">
        <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="md:hidden" />
          <Separator
            orientation="vertical"
            className="hidden h-6 md:block"
          />
          <span className="text-muted-foreground text-sm">
            Signed in as {me?.admin.email ?? "…"}
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
