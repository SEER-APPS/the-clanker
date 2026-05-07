"use client";

import Link from "next/link";
import { useGetHubtelSummaryQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HubtelSummaryPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetHubtelSummaryQuery();

  const recent = (data?.recent_transactions ?? []) as Record<string, unknown>[];
  const counts = (data?.counts ?? {}) as Record<string, unknown>;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hubtel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Programmable services overview and quick links.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/services/hubtel/transactions"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            All transactions
          </Link>
          <Link
            href="/services/hubtel/tests"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Tools and tests
          </Link>
        </div>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">Could not load Hubtel summary.</p>
      ) : null}

      {isLoading || !data ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Configured</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Prepaid API: {data.is_configured === true ? "yes" : "no"}</p>
                <p>Refund: {data.refund_configured === true ? "yes" : "no"}</p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Counts</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
                  {JSON.stringify(counts, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => {
                    const id = String(r.id ?? "");
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/services/hubtel/transactions/${id}`}
                            className="text-primary hover:underline"
                          >
                            {id}
                          </Link>
                        </TableCell>
                        <TableCell>{String(r.product ?? "—")}</TableCell>
                        <TableCell>{String(r.status ?? "—")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Config snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
                {JSON.stringify(data.config ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </article>
  );
}
