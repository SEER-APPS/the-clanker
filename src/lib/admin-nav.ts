export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavGroup = {
  label: "Navigation" | "System" | "Services";
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Navigation",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users", href: "/users" },
      { label: "Threat Alerts", href: "/threat-alerts" },
      { label: "Transactions", href: "/services/hubtel/transactions" },
      { label: "Conversations", href: "/conversations" },
      { label: "App Support", href: "/support" },
      { label: "Notifications", href: "/notifications" },
      { label: "Balances", href: "/balances" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings" },
      { label: "Features", href: "/features" },
      { label: "Tests", href: "/services/tests" },
      { label: "Analytics", href: "/services/analytics" },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Prepaid", href: "/services/prepaid" },
      { label: "Airtime", href: "/services/airtime" },
      { label: "School Fees", href: "/services/school-fees" },
      { label: "Tickets", href: "/services/tickets" },
      { label: "Passport", href: "/services/passport" },
      { label: "Permit", href: "/services/permit" },
      { label: "Hubtel", href: "/services/hubtel" },
      { label: "Data Catalogue", href: "/services/data-catalogue" },
    ],
  },
];

export const ADMIN_SUPER_NAV_ITEM: AdminNavItem = {
  label: "Admin Accounts",
  href: "/staff/admins",
};
