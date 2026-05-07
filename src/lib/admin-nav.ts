export type AdminNavItem = {
  label: string;
  href: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Users", href: "/users" },
  { label: "Threat alerts", href: "/threat-alerts" },
  { label: "Conversations", href: "/conversations" },
  { label: "Notifications", href: "/notifications" },
  { label: "Balances", href: "/balances" },
  { label: "Prepaid (data)", href: "/services/prepaid" },
  { label: "Airtime", href: "/services/airtime" },
  { label: "School fees", href: "/services/school-fees" },
  { label: "Tickets", href: "/services/tickets" },
  { label: "Passport", href: "/services/passport" },
  { label: "Permit", href: "/services/permit" },
  { label: "Data catalogue", href: "/services/data-catalogue" },
  { label: "Service tests", href: "/services/tests" },
  { label: "Analytics", href: "/services/analytics" },
  { label: "Hubtel", href: "/services/hubtel" },
  { label: "Hubtel transactions", href: "/services/hubtel/transactions" },
  { label: "Hubtel tools", href: "/services/hubtel/tests" },
  { label: "Settings", href: "/settings" },
];

export const ADMIN_SUPER_NAV_ITEM: AdminNavItem = {
  label: "Admin accounts",
  href: "/staff/admins",
};
