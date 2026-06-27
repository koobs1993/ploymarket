import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { teamKey } from "../api";
import type { TrendChartPoint, TrendSeries } from "../types";

interface TrendChartProps {
  series: TrendSeries[];
  chartData: TrendChartPoint[];
  loading: boolean;
  isLive: boolean;
  lastUpdated: number | null;
  compact?: boolean;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

function dedupeTooltipPayload(payload: TooltipPayload[]): TooltipPayload[] {
  const byName = new Map<string, TooltipPayload>();

  for (const entry of payload) {
    const key = String(entry.name ?? "").toLowerCase();
    const existing = byName.get(key);
    const isProperName = entry.name.length > 0 && entry.name[0] === entry.name[0].toUpperCase();

    if (!existing || (isProperName && existing.name === existing.name.toLowerCase())) {
      byName.set(key, entry);
    }
  }

  return Array.from(byName.values());
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const items = dedupeTooltipPayload(payload);

  return (
    <div className="hero-chart__tooltip">
      <div className="hero-chart__tooltip-label">{label}</div>
      {items.map((entry) => (
        <div key={entry.name} className="hero-chart__tooltip-row">
          <span
            className="hero-chart__tooltip-dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="hero-chart__tooltip-name">{entry.name}</span>
          <span className="hero-chart__tooltip-value">
            {entry.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function formatUpdatedAt(timestamp: number | null): string {
  if (!timestamp) return "Connecting…";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TrendChart({
  series,
  chartData,
  loading,
  isLive,
  lastUpdated,
  compact = false,
}: TrendChartProps) {
  if (loading) {
    return <div className="hero-chart hero-chart--loading">Loading trends…</div>;
  }

  if (chartData.length === 0 || series.length === 0) {
    return <div className="hero-chart hero-chart--loading">No trend data yet</div>;
  }

  const values = chartData.flatMap((point) =>
    series
      .map((team) => point[teamKey(team.title)])
      .filter((value): value is number => typeof value === "number"),
  );

  const yMin = Math.max(0, Math.floor(Math.min(...values) - 2));
  const yMax = Math.ceil(Math.max(...values) + 2);

  return (
    <div className={`hero-chart ${compact ? "hero-chart--compact" : ""}`}>
      <div className="hero-chart__header">
        <div className={`hero-chart__live ${isLive ? "hero-chart__live--on" : ""}`}>
          <span className="hero-chart__live-dot" />
          <span>{isLive ? "Live" : "Connecting"}</span>
          <span className="hero-chart__live-time">{formatUpdatedAt(lastUpdated)}</span>
        </div>
      </div>

      <div className="hero-chart__canvas">
        <ResponsiveContainer width="100%" height={compact ? 220 : 300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((team) => (
                <linearGradient
                  key={team.id}
                  id={`gradient-${team.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={team.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={team.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="4 6" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 11 }}
              minTickGap={40}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 11 }}
              domain={[yMin, yMax]}
              tickFormatter={(value) => `${value}%`}
              width={42}
            />
            <Tooltip
              cursor={{ stroke: "#404040", strokeDasharray: "4 4" }}
              content={<ChartTooltip />}
            />

            {series.map((team) => {
              const key = teamKey(team.title);
              return (
                <Area
                  key={`area-${team.id}`}
                  type="monotone"
                  dataKey={key}
                  name={team.title}
                  stroke="none"
                  fill={`url(#gradient-${team.id})`}
                  connectNulls
                  isAnimationActive={false}
                  hide
                />
              );
            })}

            {series.map((team) => {
              const key = teamKey(team.title);
              return (
                <Line
                  key={`line-${team.id}`}
                  type="monotone"
                  dataKey={key}
                  name={team.title}
                  stroke={team.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: team.color,
                    strokeWidth: 2,
                    fill: "#000",
                  }}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
