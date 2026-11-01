"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { adminApi, AdminProductPriceItem, AdminProductPriceStats } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faCoins,
  faArrowRotateRight,
  faUpload,
  faDownload,
  faPlus,
  faPenToSquare,
  faCheck,
  faTriangleExclamation,
  faCloudArrowDown,
  faSpinner,
  faTimes,
  faFileExcel,
  faLayerGroup,
  faBuildingColumns,
  faArrowTrendUp,
  faInfoCircle,
  faFileImport,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx-js-style";

// ── Palette & Formatting Constants for Excel ─────────────────────────────────
const EXCEL_PALETTE = {
  brandDark: "16171E",
  brandOrange: "E8740C",
  navyHeader: "1E293B",
  subHeader: "334155",
  rowZebra: "F8FAFC",
  white: "FFFFFF",
  borderLight: "E2E8F0",
  borderMedium: "CBD5E1",
  profitGreen: "15803D",
  profitBg: "F0FDF4",
  lossRed: "B91C1C",
  lossBg: "FEF2F2",
  newPriceBg: "FEF9C3", // Soft yellow to highlight editable New Price column
  newPriceBorder: "EAB308",
};

const BORDER_THIN = {
  top: { style: "thin", color: { rgb: EXCEL_PALETTE.borderLight } },
  bottom: { style: "thin", color: { rgb: EXCEL_PALETTE.borderLight } },
  left: { style: "thin", color: { rgb: EXCEL_PALETTE.borderLight } },
  right: { style: "thin", color: { rgb: EXCEL_PALETTE.borderLight } },
};

const BORDER_EDITABLE = {
  top: { style: "thin", color: { rgb: EXCEL_PALETTE.newPriceBorder } },
  bottom: { style: "thin", color: { rgb: EXCEL_PALETTE.newPriceBorder } },
  left: { style: "medium", color: { rgb: EXCEL_PALETTE.newPriceBorder } },
  right: { style: "medium", color: { rgb: EXCEL_PALETTE.newPriceBorder } },
};

function fmtCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrencyShort(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(str?: string | null) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_LABELS: Record<string, string> = {
  stock: "Stocks / Equity",
  mutual_fund: "Mutual Funds",
  sip: "SIP",
  bond: "Bonds & Debentures",
  fd: "Fixed Deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  gold: "Gold / SGB",
  crypto: "Cryptocurrency",
  aif: "AIF / Private Equity",
  reit_invit: "REITs / InvITs",
};

function getTypeBadgeStyle(type: string) {
  switch (type) {
    case "stock":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "mutual_fund":
    case "sip":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "bond":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "fd":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "aif":
    case "reit_invit":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "gold":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// ── Excel Export Helper ───────────────────────────────────────────────────────
function exportPricingMasterToExcel(products: AdminProductPriceItem[], isTemplateOnly = false) {
  const wb = XLSX.utils.book_new();
  const ws: any = {};
  const totalCols = 11;

  // Title Banner
  ws["A1"] = {
    v: "PHOENIX FINANCIAL SERVICES - PRODUCT PRICING MASTER",
    t: "s",
    s: {
      fill: { fgColor: { rgb: EXCEL_PALETTE.brandDark } },
      font: { name: "Calibri", sz: 14, bold: true, color: { rgb: EXCEL_PALETTE.white } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };

  // Subtitle / Instructions
  ws["A2"] = {
    v: "INSTRUCTIONS: Enter updated prices in 'New Price (₹)' (Column G). Leave unchanged if not updating. Save and upload back to the admin portal.",
    t: "s",
    s: {
      fill: { fgColor: { rgb: EXCEL_PALETTE.brandDark } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: EXCEL_PALETTE.brandOrange } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
  ];

  // Headers
  const headers = [
    "S.No",
    "Product Name",
    "Symbol / Ticker",
    "Asset Class",
    "Exchange",
    "Current Price (₹)",
    "New Price (₹)",
    "Client Holdings Count",
    "Total Invested (₹)",
    "Current Source",
    "Valuation Notes / Remarks",
  ];

  headers.forEach((h, colIdx) => {
    const isNewPrice = colIdx === 6;
    const ref = XLSX.utils.encode_cell({ r: 3, c: colIdx });
    ws[ref] = {
      v: h,
      t: "s",
      s: {
        fill: { fgColor: { rgb: isNewPrice ? EXCEL_PALETTE.brandOrange : EXCEL_PALETTE.navyHeader } },
        font: {
          name: "Calibri",
          sz: 11,
          bold: true,
          color: { rgb: EXCEL_PALETTE.white },
        },
        alignment: {
          horizontal: colIdx === 0 ? "center" : [5, 6, 7, 8].includes(colIdx) ? "right" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: BORDER_THIN,
      },
    };
  });

  // Data Rows
  const itemsToExport = isTemplateOnly && products.length === 0
    ? [
        {
          name: "Sample Unlisted Stock Ltd",
          symbol: "SAMPLEUNLISTED",
          type: "stock",
          exchange: "UNLISTED",
          currentPrice: 150.0,
          clientsCount: 2,
          holdingsCount: 3,
          totalInvested: 450000,
          source: "missing",
          manualNotes: "Quarterly audited valuation",
          isManual: false,
          isMissingPrice: false,
          totalUnits: 3000,
        },
        {
          name: "Sample Private Debt Fund Series 1",
          symbol: "DEBTFUND01",
          type: "bond",
          exchange: "PRIVATE",
          currentPrice: 1000.0,
          clientsCount: 5,
          holdingsCount: 5,
          totalInvested: 5000000,
          source: "manual_admin",
          manualNotes: "NAV as per Oct 2026 statement",
          isManual: true,
          isMissingPrice: false,
          totalUnits: 5000,
        },
      ]
    : products;

  itemsToExport.forEach((p, idx) => {
    const r = 4 + idx;
    const zebra = idx % 2 === 1 ? EXCEL_PALETTE.rowZebra : EXCEL_PALETTE.white;

    const cells = [
      { v: idx + 1, t: "n", align: "center", numFmt: "#,##0" },
      { v: p.name || "—", t: "s", align: "left" },
      { v: p.symbol || "—", t: "s", align: "left" },
      { v: TYPE_LABELS[p.type] || p.type, t: "s", align: "left" },
      { v: p.exchange || "—", t: "s", align: "center" },
      { v: p.currentPrice || 0, t: "n", align: "right", numFmt: "₹#,##0.00" },
      // Column G: New Price (leave empty or pre-populate if manual for user convenience)
      { v: isTemplateOnly ? "" : (p.isMissingPrice ? "" : p.currentPrice), t: "n", align: "right", numFmt: "₹#,##0.00", isEditable: true },
      { v: p.holdingsCount || 0, t: "n", align: "right", numFmt: "#,##0" },
      { v: p.totalInvested || 0, t: "n", align: "right", numFmt: "₹#,##0.00" },
      { v: p.isManual ? "Manual Override" : p.isMissingPrice ? "Unpriced / ₹0" : "Live API Synced", t: "s", align: "center" },
      { v: p.manualNotes || "", t: "s", align: "left" },
    ];

    cells.forEach((cell, c) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      const isEditable = (cell as any).isEditable;
      ws[ref] = {
        v: cell.v,
        t: cell.t,
        z: cell.numFmt,
        s: {
          fill: { fgColor: { rgb: isEditable ? EXCEL_PALETTE.newPriceBg : zebra } },
          font: {
            name: "Calibri",
            sz: 10,
            bold: isEditable || c === 1,
            color: { rgb: isEditable ? "92400E" : "0F172A" },
          },
          alignment: { horizontal: cell.align, vertical: "center" },
          border: isEditable ? BORDER_EDITABLE : BORDER_THIN,
        },
      };
    });
  });

  const lastRow = 4 + itemsToExport.length;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(lastRow, 5), c: totalCols - 1 },
  });

  ws["!cols"] = [
    { wch: 8 },  // S.No
    { wch: 38 }, // Product Name
    { wch: 18 }, // Symbol
    { wch: 22 }, // Asset Class
    { wch: 14 }, // Exchange
    { wch: 18 }, // Current Price
    { wch: 20 }, // New Price (Editable)
    { wch: 22 }, // Holdings Count
    { wch: 22 }, // Total Invested
    { wch: 20 }, // Source
    { wch: 35 }, // Notes
  ];

  // Freeze top 4 header rows
  ws["!views"] = [{ state: "frozen", ySplit: 4, showGridLines: true }];

  const sheetName = isTemplateOnly ? "Pricing_Template" : "Product_Prices_Master";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = isTemplateOnly
    ? `Phoenix_Price_Update_Template_${dateStr}.xlsx`
    : `Phoenix_Product_Prices_Master_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

// ── Parsed Item for Upload Preview ───────────────────────────────────────────
interface ParsedPriceRow {
  id: string;
  name: string;
  symbol: string;
  type: string;
  oldPrice: number;
  newPrice: number;
  notes: string;
  selected: boolean;
  isValid: boolean;
  errorMessage?: string;
  matchedProduct?: AdminProductPriceItem;
}

export default function AdminProductPricesPage() {
  const [products, setProducts] = useState<AdminProductPriceItem[]>([]);
  const [stats, setStats] = useState<AdminProductPriceStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "missing" | "manual" | "live">("all");

  // Single Item Edit Modal
  const [editItem, setEditItem] = useState<{
    name: string;
    symbol: string;
    type: string;
    price: string;
    notes: string;
    originalPrice: number;
    holdingsCount: number;
    clientsCount: number;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Custom Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    symbol: "",
    type: "stock",
    price: "",
    notes: "",
  });
  const [savingAdd, setSavingAdd] = useState(false);

  // Bulk Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPriceRow[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPrices({
        search: search.trim() || undefined,
        type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setStats(res.data.stats || null);
      } else {
        showToast(res.message || "Failed to load product prices.", "error");
      }
    } catch {
      showToast("Server error connecting to product pricing service.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Single Price Save
  const handleSaveSinglePrice = async () => {
    if (!editItem) return;
    const priceNum = parseFloat(editItem.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Please enter a valid price greater than 0.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await adminApi.updateProductPrice({
        name: editItem.name,
        symbol: editItem.symbol,
        type: editItem.type,
        price: priceNum,
        notes: editItem.notes,
      });

      if (res.success) {
        showToast(res.message || "Price updated successfully across all client holdings!", "success");
        setEditItem(null);
        fetchProducts();
      } else {
        showToast(res.message || "Failed to update price.", "error");
      }
    } catch {
      showToast("Network error updating price.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Add Custom Product Save
  const handleSaveAddProduct = async () => {
    if (!addForm.name.trim() && !addForm.symbol.trim()) {
      showToast("Please provide either a Product Name or Symbol.", "error");
      return;
    }
    const priceNum = parseFloat(addForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Please enter a valid price greater than 0.", "error");
      return;
    }

    setSavingAdd(true);
    try {
      const res = await adminApi.updateProductPrice({
        name: addForm.name.trim(),
        symbol: addForm.symbol.trim().toUpperCase(),
        type: addForm.type,
        price: priceNum,
        notes: addForm.notes.trim(),
      });

      if (res.success) {
        showToast(res.message || "Master product price created and applied!", "success");
        setShowAddModal(false);
        setAddForm({ name: "", symbol: "", type: "stock", price: "", notes: "" });
        fetchProducts();
      } else {
        showToast(res.message || "Failed to create product price.", "error");
      }
    } catch {
      showToast("Error creating product price.", "error");
    } finally {
      setSavingAdd(false);
    }
  };

  // ── Excel File Drop / Upload Handling ─────────────────────────────────────────
  const processExcelFile = (file: File) => {
    setUploadFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          showToast("The selected Excel file appears to be empty.", "error");
          return;
        }

        // Locate Header Row (look for "product name", "symbol", "name")
        let headerRowIdx = -1;
        let colMap: Record<string, number> = {};

        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          const rowStr = row.map((c) => String(c || "").trim().toLowerCase());
          const hasName = rowStr.some((c) => c.includes("name") || c.includes("product") || c.includes("scheme"));
          const hasSymbol = rowStr.some((c) => c.includes("symbol") || c.includes("ticker") || c.includes("code"));
          const hasPrice = rowStr.some((c) => c.includes("price") || c.includes("rate") || c.includes("nav"));

          if (hasName || hasSymbol || hasPrice) {
            headerRowIdx = r;
            row.forEach((cellVal, cIdx) => {
              const str = String(cellVal || "").trim().toLowerCase();
              if (str.includes("new price")) colMap["newPrice"] = cIdx;
              else if (str.includes("current price")) colMap["currentPrice"] = cIdx;
              else if (str.includes("price") && colMap["price"] === undefined) colMap["price"] = cIdx;

              if (str.includes("product") || str.includes("scheme") || (str.includes("name") && !str.includes("class"))) {
                colMap["name"] = cIdx;
              }
              if (str.includes("symbol") || str.includes("ticker") || str.includes("code")) {
                colMap["symbol"] = cIdx;
              }
              if (str.includes("type") || str.includes("class") || str.includes("category")) {
                colMap["type"] = cIdx;
              }
              if (str.includes("notes") || str.includes("remarks") || str.includes("source")) {
                colMap["notes"] = cIdx;
              }
            });
            break;
          }
        }

        if (headerRowIdx === -1) {
          showToast("Could not detect product or price columns in Excel sheet.", "error");
          return;
        }

        // Fallback for price column
        const priceColIdx = colMap["newPrice"] ?? colMap["price"] ?? colMap["currentPrice"];

        const parsed: ParsedPriceRow[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const rawName = colMap["name"] !== undefined ? String(row[colMap["name"]] || "").trim() : "";
          const rawSymbol = colMap["symbol"] !== undefined ? String(row[colMap["symbol"]] || "").trim().toUpperCase() : "";
          const rawType = colMap["type"] !== undefined ? String(row[colMap["type"]] || "").trim().toLowerCase() : "";
          const rawNotes = colMap["notes"] !== undefined ? String(row[colMap["notes"]] || "").trim() : "";

          // Extract price value
          const rawPriceVal = priceColIdx !== undefined ? row[priceColIdx] : null;
          let newPriceNum = 0;
          if (typeof rawPriceVal === "number") {
            newPriceNum = rawPriceVal;
          } else if (typeof rawPriceVal === "string") {
            const clean = rawPriceVal.replace(/[₹,$\s]/g, "");
            newPriceNum = parseFloat(clean);
          }

          // Skip completely empty rows
          if (!rawName && !rawSymbol && isNaN(newPriceNum)) continue;

          // Match with existing products in catalog to show Old Price and Holdings
          const matched = products.find(
            (p) =>
              (rawSymbol && p.symbol && p.symbol.toUpperCase() === rawSymbol) ||
              (rawName && p.name && p.name.toLowerCase() === rawName.toLowerCase())
          );

          const isValid = (!isNaN(newPriceNum) && newPriceNum > 0) && (rawName.length > 0 || rawSymbol.length > 0);
          const errorMsg = !isValid
            ? isNaN(newPriceNum) || newPriceNum <= 0
              ? "Missing or invalid positive price"
              : "Missing product name and symbol"
            : undefined;

          // Normalized type
          let finalType = "stock";
          if (matched) {
            finalType = matched.type;
          } else if (rawType.includes("mutual") || rawType.includes("fund")) {
            finalType = "mutual_fund";
          } else if (rawType.includes("bond") || rawType.includes("debt")) {
            finalType = "bond";
          } else if (rawType.includes("fd") || rawType.includes("fixed")) {
            finalType = "fd";
          } else if (rawType.includes("aif") || rawType.includes("private")) {
            finalType = "aif";
          }

          parsed.push({
            id: `row-${r}-${rawSymbol || rawName}`,
            name: rawName || matched?.name || rawSymbol,
            symbol: rawSymbol || matched?.symbol || "",
            type: finalType,
            oldPrice: matched ? matched.currentPrice : 0,
            newPrice: !isNaN(newPriceNum) ? newPriceNum : 0,
            notes: rawNotes || (matched?.manualNotes || "Bulk Excel update"),
            selected: isValid,
            isValid,
            errorMessage: errorMsg,
            matchedProduct: matched,
          });
        }

        if (parsed.length === 0) {
          showToast("No valid product price rows found in Excel sheet.", "error");
          return;
        }

        setParsedRows(parsed);
        setShowUploadModal(true);
      } catch (err) {
        console.error("Excel parse error:", err);
        showToast("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.", "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit Bulk Updates
  const handleApplyBulkUpdates = async () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid && r.newPrice > 0);
    if (selectedRows.length === 0) {
      showToast("No valid rows selected to update.", "error");
      return;
    }

    setSubmittingBulk(true);
    try {
      const itemsPayload = selectedRows.map((r) => ({
        name: r.name,
        symbol: r.symbol,
        type: r.type,
        price: r.newPrice,
        notes: r.notes || "Excel bulk upload",
      }));

      const res = await adminApi.bulkUpdateProductPrices(itemsPayload);
      if (res.success) {
        showToast(
          res.message || `Successfully updated ${res.data?.updatedProductsCount || selectedRows.length} products!`,
          "success"
        );
        setShowUploadModal(false);
        setParsedRows([]);
        setUploadFileName(null);
        fetchProducts();
      } else {
        showToast(res.message || "Failed to execute bulk update.", "error");
      }
    } catch {
      showToast("Server error during bulk price updates.", "error");
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Filtered Count Stats
  const selectedBulkCount = useMemo(() => parsedRows.filter((r) => r.selected && r.isValid).length, [parsedRows]);
  const totalBulkHoldingsImpact = useMemo(() => {
    return parsedRows
      .filter((r) => r.selected && r.isValid)
      .reduce((acc, r) => acc + (r.matchedProduct?.holdingsCount || 0), 0);
  }, [parsedRows]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl transition-all flex items-center gap-2.5 ${
            toast.type === "success" ? "bg-[#15803D]" : "bg-[#B91C1C]"
          }`}
        >
          <FontAwesomeIcon icon={toast.type === "success" ? faCheck : faTriangleExclamation} />
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF3EB] border border-[#E8740C]/20 flex items-center justify-center text-[#E8740C]">
              <FontAwesomeIcon icon={faCoins} className="text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1b23] tracking-tight">
                Product Prices & Master Valuation
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage live prices, override unlisted or unpriced holdings, and bulk update prices across all client portfolios.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Hidden File Input for Excel Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processExcelFile(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />

          <button
            onClick={() => exportPricingMasterToExcel(products, true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer"
            title="Download sample template with example products and instructions"
          >
            <FontAwesomeIcon icon={faDownload} className="text-xs text-[#64748B]" />
            Sample Template
          </button>

          <button
            onClick={() => exportPricingMasterToExcel(products, false)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer"
            title="Export all current products with client holdings into an editable Excel sheet"
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-xs text-[#15803D]" />
            Export All Sheet
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16171E] text-white text-xs font-semibold hover:bg-black transition shadow-sm cursor-pointer"
          >
            <FontAwesomeIcon icon={faUpload} className="text-xs text-[#E8740C]" />
            Upload Excel Sheet
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8740C] text-white text-xs font-semibold hover:bg-[#D06606] transition shadow-sm cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Custom Price
          </button>

          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 w-9 h-9 rounded-lg bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#1a1b23] hover:bg-gray-50 transition shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh prices"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} className={`text-xs ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#1E293B] flex items-center justify-center text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faLayerGroup} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1a1b23] leading-none">
              {stats?.totalProducts || products.length}
            </p>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-1">
              Catalog Products
            </p>
          </div>
        </div>

        {/* Live Synced */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faCloudArrowDown} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#15803D] leading-none">
              {stats?.liveCount || 0}
            </p>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-1">
              Live API Synced
            </p>
          </div>
        </div>

        {/* Unpriced / Missing */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-[#B91C1C] leading-none">
                {stats?.unpricedCount || 0}
              </p>
              {(stats?.unpricedCount || 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                  Needs Price
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-1">
              Unpriced (₹0.00)
            </p>
          </div>
        </div>

        {/* Impacted Holdings */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faBuildingColumns} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1a1b23] leading-none">
              {stats?.totalHoldingsCount || 0}
            </p>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-1">
              Client Holdings ({fmtCurrencyShort(stats?.totalInvestedSum || 0)})
            </p>
          </div>
        </div>
      </div>

      {/* Unpriced Warning Alert Banner */}
      {(stats?.unpricedCount || 0) > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 mb-6 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-[#D97706] mt-0.5 text-base flex-shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#92400E]">
                {stats?.unpricedCount} products in client portfolios have no live price (valued at ₹0.00)
              </h2>
              <p className="text-xs text-[#B45309] mt-0.5">
                These may include unlisted shares, private bonds, or funds not covered by AMFI/NSE. You can update their prices directly in the table below or download the Excel sheet to fill them in bulk.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("missing")}
            className="px-3 py-1.5 bg-[#D97706] text-white text-xs font-bold rounded-lg hover:bg-[#B45309] transition flex-shrink-0 cursor-pointer"
          >
            Filter Unpriced Products
          </button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm"
          />
          <input
            type="text"
            placeholder="Search by product name or ticker symbol (e.g. Reliance, EPF, 120503)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#1a1b23] bg-white outline-none focus:border-[#E8740C] cursor-pointer"
          >
            <option value="all">All Asset Classes</option>
            <option value="stock">Stocks / Direct Equity</option>
            <option value="mutual_fund">Mutual Funds & SIP</option>
            <option value="bond">Bonds & Debentures</option>
            <option value="fd">Fixed Deposits</option>
            <option value="aif">AIF & Private Equity</option>
            <option value="ppf">PPF / EPF / NPS</option>
            <option value="gold">Gold & SGB</option>
            <option value="crypto">Cryptocurrency</option>
          </select>

          {/* Status Tabs */}
          <div className="flex rounded-lg border border-[#E2E8F0] bg-gray-50/80 p-0.5">
            {[
              { id: "all", label: "All" },
              { id: "missing", label: "Unpriced (₹0)" },
              { id: "manual", label: "Manual Overrides" },
              { id: "live", label: "Live Synced" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-[#1a1b23] shadow-xs"
                    : "text-[#64748B] hover:text-[#1a1b23]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#64748B] gap-3">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#E8740C]" />
            <p className="text-sm font-semibold">Loading product master catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl mb-3">
              <FontAwesomeIcon icon={faCoins} />
            </div>
            <p className="text-base font-bold text-[#1a1b23]">No products found</p>
            <p className="text-xs text-[#64748B] max-w-md mt-1 mb-4">
              {search || typeFilter !== "all" || statusFilter !== "all"
                ? "No products match the selected filters. Try clearing your search or filters."
                : "No products exist in client portfolios yet. You can upload an Excel sheet or add custom product prices."}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-xs font-bold text-[#1a1b23] hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#16171E] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">Asset Class</th>
                  <th className="py-3 px-4 text-center">Pricing Status</th>
                  <th className="py-3 px-4 text-right">Current Price</th>
                  <th className="py-3 px-4 text-right">Holdings Impact</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {products.map((p, idx) => {
                  const typeLabel = TYPE_LABELS[p.type] || p.type;
                  const isUnpriced = p.isMissingPrice;
                  const isManual = p.isManual;

                  return (
                    <tr
                      key={`${p.symbol || ""}-${p.name}-${idx}`}
                      className={`hover:bg-[#FFF8F3]/40 transition ${isUnpriced ? "bg-red-50/30" : ""}`}
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 text-center font-bold text-[#94A3B8]">
                        {idx + 1}
                      </td>

                      {/* Product Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1a1b23] text-sm leading-snug">
                          {p.name || "—"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {p.symbol && (
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#475569]">
                              {p.symbol}
                            </span>
                          )}
                          {p.exchange && (
                            <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">
                              {p.exchange}
                            </span>
                          )}
                          {p.manualNotes && (
                            <span
                              className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate max-w-[200px]"
                              title={p.manualNotes}
                            >
                              Note: {p.manualNotes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Asset Class */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getTypeBadgeStyle(
                            p.type
                          )}`}
                        >
                          {typeLabel}
                        </span>
                      </td>

                      {/* Pricing Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isUnpriced ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
                            Unpriced (₹0.00)
                          </span>
                        ) : isManual ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-[#E8740C]">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                            Manual Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                            <FontAwesomeIcon icon={faCloudArrowDown} className="text-[10px]" />
                            Live API Synced
                          </span>
                        )}
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`text-sm font-black ${
                            isUnpriced ? "text-red-600" : "text-[#1a1b23]"
                          }`}
                        >
                          {fmtCurrency(p.currentPrice)}
                        </div>
                        {isManual && p.previousPrice && p.previousPrice !== p.currentPrice && (
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">
                            Was {fmtCurrency(p.previousPrice)}
                          </div>
                        )}
                      </td>

                      {/* Holdings Impact */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-[#1a1b23]">
                          {p.holdingsCount} {p.holdingsCount === 1 ? "holding" : "holdings"}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {p.clientsCount} {p.clientsCount === 1 ? "client" : "clients"} • {fmtCurrencyShort(p.totalInvested)}
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                        <div>{formatDate(p.lastUpdated || p.lastPriceUpdate)}</div>
                        <div className="text-[10px] text-[#94A3B8] capitalize mt-0.5">
                          Source: {p.source ? p.source.replace("_", " ") : "system"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditItem({
                              name: p.name,
                              symbol: p.symbol || "",
                              type: p.type,
                              price: p.currentPrice > 0 ? String(p.currentPrice) : "",
                              notes: p.manualNotes || "",
                              originalPrice: p.currentPrice,
                              holdingsCount: p.holdingsCount,
                              clientsCount: p.clientsCount,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-[#E8740C]/30 text-[#E8740C] text-xs font-bold hover:bg-[#E8740C] hover:text-white transition cursor-pointer shadow-xs"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="text-[11px]" />
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL 1: SINGLE PRODUCT PRICE UPDATE
         ───────────────────────────────────────────────────────────────────────── */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#16171E] text-white p-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8740C] px-2 py-0.5 rounded bg-white/10">
                  Global Price Override
                </span>
                <h3 className="text-lg font-bold mt-1 text-white leading-snug">
                  {editItem.name}
                </h3>
                {editItem.symbol && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    Symbol: {editItem.symbol}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="text-gray-400 hover:text-white transition p-1 cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Impact Notice */}
            <div className="bg-[#FFF3EB] px-5 py-3 border-b border-[#E8740C]/20 flex items-center gap-3">
              <FontAwesomeIcon icon={faInfoCircle} className="text-[#E8740C] text-sm flex-shrink-0" />
              <p className="text-xs text-[#92400E]">
                Saving this price will immediately update <strong>{editItem.holdingsCount} holdings</strong> across <strong>{editItem.clientsCount} clients</strong> and protect it from automated sync resets.
              </p>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1.5">
                  New Current Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter price per unit..."
                    value={editItem.price}
                    onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-[#CBD5E1] rounded-xl text-base font-bold text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/20"
                    autoFocus
                  />
                </div>
                {editItem.originalPrice > 0 && (
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Current active price: {fmtCurrency(editItem.originalPrice)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1.5">
                  Audit Notes / Valuation Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audited NAV statement Oct 2026, Unlisted broker quote"
                  value={editItem.notes}
                  onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-xl text-xs text-[#1a1b23] outline-none focus:border-[#E8740C]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEditItem(null)}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSinglePrice}
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl bg-[#E8740C] text-white text-xs font-bold hover:bg-[#D06606] transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {savingEdit ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    Updating Portfolios...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    Apply Price to All Portfolios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL 2: ADD CUSTOM PRODUCT MASTER PRICE
         ───────────────────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#16171E] text-white p-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  Register Custom Product Price
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Define an authoritative master price for any unlisted share, private bond, or fund.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition p-1 cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1">
                  Product / Scheme Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy Unlisted Shares, Waterfield Private Debt"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-xl text-xs text-[#1a1b23] outline-none focus:border-[#E8740C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1">
                    Symbol / Ticker
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SWIGGY"
                    value={addForm.symbol}
                    onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#1a1b23] outline-none focus:border-[#E8740C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1">
                    Asset Class
                  </label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#1a1b23] bg-white outline-none focus:border-[#E8740C]"
                  >
                    <option value="stock">Stocks / Unlisted Equity</option>
                    <option value="mutual_fund">Mutual Funds / SIP</option>
                    <option value="bond">Bonds & Debentures</option>
                    <option value="fd">Fixed Deposits</option>
                    <option value="aif">AIF & Private Equity</option>
                    <option value="ppf">PPF / EPF / NPS</option>
                    <option value="gold">Gold & SGB</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1">
                  Master Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#1a1b23] outline-none focus:border-[#E8740C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1b23] uppercase tracking-wider mb-1">
                  Valuation Source / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unlisted market price Oct 2026, Auditor certificate"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-xl text-xs text-[#1a1b23] outline-none focus:border-[#E8740C]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={savingAdd}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddProduct}
                disabled={savingAdd}
                className="px-5 py-2 rounded-xl bg-[#E8740C] text-white text-xs font-bold hover:bg-[#D06606] transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {savingAdd ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    Save Product Price
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL 3: EXCEL BULK UPLOAD & LIVE PREVIEW MODAL
         ───────────────────────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#16171E] text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#15803D]/20 text-[#10B981] flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faFileExcel} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    Bulk Price Update Preview
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    File: <span className="text-white font-semibold">{uploadFileName || "Uploaded File"}</span> • {parsedRows.length} rows detected
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedRows([]);
                }}
                className="text-gray-400 hover:text-white transition p-1 cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Summary Toolbar */}
            <div className="bg-gray-50 border-b border-[#E2E8F0] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-4 text-xs font-bold text-[#1a1b23]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                  <span>{selectedBulkCount} products ready to update</span>
                </div>
                {totalBulkHoldingsImpact > 0 && (
                  <div className="flex items-center gap-1.5 text-[#E8740C]">
                    <FontAwesomeIcon icon={faBuildingColumns} />
                    <span>Affects {totalBulkHoldingsImpact} client holdings</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allSelected = parsedRows.every((r) => r.selected);
                    setParsedRows(parsedRows.map((r) => ({ ...r, selected: !allSelected && r.isValid })));
                  }}
                  className="text-xs font-bold text-[#64748B] hover:text-[#1a1b23] underline cursor-pointer"
                >
                  {parsedRows.every((r) => r.selected) ? "Deselect All" : "Select All Valid"}
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-[#475569] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                          onChange={(e) => {
                            setParsedRows(parsedRows.map((r) => ({ ...r, selected: e.target.checked && r.isValid })));
                          }}
                          className="rounded text-[#E8740C] focus:ring-[#E8740C]"
                        />
                      </th>
                      <th className="py-2.5 px-3">Product Name & Ticker</th>
                      <th className="py-2.5 px-3">Asset Class</th>
                      <th className="py-2.5 px-3 text-right">Old Price</th>
                      <th className="py-2.5 px-3 text-right">New Price (₹)</th>
                      <th className="py-2.5 px-3 text-center">Holdings Impact</th>
                      <th className="py-2.5 px-3">Valuation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {parsedRows.map((row, idx) => {
                      const isPriceChanged = row.oldPrice > 0 && row.newPrice !== row.oldPrice;
                      const pctChange =
                        row.oldPrice > 0 ? ((row.newPrice - row.oldPrice) / row.oldPrice) * 100 : 0;

                      return (
                        <tr
                          key={row.id}
                          className={`${
                            !row.isValid
                              ? "bg-red-50/50"
                              : row.selected
                              ? "bg-white hover:bg-orange-50/20"
                              : "bg-gray-50/70 text-gray-400"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              disabled={!row.isValid}
                              onChange={(e) => {
                                setParsedRows(
                                  parsedRows.map((r) => (r.id === row.id ? { ...r, selected: e.target.checked } : r))
                                );
                              }}
                              className="rounded text-[#E8740C] focus:ring-[#E8740C]"
                            />
                          </td>

                          {/* Name & Ticker */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#1a1b23]">{row.name}</div>
                            {row.symbol && (
                              <span className="font-mono text-[10px] text-gray-500 font-semibold">
                                {row.symbol}
                              </span>
                            )}
                            {row.errorMessage && (
                              <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                                {row.errorMessage}
                              </p>
                            )}
                          </td>

                          {/* Asset Class */}
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-gray-600 uppercase">
                              {TYPE_LABELS[row.type] || row.type}
                            </span>
                          </td>

                          {/* Old Price */}
                          <td className="py-2.5 px-3 text-right text-gray-500">
                            {row.oldPrice > 0 ? fmtCurrency(row.oldPrice) : "₹0.00"}
                          </td>

                          {/* New Price (Editable right in preview table!) */}
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              value={row.newPrice || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setParsedRows(
                                  parsedRows.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          newPrice: isNaN(val) ? 0 : val,
                                          isValid: !isNaN(val) && val > 0,
                                        }
                                      : r
                                  )
                                );
                              }}
                              className="w-24 px-2 py-1 text-right font-black text-xs border border-amber-300 bg-amber-50 rounded-lg text-[#1a1b23] outline-none focus:ring-1 focus:ring-[#E8740C]"
                            />
                            {isPriceChanged && (
                              <span
                                className={`block text-[10px] font-bold mt-0.5 ${
                                  pctChange >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {pctChange >= 0 ? "+" : ""}
                                {pctChange.toFixed(1)}%
                              </span>
                            )}
                          </td>

                          {/* Impact */}
                          <td className="py-2.5 px-3 text-center">
                            {row.matchedProduct ? (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                {row.matchedProduct.holdingsCount} lots ({row.matchedProduct.clientsCount} clients)
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">New product</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.notes}
                              placeholder="Notes..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(
                                  parsedRows.map((r) => (r.id === row.id ? { ...r, notes: val } : r))
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded text-gray-700 outline-none focus:border-[#E8740C]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedRows([]);
                }}
                disabled={submittingBulk}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyBulkUpdates}
                disabled={submittingBulk || selectedBulkCount === 0}
                className="px-6 py-2.5 rounded-xl bg-[#E8740C] text-white text-xs font-bold hover:bg-[#D06606] transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {submittingBulk ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    Updating Portfolios...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    Apply Updates ({selectedBulkCount} Products)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
