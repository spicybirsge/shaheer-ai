"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);
export const modelScores = [
  { name: "Shaheer 1.0 Flash", score: 99.8 },
  { name: "GPT 6 Astra", score: 89.4 },
  { name: "Claude Fable 5.2", score: 86.7 },
];
export function ModelCharts() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const text = dark ? "#a3a3a3" : "#525252";
  const grid = dark ? "#ffffff12" : "#00000012";
  const primary = dark ? "#ededed" : "#262626";
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Beyond the benchmark.</CardTitle>
          <CardDescription>
            S-Intelligence frontier model comparison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar
              aria-label="S-Intelligence comparison: Shaheer 1.0 Flash 99.8, GPT 6 Astra 89.4, Claude Fable 5.2 86.7."
              data={{
                labels: modelScores.map((b) => b.name),
                datasets: [
                  {
                    label: "Score",
                    data: modelScores.map((b) => b.score),
                    backgroundColor: [
                      primary,
                      dark ? "#525252" : "#a3a3a3",
                      dark ? "#383838" : "#d4d4d4",
                    ],
                    borderRadius: 5,
                    barThickness: 28,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                animation: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: false },
                },
                scales: {
                  x: {
                    min: 0,
                    max: 100,
                    ticks: { color: text },
                    grid: { color: grid },
                  },
                  y: {
                    ticks: { color: text, font: { size: 10 } },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
          <details className="mt-4 text-xs text-muted-foreground">
            <summary>View data</summary>
            <table className="mt-3 w-full text-left">
              <caption className="sr-only">S-Intelligence model comparison</caption>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {modelScores.map((b) => (
                  <tr key={b.name}>
                    <td className="py-2">{b.name}</td>
                    <td>{b.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>A different scale of ambition.</CardTitle>
          <CardDescription>
            Architecture scale. Capacity in trillions of parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line
              aria-label="Architecture scale: versions 0.1 to 1.0, from 2 to 128 trillion parameters."
              data={{
                labels: ["0.1", "0.3", "0.5", "0.8", "1.0"],
                datasets: [
                  {
                    label: "Parameters (T)",
                    data: [2, 8, 24, 64, 128],
                    borderColor: primary,
                    backgroundColor: dark ? "#ffffff0c" : "#0000000c",
                    pointBackgroundColor: primary,
                    pointRadius: 4,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: false },
                },
                scales: {
                  x: {
                    ticks: { color: text },
                    grid: { display: false },
                    title: {
                      display: true,
                      text: "Model version",
                      color: text,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: text, callback: (value) => `${value}T` },
                    grid: { color: grid },
                  },
                },
              }}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Model versions: 0.1 → 2T · 0.3 → 8T · 0.5 → 24T · 0.8 → 64T · 1.0 →
            128T.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
