"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faPhone, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav className="bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] sticky top-0 z-[1000] py-[15px]">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-[15px]">
            <Image src="/logo.jpg" alt="Phoenix Financial Services Logo" width={150} height={60} className="max-h-[60px] w-auto object-contain" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-[30px]">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`font-medium transition-all duration-300 ${pathname === link.href ? "text-[#E8740C]" : "text-[#444] hover:text-[#E8740C]"}`}>
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className="inline-block px-5 py-[10px] rounded-[30px] font-semibold bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433] hover:shadow-[0_8px_24px_rgba(232,116,12,0.15)]">
              Get in Touch
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden bg-transparent border-none text-[1.5rem] text-[#333] cursor-pointer p-2" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[4px] z-[10000]" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 w-[280px] h-full bg-white shadow-[-5px_0_25px_rgba(0,0,0,0.15)] z-[10001] flex flex-col pt-[80px] px-[30px] pb-[30px] gap-0 overflow-y-auto transition-[right] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${menuOpen ? "right-0" : "-right-[300px]"}`}
        style={{ right: menuOpen ? "0" : "-300px" }}>

        {/* Close */}
        <button className="absolute top-5 right-5 text-[2rem] leading-none text-[#333] bg-transparent border-none cursor-pointer hover:text-[#E8740C] transition-all" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          &times;
        </button>

        {/* Sidebar brand */}
        <div className="flex items-center gap-[10px] mb-[30px] pb-5 border-b border-[#DDD] w-full">
          <Image src="/logo.jpg" alt="Phoenix Financial" width={90} height={36} className="max-h-9 w-auto" />
          <span className="text-[0.85rem] font-bold text-[#333] tracking-[0.5px]">Phoenix Financial</span>
        </div>

        {/* Links */}
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
            className={`w-full py-[14px] text-[1.05rem] font-semibold border-b border-[#DDD] transition-colors ${pathname === link.href ? "text-[#E8740C]" : "text-[#333]"}`}>
            {link.label}
          </Link>
        ))}
        <Link href="/contact" onClick={() => setMenuOpen(false)}
          className="mt-5 w-full text-center px-5 py-3 rounded-[30px] font-semibold bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433]">
          Get in Touch
        </Link>

        {/* Sidebar footer */}
        <div className="mt-auto pt-[25px] border-t border-[#DDD] flex flex-col gap-4">
          <div className="flex items-center gap-[10px] text-[0.85rem] text-[#444]">
            <span className="w-[30px] h-[30px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[0.8rem] flex-shrink-0">
              <FontAwesomeIcon icon={faPhone} />
            </span>
            <span>020 6689 3715</span>
          </div>
          <div className="flex items-center gap-[10px] text-[0.85rem] text-[#444]">
            <span className="w-[30px] h-[30px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[0.8rem] flex-shrink-0">
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <span>phoenixcfe@gmail.com</span>
          </div>
          <div className="flex gap-[10px] mt-1">
            <a href="https://wa.me/917021210788" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 bg-[#F2F3F5] border border-[#DDD] rounded-full flex items-center justify-center text-[#444] text-[0.85rem] transition-all hover:bg-[#E8740C] hover:text-white hover:border-[#E8740C]">
              <FontAwesomeIcon icon={faWhatsapp} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
