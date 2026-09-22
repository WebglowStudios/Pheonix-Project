"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { portfolioApi, getStoredUser, type PortfolioSummary, type Investment, type User } from "@/lib/api";
import MasterPortfolioReport from "@/components/report/MasterPortfolioReport";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPrint,
  faArrowLeft,
  faRotateRight,
  faCircleCheck,
  faFilePdf,
  faDownload,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export default function ReportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const stored = getStoredUser();
      setUser(stored);

      const [sumRes, invRes] = await Promise.all([
        portfolioApi.getSummary(),
        portfolioApi.getAll(),
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (invRes.success && invRes.data) {
        setInvestments(invRes.data);
      }
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDownloadPdf() {
    if (generating) return;
    setGenerating(true);
    try {
      const page1 = document.getElementById("report-page-1");
      const page2 = document.getElementById("report-page-2");

      if (!page1) throw new Error("Report page 1 not found");

      // Dynamic import to keep client bundle lean
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 6; // 6mm margin
      const contentWidth = pdfWidth - margin * 2;

      // Render Page 1 to high-res PNG (2x pixel ratio for 300-DPI quality)
      const imgData1 = await toPng(page1, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const imgProps1 = pdf.getImageProperties(imgData1);
      const h1 = (imgProps1.height * contentWidth) / imgProps1.width;
      pdf.addImage(imgData1, "PNG", margin, margin, contentWidth, Math.min(h1, pdfHeight - margin * 2));

      // Render Page 2 if present
      if (page2) {
        const imgData2 = await toPng(page2, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const imgProps2 = pdf.getImageProperties(imgData2);
        const h2 = (imgProps2.height * contentWidth) / imgProps2.width;

        pdf.addPage();
        pdf.addImage(imgData2, "PNG", margin, margin, contentWidth, Math.min(h2, pdfHeight - margin * 2));
      }

      const userName = user?.name ? user.name.trim().replace(/[^a-zA-Z0-9]/g, "_") : "Client";
      pdf.save(`Phoenix_Master_Portfolio_${userName}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
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
      {/* Action Toolbar (Hidden in Print) */}
      <div className="max-w-[1020px] mx-auto mb-5 print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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
            onClick={handlePrint}
            disabled={generating}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Print to printer"
          >
            <FontAwesomeIcon icon={faPrint} className="text-xs text-gray-600" />
            Print
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

      {/* Tip Banner (Hidden in Print) */}
      <div className="max-w-[1020px] mx-auto mb-4 print:hidden px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
        <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600 flex-shrink-0" />
        <span>
          <strong>Pro-Tip:</strong> In your browser print dialog, select <strong>&ldquo;Save as PDF&rdquo;</strong> and make sure <strong>&ldquo;Background graphics&rdquo;</strong> is checked to retain table headers and chart colors.
        </span>
      </div>

      {/* Printable Report Component */}
      <div className="print-surface">
        <MasterPortfolioReport
          user={user}
          summary={summary}
          investments={investments}
          reportDate={new Date()}
        />
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
