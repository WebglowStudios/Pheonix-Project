"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { adminApi, Investment, InvestmentType } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel, faUpload, faDownload, faArrowLeft,
  faCheckCircle, faTimesCircle, faTriangleExclamation,
  faSpinner, faTrash, faEye,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ────────────────────────────────────────────────────────────────────
type ParsedRow = Record<string, string | number>;

const VALID_TYPES = [
  "stock", "mutual_fund", "sip", "ppf", "epf",
  "fd", "nps", "bond", "gold", "crypto", "aif", "reit_invit",
];

// ── Sample template columns & sample data ────────────────────────────────────
const TEMPLATE_COLUMNS = [
  "type", "name", "symbol", "exchange", "units", "buyPrice",
  "buyDate", "investedAmount", "currentPrice",
  "sipAmount", "sipStartDate", "instalments",
  "principal", "interestRate", "maturityDate", "tenureMonths",
  "institution", "category", "folioNumber", "notes",
];

const SAMPLE_ROWS = [
  {
    type: "stock", name: "Reliance Industries", symbol: "RELIANCE", exchange: "NSE",
    units: 10, buyPrice: 2400, buyDate: "2024-01-15", investedAmount: 24000,
    currentPrice: 2650, category: "equity", notes: "Long term hold",
  },
  {
    type: "mutual_fund", name: "Axis Bluechip Fund", symbol: "119551", exchange: "",
    units: 500, buyPrice: 45.5, buyDate: "2023-06-01", investedAmount: 22750,
    currentPrice: 52.3, category: "equity", folioNumber: "12345678",
  },
  {
    type: "sip", name: "HDFC Mid-Cap Opportunities", symbol: "118989", exchange: "",
    investedAmount: 60000, sipAmount: 5000, sipStartDate: "2022-01-01",
    instalments: 12, avgNav: 94.5, category: "equity",
  },
  {
    type: "fd", name: "SBI Fixed Deposit", institution: "State Bank of India",
    principal: 100000, interestRate: 7.1, maturityDate: "2026-03-31",
    tenureMonths: 24, investedAmount: 100000, category: "debt",
  },
  {
    type: "gold", name: "Physical Gold", units: 50, buyPrice: 5800,
    buyDate: "2023-11-01", investedAmount: 290000, currentPrice: 6400,
    category: "others",
  },
  {
    type: "aif", name: "ABC AIF Category II", investedAmount: 500000,
    currentPrice: 580000, category: "others", notes: "Unlisted — manual pricing",
  },
];

// ── Download sample template ─────────────────────────────────────────────────
function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: TEMPLATE_COLUMNS });

  // Style the header row
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cell]) continue;
    ws[cell].s = {
      fill: { fgColor: { rgb: "1A2740" } },
      font: { color: { rgb: "F0A500" }, bold: true },
    };
  }

  // Column widths
  ws["!cols"] = TEMPLATE_COLUMNS.map((col) => ({
    wch: Math.max(col.length + 4, 16),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Investments");

  // Instructions sheet
  const instructions = [
    ["Column", "Required?", "Valid Values / Notes"],
    ["type", "✅ Required", VALID_TYPES.join(" | ")],
    ["name", "✅ Required", "Full product name (e.g. Reliance Industries)"],
    ["symbol", "Optional", "NSE/BSE ticker (stock), AMFI code (MF), or leave blank"],
    ["exchange", "Optional", "NSE | BSE — stocks only"],
    ["units", "Optional", "Number of units/shares held"],
    ["buyPrice", "Optional", "Per-unit buy price in ₹"],
    ["buyDate", "Optional", "YYYY-MM-DD format"],
    ["investedAmount", "✅ Required", "Total amount invested in ₹"],
    ["currentPrice", "Optional", "Current market price per unit (or current value for AIFs)"],
    ["sipAmount", "MF/SIP only", "Monthly SIP installment amount"],
    ["sipStartDate", "MF/SIP only", "YYYY-MM-DD"],
    ["instalments", "MF/SIP only", "Number of SIP installments completed"],
    ["avgNav", "MF/SIP only", "Average NAV across installments"],
    ["principal", "FD/PPF/Bond", "Principal amount invested"],
    ["interestRate", "FD/PPF/Bond", "Annual interest rate in % (e.g. 7.1 for 7.1%)"],
    ["maturityDate", "FD/PPF/Bond", "YYYY-MM-DD"],
    ["tenureMonths", "FD/PPF/Bond", "Tenure in months"],
    ["institution", "FD/PPF/Bond", "Bank or institution name"],
    ["category", "Optional", "equity | debt | elss | hybrid | others"],
    ["folioNumber", "Optional", "MF folio number"],
    ["notes", "Optional", "Any additional notes"],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
  wsInstr["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

  XLSX.writeFile(wb, "Phoenix_Investment_Import_Template.xlsx");
}

// ── Map raw parsed row to Investment fields ──────────────────────────────────
function mapRow(raw: ParsedRow) {
  const get = (key: string) => {
    const val = raw[key] ?? raw[key.toLowerCase()] ?? raw[key.replace(/([A-Z])/g, "_$1").toLowerCase()];
    return val !== undefined ? String(val).trim() : "";
  };
  return {
    type:            get("type").toLowerCase() as InvestmentType,
    name:            get("name"),
    symbol:          get("symbol").toUpperCase(),
    exchange:        get("exchange").toUpperCase(),
    units:           parseFloat(get("units")) || 0,
    buyPrice:        parseFloat(get("buyPrice") || get("buy_price")) || 0,
    buyDate:         get("buyDate") || get("buy_date"),
    investedAmount:  parseFloat(get("investedAmount") || get("invested_amount")) || 0,
    currentPrice:    parseFloat(get("currentPrice") || get("current_price")) || 0,
    sipAmount:       parseFloat(get("sipAmount") || get("sip_amount")) || 0,
    sipStartDate:    get("sipStartDate") || get("sip_start_date"),
    instalments:     parseInt(get("instalments")) || 0,
    avgNav:          parseFloat(get("avgNav") || get("avg_nav")) || 0,
    principal:       parseFloat(get("principal")) || 0,
    interestRate:    parseFloat(get("interestRate") || get("interest_rate")) || 0,
    maturityDate:    get("maturityDate") || get("maturity_date"),
    tenureMonths:    parseInt(get("tenureMonths") || get("tenure_months")) || 0,
    institution:     get("institution"),
    category:        get("category").toLowerCase(),
    folioNumber:     get("folioNumber") || get("folio_number"),
    notes:           get("notes"),
  };
}

// ── Validate a mapped row client-side ─────────────────────────────────────────
function validateRow(row: ReturnType<typeof mapRow>): string | null {
  if (!VALID_TYPES.includes(row.type)) return `Invalid type "${row.type}"`;
  if (!row.name) return "Name is required";
  if (!row.investedAmount || row.investedAmount <= 0) return "investedAmount must be > 0";
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// Page Component
// ════════════════════════════════════════════════════════════════════════════
export default function BulkImportPage() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows]           = useState<ReturnType<typeof mapRow>[]>([]);
  const [errors, setErrors]       = useState<Record<number, string>>({});
  const [fileName, setFileName]   = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<{
    importedCount: number; skippedCount: number;
    created: { row: number; name: string }[];
    skipped:  { row: number; name: string; reason: string }[];
  } | null>(null);
  const [dragOver, setDragOver]   = useState(false);

  // ── Parse Excel/CSV file ────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setResult(null);
    setRows([]);
    setErrors({});
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb   = XLSX.read(data, { type: "array", cellDates: true });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });

      const mapped  = raw.map(mapRow);
      const errMap: Record<number, string> = {};
      mapped.forEach((r, i) => {
        const err = validateRow(r);
        if (err) errMap[i] = err;
      });

      setRows(mapped);
      setErrors(errMap);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const removeRow = (i: number) => {
    setRows((r) => r.filter((_, idx) => idx !== i));
    setErrors((err) => {
      const copy = { ...err };
      delete copy[i];
      return copy;
    });
  };

  const validRows  = rows.filter((_, i) => !errors[i]);
  const invalidRows = rows.filter((_, i) => !!errors[i]);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await adminApi.bulkImportInvestments(userId, validRows);
      // Backend returns importedCount/skippedCount at top level (merged with ApiResponse)
      const payload = (res.data ?? res as unknown) as {
        importedCount: number;
        skippedCount:  number;
        created: { row: number; name: string }[];
        skipped:  { row: number; name: string; reason: string }[];
      };
      setResult(payload);
      setRows([]);
      setFileName("");
    } catch (err) {
      alert("Import failed. Please try again.");
      console.error(err);
    } finally {
      setImporting(false);
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  const thClass = "text-left text-[11px] font-bold uppercase tracking-wider text-[#8a92a6] px-3 py-2.5 whitespace-nowrap";
  const tdClass = "px-3 py-2.5 text-[13px] text-[#2d3748]";

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/users`}
            className="flex items-center gap-2 text-sm text-[#8a92a6] hover:text-[#E8740C] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Users
          </Link>
          <div className="h-4 w-px bg-[#e2e8f0]" />
          <div>
            <h1 className="text-[20px] font-bold text-[#1a2740]">
              <FontAwesomeIcon icon={faFileExcel} className="text-green-600 mr-2" />
              Bulk Import Investments
            </h1>
            <p className="text-xs text-[#8a92a6] mt-0.5">
              Upload an Excel or CSV file to add multiple holdings for this client at once
            </p>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-lg" />
              </div>
              <div>
                <p className="font-bold text-[#1a2740]">Import Complete</p>
                <p className="text-sm text-[#64748b]">
                  <span className="text-green-600 font-semibold">{result.importedCount} holdings added</span>
                  {result.skippedCount > 0 && (
                    <span className="text-amber-600 font-semibold ml-2">· {result.skippedCount} skipped</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => router.push(`/admin/users`)}
                className="ml-auto px-4 py-2 bg-[#E8740C] text-white text-sm font-bold rounded-lg hover:bg-[#cf6509] transition-colors"
              >
                View Portfolio
              </button>
            </div>
            {result.skipped.length > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-bold text-amber-700 mb-2">Skipped Rows</p>
                {result.skipped.map((s, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    Row {s.row}: <strong>{s.name}</strong> — {s.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Instructions + download */}
          <div className="space-y-4">

            {/* Download template */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1a2740] text-[14px] mb-1">Step 1 — Download Template</h2>
              <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
                Download the Excel template with sample data and an instructions sheet showing every column and valid values.
              </p>
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Sample Template (.xlsx)
              </button>
            </div>

            {/* Valid types */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1a2740] text-[14px] mb-3">Valid Investment Types</h2>
              <div className="flex flex-wrap gap-1.5">
                {VALID_TYPES.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-[#f0f4ff] text-[#4f6ef7] text-[11px] font-semibold rounded-full border border-[#c7d2fe]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Required fields */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1a2740] text-[14px] mb-3">Required Columns</h2>
              <ul className="space-y-1.5 text-xs text-[#64748b]">
                {[
                  ["type", "Investment type (see above)"],
                  ["name", "Full product name"],
                  ["investedAmount", "Total amount in ₹"],
                ].map(([col, desc]) => (
                  <li key={col} className="flex gap-2">
                    <span className="font-mono font-bold text-[#E8740C] min-w-[110px]">{col}</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#94a3b8] mt-3">All other columns are optional.</p>
            </div>
          </div>

          {/* Right — Upload + preview */}
          <div className="lg:col-span-2 space-y-4">

            {/* Drop zone */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1a2740] text-[14px] mb-3">Step 2 — Upload Your File</h2>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${dragOver
                    ? "border-[#E8740C] bg-orange-50"
                    : "border-[#cbd5e1] hover:border-[#E8740C] hover:bg-orange-50/40"
                  }
                `}
              >
                <FontAwesomeIcon
                  icon={faUpload}
                  className={`text-3xl mb-3 ${dragOver ? "text-[#E8740C]" : "text-[#94a3b8]"}`}
                />
                <p className="font-semibold text-[#1a2740] text-sm">
                  {fileName || "Drop your Excel / CSV file here"}
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">or click to browse — .xlsx, .xls, .csv accepted</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {rows.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                      {validRows.length} valid
                    </span>
                    {invalidRows.length > 0 && (
                      <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                        <FontAwesomeIcon icon={faTimesCircle} className="text-xs" />
                        {invalidRows.length} with errors
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white text-sm font-bold rounded-lg hover:bg-[#cf6509] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Importing…</>
                    ) : (
                      <><FontAwesomeIcon icon={faUpload} /> Import {validRows.length} Holdings</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Preview table */}
            {rows.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                  <h2 className="font-bold text-[#1a2740] text-[14px]">
                    <FontAwesomeIcon icon={faEye} className="mr-2 text-[#8a92a6]" />
                    Preview — {rows.length} rows
                  </h2>
                  <button
                    onClick={() => { setRows([]); setErrors({}); setFileName(""); }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#f8fafc] sticky top-0 z-10">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Symbol</th>
                        <th className={thClass}>Units</th>
                        <th className={thClass}>Buy Price</th>
                        <th className={thClass}>Invested (₹)</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {rows.map((row, i) => {
                        const err = errors[i];
                        return (
                          <tr
                            key={i}
                            className={err ? "bg-red-50" : "hover:bg-[#f8fafc]"}
                          >
                            <td className={tdClass + " text-[#94a3b8] font-mono"}>{i + 2}</td>
                            <td className={tdClass}>
                              {err ? (
                                <span className="flex items-center gap-1 text-red-500 text-[11px] font-semibold" title={err}>
                                  <FontAwesomeIcon icon={faTriangleExclamation} />
                                  Error
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600 text-[11px] font-semibold">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                  OK
                                </span>
                              )}
                            </td>
                            <td className={tdClass}>
                              <span className="px-2 py-0.5 bg-[#f0f4ff] text-[#4f6ef7] text-[11px] font-semibold rounded-full">
                                {row.type || "—"}
                              </span>
                            </td>
                            <td className={tdClass + " font-medium max-w-[160px] truncate"} title={row.name}>
                              {row.name || <span className="text-red-400">missing</span>}
                            </td>
                            <td className={tdClass + " font-mono text-[12px] text-[#64748b]"}>{row.symbol || "—"}</td>
                            <td className={tdClass + " text-right"}>{row.units || "—"}</td>
                            <td className={tdClass + " text-right"}>
                              {row.buyPrice ? `₹${row.buyPrice.toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className={tdClass + " text-right font-semibold"}>
                              {row.investedAmount
                                ? `₹${row.investedAmount.toLocaleString("en-IN")}`
                                : <span className="text-red-400">missing</span>
                              }
                            </td>
                            <td className={tdClass + " text-[#64748b]"}>{row.category || "—"}</td>
                            <td className={tdClass}>
                              <button
                                onClick={() => removeRow(i)}
                                className="text-[#94a3b8] hover:text-red-500 transition-colors"
                                title="Remove row"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Error summary */}
                {Object.keys(errors).length > 0 && (
                  <div className="border-t border-[#e2e8f0] px-5 py-3 bg-red-50">
                    <p className="text-xs font-bold text-red-600 mb-1.5">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />
                      {Object.keys(errors).length} row(s) have errors and will be skipped:
                    </p>
                    {Object.entries(errors).map(([idx, msg]) => (
                      <p key={idx} className="text-xs text-red-500">
                        Row {Number(idx) + 2}: {rows[Number(idx)]?.name || "unnamed"} — {msg}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

