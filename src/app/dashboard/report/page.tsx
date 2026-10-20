"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { portfolioApi, familyApi, getStoredUser, type PortfolioSummary, type Investment, type User, type FamilyMember } from "@/lib/api";
import MasterPortfolioReport from "@/components/report/MasterPortfolioReport";
import FamilyPortfolioReport from "@/components/report/FamilyPortfolioReport";
import { exportPortfolioToExcel } from "@/lib/exportUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotateRight,
  faCircleCheck,
  faFilePdf,
  faFileExcel,
  faDownload,
  faSpinner,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export default function ReportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportScope, setReportScope] = useState<"individual" | "family">("individual");
  const [familyMembersCount, setFamilyMembersCount] = useState<number>(0);

  async function loadData() {
    setLoading(true);
    try {
      const stored = getStoredUser();
      setUser(stored);

      if (reportScope === "family") {
        const famRes = await familyApi.getCumulative();
        if (famRes.success && famRes.data) {
          setSummary(famRes.data.summary);
          setInvestments(famRes.data.investments || []);
          setMembers(famRes.data.members || []);
          setFamilyMembersCount(famRes.data.members?.length || 0);
        }
      } else {
        const [sumRes, invRes, famMembersRes] = await Promise.all([
          portfolioApi.getSummary(),
          portfolioApi.getAll(),
          familyApi.getMembers().catch(() => ({ success: false, data: null })),
        ]);

        if (sumRes.success && sumRes.data) {
          setSummary(sumRes.data);
        }
        if (invRes.success && invRes.data) {
          setInvestments(invRes.data);
        }
        if (famMembersRes.success && famMembersRes.data) {
          setFamilyMembersCount(
            (famMembersRes.data.members?.length || 0) + 1
          );
        }
      }
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [reportScope]);

  async function handleDownloadPdf() {
    if (generating) return;
    setGenerating(true);
    try {
      const { generatePortfolioReportPdf } = await import("@/lib/generatePortfolioPdf");
      await generatePortfolioReportPdf({
        user,
        summary,
        investments,
        reportDate: new Date(),
        reportScope,
        members,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again or check console.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadExcel() {
    exportPortfolioToExcel(user, investments, summary, {
      isFamily: reportScope === "family",
      members,
    });
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Generating Master Portfolio Statement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 px-2 sm:px-4 bg-[#F3F4F7]">
      {/* Action Toolbar */}
      <div className="max-w-[1020px] mx-auto mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faFilePdf} className="text-[#E8740C]" />
              Master Portfolio Report
            </h1>
            <p className="text-xs text-gray-500">Live investor statement ready for export</p>
          </div>
        </div>

        {/* Scope Toggle: Individual vs Family */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setReportScope("individual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              reportScope === "individual"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            My Individual Statement
          </button>
          <button
            onClick={() => setReportScope("family")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              reportScope === "family"
                ? "bg-[#E8740C] text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon icon={faUsers} className="text-xs" />
            <span>Family Cumulative ({familyMembersCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={loadData}
            disabled={generating}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh latest data"
          >
            <FontAwesomeIcon icon={faRotateRight} className="text-xs text-gray-500" />
            Refresh
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={generating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#14532D] bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] shadow-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Download formatted Master Excel statement"
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-xs text-[#16A34A]" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E8740C] hover:bg-[#d46606] shadow-sm rounded-lg transition-all cursor-pointer hover:shadow-md disabled:opacity-75"
          >
            <FontAwesomeIcon
              icon={generating ? faSpinner : faDownload}
              className={`text-xs ${generating ? "animate-spin" : ""}`}
            />
            {generating ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-[1020px] mx-auto mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
        <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600 flex-shrink-0" />
        <span>
          <strong>Executive Export:</strong> Export your live statement as an official, high-resolution <strong>PDF Report</strong> or a professionally styled <strong>Master Excel Workbook</strong> complete with asset allocation, frozen headers, and accounting summaries.
        </span>
      </div>

      {/* Printable Report Component */}
      <div className="print-surface">
        {reportScope === "family" ? (
          <FamilyPortfolioReport
            primaryUser={user}
            members={members}
            summary={summary as any}
            investments={investments as any}
            reportDate={new Date()}
          />
        ) : (
          <MasterPortfolioReport
            user={user}
            summary={summary}
            investments={investments}
            reportDate={new Date()}
          />
        )}
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside,
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          .print-surface {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .report-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
