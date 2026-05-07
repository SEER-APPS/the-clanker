export type AdminMe = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  profile_photo: string | null;
  is_super_admin: boolean;
  last_login_at: string | null;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    prev: string | null;
    next: string | null;
  };
};

export type DashboardPayload = {
  stats: Record<string, number>;
  recent_users: Array<{
    id: number;
    name: string | null;
    phone_number: string | null;
    created_at: string | null;
  }>;
  recent_alerts: Array<{
    id: number;
    threat_type: string;
    status: string;
    created_at: string | null;
    user: { id: number; name: string | null; phone_number: string | null } | null;
  }>;
  charts: {
    user_growth: { labels: string[]; data: number[] };
    messages_by_hour: { labels: string[]; data: number[] };
    alerts_by_type: { labels: string[]; data: number[] };
    alerts_by_status: { labels: string[]; data: number[] };
    notifications_by_status: { labels: string[]; data: number[] };
  };
};
