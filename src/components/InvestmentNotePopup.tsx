"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNoteSticky,
  faQuoteRight,
  faCopy,
  faCheck,
  faTimes,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  notes?: string | null;
  itemName?: string;
  itemType?: string;
  children?: ReactNode;
  className?: string;
}

interface Coords {
  top: number;
  left: number;
  arrowLeft: number;
  placement: "top" | "bottom";
}

export default function InvestmentNotePopup({
  notes,
  itemName,
  itemType,
  children,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanNotes = notes?.trim() || "";

  // Ensure portal only mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute position relative to viewport
  function updatePosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = Math.min(380, window.innerWidth - 24);
    const popupEstHeight = 220;

    // Viewport space check
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceBelow < popupEstHeight && spaceAbove > spaceBelow ? "top" : "bottom";

    // Horizontal alignment centered on trigger, clamped within screen margins
    const triggerCenter = rect.left + rect.width / 2;
    let targetLeft = triggerCenter - popupWidth / 2;
    const minLeft = 12;
    const maxLeft = window.innerWidth - popupWidth - 12;
    targetLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

    // Vertical alignment
    const targetTop =
      placement === "bottom" ? rect.bottom + 8 : rect.top - 8;

    // Relative arrow position inside popup
    const arrowLeft = Math.max(
      16,
      Math.min(triggerCenter - targetLeft - 7, popupWidth - 30)
    );

    setCoords({
      top: targetTop,
      left: targetLeft,
      arrowLeft,
      placement,
    });
  }

  // Auto-close on scroll or window resize to prevent orphaned floating popups
  useEffect(() => {
    if (!isOpen) return;

    function handleScrollOrResize() {
      updatePosition();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleTriggerMouseEnter() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    openTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 60);
  }

  function handleTriggerMouseLeave() {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  }

  function handlePopupMouseEnter() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }

  function handlePopupMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  }

  function handleCopyNote(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  }

  // If no note exists, render children without tooltip wrapper
  if (!cleanNotes) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        className={`inline-flex items-center gap-1.5 align-middle max-w-full ${className}`}
      >
        {/* Child content (e.g. holding name) */}
        <div className="min-w-0 cursor-pointer">{children}</div>

        {/* Luminous Note Indicator Chip */}
        <button
          type="button"
          onClick={handleToggleClick}
          title="View Strategy Note"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 text-[#E8740C] border border-[#E8740C]/35 hover:border-[#E8740C] hover:bg-[#E8740C]/20 transition-all text-[10px] font-bold tracking-tight shadow-[0_0_10px_rgba(232,116,12,0.18)] cursor-pointer flex-shrink-0 active:scale-95 group/chip"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8740C] shadow-[0_0_8px_#E8740C] animate-pulse flex-shrink-0" />
          <FontAwesomeIcon
            icon={faNoteSticky}
            className="text-[9px] text-[#E8740C] group-hover/chip:rotate-6 transition-transform"
          />
          <span className="text-[9px] font-extrabold uppercase tracking-wide">
            Note
          </span>
        </button>
      </div>

      {/* ── React Portal Floating HUD Popover ── */}
      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={popupRef}
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.placement === "bottom" ? coords.top : "auto",
              bottom:
                coords.placement === "top"
                  ? window.innerHeight - coords.top
                  : "auto",
              left: coords.left,
              width: Math.min(380, window.innerWidth - 24),
              zIndex: 99999,
            }}
            className="text-white text-left cursor-default select-text transition-all duration-150 animate-fadeIn"
          >
            {/* Popover Card */}
            <div className="relative rounded-2xl bg-[#0d0f17]/98 backdrop-blur-2xl border border-white/[0.14] ring-1 ring-[#E8740C]/20 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),0_0_28px_rgba(232,116,12,0.16)] overflow-hidden">
              {/* Glowing Top Radiant Bar */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#E8740C] to-transparent shadow-[0_0_10px_#E8740C]" />

              <div className="p-4 sm:p-4.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E8740C] to-[#b85a06] text-white flex items-center justify-center text-xs shadow-md shadow-[#E8740C]/35 flex-shrink-0">
                      <FontAwesomeIcon icon={faNoteSticky} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[1.5px] text-[#E8740C]">
                        Investor Strategy Note
                      </p>
                      <p className="text-sm font-bold text-white truncate max-w-[210px] leading-tight">
                        {itemName || "Holding Memo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {itemType && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-white/80 text-[9px] font-bold border border-white/10 uppercase tracking-wider">
                        {itemType}
                      </span>
                    )}
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-6 h-6 rounded-md text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                      title="Dismiss Note"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Note Body Inset */}
                <div className="relative bg-white/[0.035] border border-white/[0.08] rounded-xl p-3.5 overflow-hidden">
                  {/* Subtle Quote Watermark */}
                  <FontAwesomeIcon
                    icon={faQuoteRight}
                    className="absolute -bottom-2 -right-1 text-white/[0.03] text-5xl pointer-events-none select-none"
                  />

                  <div className="relative pl-3 border-l-2 border-[#E8740C]">
                    <p className="text-[13px] text-gray-200 leading-[1.65] font-normal whitespace-pre-wrap break-words max-h-56 overflow-y-auto pr-1 selection:bg-[#E8740C] selection:text-white font-sans">
                      {cleanNotes}
                    </p>
                  </div>
                </div>

                {/* Footer Toolbar */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/50">
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                      className="text-[#E8740C] text-[10px]"
                    />
                    <span className="text-white/60 text-[10px] font-medium">
                      Private Advisory Memo
                    </span>
                  </span>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-[#E8740C]/20 text-white/85 hover:text-white border border-white/10 hover:border-[#E8740C]/40 text-[10px] font-semibold transition-all active:scale-95 shadow-sm"
                    title="Copy note text to clipboard"
                  >
                    <FontAwesomeIcon
                      icon={copied ? faCheck : faCopy}
                      className={`text-[10px] ${
                        copied ? "text-[#10B981]" : "text-white/70"
                      }`}
                    />
                    <span>{copied ? "Copied!" : "Copy Note"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Arrow Notch pointing at trigger */}
            <div
              style={{ left: coords.arrowLeft }}
              className={`absolute w-3.5 h-3.5 bg-[#0d0f17] border-white/[0.14] rotate-45 pointer-events-none ${
                coords.placement === "top"
                  ? "-bottom-1.5 border-b border-r"
                  : "-top-1.5 border-t border-l"
              }`}
            />
          </div>,
          document.body
        )}
    </>
  );
}
