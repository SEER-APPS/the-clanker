"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DetailField = {
  label: string;
  value: string;
  mono?: boolean;
};

export function HubtelDetailSection({
  title,
  fields,
}: {
  title: string;
  fields: DetailField[];
}): React.ReactElement | null {
  if (fields.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={`${title}-${field.label}`} className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {field.label}
              </dt>
              <dd
                className={`text-sm break-all ${field.mono ? "font-mono text-xs" : ""}`}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
