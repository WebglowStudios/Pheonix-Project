"use client";

import { useEffect, useState } from "react";
import { portfolioApi, getStoredUser, type Transaction, type ExitReportSummary, type User } from "@/lib/api";
import ExitPnlReport from "@/components/report/ExitPnlReport";

export default function ActivityPnlPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ExitReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(true);

    portfolioApi
      .getTransactions()
      .then((res) => {
        if (res.success && res.data) {
          setTransactions(res.data.transactions || (res as any).transactions || (res.data as any) || []);
          setSummary(res.data.summary || (res as any).summary || null);
        }
      })
      .catch((err) => {
        console.error("Error fetching transactions for activity report:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ExitPnlReport
        transactions={transactions}
        summary={summary}
        user={user}
        loading={loading}
      />
    </div>
  );
}
