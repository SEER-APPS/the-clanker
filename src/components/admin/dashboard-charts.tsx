"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { DashboardPayload } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: "bottom" as const },
  },
};

export function DashboardCharts({
  charts,
}: {
  charts: DashboardPayload["charts"];
}): React.ReactElement {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle className="text-base">User signups (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <Line
            data={{
              labels: charts.user_growth.labels,
              datasets: [
                {
                  label: "New users",
                  data: charts.user_growth.data,
                  borderColor: "oklch(0.35 0.15 264)",
                  backgroundColor: "oklch(0.55 0.12 264 / 0.2)",
                  fill: true,
                  tension: 0.25,
                },
              ],
            }}
            options={chartOptions}
          />
        </CardContent>
      </Card>
      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle className="text-base">Messages by hour (24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <Bar
            data={{
              labels: charts.messages_by_hour.labels,
              datasets: [
                {
                  label: "Messages",
                  data: charts.messages_by_hour.data,
                  backgroundColor: "oklch(0.45 0.08 200)",
                },
              ],
            }}
            options={chartOptions}
          />
        </CardContent>
      </Card>
      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle className="text-base">Alerts by type</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[220px] justify-center">
          <Doughnut
            data={{
              labels: charts.alerts_by_type.labels,
              datasets: [
                {
                  data: charts.alerts_by_type.data,
                  backgroundColor: [
                    "oklch(0.55 0.18 27)",
                    "oklch(0.55 0.15 264)",
                    "oklch(0.55 0.12 145)",
                    "oklch(0.55 0.1 85)",
                    "oklch(0.5 0.05 280)",
                  ],
                },
              ],
            }}
            options={chartOptions}
          />
        </CardContent>
      </Card>
      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle className="text-base">Notifications by status (7 days)</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[220px] justify-center">
          <Doughnut
            data={{
              labels: charts.notifications_by_status.labels,
              datasets: [
                {
                  data: charts.notifications_by_status.data,
                  backgroundColor: [
                    "oklch(0.45 0.12 145)",
                    "oklch(0.55 0.18 27)",
                    "oklch(0.5 0.08 250)",
                  ],
                },
              ],
            }}
            options={chartOptions}
          />
        </CardContent>
      </Card>
    </section>
  );
}
