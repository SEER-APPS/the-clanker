"use client";

import { useState } from "react";
import { HubtelServiceTransactionsCard } from "@/components/hubtel/hubtel-service-transactions-card";
import { Label } from "@/components/ui/label";
import { HUBTEL_UTILITY_FILTER_OPTIONS } from "@/lib/hubtel-admin-products";

export default function PrepaidPage(): React.ReactElement {
  const [utilityProduct, setUtilityProduct] = useState("");

  const utilityFilter = (
    <div className="space-y-2">
      <Label htmlFor="utility-product">Utility / TV</Label>
      <select
        id="utility-product"
        className="border-input bg-background h-9 min-w-[220px] rounded-md border px-3 text-sm"
        value={utilityProduct}
        onChange={(e) => {
          setUtilityProduct(e.target.value);
        }}
      >
        {HUBTEL_UTILITY_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Prepaid &amp; utilities</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hubtel Commission Services — electricity, water, TV, and related bill payments.
        </p>
      </header>

      <HubtelServiceTransactionsCard
        key={utilityProduct || "all-utilities"}
        title="Utility transactions"
        productGroup={utilityProduct ? undefined : "utilities"}
        product={utilityProduct || undefined}
        utilityProductFilter={utilityFilter}
      />
    </article>
  );
}
