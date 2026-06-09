"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useGetFeaturesQuery, useUpdateFeatureMutation } from "@/store/admin-api";

type FeatureToggleConfig = {
  key: string;
  label: string;
  description: string;
  category: "Authentication" | "Payments" | "Services";
};

const FEATURE_TOGGLES: FeatureToggleConfig[] = [
  {
    key: "guest_mode_enabled",
    label: "Guest Mode",
    description: "Allow guest users to sign in and use chat flows.",
    category: "Authentication",
  },
  {
    key: "hubtel_direct_receive_enabled",
    label: "Hubtel Direct Receive",
    description:
      "Use in-app MoMo payment (Direct Receive) instead of redirect checkout. When off, apps use Hubtel hosted checkout.",
    category: "Payments",
  },
  {
    key: "service_prepaid_enabled",
    label: "ECG Prepaid",
    description: "Show ECG prepaid service in mobile apps.",
    category: "Services",
  },
  {
    key: "service_airtime_enabled",
    label: "Airtime & Data",
    description: "Show airtime and data services in mobile apps.",
    category: "Services",
  },
  {
    key: "service_utilities_enabled",
    label: "Utilities",
    description: "Show utilities service in mobile apps.",
    category: "Services",
  },
  {
    key: "service_school_fees_enabled",
    label: "School Fees",
    description: "Show school fees service in mobile apps.",
    category: "Services",
  },
  {
    key: "service_tickets_enabled",
    label: "Tickets",
    description: "Show ticketing service in mobile apps.",
    category: "Services",
  },
  {
    key: "service_passport_enabled",
    label: "Passport",
    description: "Show passport service in mobile apps.",
    category: "Services",
  },
  {
    key: "service_permit_enabled",
    label: "Permit",
    description: "Show permit service in mobile apps.",
    category: "Services",
  },
];

export default function FeaturesPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetFeaturesQuery();
  const [updateFeature, { isLoading: isSaving }] = useUpdateFeatureMutation();
  const [pendingFeatureKey, setPendingFeatureKey] = useState<string | null>(null);
  const flags = data?.flags ?? {};

  const grouped = useMemo(() => {
    return {
      Authentication: FEATURE_TOGGLES.filter((item) => item.category === "Authentication"),
      Payments: FEATURE_TOGGLES.filter((item) => item.category === "Payments"),
      Services: FEATURE_TOGGLES.filter((item) => item.category === "Services"),
    };
  }, []);

  async function onSetFeature(key: string, enabled: boolean): Promise<void> {
    setPendingFeatureKey(key);
    try {
      await updateFeature({ key, enabled }).unwrap();
    } finally {
      setPendingFeatureKey(null);
    }
  }

  function formatUpdatedAt(value: string | null): string {
    if (!value) {
      return "Not updated yet";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }
    return date.toLocaleString();
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="admin-page-title">Features</h1>
        <p className="admin-page-sub">Control which capabilities are visible in mobile apps.</p>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">
          Features could not be loaded. Please refresh and try again.
        </p>
      ) : null}

      {(["Authentication", "Payments", "Services"] as const).map((category) => (
        <Card key={category} className="rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {grouped[category].map((feature) => {
              const featureState = flags[feature.key];
              const enabled = featureState?.enabled === true;
              const updatedByLabel = featureState?.updatedBy
                ? `${featureState.updatedBy.adminName} (${featureState.updatedBy.adminEmail})`
                : "System default";
              return (
                <div
                  key={feature.key}
                  className="flex items-center justify-between gap-3 border border-border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{feature.label}</p>
                      <Badge variant={enabled ? "white" : "gray"}>
                        {enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{feature.description}</p>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Last updated by {updatedByLabel} on {formatUpdatedAt(featureState?.updatedAt ?? null)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isSaving && pendingFeatureKey === feature.key ? (
                      <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    <Switch
                      checked={enabled}
                      disabled={isLoading || isSaving}
                      aria-label={`${feature.label}: ${enabled ? "enabled" : "disabled"}`}
                      onCheckedChange={(nextEnabled) => {
                        if (nextEnabled !== enabled) {
                          void onSetFeature(feature.key, nextEnabled);
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-4 animate-spin" />
                Loading feature flags…
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </article>
  );
}
