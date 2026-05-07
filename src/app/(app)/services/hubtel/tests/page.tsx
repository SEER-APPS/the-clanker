"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useHubtelTestSmsMutation,
  useHubtelTestSmsBatchMutation,
  useHubtelTestAirtimeMutation,
  useHubtelQueryBundlesMutation,
  useHubtelTestDataBundleMutation,
  useHubtelQueryUtilityMutation,
  useHubtelTestUtilityMutation,
  useHubtelTestTvMutation,
  useHubtelTestCheckoutMutation,
  useHubtelStatusCheckMutation,
  useHubtelRefundMutation,
  useHubtelSyncPendingMutation,
} from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function HubtelTestsPage(): React.ReactElement {
  const [out, setOut] = useState<unknown>(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [batchRecipients, setBatchRecipients] = useState("");
  const [airDest, setAirDest] = useState("");
  const [airAmt, setAirAmt] = useState("");
  const [airNet, setAirNet] = useState("mtn");
  const [bDest, setBDest] = useState("");
  const [bNet, setBNet] = useState("mtn");
  const [dataBundleJson, setDataBundleJson] = useState("{}");
  const [utilityQueryJson, setUtilityQueryJson] = useState("{}");
  const [utilityTestJson, setUtilityTestJson] = useState("{}");
  const [tvJson, setTvJson] = useState("{}");
  const [checkoutJson, setCheckoutJson] = useState("{}");
  const [statusJson, setStatusJson] = useState("{}");
  const [refundJson, setRefundJson] = useState("{}");

  const [sms] = useHubtelTestSmsMutation();
  const [smsBatch] = useHubtelTestSmsBatchMutation();
  const [air] = useHubtelTestAirtimeMutation();
  const [qBundle] = useHubtelQueryBundlesMutation();
  const [dataBundle] = useHubtelTestDataBundleMutation();
  const [qUtil] = useHubtelQueryUtilityMutation();
  const [tUtil] = useHubtelTestUtilityMutation();
  const [tTv] = useHubtelTestTvMutation();
  const [tCheckout] = useHubtelTestCheckoutMutation();
  const [status] = useHubtelStatusCheckMutation();
  const [refund] = useHubtelRefundMutation();
  const [sync] = useHubtelSyncPendingMutation();

  function show(res: unknown): void {
    setOut(res);
  }

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/services/hubtel"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back to Hubtel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hubtel tools</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          These calls hit live provider endpoints. Use staging credentials when available.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMS</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={smsPhone}
                onChange={(e) => {
                  setSmsPhone(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Message</Label>
              <Input
                value={smsMsg}
                onChange={(e) => {
                  setSmsMsg(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={async () => {
                try {
                  const res = await sms({ phone: smsPhone, message: smsMsg }).unwrap();
                  show(res);
                  toast.success("SMS request finished.");
                } catch (e) {
                  toast.error(failMsg(e));
                }
              }}
            >
              Send SMS
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const res = await smsBatch({
                    recipients: batchRecipients,
                    message: smsMsg,
                  }).unwrap();
                  show(res);
                  toast.success("Batch finished.");
                } catch (e) {
                  toast.error(failMsg(e));
                }
              }}
            >
              SMS batch
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Batch recipients (comma-separated)</Label>
            <Input
              value={batchRecipients}
              onChange={(e) => {
                setBatchRecipients(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Airtime test</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Destination</Label>
            <Input
              value={airDest}
              onChange={(e) => {
                setAirDest(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              value={airAmt}
              onChange={(e) => {
                setAirAmt(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Network</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={airNet}
              onChange={(e) => {
                setAirNet(e.target.value);
              }}
            >
              <option value="mtn">mtn</option>
              <option value="telecel">telecel</option>
              <option value="at">at</option>
            </select>
          </div>
          <Button
            type="button"
            className="md:col-span-3"
            onClick={async () => {
              try {
                const res = await air({
                  destination: airDest,
                  amount: Number(airAmt),
                  network: airNet,
                }).unwrap();
                show(res);
                toast.success("Airtime test sent.");
              } catch (e) {
                toast.error(failMsg(e));
              }
            }}
          >
            Run airtime
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Query data bundles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={bDest}
                onChange={(e) => {
                  setBDest(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <select
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={bNet}
                onChange={(e) => {
                  setBNet(e.target.value);
                }}
              >
                <option value="mtn">mtn</option>
                <option value="telecel">telecel</option>
                <option value="at">at</option>
                <option value="broadband_telecel">broadband_telecel</option>
              </select>
            </div>
          </div>
          <Button
            type="button"
            onClick={async () => {
              try {
                const res = await qBundle({ destination: bDest, network: bNet }).unwrap();
                show(res);
                toast.success("Bundles loaded.");
              } catch (e) {
                toast.error(failMsg(e));
              }
            }}
          >
            Query bundles
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data bundle purchase (JSON body)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="font-mono text-xs"
            rows={6}
            value={dataBundleJson}
            onChange={(e) => {
              setDataBundleJson(e.target.value);
            }}
          />
          <Button
            type="button"
            onClick={async () => {
              try {
                const body = JSON.parse(dataBundleJson) as Record<string, unknown>;
                const res = await dataBundle(body).unwrap();
                show(res);
                toast.success("Data bundle call finished.");
              } catch (e) {
                toast.error(e instanceof SyntaxError ? "Invalid JSON." : failMsg(e));
              }
            }}
          >
            Run data bundle test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utility query / test (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Query body</Label>
            <Textarea
              className="font-mono text-xs"
              rows={4}
              value={utilityQueryJson}
              onChange={(e) => {
                setUtilityQueryJson(e.target.value);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const body = JSON.parse(utilityQueryJson) as Record<string, unknown>;
                  const res = await qUtil(body).unwrap();
                  show(res);
                  toast.success("Utility query done.");
                } catch (e) {
                  toast.error(e instanceof SyntaxError ? "Invalid JSON." : failMsg(e));
                }
              }}
            >
              Query utility
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Test body</Label>
            <Textarea
              className="font-mono text-xs"
              rows={4}
              value={utilityTestJson}
              onChange={(e) => {
                setUtilityTestJson(e.target.value);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const body = JSON.parse(utilityTestJson) as Record<string, unknown>;
                  const res = await tUtil(body).unwrap();
                  show(res);
                  toast.success("Utility test done.");
                } catch (e) {
                  toast.error(e instanceof SyntaxError ? "Invalid JSON." : failMsg(e));
                }
              }}
            >
              Test utility
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TV / checkout / status / refund (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JsonBlock
            label="TV test body"
            value={tvJson}
            onChange={setTvJson}
            onRun={async () => {
              const body = JSON.parse(tvJson) as Record<string, unknown>;
              show(await tTv(body).unwrap());
            }}
          />
          <JsonBlock
            label="Checkout test body"
            value={checkoutJson}
            onChange={setCheckoutJson}
            onRun={async () => {
              const body = JSON.parse(checkoutJson) as Record<string, unknown>;
              show(await tCheckout(body).unwrap());
            }}
          />
          <JsonBlock
            label="Status check body"
            value={statusJson}
            onChange={setStatusJson}
            onRun={async () => {
              const body = JSON.parse(statusJson) as Record<string, unknown>;
              show(await status(body).unwrap());
            }}
          />
          <JsonBlock
            label="Refund body"
            value={refundJson}
            onChange={setRefundJson}
            onRun={async () => {
              const body = JSON.parse(refundJson) as Record<string, unknown>;
              show(await refund(body).unwrap());
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync pending</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={async () => {
              try {
                const res = await sync().unwrap();
                show(res);
                toast.success("Sync invoked.");
              } catch (e) {
                toast.error(failMsg(e));
              }
            }}
          >
            Run sync-pending
          </Button>
        </CardContent>
      </Card>

      {out !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(out, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </article>
  );
}

function JsonBlock({
  label,
  value,
  onChange,
  onRun,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onRun: () => Promise<void>;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        className="font-mono text-xs"
        rows={4}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void (async () => {
            try {
              await onRun();
              toast.success("OK");
            } catch (e) {
              toast.error(e instanceof SyntaxError ? "Invalid JSON." : failMsg(e));
            }
          })();
        }}
      >
        Run
      </Button>
    </div>
  );
}

function failMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const m = (e as { data?: { message?: string } }).data?.message;
    if (m) {
      return m;
    }
  }
  return "Request failed.";
}
