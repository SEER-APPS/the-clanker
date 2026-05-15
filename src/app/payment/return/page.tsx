import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentReturnClient } from "@/app/payment/return/payment-return-client";

export const metadata: Metadata = {
  title: "Payment return — Seer Admin",
  description: "Hubtel checkout return and order status",
};

export default function PaymentReturnPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <main className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
          <p className="text-muted-foreground text-sm" aria-busy="true">
            Loading payment status…
          </p>
        </main>
      }
    >
      <PaymentReturnClient />
    </Suspense>
  );
}
