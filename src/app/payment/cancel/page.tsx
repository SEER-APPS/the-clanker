import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payment cancelled — Seer Admin",
  description: "Checkout was cancelled",
};

export default function PaymentCancelPage(): React.ReactElement {
  const ghost = buttonVariants({
    variant: "outline",
    size: "default",
  });
  const primary = buttonVariants({
    variant: "default",
    size: "default",
  });

  return (
    <main className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg border shadow-sm">
        <CardHeader className="text-center">
          <div
            className="border-muted-foreground/40 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 text-muted-foreground"
            aria-hidden="true"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </div>
          <CardTitle className="text-xl font-semibold">
            Payment cancelled
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            You cancelled the payment. No money was taken from your account.
            You can try again whenever you&apos;re ready.
          </p>
        </CardHeader>
        <CardContent>
          <nav className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className={cn(ghost)}>
              Dashboard
            </Link>
            <Link href="/services/hubtel/tests" className={cn(primary)}>
              Hubtel tools
            </Link>
          </nav>
        </CardContent>
      </Card>
    </main>
  );
}
