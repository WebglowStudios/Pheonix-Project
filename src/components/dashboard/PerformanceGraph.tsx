"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faChevronRight,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import {
  generatePerformanceTimeline,
  type PerformanceTimeframe,
  type PerformancePoint,
} from "@/lib/assetAllocation";

interface PerformanceGraphProps {
  investments: Array<{
    buyDate?: string | Date | null;
    sipStartDate?: string | Date | null;
    createdAt?: string | Date | null;
    investedAmount?: number;
    currentValue?: number;
  }>;
  totalCurrentValue?: number;
  totalInvested?: number;
}

function fmtLakhs(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val.toFixed(0)}`;
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function PerformanceGraph({
  investments,
  totalCurrentValue = 0,
  totalInvested = 0,
}: PerformanceGraphProps) {
  const [timeframe, setTimeframe] = useState<PerformanceTimeframe>("ALL");
  const [hoveredPoint, setHoveredPoint] = useState<PerformancePoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const points = useMemo(() => {
    return generatePerformanceTimeline(investments, timeframe);
  }, [investments, timeframe]);

  // Chart dimensions & padding
  const width = 640;
  const height = 240;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 32;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Min and max for Y-axis
  const { minVal, maxVal, yTicks } = useMemo(() => {
    if (points.length === 0) {
      return { minVal: 0, maxVal: 100000, yTicks: [0, 50000, 100000] };
    }
    const vals = points.map((p) => p.value);
    const rawMin = Math.min(...vals, 0);
    const rawMax = Math.max(...vals, totalCurrentValue, 10000);
    // Add 10% headroom
    const headRoom = (rawMax - rawMin) * 0.12;
    const maxVal = Math.ceil((rawMax + headRoom) / 50000) * 50000;
    const minVal = 0;

    // 4 evenly spaced Y-ticks
    const step = maxVal / 4;
    const yTicks = [0, step, step * 2, step * 3, maxVal];

    return { minVal, maxVal, yTicks };
  }, [points, totalCurrentValue]);

  // Map data points to SVG coordinates
  const coords = useMemo(() => {
    if (points.length < 2) return [];
    return points.map((p, idx) => {
      const x = padLeft + (idx / (points.length - 1)) * chartW;
      const yNorm = (p.value - minVal) / (maxVal - minVal || 1);
      const y = padTop + chartH - yNorm * chartH;
      return { x, y, point: p };
    });
  }, [points, minVal, maxVal, padLeft, padTop, chartW, chartH]);

  // Generate smooth SVG bezier path
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length < 2) return { linePath: "", areaPath: "" };

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const baselineY = padTop + chartH;
    const area = `${d} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;

    return { linePath: d, areaPath: area };
  }, [coords, padTop, chartH]);

  // Handle pointer tracking for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    // Find closest point
    let closest = coords[0];
    let minDist = Math.abs(coords[0].x - svgX);
    for (let i = 1; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = coords[i];
      }
    }

    setHoveredPoint(closest.point);
    setHoverX(closest.x);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
  };

  const activeDisplay = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);
  const totalGain = (activeDisplay?.value || totalCurrentValue) - (activeDisplay?.invested || totalInvested);
  const totalGainPct = (activeDisplay?.invested || totalInvested) > 0 ? (totalGain / (activeDisplay?.invested || totalInvested)) * 100 : 0;
  const isGain = totalGain >= 0;

  return (
    <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden flex flex-col justify-between h-full">
      {/* Header with Title and Timeframe Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#F0F2F5] min-h-[58px]">
        <div>
          <h2 className="text-[13px] font-bold text-[#1a1b23] tracking-tight">Performance</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg font-black text-[#1a1b23] tabular-nums">
              {fmtCurrency(activeDisplay?.value ?? totalCurrentValue)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${
                isGain ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              <FontAwesomeIcon icon={isGain ? faArrowTrendUp : faArrowTrendDown} className="text-[10px]" />
              {isGain ? "+" : ""}
              {totalGainPct.toFixed(2)}%
            </span>
            {hoveredPoint && (
              <span className="text-[11px] text-gray-400 font-medium ml-1">
                ({hoveredPoint.label})
              </span>
            )}
          </div>
        </div>

        {/* Timeframe selector pills matching the reference screenshot */}
        <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-lg self-start sm:self-auto">
          {(["ALL", "YTD", "1Y", "3M"] as PerformanceTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-white text-[#1a1b23] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tf === "ALL" ? "ALL TIME" : tf}
            </button>
          ))}
          <span
            title="Custom timeframe locked"
            className="px-2 py-1 text-[11px] font-semibold text-gray-400 flex items-center gap-1 cursor-not-allowed select-none opacity-60"
          >
            CUSTOM <FontAwesomeIcon icon={faLock} className="text-[9px]" />
          </span>
        </div>
      </div>

      {/* SVG Performance Chart */}
      <div className="p-4 relative flex-1 flex flex-col justify-center">
        {points.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-xs">
            No transaction timeline available yet.
          </div>
        ) : (
          <div className="relative w-full">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#0284C7" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {yTicks.map((yVal, i) => {
                const yNorm = (yVal - minVal) / (maxVal - minVal || 1);
                const yPos = padTop + chartH - yNorm * chartH;
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={width - padRight}
                      y2={yPos}
                      stroke="#EAECEF"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={padLeft - 8}
                      y={yPos + 3.5}
                      textAnchor="end"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="#8a92a6"
                    >
                      {fmtLakhs(yVal)}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#perfGradient)" />}

              {/* Primary Performance Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X-Axis Date Labels */}
              {coords.map((c, i) => {
                // Show every 2nd or 3rd label so they don't crowd
                const shouldShow = i % 2 === 0 || i === coords.length - 1;
                if (!shouldShow) return null;
                return (
                  <text
                    key={i}
                    x={c.x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#8a92a6"
                  >
                    {c.point.label}
                  </text>
                );
              })}

              {/* Interactive Cursor Hairline */}
              {hoverX !== null && (
                <line
                  x1={hoverX}
                  y1={padTop}
                  x2={hoverX}
                  y2={padTop + chartH}
                  stroke="#0284C7"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
              )}

              {/* Data points */}
              {coords.map((c, i) => {
                const isHovered = hoveredPoint?.date === c.point.date;
                return (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? "#0284C7" : "#FFFFFF"}
                    stroke="#0284C7"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && hoverX !== null && (
              <div
                className="absolute pointer-events-none -top-1 bg-[#16171e]/95 text-white text-[11px] p-2.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 z-20 transition-all transform -translate-x-1/2"
                style={{
                  left: `${(hoverX / width) * 100}%`,
                }}
              >
                <div className="font-bold text-gray-300 border-b border-white/10 pb-1 mb-1 text-[10px]">
                  {hoveredPoint.label} · {hoveredPoint.date}
                </div>
                <div className="flex justify-between gap-3 text-white font-black text-xs">
                  <span>Valuation:</span>
                  <span>{fmtCurrency(hoveredPoint.value)}</span>
                </div>
                <div className="flex justify-between gap-3 text-gray-400 text-[10.5px]">
                  <span>Invested:</span>
                  <span>{fmtCurrency(hoveredPoint.invested)}</span>
                </div>
                <div
                  className={`flex justify-between gap-3 font-semibold text-[10.5px] ${
                    hoveredPoint.gain >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <span>Unrealised Gain:</span>
                  <span>
                    {hoveredPoint.gain >= 0 ? "+" : ""}
                    {fmtCurrency(hoveredPoint.gain)} ({hoveredPoint.gainPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Link matching screenshot */}
      <div className="px-5 py-2.5 bg-[#FAFBFD] border-t border-[#F0F2F5] flex justify-between items-center text-xs mt-auto">
        <span className="text-gray-400 font-medium">Trajectory from active holdings</span>
        <Link
          href="/dashboard/portfolio"
          className="text-[#E8740C] font-semibold flex items-center gap-1 hover:text-[#d4660b] no-underline"
        >
          See Performance Details <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
        </Link>
      </div>
    </div>
  );
}
