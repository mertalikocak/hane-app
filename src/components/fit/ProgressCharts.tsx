"use client";

import { useState, useMemo, useRef } from "react";
import { FullMeasurementRecord } from "@/domain/bodyTrackingTypes";

interface ProgressChartsProps {
  records: FullMeasurementRecord[];
  gender: "male" | "female";
}

type MetricType = "weight" | "bodyFat" | "waist";

interface MetricConfig {
  key: MetricType;
  title: string;
  unit: string;
  icon: string;
  color: string;
  strokeColor: string;
  gradientFrom: string;
  gradientTo: string;
  extractValue: (rec: FullMeasurementRecord) => number | null | undefined;
}

const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  weight: {
    key: "weight",
    title: "Kilo Değişimi",
    unit: "kg",
    icon: "⚖️",
    color: "emerald",
    strokeColor: "#10b981", // emerald-500
    gradientFrom: "rgba(16, 185, 129, 0.35)",
    gradientTo: "rgba(16, 185, 129, 0.0)",
    extractValue: (rec) => rec.measurement.weight,
  },
  bodyFat: {
    key: "bodyFat",
    title: "Yağ Oranı Değişimi",
    unit: "%",
    icon: "🎯",
    color: "teal",
    strokeColor: "#14b8a6", // teal-500
    gradientFrom: "rgba(20, 184, 166, 0.35)",
    gradientTo: "rgba(20, 184, 166, 0.0)",
    extractValue: (rec) => rec.measurement.bodyFat,
  },
  waist: {
    key: "waist",
    title: "Bel Çevresi Değişimi",
    unit: "cm",
    icon: "📐",
    color: "blue",
    strokeColor: "#3b82f6", // blue-500
    gradientFrom: "rgba(59, 130, 246, 0.35)",
    gradientTo: "rgba(59, 130, 246, 0.0)",
    extractValue: (rec) => rec.measurement.waist,
  },
};

function formatTurkishShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatTurkishFullDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

interface DataPoint {
  id: string;
  date: string;
  formattedShortDate: string;
  formattedFullDate: string;
  value: number;
}

export function ProgressCharts({ records }: ProgressChartsProps) {
  const [activeTab, setActiveTab] = useState<MetricType>("weight");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sort chronological ascending (oldest to newest for progression graphs)
  const chronologicalRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(a.measurement.date).getTime() - new Date(b.measurement.date).getTime()
    );
  }, [records]);

  // Extract datasets for all 3 metrics
  const dataSeries = useMemo(() => {
    const getPointsForMetric = (cfg: MetricConfig): DataPoint[] => {
      const points: DataPoint[] = [];
      for (const rec of chronologicalRecords) {
        const val = cfg.extractValue(rec);
        if (val !== undefined && val !== null && !isNaN(val) && val > 0) {
          points.push({
            id: rec.measurement.id,
            date: rec.measurement.date,
            formattedShortDate: formatTurkishShortDate(rec.measurement.date),
            formattedFullDate: formatTurkishFullDate(rec.measurement.date),
            value: Number(val),
          });
        }
      }
      return points;
    };

    return {
      weight: getPointsForMetric(METRIC_CONFIGS.weight),
      bodyFat: getPointsForMetric(METRIC_CONFIGS.bodyFat),
      waist: getPointsForMetric(METRIC_CONFIGS.waist),
    };
  }, [chronologicalRecords]);

  const activeConfig = METRIC_CONFIGS[activeTab];
  const activeData = dataSeries[activeTab];
  const hasEnoughData = activeData.length >= 2;

  // Compute metric stats (Initial, Current, Min, Max, Total Change)
  const stats = useMemo(() => {
    if (activeData.length === 0) return null;

    const first = activeData[0].value;
    const latest = activeData[activeData.length - 1].value;
    const change = Number((latest - first).toFixed(1));
    const values = activeData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      first,
      latest,
      change,
      min,
      max,
      count: activeData.length,
    };
  }, [activeData]);

  // SVG Chart Geometry Calculations
  const chartGeometry = useMemo(() => {
    if (!hasEnoughData) return null;

    const width = 700;
    const height = 280;
    const padding = { top: 30, right: 35, bottom: 40, left: 55 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const values = activeData.map((d) => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    // Add safe buffer to Y-axis
    const range = dataMax - dataMin;
    const buffer = range === 0 ? Math.max(1, dataMax * 0.05) : range * 0.15;
    const yMin = Math.max(0, Math.floor((dataMin - buffer) * 10) / 10);
    const yMax = Math.ceil((dataMax + buffer) * 10) / 10;
    const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

    const points = activeData.map((d, index) => {
      const x = padding.left + (index / (activeData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.value - yMin) / yRange) * innerHeight;
      return { ...d, x, y, index };
    });

    // Generate smooth bezier curve path or straight polyline
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    // Generate closed area path for fill gradient
    const areaD = `${pathD} L ${points[points.length - 1].x} ${
      padding.top + innerHeight
    } L ${points[0].x} ${padding.top + innerHeight} Z`;

    // Horizontal Grid ticks (4 levels)
    const gridLevels = [0, 0.33, 0.66, 1];
    const yTicks = gridLevels.map((lvl) => {
      const val = yMin + lvl * yRange;
      const yPos = padding.top + innerHeight - lvl * innerHeight;
      return {
        value: Math.round(val * 10) / 10,
        y: yPos,
      };
    });

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      yMin,
      yMax,
      points,
      pathD,
      areaD,
      yTicks,
    };
  }, [activeData, hasEnoughData]);

  // Handle mouse move over SVG to find closest data point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartGeometry || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartGeometry.width;

    let closestIdx = 0;
    let minDistance = Infinity;

    chartGeometry.points.forEach((pt, i) => {
      const distance = Math.abs(pt.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    setHoveredPointIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredPointIndex(null);
  };

  const activeHoverPoint =
    chartGeometry && hoveredPointIndex !== null
      ? chartGeometry.points[hoveredPointIndex]
      : null;

  return (
    <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. Header & Metric Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>📈</span>
            <span>Gelişim ve İlerleme Grafikleri</span>
          </h3>
          <p className="text-xs text-muted">
            Vücut kompozisyonunuzdaki zaman içerisindeki değişim ve trend analizi
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-raised/80 p-1.5 rounded-2xl border border-border/60 self-start lg:self-auto">
          {(["weight", "bodyFat", "waist"] as MetricType[]).map((type) => {
            const cfg = METRIC_CONFIGS[type];
            const count = dataSeries[type].length;
            const isSelected = activeTab === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActiveTab(type);
                  setHoveredPointIndex(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-surface text-foreground shadow-xs border border-border"
                    : "text-muted hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.title.replace(" Değişimi", "")}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-surface-raised text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Stats Bar (If active metric has enough data) */}
      {hasEnoughData && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-in fade-in duration-200">
          {/* Başlangıç */}
          <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              İlk Kayıt ({formatTurkishShortDate(activeData[0].date)})
            </span>
            <div className="text-sm font-black text-foreground">
              {stats.first} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          {/* Güncel */}
          <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              Son Kayıt ({formatTurkishShortDate(activeData[activeData.length - 1].date)})
            </span>
            <div className="text-sm font-black text-foreground">
              {stats.latest} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          {/* Toplam Değişim */}
          <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              Net Değişim
            </span>
            <div
              className={`text-sm font-black ${
                stats.change < 0
                  ? "text-emerald-500"
                  : stats.change > 0
                  ? "text-amber-500"
                  : "text-muted"
              }`}
            >
              {stats.change > 0 ? `+${stats.change}` : stats.change}{" "}
              <span className="text-xs font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          {/* En Düşük */}
          <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              En Düşük
            </span>
            <div className="text-sm font-black text-foreground">
              {stats.min} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          {/* En Yüksek */}
          <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-3 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-muted block">
              En Yüksek
            </span>
            <div className="text-sm font-black text-foreground">
              {stats.max} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Chart Canvas Area OR Empty State */}
      {!hasEnoughData ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center bg-surface-raised/40 space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border/60 text-2xl shadow-xs">
            {activeConfig.icon}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-foreground">
              {activeConfig.title} İçin Yetersiz Veri
            </h4>
            <p className="text-xs text-muted">
              {activeData.length === 0
                ? `Henüz bu kategoriye ait (${activeConfig.title.toLowerCase()}) herhangi bir ölçüm verisi kaydedilmedi.`
                : `Grafik oluşturulabilmesi için en az 2 farklı tarihe ait ölçüm kaydı gereklidir. Şu anda 1 kayıt mevcut.`}
            </p>
          </div>
        </div>
      ) : (
        chartGeometry && (
          <div className="relative rounded-3xl border border-border/70 bg-surface-raised/30 p-4 sm:p-6 overflow-hidden">
            {/* Interactive Tooltip Card Overlay */}
            {activeHoverPoint && (
              <div
                className="absolute z-20 pointer-events-none rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md px-4 py-2.5 shadow-xl transition-all duration-75 space-y-0.5 text-left min-w-[140px]"
                style={{
                  left: `clamp(10px, ${
                    (activeHoverPoint.x / chartGeometry.width) * 100
                  }%, calc(100% - 150px))`,
                  top: "16px",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
                  <span className="text-[10px] font-bold text-muted">
                    📅 {activeHoverPoint.formattedShortDate}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    #{activeHoverPoint.index + 1}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-0.5">
                  <span className="text-lg font-black text-foreground">
                    {activeHoverPoint.value}
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {activeConfig.unit}
                  </span>
                </div>
                <div className="text-[10px] text-muted">
                  {activeHoverPoint.index > 0 ? (
                    (() => {
                      const prevVal = chartGeometry.points[activeHoverPoint.index - 1].value;
                      const diff = Number((activeHoverPoint.value - prevVal).toFixed(1));
                      return (
                        <span
                          className={`font-bold ${
                            diff < 0
                              ? "text-emerald-500"
                              : diff > 0
                              ? "text-amber-500"
                              : "text-muted"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} {activeConfig.unit} (önceki)
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-muted">İlk Başlangıç Kaydı</span>
                  )}
                </div>
              </div>
            )}

            {/* Responsive SVG Chart */}
            <div className="w-full aspect-[21/9] min-h-[220px] max-h-[340px]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                className="w-full h-full overflow-visible select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  {/* Glowing line gradient */}
                  <linearGradient
                    id={`gradient-area-${activeTab}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={activeConfig.gradientFrom} />
                    <stop offset="100%" stopColor={activeConfig.gradientTo} />
                  </linearGradient>

                  {/* Drop shadow for line curve */}
                  <filter id="glow-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow
                      dx="0"
                      dy="4"
                      stdDeviation="6"
                      floodColor={activeConfig.strokeColor}
                      floodOpacity="0.3"
                    />
                  </filter>
                </defs>

                {/* Horizontal Grid Lines and Y-Axis Ticks */}
                {chartGeometry.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={chartGeometry.padding.left}
                      y1={tick.y}
                      x2={chartGeometry.width - chartGeometry.padding.right}
                      y2={tick.y}
                      stroke="currentColor"
                      strokeOpacity={i === 0 ? "0.15" : "0.08"}
                      strokeDasharray={i === 0 ? "none" : "4 4"}
                      strokeWidth="1"
                    />
                    <text
                      x={chartGeometry.padding.left - 10}
                      y={tick.y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="bold"
                      className="fill-muted"
                    >
                      {tick.value}
                    </text>
                  </g>
                ))}

                {/* Gradient Area Under Curve */}
                <path
                  d={chartGeometry.areaD}
                  fill={`url(#gradient-area-${activeTab})`}
                  className="transition-all duration-300"
                />

                {/* Main Curved Line */}
                <path
                  d={chartGeometry.pathD}
                  fill="none"
                  stroke={activeConfig.strokeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-shadow)"
                  className="transition-all duration-300"
                />

                {/* Vertical Crosshair Line on Hover */}
                {activeHoverPoint && (
                  <line
                    x1={activeHoverPoint.x}
                    y1={chartGeometry.padding.top}
                    x2={activeHoverPoint.x}
                    y2={chartGeometry.height - chartGeometry.padding.bottom}
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* Data Points (Circles) */}
                {chartGeometry.points.map((pt, index) => {
                  const isHovered = hoveredPointIndex === index;
                  return (
                    <g key={pt.id} className="cursor-pointer">
                      {/* Outer pulse ring on hover */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="11"
                          fill={activeConfig.strokeColor}
                          fillOpacity="0.25"
                          className="animate-ping"
                        />
                      )}

                      {/* Main Point Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6.5" : "4.5"}
                        fill="#ffffff"
                        stroke={activeConfig.strokeColor}
                        strokeWidth={isHovered ? "3" : "2.5"}
                        className="transition-all duration-150 shadow-md"
                      />
                    </g>
                  );
                })}

                {/* X-Axis Date Labels (First, Middle, and Last or Key points) */}
                {chartGeometry.points.map((pt, index) => {
                  // Show date label for first, last, and intermittent points
                  const shouldShow =
                    index === 0 ||
                    index === chartGeometry.points.length - 1 ||
                    (chartGeometry.points.length > 4 &&
                      index === Math.floor(chartGeometry.points.length / 2));

                  if (!shouldShow) return null;

                  return (
                    <text
                      key={`date-${pt.id}`}
                      x={pt.x}
                      y={chartGeometry.height - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      className="fill-muted select-none"
                    >
                      {pt.formattedShortDate}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Chart Footer Legend */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted">
              <span>
                Toplam <strong>{activeData.length}</strong> ölçüm noktası
              </span>
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: activeConfig.strokeColor }}
                />
                {activeConfig.title} ({activeConfig.unit})
              </span>
            </div>
          </div>
        )
      )}
    </section>
  );
}
