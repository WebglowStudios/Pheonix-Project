"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setToken, setStoredUser } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  onError?: (msg: string) => void;
}

export default function GoogleSignInButton({
  text = "continue_with",
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isPlaceholder =
    !clientId ||
    clientId.includes("your_google_client_id_here") ||
    clientId.trim() === "";

  useEffect(() => {
    if (isPlaceholder) {
      setConfigMissing(true);
      return;
    }

    const scriptId = "google-jssdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    function initGoogle() {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response.credential) return;
            setLoading(true);
            try {
              const res = await authApi.googleLogin(response.credential);
              if (!res.success || !res.token || !res.user) {
                onError?.(res.message || "Google sign-in failed. Please try again.");
                setLoading(false);
                return;
              }

              setToken(res.token);
              setStoredUser(res.user);
              router.push("/dashboard");
            } catch {
              onError?.("Unable to complete Google sign-in. Please try again.");
              setLoading(false);
            }
          },
        });

        // Clear existing children before rendering
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: text,
          shape: "rectangular",
          logo_alignment: "left",
          width: "360",
        });
      } catch (err) {
        console.error("Google button initialization error:", err);
      }
    }

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initGoogle();
    }
  }, [clientId, isPlaceholder, text, router, onError]);

  function handlePlaceholderClick() {
    onError?.(
      "Google Client ID is not yet configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file."
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-[#666] font-medium">
          <span className="w-3.5 h-3.5 border-2 border-[#E8740C] border-t-transparent rounded-full animate-spin inline-block" />
          Signing in with Google...
        </div>
      )}

      {configMissing ? (
        <button
          type="button"
          onClick={handlePlaceholderClick}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-[#DDD] hover:border-[#bbb] hover:bg-[#fafafa] rounded-lg text-sm font-semibold text-[#444] transition-all shadow-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {text === "signup_with" ? "Sign up with Google" : "Continue with Google"}
        </button>
      ) : (
        <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />
      )}
    </div>
  );
}
