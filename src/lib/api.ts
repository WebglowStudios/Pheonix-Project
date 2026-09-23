/**
 * Phoenix Engine API client
 * Typed fetch wrapper — auto-attaches JWT, handles auth errors.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("phoenix_token");
}

export function setToken(token: string): void {
  localStorage.setItem("phoenix_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("phoenix_token");
  localStorage.removeItem("phoenix_user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("phoenix_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: User): void {
  localStorage.setItem("phoenix_user", JSON.stringify(user));
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  riskProfile: "conservative" | "moderate" | "aggressive";
  createdAt?: string;
}

export type InvestmentType =
  | "stock" | "mutual_fund" | "sip" | "ppf" | "epf"
  | "fd" | "nps" | "bond" | "gold" | "crypto" | "aif" | "reit_invit";

export interface Investment {
  _id: string;
  userId: string;
  type: InvestmentType;
  name: string;
  symbol?: string;
  exchange?: string;
  folioNumber?: string;
  units?: number;
  buyPrice?: number;
  buyDate?: string;
  sipAmount?: number;
  sipStartDate?: string;
  instalments?: number;
  avgNav?: number;
  principal?: number;
  interestRate?: number;
  maturityDate?: string;
  tenureMonths?: number;
  institution?: string;
  investedAmount: number;
  currentPrice?: number;
  lastPriceUpdate?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Computed by backend on GET /api/portfolio
  currentValue?: number;
  gain?: number;
  gainPercent?: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGain: number;
  totalGainPercent: number;
  holdings: number;
  byType: Record<string, { count: number; invested: number; currentValue: number }>;
  recentInvestments: Partial<Investment>[];
  pricesLastUpdated: string | null;
}

// Auth-specific response shapes (token/user are top-level in backend response)
export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  errors?: Array<{ msg: string; path: string }>;
  data?: unknown;
  count?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  data?: T;
  count?: number;
  errors?: Array<{ msg: string; path: string }>;
}

// ─── Core fetch ────────────────────────────────────────────────────────────

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (response.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }
  return data;
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: { name: string; email: string; password: string; phone?: string; riskProfile?: string }) =>
    request<never>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<never>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  // /me returns { success, user } — user is top-level on ApiResponse
  me: () => request<never>("/api/auth/me"),

  // /profile returns { success, user } — user is top-level on ApiResponse
  updateProfile: (payload: { name?: string; phone?: string; riskProfile?: string }) =>
    request<never>("/api/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<never>("/api/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
};

// ─── Prices API ────────────────────────────────────────────────────────────

export const pricesApi = {
  refresh: () =>
    request<{ updated: number; failed: number; message: string }>("/api/prices/refresh", { method: "POST" }),

  lookupStock: (symbol: string, exchange?: string) =>
    request<{ price: number; symbol: string }>(
      `/api/prices/stock/${symbol}${exchange ? `?exchange=${exchange}` : ""}`
    ),

  lookupMFNav: (amfiCode: string) =>
    request<{ nav: number; amfiCode: string }>(`/api/prices/mf/${amfiCode}`),

  lookupGold: () =>
    request<{ pricePerGram: number }>("/api/prices/gold"),

  lookupCrypto: (symbol: string) =>
    request<{ price: number; symbol: string }>(`/api/prices/crypto/${symbol}`),

  search: (type: "stock" | "mutual_fund" | "sip" | "crypto", query: string) =>
    request<
      Array<{
        name: string;
        symbol?: string;
        code?: string;
        fullSymbol?: string;
        exchange?: string;
        id?: string;
        type: string;
      }>
    >(`/api/prices/search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(query)}`),
};

export const portfolioApi = {
  getSummary: () =>
    request<PortfolioSummary>("/api/portfolio/summary"),

  getAll: (params?: { type?: string; sort?: string; order?: string; search?: string }) => {
    const query = params
      ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString()
      : "";
    return request<Investment[]>(`/api/portfolio${query}`);
  },

  add: (data: Partial<Investment>) =>
    request<Investment>("/api/portfolio", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Investment>) =>
    request<Investment>(`/api/portfolio/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: string) =>
    request<never>(`/api/portfolio/${id}`, { method: "DELETE" }),
};
