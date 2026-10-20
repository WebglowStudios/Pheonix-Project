import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Svg,
  Path,
  Font,
} from "@react-pdf/renderer";
import {
  type Investment,
  type PortfolioSummary,
  type User,
  type CumulativeInvestment,
  type FamilyMember,
} from "@/lib/api";
import {
  fmtIndianCurrency,
  fmtNumber,
  formatDateIndian,
  estimateAnnualizedReturn,
} from "@/lib/format";
import { getMacroAssetClass, MACRO_ASSET_CLASSES, type MacroAssetClass } from "@/lib/assetAllocation";

// Disable automatic hyphenation for all text in the PDF
Font.registerHyphenationCallback((word: string) => [word]);

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  brandGreen: "#bbf7d0",
  brandGreenBorder: "#86efac",
  brandGreenDark: "#14532d",
  tableHeaderGreen: "#dcfce7",
  tableHeaderAif: "#EFEBE9",
  bannerAif: "#4E342E",
  totalRowAif: "#D7CCC8",
  brandAmber: "#E8740C",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  black: "#000000",
  greenGain: "#15803d",
  redLoss: "#b91c1c",
};

const ASSET_LABEL_MAP: Record<string, string> = {
  mutual_fund: "Mutual Funds",
  sip: "Systematic Investment (SIP)",
  stock: "Direct Equity Holdings",
  aif: "Alternative Investment Funds (AIF)",
  fd: "Fixed Deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  bond: "Bonds & Debentures",
  gold: "Gold / SGB",
  crypto: "Crypto / Digital Assets",
  reit_invit: "REIT / InvIT",
};

const MEMBER_ACCENT_COLORS = [
  "#1565C0", "#2E7D32", "#6A1B9A", "#880E4F",
  "#E65100", "#00838F", "#F57F17", "#4527A0",
];

// ─── SVG Rupee Icon ───────────────────────────────────────────────────────────
const RupeeIcon = ({ color = "#111827", size = 7 }: { color?: string; size?: number }) => (
  <Svg width={size * 0.75} height={size} viewBox="0 0 24 24" style={{ marginRight: 1 }}>
    <Path
      d="M13.66 7C13.1 5.82 11.9 5 10.5 5L6 5V3H18V5H14.74C15.22 5.58 15.58 6.26 15.79 7H18V9H16C15.73 11.8 13.37 14 10.5 14H9.61L15.89 21H13.21L7 14V12H10.5C12.16 12 13.5 10.66 13.5 9H6V7H13.66Z"
      fill={color}
    />
  </Svg>
);

// ─── Math for Donut Chart SVG Arcs ─────────────────────────────────────────────
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const span = Math.min(Math.max(endAngle - startAngle, 0.1), 359.99);
  const effectiveEnd = startAngle + span;

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, effectiveEnd);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, effectiveEnd);

  const largeArcFlag = span > 180 ? 1 : 0;

  return [
    "M", startOuter.x.toFixed(2), startOuter.y.toFixed(2),
    "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x.toFixed(2), endOuter.y.toFixed(2),
    "L", endInner.x.toFixed(2), endInner.y.toFixed(2),
    "A", innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x.toFixed(2), startInner.y.toFixed(2),
    "Z",
  ].join(" ");
}

// ─── Table Cell Helper Components ──────────────────────────────────────────────
// Using View wrappers with alignItems: "stretch" guarantees that vertical border lines
// stretch 100% of the row height continuously with ZERO broken lines or detached dashes.

interface CellProps {
  width: number;
  last?: boolean;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  style?: any;
}

const Th = ({ width, last = false, align = "left", children, style }: CellProps) => (
  <View
    style={[
      {
        width,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: C.gray300,
        paddingVertical: 3.5,
        paddingHorizontal: 3.5,
        justifyContent: "center",
      },
      style,
    ]}
  >
    {typeof children === "string" || typeof children === "number" ? (
      <Text
        style={{
          fontSize: 7,
          fontFamily: "Helvetica-Bold",
          color: C.gray800,
          textAlign: align,
        }}
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </View>
);

const Td = ({ width, last = false, align = "left", children, style }: CellProps) => (
  <View
    style={[
      {
        width,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: C.gray300,
        paddingVertical: 3.5,
        paddingHorizontal: 3.5,
        justifyContent: "center",
      },
      style,
    ]}
  >
    {typeof children === "string" || typeof children === "number" ? (
      <Text
        style={{
          fontSize: 6.8,
          color: C.gray800,
          textAlign: align,
        }}
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </View>
);

const Ttotal = ({ width, last = false, align = "left", children, style }: CellProps) => (
  <View
    style={[
      {
        width,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: C.gray300,
        paddingVertical: 3.5,
        paddingHorizontal: 3.5,
        justifyContent: "center",
      },
      style,
    ]}
  >
    {typeof children === "string" || typeof children === "number" ? (
      <Text
        style={{
          fontSize: 7,
          fontFamily: "Helvetica-Bold",
          color: C.gray900,
          textAlign: align,
        }}
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </View>
);

// ─── React-PDF StyleSheet ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 38,
    paddingHorizontal: 21,
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: C.gray800,
  },

  // ── Top Header Banner ──
  topBanner: {
    backgroundColor: C.brandGreen,
    borderWidth: 1,
    borderColor: C.brandGreenBorder,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    textAlign: "center",
    borderRadius: 2,
    marginBottom: 5,
  },
  topBannerText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.brandGreenDark,
    letterSpacing: 0.5,
  },

  // ── Header Details Row ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.gray300,
    marginBottom: 4,
  },
  headerLeft: {
    width: 200,
  },
  clientName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    marginBottom: 2,
  },
  clientSub: {
    fontSize: 7,
    color: C.gray700,
    marginBottom: 1,
  },
  clientMeta: {
    fontSize: 7,
    color: C.gray900,
    fontFamily: "Helvetica",
  },
  clientRm: {
    fontSize: 7,
    color: C.gray700,
    marginTop: 1,
  },
  headerCenter: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    width: 95,
    height: 38,
    objectFit: "contain",
  },
  headerRight: {
    width: 220,
    textAlign: "right",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    marginBottom: 1.5,
  },
  companyAddress: {
    fontSize: 6.5,
    color: C.gray700,
    lineHeight: 1.25,
  },
  companyContact: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    marginTop: 1.5,
  },

  // ── Date & Website Bar ──
  dateBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray300,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  dateBarText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray800,
  },

  // ── High-Level KPI Summary Bar Table ──
  kpiTable: {
    borderWidth: 1,
    borderColor: C.gray300,
    marginBottom: 7,
  },
  kpiHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.tableHeaderGreen,
    borderBottomWidth: 1,
    borderBottomColor: C.gray300,
    alignItems: "stretch",
  },
  kpiDataRow: {
    flexDirection: "row",
    backgroundColor: C.white,
    alignItems: "stretch",
  },

  // ── Section Banners ──
  sectionBanner: {
    backgroundColor: C.brandGreen,
    borderWidth: 1,
    borderColor: C.brandGreenBorder,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  sectionBannerText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    textAlign: "center",
  },
  sectionBannerLeft: {
    backgroundColor: C.brandGreen,
    borderWidth: 1,
    borderColor: C.brandGreenBorder,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  sectionBannerLeftText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    textAlign: "left",
  },
  aifBanner: {
    backgroundColor: C.bannerAif,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aifBannerText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  aifBannerSubText: {
    fontSize: 6.5,
    color: C.white,
    opacity: 0.9,
  },

  // ── 2-Column Asset Allocation Container ──
  allocationGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.gray300,
    marginBottom: 7,
    alignItems: "stretch",
  },
  donutCol: {
    width: 210,
    borderRightWidth: 1,
    borderRightColor: C.gray300,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
  },
  donutTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
    marginBottom: 4,
    textAlign: "center",
  },
  donutChartWrapper: {
    width: 122,
    height: 122,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  donutCenterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 122,
    height: 122,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#666666",
    marginBottom: 1,
  },
  donutCenterValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 5,
    marginBottom: 2,
  },
  legendDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 1,
    marginRight: 2.5,
  },
  legendText: {
    fontSize: 6.5,
    fontFamily: "Helvetica",
    color: C.gray700,
  },
  allocationTableCol: {
    width: 342,
  },

  // ── Table Container ──
  tableWrap: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.gray300,
    marginBottom: 7,
  },
  rowStretch: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
    alignItems: "stretch",
    backgroundColor: C.white,
  },
  rowStretchAlt: {
    backgroundColor: C.gray50,
  },
  headRowStretch: {
    flexDirection: "row",
    backgroundColor: C.tableHeaderGreen,
    borderBottomWidth: 1,
    borderBottomColor: C.gray300,
    alignItems: "stretch",
  },
  totalRowStretch: {
    flexDirection: "row",
    backgroundColor: C.brandGreen,
    borderTopWidth: 1,
    borderTopColor: C.gray400,
    alignItems: "stretch",
  },

  // ── Typography Helpers ──
  boldText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
  },
  posGainText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.greenGain,
  },
  negLossText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.redLoss,
  },

  // ── Footer Fixed on Every Page ──
  pageFooter: {
    position: "absolute",
    bottom: 12,
    left: 21,
    right: 21,
  },
  regBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray300,
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 2.5,
  },
  regLabel: {
    fontSize: 6.2,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
  },
  regValue: {
    fontSize: 6.2,
    fontFamily: "Helvetica",
    color: C.gray800,
  },
  footerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerDisclaimer: {
    fontSize: 6.2,
    color: C.gray600,
  },
  pageNumber: {
    fontSize: 6.2,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
  },
});

// ─── Component Props ──────────────────────────────────────────────────────────
export interface GeneratePortfolioPdfOptions {
  user: User | null;
  summary: PortfolioSummary | null;
  investments: Investment[] | CumulativeInvestment[];
  reportDate?: Date;
  reportScope?: "individual" | "family";
  members?: FamilyMember[];
  logoDataUri?: string;
}

// ─── React-PDF Document Component ─────────────────────────────────────────────
export const PortfolioPdfDocument = ({
  user,
  summary,
  investments,
  reportDate = new Date(),
  reportScope = "individual",
  members = [],
  logoDataUri,
}: GeneratePortfolioPdfOptions) => {
  const isFamily = reportScope === "family";
  const hasFamilyOwners = investments.some(
    (i) => (i as CumulativeInvestment).ownerName && (i as CumulativeInvestment).ownerName !== user?.name
  );

  // Calculations
  const totalInvested = summary?.totalInvested ?? investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const totalCurrentValue = summary?.currentValue ?? investments.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalAbsReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Earliest date for XIRR
  const earliestDate = investments.reduce<string | null>((earliest, i) => {
    const d = i.buyDate || i.sipStartDate || i.createdAt;
    if (!d) return earliest;
    if (!earliest) return d;
    return new Date(d) < new Date(earliest) ? d : earliest;
  }, null);
  const totalXirr = estimateAnnualizedReturn(totalInvested, totalCurrentValue, earliestDate);

  // Macro Asset Allocation Breakdown
  const macroBreakdown = (["equity", "debt", "alternatives", "others"] as MacroAssetClass[]).map((macroKey) => {
    const meta = MACRO_ASSET_CLASSES[macroKey];
    const items = investments.filter((i) => getMacroAssetClass(i.type) === macroKey);
    const cost = items.reduce((s, i) => s + (i.investedAmount || 0), 0);
    const val = items.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
    const gain = val - cost;
    const absRet = cost > 0 ? (gain / cost) * 100 : 0;
    const holdingPct = totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0;

    const earliestMacro = items.reduce<string | null>((earliest, i) => {
      const d = i.buyDate || i.sipStartDate || i.createdAt;
      if (!d) return earliest;
      if (!earliest) return d;
      return new Date(d) < new Date(earliest) ? d : earliest;
    }, null);

    const xirr = estimateAnnualizedReturn(cost, val, earliestMacro);

    return {
      type: macroKey,
      label: meta.label,
      cost,
      val,
      absRet,
      xirr,
      holdingPct,
      color: meta.color,
      count: items.length,
    };
  }).filter((m) => m.count > 0 || m.holdingPct > 0);

  // Donut Segments
  let cumulativePct = 0;
  const donutSegments = macroBreakdown.map((item) => {
    const startPct = cumulativePct;
    cumulativePct += item.holdingPct;
    return {
      ...item,
      startPct,
      endPct: cumulativePct,
    };
  });

  // Filter Holdings By Asset Class
  const mfHoldings = investments.filter((i) => i.type === "mutual_fund" || i.type === "sip");
  const stockHoldings = investments.filter((i) => i.type === "stock");
  const aifHoldings = investments.filter((i) => i.type === "aif");
  const fixedHoldings = investments.filter((i) =>
    ["fd", "ppf", "epf", "nps", "bond", "gold", "crypto", "reit_invit"].includes(i.type)
  );

  // Subtotals
  const mfTotalCost = mfHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const mfTotalVal = mfHoldings.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const mfTotalGain = mfTotalVal - mfTotalCost;
  const mfTotalAbsRet = mfTotalCost > 0 ? (mfTotalGain / mfTotalCost) * 100 : 0;

  const stockTotalCost = stockHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const stockTotalVal = stockHoldings.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const stockTotalGain = stockTotalVal - stockTotalCost;
  const stockTotalAbsRet = stockTotalCost > 0 ? (stockTotalGain / stockTotalCost) * 100 : 0;

  const aifTotalCost = aifHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const aifTotalVal = aifHoldings.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const aifTotalGain = aifTotalVal - aifTotalCost;
  const aifTotalAbsRet = aifTotalCost > 0 ? (aifTotalGain / aifTotalCost) * 100 : 0;

  const fixedTotalCost = fixedHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const fixedTotalVal = fixedHoldings.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const fixedTotalGain = fixedTotalVal - fixedTotalCost;
  const fixedTotalAbsRet = fixedTotalCost > 0 ? (fixedTotalGain / fixedTotalCost) * 100 : 0;

  const clientTitle = isFamily
    ? `${user?.name || "Primary Account Holder"} & Family`
    : user?.name || "Client";

  const memberNames = members.length > 0
    ? members.map((m) => m.name).join(" • ")
    : "";

  return (
    <Document
      title={`${isFamily ? "Family Cumulative" : "Master"} Portfolio Statement — Phoenix Financial Services`}
      author="Phoenix Financial Services"
      subject="Client Portfolio Valuation & Statement"
    >
      <Page size="A4" style={s.page} wrap>
        {/* ── Top Header Banner ── */}
        <View style={s.topBanner} wrap={false}>
          <Text style={s.topBannerText}>
            {isFamily ? "HOUSEHOLD CUMULATIVE PORTFOLIO — MASTER STATEMENT" : "MASTER PORTFOLIO"}
          </Text>
        </View>

        {/* ── Investor & Distributor Info Header ── */}
        <View style={s.headerRow} wrap={false}>
          <View style={s.headerLeft}>
            <Text style={s.clientName}>
              {clientTitle.toUpperCase()} {user?.id ? `(${user.id.slice(-8).toUpperCase()})` : ""}
            </Text>
            {isFamily && memberNames ? (
              <Text style={s.clientSub}>Linked Members: {memberNames}</Text>
            ) : (
              <Text style={s.clientSub}>Financial Planning &amp; Wealth Management Client</Text>
            )}
            <Text style={s.clientMeta}>
              Mobile: {user?.phone || "+91 98860 XXXXX"} | Email: {user?.email || "client@email.com"}
            </Text>
            <Text style={s.clientRm}>RM Name: Phoenix Financial Advisory Desk</Text>
          </View>

          <View style={s.headerCenter}>
            {logoDataUri ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoDataUri} style={s.headerLogo} />
            ) : (
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.brandAmber }}>
                PHOENIX
              </Text>
            )}
          </View>

          <View style={s.headerRight}>
            <Text style={s.companyName}>PHOENIX FINANCIAL SERVICES</Text>
            <Text style={s.companyAddress}>Pune: 708, Global Business Hub, Kharadi, Pune 411014</Text>
            <Text style={s.companyAddress}>Mumbai: 11, Brahamsiddhi, Century Bazar, Worli 400025</Text>
            <Text style={s.companyContact}>
              Phone: +91 70212 10788 | Email: connect@phoenixfiserv.co.in
            </Text>
          </View>
        </View>

        {/* ── Date & Portal Bar ── */}
        <View style={s.dateBar} wrap={false}>
          <Text style={s.dateBarText}>
            Report Date: {formatDateIndian(reportDate)}
            {isFamily && members.length > 0 ? `  |  Linked Accounts: ${members.length}` : ""}
          </Text>
          <Text style={s.dateBarText}>www.phoenixfiserv.co.in</Text>
        </View>

        {/* ── High-Level KPI Summary Bar Table (Exact replica of preview) ── */}
        <View style={s.kpiTable} wrap={false}>
          <View style={s.kpiHeaderRow}>
            <Th width={110} align="center">Inv. Cost</Th>
            <Th width={110} align="center">Current Value</Th>
            <Th width={111} align="center">Unrealised Gain</Th>
            <Th width={111} align="center">Absolute Return (%)</Th>
            <Th width={110} align="center" last>XIRR / Ann. (%)</Th>
          </View>
          <View style={s.kpiDataRow}>
            <Td width={110} align="center">
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.gray900 }}>
                {fmtIndianCurrency(totalInvested, false)}
              </Text>
            </Td>
            <Td width={110} align="center">
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.gray900 }}>
                {fmtIndianCurrency(totalCurrentValue, false)}
              </Text>
            </Td>
            <Td width={111} align="center">
              <Text
                style={{
                  fontSize: 9.5,
                  fontFamily: "Helvetica-Bold",
                  color: totalGain >= 0 ? C.greenGain : C.redLoss,
                }}
              >
                {fmtIndianCurrency(totalGain, false)}
              </Text>
            </Td>
            <Td width={111} align="center">
              <Text
                style={{
                  fontSize: 9.5,
                  fontFamily: "Helvetica-Bold",
                  color: totalAbsReturn >= 0 ? C.greenGain : C.redLoss,
                }}
              >
                {fmtNumber(totalAbsReturn)}%
              </Text>
            </Td>
            <Td width={110} align="center" last>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.greenGain }}>
                {fmtNumber(totalXirr)}%
              </Text>
            </Td>
          </View>
        </View>

        {/* ── Family Members — Individual Wealth Contribution (if scope is family) ── */}
        {isFamily && members.length > 0 && (
          <View wrap={false} style={{ marginBottom: 7 }}>
            <View style={s.sectionBanner}>
              <Text style={s.sectionBannerText}>Family Members — Individual Wealth Contribution</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={s.headRowStretch}>
                <Th width={80}>Member</Th>
                <Th width={55}>Relationship</Th>
                <Th width={85}>Email</Th>
                <Th width={36}>Holdings</Th>
                <Th width={60}>Inv. Cost</Th>
                <Th width={60}>Current Value</Th>
                <Th width={60}>Gain / Loss</Th>
                <Th width={56}>Abs Ret (%)</Th>
                <Th width={60} last>Share (%)</Th>
              </View>
              {members.map((m, idx) => {
                const st = m.stats || {
                  totalInvested: 0,
                  currentValue: 0,
                  totalGain: 0,
                  totalGainPercent: 0,
                  holdingsCount: 0,
                };
                const share = totalCurrentValue > 0 ? (st.currentValue / totalCurrentValue) * 100 : 0;
                const memberColor = MEMBER_ACCENT_COLORS[idx % MEMBER_ACCENT_COLORS.length];

                return (
                  <View
                    key={m.userId || idx}
                    style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                  >
                    <Td width={80}>
                      <Text style={[s.boldText, { color: memberColor }]}>
                        {m.name} {m.isSelf ? "(Primary)" : ""}
                      </Text>
                    </Td>
                    <Td width={55}>{m.relationship}</Td>
                    <Td width={85}>{m.email || "—"}</Td>
                    <Td width={36}>{st.holdingsCount}</Td>
                    <Td width={60}>{fmtIndianCurrency(st.totalInvested, false)}</Td>
                    <Td width={60}>
                      <Text style={s.boldText}>{fmtIndianCurrency(st.currentValue, false)}</Text>
                    </Td>
                    <Td width={60}>
                      <Text style={st.totalGain >= 0 ? s.posGainText : s.negLossText}>
                        {fmtIndianCurrency(st.totalGain, false)}
                      </Text>
                    </Td>
                    <Td width={56}>
                      <Text style={st.totalGainPercent >= 0 ? s.posGainText : s.negLossText}>
                        {fmtNumber(st.totalGainPercent)}%
                      </Text>
                    </Td>
                    <Td width={60} last>
                      <Text style={s.boldText}>{fmtNumber(share, 1)}%</Text>
                    </Td>
                  </View>
                );
              })}
              <View style={s.totalRowStretch}>
                <Ttotal width={256}>Household Total</Ttotal>
                <Ttotal width={60}>{fmtIndianCurrency(totalInvested, false)}</Ttotal>
                <Ttotal width={60}>{fmtIndianCurrency(totalCurrentValue, false)}</Ttotal>
                <Ttotal width={60}>{fmtIndianCurrency(totalGain, false)}</Ttotal>
                <Ttotal width={56}>{fmtNumber(totalAbsReturn)}%</Ttotal>
                <Ttotal width={60} last>100.00%</Ttotal>
              </View>
            </View>
          </View>
        )}

        {/* ── Section: Portfolio Asset Allocation Side-by-Side ── */}
        <View wrap={false} style={{ marginBottom: 7 }}>
          <View style={s.sectionBanner}>
            <Text style={s.sectionBannerText}>
              {isFamily
                ? "Household Asset Allocation (Macro Asset Classes)"
                : "Portfolio Asset Allocation (Macro Asset Classes)"}
            </Text>
          </View>

          <View style={s.allocationGrid}>
            {/* Left: Donut Chart SVG + Center Label + Mini Legend */}
            <View style={s.donutCol}>
              <Text style={s.donutTitle}>Macro Asset Allocation</Text>

              {totalCurrentValue > 0 ? (
                <View style={s.donutChartWrapper}>
                  <Svg width={122} height={122} viewBox="0 0 200 200">
                    {donutSegments.map((segment) => {
                      const startAngle = (segment.startPct / 100) * 360;
                      const endAngle = (segment.endPct / 100) * 360;
                      if (endAngle - startAngle <= 0.05) return null;
                      return (
                        <Path
                          key={segment.type}
                          d={describeDonutArc(100, 100, 52, 85, startAngle, endAngle)}
                          fill={segment.color}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </Svg>
                  {/* Center Text Overlay */}
                  <View style={s.donutCenterOverlay}>
                    <Text style={s.donutCenterLabel}>{isFamily ? "HOUSEHOLD" : "TOTAL"}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <RupeeIcon size={7.5} color="#111111" />
                      <Text style={s.donutCenterValue}>
                        {fmtIndianCurrency(totalCurrentValue, true).replace(/^₹\s*/, "")}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 7, color: C.gray400, marginVertical: 20 }}>
                  No holdings recorded
                </Text>
              )}

              {/* Mini Legend underneath Donut */}
              <View style={s.legendWrap}>
                {donutSegments.map((seg) => (
                  <View key={seg.type} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: seg.color }]} />
                    <Text style={s.legendText}>
                      {seg.label}: {fmtNumber(seg.holdingPct, 1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Macro Asset Allocation Table */}
            <View style={s.allocationTableCol}>
              <View style={s.headRowStretch}>
                <Th width={82}>Asset Class</Th>
                <Th width={52}>Inv. Cost</Th>
                <Th width={52}>Current Value</Th>
                <Th width={50}>Abs Ret (%)</Th>
                <Th width={48}>XIRR (%)</Th>
                <Th width={58} last>Allocation (%)</Th>
              </View>

              {macroBreakdown.map((row, idx) => (
                <View
                  key={row.type}
                  style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                >
                  <Td width={82}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 4.5, height: 4.5, borderRadius: 1, backgroundColor: row.color, marginRight: 3 }} />
                      <Text style={s.boldText}>{row.label}</Text>
                    </View>
                  </Td>
                  <Td width={52}>{fmtIndianCurrency(row.cost, false)}</Td>
                  <Td width={52}>
                    <Text style={s.boldText}>{fmtIndianCurrency(row.val, false)}</Text>
                  </Td>
                  <Td width={50}>
                    <Text style={row.absRet >= 0 ? s.posGainText : s.negLossText}>
                      {fmtNumber(row.absRet)}
                    </Text>
                  </Td>
                  <Td width={48}>{fmtNumber(row.xirr)}</Td>
                  <Td width={58} last>
                    <Text style={s.boldText}>{fmtNumber(row.holdingPct)}%</Text>
                  </Td>
                </View>
              ))}

              {/* Grand Total Row */}
              <View style={s.totalRowStretch}>
                <Ttotal width={82}>Total</Ttotal>
                <Ttotal width={52}>{fmtIndianCurrency(totalInvested, false)}</Ttotal>
                <Ttotal width={52}>{fmtIndianCurrency(totalCurrentValue, false)}</Ttotal>
                <Ttotal width={50}>{fmtNumber(totalAbsReturn)}</Ttotal>
                <Ttotal width={48}>{fmtNumber(totalXirr)}</Ttotal>
                <Ttotal width={58} last>100.00%</Ttotal>
              </View>
            </View>
          </View>
        </View>

        {/* ── Table: Mutual Funds & SIP Holdings ── */}
        {mfHoldings.length > 0 && (
          <View wrap={true} style={{ marginBottom: 7 }}>
            <View style={s.sectionBannerLeft} wrap={false}>
              <Text style={s.sectionBannerLeftText}>Mutual Fund &amp; SIP Holdings</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={s.headRowStretch} wrap={false}>
                {hasFamilyOwners && <Th width={65}>Investor Name</Th>}
                <Th width={hasFamilyOwners ? 120 : 162}>Scheme Name</Th>
                <Th width={hasFamilyOwners ? 45 : 55}>Folio / Code</Th>
                <Th width={hasFamilyOwners ? 46 : 50}>Investment Date</Th>
                <Th width={hasFamilyOwners ? 38 : 40}>Units</Th>
                <Th width={hasFamilyOwners ? 38 : 40}>Avg NAV</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Inv. Cost</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Current Value</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Unrealised Gain</Th>
                <Th width={hasFamilyOwners ? 50 : 40} last>Abs Ret (%)</Th>
              </View>

              {mfHoldings.map((inv, idx) => {
                const cost = inv.investedAmount || 0;
                const val = inv.currentValue ?? cost;
                const gain = val - cost;
                const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                const units = inv.units || (inv.sipAmount && inv.instalments && inv.avgNav ? (inv.sipAmount * inv.instalments) / inv.avgNav : 0);
                const nav = inv.buyPrice || inv.avgNav || (units > 0 ? cost / units : 0);
                const owner = (inv as CumulativeInvestment).ownerName || user?.name || "Client";

                return (
                  <View
                    key={inv._id || idx}
                    style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                    wrap={false}
                  >
                    {hasFamilyOwners && (
                      <Td width={65}>
                        <Text style={s.boldText}>{owner}</Text>
                      </Td>
                    )}
                    <Td width={hasFamilyOwners ? 120 : 162}>
                      <Text style={s.boldText}>{inv.name}</Text>
                      {inv.type === "sip" && (
                        <Text style={{ fontSize: 5.5, color: C.brandAmber }}>SIP Active</Text>
                      )}
                    </Td>
                    <Td width={hasFamilyOwners ? 45 : 55}>{inv.symbol || inv.folioNumber || "—"}</Td>
                    <Td width={hasFamilyOwners ? 46 : 50}>
                      {formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt)}
                    </Td>
                    <Td width={hasFamilyOwners ? 38 : 40}>{fmtNumber(units, 3)}</Td>
                    <Td width={hasFamilyOwners ? 38 : 40}>{fmtNumber(nav, 2)}</Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(cost, false)}</Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>
                      <Text style={s.boldText}>{fmtIndianCurrency(val, false)}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>
                      <Text style={gain >= 0 ? s.posGainText : s.negLossText}>
                        {fmtIndianCurrency(gain, false)}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 40} last>
                      <Text style={absRet >= 0 ? s.posGainText : s.negLossText}>
                        {fmtNumber(absRet)}%
                      </Text>
                    </Td>
                  </View>
                );
              })}

              {/* Fund Portfolio Total Row */}
              <View style={s.totalRowStretch} wrap={false}>
                <Ttotal width={hasFamilyOwners ? 352 : 347}>
                  Fund Portfolio Total:
                </Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(mfTotalCost, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(mfTotalVal, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(mfTotalGain, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 40} last>{fmtNumber(mfTotalAbsRet)}%</Ttotal>
              </View>
            </View>
          </View>
        )}

        {/* ── Table: Direct Equity Holdings (EDEOH) ── */}
        {stockHoldings.length > 0 && (
          <View wrap={true} style={{ marginBottom: 7 }}>
            <View style={s.sectionBannerLeft} wrap={false}>
              <Text style={s.sectionBannerLeftText}>Direct Equity Holdings</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={s.headRowStretch} wrap={false}>
                {hasFamilyOwners && <Th width={65}>Investor Name</Th>}
                <Th width={hasFamilyOwners ? 120 : 162}>Company / Stock Name</Th>
                <Th width={hasFamilyOwners ? 45 : 50}>Symbol / Ticker</Th>
                <Th width={hasFamilyOwners ? 46 : 50}>Investment Date</Th>
                <Th width={hasFamilyOwners ? 36 : 38}>Qty / Shares</Th>
                <Th width={hasFamilyOwners ? 40 : 47}>Avg Price</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Inv. Cost</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Current Value</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Unrealised Gain</Th>
                <Th width={hasFamilyOwners ? 50 : 40} last>Abs Ret (%)</Th>
              </View>

              {stockHoldings.map((inv, idx) => {
                const cost = inv.investedAmount || 0;
                const val = inv.currentValue ?? cost;
                const gain = val - cost;
                const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                const owner = (inv as CumulativeInvestment).ownerName || user?.name || "Client";

                return (
                  <View
                    key={inv._id || idx}
                    style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                    wrap={false}
                  >
                    {hasFamilyOwners && (
                      <Td width={65}>
                        <Text style={s.boldText}>{owner}</Text>
                      </Td>
                    )}
                    <Td width={hasFamilyOwners ? 120 : 162}>
                      <Text style={s.boldText}>{inv.name}</Text>
                      {inv.isFreeShare && (
                        <Text style={{ fontSize: 5.5, color: C.brandAmber, fontFamily: "Helvetica-Bold" }}>
                          FREE SHARES · RISK FREE
                        </Text>
                      )}
                    </Td>
                    <Td width={hasFamilyOwners ? 45 : 50}>
                      <Text style={s.boldText}>{inv.symbol || "—"}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 46 : 50}>
                      {formatDateIndian(inv.buyDate || inv.createdAt)}
                    </Td>
                    <Td width={hasFamilyOwners ? 36 : 38}>
                      {fmtNumber(inv.units || 0, 0)}
                    </Td>
                    <Td width={hasFamilyOwners ? 40 : 47}>
                      <Text style={{ fontSize: 6.8 }}>{fmtNumber(inv.buyPrice || 0)}</Text>
                      {inv.currentPrice && inv.currentPrice !== inv.buyPrice && (
                        <Text style={{ fontSize: 5.5, color: C.gray600 }}>
                          CMP: {fmtNumber(inv.currentPrice)}
                        </Text>
                      )}
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(cost, false)}</Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>
                      <Text style={s.boldText}>{fmtIndianCurrency(val, false)}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>
                      <Text style={gain >= 0 ? s.posGainText : s.negLossText}>
                        {fmtIndianCurrency(gain, false)}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 40} last>
                      <Text style={absRet >= 0 ? s.posGainText : s.negLossText}>
                        {fmtNumber(absRet)}%
                      </Text>
                    </Td>
                  </View>
                );
              })}

              {/* Equity Portfolio Total Row */}
              <View style={s.totalRowStretch} wrap={false}>
                <Ttotal width={hasFamilyOwners ? 352 : 347}>
                  Equity Portfolio Total:
                </Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(stockTotalCost, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(stockTotalVal, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(stockTotalGain, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 40} last>{fmtNumber(stockTotalAbsRet)}%</Ttotal>
              </View>
            </View>
          </View>
        )}

        {/* ── Table: Alternative Investment Funds (AIF) ── */}
        {aifHoldings.length > 0 && (
          <View wrap={true} style={{ marginBottom: 7 }}>
            <View style={s.aifBanner} wrap={false}>
              <Text style={s.aifBannerText}>Alternative Investment Funds (AIF) Portfolio</Text>
              <Text style={s.aifBannerSubText}>SEBI Regulated Category I / II / III Alternative Funds</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={[s.headRowStretch, { backgroundColor: C.tableHeaderAif }]} wrap={false}>
                {hasFamilyOwners && <Th width={65}>Investor Name</Th>}
                <Th width={hasFamilyOwners ? 105 : 132}>Fund / Scheme Name</Th>
                <Th width={hasFamilyOwners ? 55 : 65}>Fund House / AMC</Th>
                <Th width={hasFamilyOwners ? 52 : 60}>Category / Strategy</Th>
                <Th width={hasFamilyOwners ? 40 : 45}>Folio ID</Th>
                <Th width={hasFamilyOwners ? 45 : 50}>Inception Date</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Capital Invested</Th>
                <Th width={hasFamilyOwners ? 50 : 55}>Latest Valuation</Th>
                <Th width={hasFamilyOwners ? 45 : 50}>Unrealised Gain</Th>
                <Th width={hasFamilyOwners ? 45 : 40} last>Abs Ret (%)</Th>
              </View>

              {aifHoldings.map((inv, idx) => {
                const cost = inv.investedAmount || 0;
                const val = inv.currentValue ?? cost;
                const gain = val - cost;
                const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                const owner = (inv as CumulativeInvestment).ownerName || user?.name || "Client";

                return (
                  <View
                    key={inv._id || idx}
                    style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                    wrap={false}
                  >
                    {hasFamilyOwners && (
                      <Td width={65}>
                        <Text style={s.boldText}>{owner}</Text>
                      </Td>
                    )}
                    <Td width={hasFamilyOwners ? 105 : 132}>
                      <Text style={s.boldText}>{inv.name}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 55 : 65}>{inv.institution || "—"}</Td>
                    <Td width={hasFamilyOwners ? 52 : 60}>{inv.notes || "Category III"}</Td>
                    <Td width={hasFamilyOwners ? 40 : 45}>{inv.folioNumber || "—"}</Td>
                    <Td width={hasFamilyOwners ? 45 : 50}>
                      {formatDateIndian(inv.buyDate || inv.createdAt)}
                    </Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(cost, false)}</Td>
                    <Td width={hasFamilyOwners ? 50 : 55}>
                      <Text style={s.boldText}>{fmtIndianCurrency(val, false)}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 45 : 50}>
                      <Text style={gain >= 0 ? s.posGainText : s.negLossText}>
                        {fmtIndianCurrency(gain, false)}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 45 : 40} last>
                      <Text style={absRet >= 0 ? s.posGainText : s.negLossText}>
                        {fmtNumber(absRet)}%
                      </Text>
                    </Td>
                  </View>
                );
              })}

              {/* AIF Total Row */}
              <View style={[s.totalRowStretch, { backgroundColor: C.totalRowAif }]} wrap={false}>
                <Ttotal width={hasFamilyOwners ? 362 : 352}>
                  AIF Grand Total:
                </Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(aifTotalCost, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 50 : 55}>{fmtIndianCurrency(aifTotalVal, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 45 : 50}>{fmtIndianCurrency(aifTotalGain, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 45 : 40} last>{fmtNumber(aifTotalAbsRet)}%</Ttotal>
              </View>
            </View>
          </View>
        )}

        {/* ── Table: Fixed Income & Other Assets ── */}
        {fixedHoldings.length > 0 && (
          <View wrap={true} style={{ marginBottom: 7 }}>
            <View style={s.sectionBannerLeft} wrap={false}>
              <Text style={s.sectionBannerLeftText}>Fixed Income, Commodities &amp; Other Assets</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={s.headRowStretch} wrap={false}>
                {hasFamilyOwners && <Th width={65}>Investor Name</Th>}
                <Th width={hasFamilyOwners ? 55 : 60}>Asset Type</Th>
                <Th width={hasFamilyOwners ? 107 : 132}>Holding Name / Institution</Th>
                <Th width={hasFamilyOwners ? 60 : 65}>Investment / Maturity Date</Th>
                <Th width={hasFamilyOwners ? 45 : 50}>Interest / Rate</Th>
                <Th width={hasFamilyOwners ? 55 : 60}>Invested Amount</Th>
                <Th width={hasFamilyOwners ? 55 : 60}>Current Value</Th>
                <Th width={hasFamilyOwners ? 55 : 65}>Gain / Accrual</Th>
                <Th width={hasFamilyOwners ? 55 : 60} last>Abs Ret (%)</Th>
              </View>

              {fixedHoldings.map((inv, idx) => {
                const cost = inv.investedAmount || 0;
                const val = inv.currentValue ?? cost;
                const gain = val - cost;
                const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                const owner = (inv as CumulativeInvestment).ownerName || user?.name || "Client";

                return (
                  <View
                    key={inv._id || idx}
                    style={[s.rowStretch, idx % 2 === 1 ? s.rowStretchAlt : {}]}
                    wrap={false}
                  >
                    {hasFamilyOwners && (
                      <Td width={65}>
                        <Text style={s.boldText}>{owner}</Text>
                      </Td>
                    )}
                    <Td width={hasFamilyOwners ? 55 : 60}>
                      <Text style={s.boldText}>
                        {ASSET_LABEL_MAP[inv.type] || inv.type.toUpperCase()}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 107 : 132}>
                      <Text style={s.boldText}>
                        {inv.name} {inv.institution ? `(${inv.institution})` : ""}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 60 : 65}>
                      {inv.maturityDate
                        ? `Mat: ${formatDateIndian(inv.maturityDate)}`
                        : formatDateIndian(inv.buyDate || inv.createdAt)}
                    </Td>
                    <Td width={hasFamilyOwners ? 45 : 50}>
                      {inv.interestRate != null ? `${inv.interestRate}% p.a.` : "—"}
                    </Td>
                    <Td width={hasFamilyOwners ? 55 : 60}>{fmtIndianCurrency(cost, false)}</Td>
                    <Td width={hasFamilyOwners ? 55 : 60}>
                      <Text style={s.boldText}>{fmtIndianCurrency(val, false)}</Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 55 : 65}>
                      <Text style={gain >= 0 ? s.posGainText : s.negLossText}>
                        {fmtIndianCurrency(gain, false)}
                      </Text>
                    </Td>
                    <Td width={hasFamilyOwners ? 55 : 60} last>
                      <Text style={absRet >= 0 ? s.posGainText : s.negLossText}>
                        {fmtNumber(absRet)}%
                      </Text>
                    </Td>
                  </View>
                );
              })}

              {/* Fixed Income Total Row */}
              <View style={s.totalRowStretch} wrap={false}>
                <Ttotal width={hasFamilyOwners ? 332 : 302}>
                  Fixed Income Total:
                </Ttotal>
                <Ttotal width={hasFamilyOwners ? 55 : 60}>{fmtIndianCurrency(fixedTotalCost, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 55 : 60}>{fmtIndianCurrency(fixedTotalVal, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 55 : 65}>{fmtIndianCurrency(fixedTotalGain, false)}</Ttotal>
                <Ttotal width={hasFamilyOwners ? 55 : 60} last>{fmtNumber(fixedTotalAbsRet)}%</Ttotal>
              </View>
            </View>
          </View>
        )}

        {/* ── Fixed Footer on every page ── */}
        <View style={s.pageFooter} fixed>
          <View style={s.regBar}>
            <Text style={s.regLabel}>REGULATORY REGISTRATIONS:</Text>
            <Text style={s.regValue}>AMFI: ARN 175433</Text>
            <Text style={{ fontSize: 6.2, color: C.gray400 }}>•</Text>
            <Text style={s.regValue}>BSE: AP0107480100941</Text>
            <Text style={{ fontSize: 6.2, color: C.gray400 }}>•</Text>
            <Text style={s.regValue}>NSE: AP206911451</Text>
            <Text style={{ fontSize: 6.2, color: C.gray400 }}>•</Text>
            <Text style={s.regValue}>MCX: AP33944</Text>
          </View>
          <View style={s.footerMetaRow}>
            <Text style={s.footerDisclaimer}>
              Generated by Phoenix Financial Services Portal · Confidential — For Client Reference Only
            </Text>
            <Text
              style={s.pageNumber}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ─── Helper to pre-fetch logo as Base64 Data URI ──────────────────────────────
async function fetchLogoBase64(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

// ─── Main Export Function ─────────────────────────────────────────────────────
export async function generatePortfolioReportPdf(options: GeneratePortfolioPdfOptions): Promise<void> {
  const logoDataUri = await fetchLogoBase64();

  const doc = (
    <PortfolioPdfDocument
      {...options}
      logoDataUri={logoDataUri}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const prefix = options.reportScope === "family"
    ? "Phoenix_Family_Cumulative_Portfolio"
    : "Phoenix_Master_Portfolio";
  const userName = options.user?.name
    ? options.user.name.trim().replace(/[^a-zA-Z0-9]/g, "_")
    : "Client";
  a.download = `${prefix}_${userName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
