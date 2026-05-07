import { AdminAppShell } from "@/components/admin/admin-app-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AdminAppShell>{children}</AdminAppShell>;
}
