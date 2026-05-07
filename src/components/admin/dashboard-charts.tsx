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

const BLACK = "#0a0a0a";
const GRAYS = ["#0a0a0a", "#2e2e2e", "#4a4a4a", "#6b6b6b", "#9a9a9a", "#c4c4c4", "#e0e0e0"];

const sharedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        color: "#6b6b6b",
        font: { family: "var(--font-mono)", size: 10 },
      },
    },
  },
};

export function DashboardCharts({
  charts,
}: {
  charts: DashboardPayload["charts"];
}): React.ReactElement {
  return (
    <section className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="min-h-[280px] rounded-none">
          <CardHeader className="border-b py-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle className="admin-card-title">User Growth — Last 30 Days</CardTitle>
              <span className="text-[11px] text-muted-foreground">Daily registrations</span>
            </div>
          </CardHeader>
          <CardContent className="h-[220px] px-5 py-4">
          <Line
            data={{
              labels: charts.user_growth.labels,
              datasets: [
                {
                  label: "New users",
                  data: charts.user_growth.data,
                  borderColor: BLACK,
                  backgroundColor: "rgba(10,10,10,0.06)",
                  fill: true,
                  tension: 0.3,
                  borderWidth: 1.5,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: BLACK,
                },
              ],
            }}
            options={{
              ...sharedOptions,
              plugins: { ...sharedOptions.plugins, legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
                y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
              },
            }}
          />
        </CardContent>
        </Card>

        <Card className="min-h-[280px] rounded-none">
          <CardHeader className="border-b py-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle className="admin-card-title">Alert Status</CardTitle>
              <span className="text-[11px] text-muted-foreground">All time</span>
            </div>
          </CardHeader>
          <CardContent className="flex h-[220px] items-center justify-center px-5 py-4">
            <div className="h-[180px] w-[180px]">
              <Doughnut
                data={{
                  labels: charts.alerts_by_status.labels,
                  datasets: [
                    {
                      data: charts.alerts_by_status.data,
                      backgroundColor: GRAYS.slice(0, charts.alerts_by_status.labels.length),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  ...sharedOptions,
                  cutout: "70%",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        <Card className="min-h-[260px] rounded-none">
          <CardHeader className="border-b py-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle className="admin-card-title">Messages — Last 24 Hours</CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Hourly breakdown · messages auto-deleted after 24h
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[180px] px-5 py-4">
          <Bar
            data={{
              labels: charts.messages_by_hour.labels,
              datasets: [
                {
                  label: "Messages",
                  data: charts.messages_by_hour.data,
                  backgroundColor: "rgba(10,10,10,0.18)",
                  borderColor: BLACK,
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              ...sharedOptions,
              plugins: { ...sharedOptions.plugins, legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
                y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
              },
            }}
          />
        </CardContent>
        </Card>

        <Card className="min-h-[260px] rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">Alert Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[180px] px-5 py-4">
            <Bar
              data={{
                labels: charts.alerts_by_type.labels,
                datasets: [
                  {
                    label: "Alerts",
                    data: charts.alerts_by_type.data,
                    backgroundColor: GRAYS.slice(0, charts.alerts_by_type.labels.length).map(
                      (c) => `${c}cc`,
                    ),
                    borderColor: GRAYS.slice(0, charts.alerts_by_type.labels.length),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                ...sharedOptions,
                plugins: { ...sharedOptions.plugins, legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
                  y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { color: "#6b6b6b", font: { size: 10 } } },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[260px] rounded-none">
          <CardHeader className="border-b py-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle className="admin-card-title">Push Delivery</CardTitle>
              <span className="text-[11px] text-muted-foreground">7 days</span>
            </div>
          </CardHeader>
          <CardContent className="flex h-[180px] items-center justify-center px-5 py-4">
            <div className="h-[140px] w-[140px]">
              <Doughnut
                data={{
                  labels: charts.notifications_by_status.labels,
                  datasets: [
                    {
                      data: charts.notifications_by_status.data,
                      backgroundColor: GRAYS.slice(0, charts.notifications_by_status.labels.length),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  ...sharedOptions,
                  cutout: "70%",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
