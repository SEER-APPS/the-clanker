"use client";

import {
  useGetBalancesQuery,
  useGetHubtelBalanceQuery,
  useGetReloadlyBalanceQuery,
  usePostVerifyNumberMutation,
} from "@/store/admin-api";
import { ServiceOrderResendButton } from "@/components/admin/service-order-resend-button";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type BalancesPayload = {
  hubtelSpent?: number;
  hubtelCommission?: number;
  hubtelNetCost?: number;
  hubtelPending?: number;
  hubtelConfigured?: boolean;
  ordersTotal?: number;
  ordersDelivered?: number;
  ordersPending?: number;
  ordersFailed?: number;
  revenueCollected?: number;
  deliveryCost?: number;
  totalMarkup?: number;
  recentOrders?: RecentOrder[];
};

type RecentOrder = {
  uuid: string;
  product?: string;
  product_label?: string;
  recipient?: string;
  recipient_name?: string | null;
  charged_amount?: number;
  delivery_amount?: number;
  markup?: number;
  status?: string;
  created_human?: string | null;
};

export default function BalancesPage(): React.ReactElement {
  const { data: summary, isLoading, refetch: refetchBalances } = useGetBalancesQuery();
  const { data: reloadly, refetch: refetchReloadly, isFetching: reloadlyBalanceFetching } =
    useGetReloadlyBalanceQuery();
  const {
    data: hubtelBalance,
    refetch: refetchHubtelBalance,
    isFetching: hubtelBalanceFetching,
  } = useGetHubtelBalanceQuery();
  const [verify, { isLoading: verifying }] = usePostVerifyNumberMutation();
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [mode, setMode] = useState("both");
  const [verifyResult, setVerifyResult] = useState<unknown>(null);

  const payload = (summary && typeof summary === "object"
    ? (summary as BalancesPayload)
    : undefined) satisfies BalancesPayload | undefined;

  const reloadlyData = (reloadly && typeof reloadly === "object"
    ? (reloadly as Record<string, unknown>)
    : undefined) satisfies Record<string, unknown> | undefined;

  const hubtelLive = (hubtelBalance && typeof hubtelBalance === "object"
    ? (hubtelBalance as {
        amount?: unknown;
        responseCode?: unknown;
        message?: unknown;
        collection?: { amount?: unknown; responseCode?: unknown; message?: unknown; error?: unknown };
        disbursement?: { amount?: unknown; responseCode?: unknown; message?: unknown; error?: unknown };
      })
    : undefined) satisfies
    | {
        amount?: unknown;
        responseCode?: unknown;
        message?: unknown;
        collection?: { amount?: unknown; responseCode?: unknown; message?: unknown; error?: unknown };
        disbursement?: { amount?: unknown; responseCode?: unknown; message?: unknown; error?: unknown };
      }
    | undefined;

  const collectionBalance = hubtelLive?.collection?.amount ?? null;
  const disbursementBalance =
    hubtelLive?.disbursement?.amount ?? hubtelLive?.amount ?? null;

  async function onVerify(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await verify({
        phone,
        network: network || undefined,
        mode,
      }).unwrap();
      setVerifyResult(res);
      toast.success("Lookup completed.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Verify failed.")
          : "Verify failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <AdminPageHeader
          title="Provider Balances"
          subtitle="Monitor funds across Hubtel and Reloadly — and verify customer numbers"
        />
        <Link
          href="/services/orders/failures"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Resend failed deliveries
        </Link>
      </header>

      {isLoading || !payload ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="rounded-none p-3">
              <div className="bg-muted h-6 w-24 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-28 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-40 animate-pulse rounded" />
            </Card>
          ))}
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard
              label="Revenue Collected"
              value={`GHS ${formatMoney(payload.revenueCollected)}`}
              note="Charged to customers (delivered orders)"
            />
            <KpiCard
              label="Delivery Cost"
              value={`GHS ${formatMoney(payload.deliveryCost)}`}
              note="Paid out via Hubtel Commission Services"
            />
            <KpiCard
              label="Markup Earned"
              value={`GHS ${formatMoney(payload.totalMarkup)}`}
              note="Revenue minus delivery cost"
            />
            <KpiCard
              label="Hubtel Commission"
              value={`GHS ${formatMoney(payload.hubtelCommission, 4)}`}
              note="Commission credited back from Hubtel"
            />
            <KpiCard
              label="Hubtel Pending"
              value={`GHS ${formatMoney(payload.hubtelPending)}`}
              note="Pending Commission Services transactions"
            />
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total Orders" value={String(payload.ordersTotal ?? 0)} />
            <StatCard label="Delivered" value={String(payload.ordersDelivered ?? 0)} />
            <StatCard label="In Progress" value={String(payload.ordersPending ?? 0)} />
            <Link href="/services/orders/failures" className="block">
              <StatCard label="Failed / stuck" value={String(payload.ordersFailed ?? 0)} />
            </Link>
          </section>
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="admin-card-title">Reloadly Account Balance</CardTitle>
            <Button
              type="button"
              variant="ghost"
              disabled={reloadlyBalanceFetching}
              aria-busy={reloadlyBalanceFetching}
              onClick={() => {
                void refetchReloadly();
              }}
            >
              {reloadlyBalanceFetching ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </CardHeader>
          <CardContent className="py-4">
            {reloadlyData ? (
              <div className="space-y-1">
                <div className="text-primary text-2xl font-semibold">
                  {String(reloadlyData.currencyCode ?? "USD")}{" "}
                  {formatMoney(Number(reloadlyData.balance ?? 0))}
                </div>
                <div className="text-muted-foreground text-xs">
                  Country: {String(reloadlyData.countryCode ?? "—")} &nbsp;|&nbsp; Currency:{" "}
                  {String(reloadlyData.currencyName ?? "—")}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Click Refresh to fetch live balance.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">Hubtel Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={hubtelBalanceFetching}
                aria-busy={hubtelBalanceFetching}
                onClick={() => {
                  void refetchHubtelBalance();
                }}
              >
                {hubtelBalanceFetching ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Refreshing…
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            {hubtelLive ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 rounded-md border p-3">
                  <div className="text-sm font-medium">Collection account</div>
                  <div className="text-primary text-2xl font-semibold">
                    GHS {formatMoney(collectionBalance)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Customer MoMo payments land here
                  </div>
                </div>
                <div className="space-y-1 rounded-md border p-3">
                  <div className="text-sm font-medium">Disbursement (prepaid)</div>
                  <div className="text-primary text-2xl font-semibold">
                    GHS {formatMoney(disbursementBalance)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Used for airtime, data, and bill delivery
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Click Refresh to fetch live Hubtel balances.</p>
            )}

            <div className="bg-muted rounded-md p-3 text-sm">
              <span className="font-semibold">Net Hubtel cost to date:</span>{" "}
              <span className="text-destructive font-semibold">
                GHS {formatMoney(payload?.hubtelNetCost)}
              </span>{" "}
              <span className="text-muted-foreground text-xs">
                (spent minus commission returned)
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Number Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          <form
            className="grid gap-3 lg:grid-cols-4 lg:items-end"
            onSubmit={(e) => {
              void onVerify(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="v-phone">Phone number</Label>
              <Input
                id="v-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
                required
                placeholder="e.g. 0548496120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-network">Network (auto-detected)</Label>
              <select
                id="v-network"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                }}
              >
                <option value="">Auto-detect</option>
                <option value="mtn">MTN</option>
                <option value="telecel">Telecel</option>
                <option value="at">AirtelTigo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-mode">Verification mode</Label>
              <select
                id="v-mode"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                }}
              >
                <option value="both">Both (SIM + MoMo)</option>
                <option value="msisdn">SIM name only</option>
                <option value="momo">MoMo wallet only</option>
              </select>
            </div>
            <Button type="submit" disabled={verifying} aria-busy={verifying}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                "Verify Number"
              )}
            </Button>
          </form>

          {verifyResult !== null ? (
            <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word">
              {JSON.stringify(verifyResult, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
          <div>
            <CardTitle className="admin-card-title">Recent Service Orders</CardTitle>
            <p className="text-muted-foreground text-xs">Payment-first orders from the public API</p>
          </div>
          <Link href="/services/orders/failures" className={buttonVariants({ variant: "outline", size: "sm" })}>
            All delivery failures
          </Link>
        </CardHeader>
        <CardContent className="py-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Charged</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payload?.recentOrders ?? []).length ? (
                  (payload?.recentOrders ?? []).map((o) => (
                    <TableRow key={o.uuid} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="text-sm font-medium">
                          {o.product_label ?? o.product ?? "—"}
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">{o.uuid}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {o.recipient ?? "—"}
                        {o.recipient_name ? (
                          <div className="text-muted-foreground font-sans text-[11px]">
                            {o.recipient_name}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">
                        GHS {formatMoney(o.charged_amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        GHS {formatMoney(o.delivery_amount)}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-medium">
                        GHS {formatMoney(o.markup, 4)}
                      </TableCell>
                      <TableCell className="text-sm">{formatStatus(o.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {o.created_human ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ServiceOrderResendButton
                          orderUuid={o.uuid}
                          status={o.status}
                          onCompleted={() => {
                            void refetchBalances();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                      No service orders yet. Orders appear here when customers pay via the API.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

function KpiCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}): React.ReactElement {
  return (
    <Card className="rounded-none p-3">
      <div className="text-primary text-xl font-semibold">{value}</div>
      <div className="text-muted-foreground mt-1 text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </div>
      <div className="text-muted-foreground mt-1 text-[11px] leading-relaxed">{note}</div>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <Card className="rounded-none p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-muted-foreground mt-1 text-xs">{label}</div>
    </Card>
  );
}

function formatMoney(value: unknown, decimals: number = 2): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
}

function formatStatus(status: unknown): string {
  const s = String(status ?? "");
  if (!s) return "—";
  return s.replaceAll("_", " ");
}
