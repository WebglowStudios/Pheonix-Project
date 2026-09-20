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
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem("phoenix_user", JSON.stringify(user));
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  riskProfile: "conservative" | "moderate" | "aggressive";
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  data?: T;
  errors?: Array<{ msg: string; path: string }>;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Auto-handle 401 — clear session and redirect to login
  if (response.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }

  return data;
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    riskProfile?: string;
  }) =>
    request<never>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<never>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<never>("/api/auth/me"),

  updateProfile: (payload: {
    name?: string;
    phone?: string;
    riskProfile?: string;
  }) =>
    request<never>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) =>
    request<never>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
