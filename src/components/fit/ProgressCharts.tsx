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
    color: "purple",
    strokeColor: "#76548F",
    gradientFrom: "rgba(118, 84, 143, 0.28)",
    gradientTo: "rgba(118, 84, 143, 0.0)",
    extractValue: (rec) => rec.measurement.weight,
  },
  bodyFat: {
    key: "bodyFat",
    title: "Yağ Oranı Değişimi",
    unit: "%",
    icon: "🎯",
    color: "emerald",
    strokeColor: "#2D7A53",
    gradientFrom: "rgba(45, 122, 83, 0.28)",
    gradientTo: "rgba(45, 122, 83, 0.0)",
    extractValue: (rec) => rec.measurement.bodyFat,
  },
  waist: {
    key: "waist",
    title: "Bel Çevresi Değişimi",
    unit: "cm",
    icon: "📐",
    color: "blue",
    strokeColor: "#3B6FA0",
    gradientFrom: "rgba(59, 111, 160, 0.28)",
    gradientTo: "rgba(59, 111, 160, 0.0)",
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

  const chronologicalRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(a.measurement.date).getTime() - new Date(b.measurement.date).getTime()
    );
  }, [records]);

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

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${
      padding.top + innerHeight
    } L ${points[0].x} ${padding.top + innerHeight} Z`;

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
    <section className="ds-card p-6 sm:p-7 space-y-6">
      {/* 1. Header & Metric Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>📈</span>
            <span>Gelişim ve İlerleme Grafikleri</span>
          </h3>
          <p className="text-xs text-muted">
            Vücut kompozisyonunuzdaki zaman içerisindeki değişim ve trend analizi
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-raised p-1 rounded-xl border border-border self-start lg:self-auto">
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-surface text-foreground shadow-xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.title.replace(" Değişimi", "")}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isSelected
                      ? "bg-surface-lavender text-primary"
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

      {/* 2. Stats Bar */}
      {hasEnoughData && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-in fade-in duration-150">
          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              İlk Kayıt ({formatTurkishShortDate(activeData[0].date)})
            </span>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {stats.first} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              Son Kayıt ({formatTurkishShortDate(activeData[activeData.length - 1].date)})
            </span>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {stats.latest} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              Net Değişim
            </span>
            <div
              className={`text-sm font-bold tabular-nums ${
                stats.change < 0
                  ? "text-success"
                  : stats.change > 0
                  ? "text-warning"
                  : "text-muted"
              }`}
            >
              {stats.change > 0 ? `+${stats.change}` : stats.change}{" "}
              <span className="text-xs font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-muted block">
              En Düşük
            </span>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {stats.min} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-muted block">
              En Yüksek
            </span>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {stats.max} <span className="text-xs text-muted font-normal">{activeConfig.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Chart Canvas Area OR Empty State */}
      {!hasEnoughData ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-surface-raised/50 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border text-xl shadow-xs">
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
          <div className="relative rounded-2xl border border-border bg-surface-raised/40 p-4 sm:p-6 overflow-hidden">
            {/* Interactive Tooltip Card Overlay */}
            {activeHoverPoint && (
              <div
                className="absolute z-20 pointer-events-none rounded-xl border border-border bg-surface px-4 py-2.5 shadow-md transition-all duration-75 space-y-0.5 text-left min-w-[140px]"
                style={{
                  left: `clamp(10px, ${
                    (activeHoverPoint.x / chartGeometry.width) * 100
                  }%, calc(100% - 150px))`,
                  top: "16px",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border pb-1">
                  <span className="text-[10px] font-bold text-muted">
                    📅 {activeHoverPoint.formattedShortDate}
                  </span>
                  <span className="text-[9px] font-bold text-primary bg-surface-lavender px-1.5 py-0.5 rounded">
                    #{activeHoverPoint.index + 1}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-0.5">
                  <span className="text-lg font-bold text-foreground tabular-nums">
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
                          className={`font-bold tabular-nums ${
                            diff < 0
                              ? "text-success"
                              : diff > 0
                              ? "text-warning"
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
                      strokeOpacity={i === 0 ? "0.18" : "0.1"}
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
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* Data Points */}
                {chartGeometry.points.map((pt, index) => {
                  const isHovered = hoveredPointIndex === index;
                  return (
                    <g key={pt.id} className="cursor-pointer">
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="10"
                          fill={activeConfig.strokeColor}
                          fillOpacity="0.2"
                        />
                      )}

                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6" : "4.5"}
                        fill="#ffffff"
                        stroke={activeConfig.strokeColor}
                        strokeWidth={isHovered ? "3" : "2.5"}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* X-Axis Date Labels */}
                {chartGeometry.points.map((pt, index) => {
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
            <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted">
              <span>
                Toplam <strong>{activeData.length}</strong> ölçüm noktası
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
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
