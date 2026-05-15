import { AdminIncidentFallback } from "@/components/admin/admin-incident-fallback";

export default function NotFound(): React.ReactElement {
  return (
    <AdminIncidentFallback
      title="Page not found"
      description="That path does not exist in the admin app. Use the sidebar to navigate, or return to the dashboard."
    />
  );
}
