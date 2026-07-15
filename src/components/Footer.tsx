import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuildingColumns, faCertificate, faChartLine, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const keyProducts = ["Advisory", "Asset Management", "Fixed Income"];

const compliance = [
  { icon: faBuildingColumns, label: "AMFI" },
  { icon: faCertificate, label: "BSE" },
  { icon: faChartLine, label: "NSE" },
];

export default function Footer() {
  return (
    <footer className="bg-[#333] text-white pt-[80px] pb-5">
      <div className="max-w-[1200px] mx-auto px-5">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-[40px] mb-[50px]">

          {/* Brand */}
          <div>
            <Image src="/logo.jpg" alt="Phoenix Financial Services" width={140} height={70} className="max-h-[70px] w-auto mb-[15px]" />
            <p className="text-[#e0e0e0] text-[0.9rem] mb-5">
              Dedicated to providing transparent, expert-driven wealth management and financial advisory services for a secure tomorrow.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[1.1rem] font-bold mb-5 pb-[10px] relative after:absolute after:bottom-0 after:left-0 after:w-[40px] after:h-[2px] after:bg-[#E8740C] tracking-[1.5px]">
              Quick Links
            </h4>
            <ul>
              {quickLinks.map((l) => (
                <li key={l.href} className="mb-3">
                  <Link href={l.href} className="!text-[#e0e0e0] text-[0.95rem] transition-all duration-300 hover:!text-[#E8740C] hover:pl-[5px]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Products */}
          <div>
            <h4 className="text-[1.1rem] font-bold mb-5 pb-[10px] relative after:absolute after:bottom-0 after:left-0 after:w-[40px] after:h-[2px] after:bg-[#E8740C] tracking-[1.5px]">
              Key Products
            </h4>
            <ul>
              {keyProducts.map((p) => (
                <li key={p} className="mb-3">
                  <Link href="/services" className="!text-[#e0e0e0] text-[0.95rem] transition-all duration-300 hover:!text-[#E8740C] hover:pl-[5px]">
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/services" className="inline-flex items-center gap-1.5 mt-[10px] text-[0.85rem] font-bold !text-[#E8740C]">
              View All Services <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

          {/* WhatsApp Channel */}
          <div>
            <h4 className="text-[1.1rem] font-bold mb-5 pb-[10px] relative after:absolute after:bottom-0 after:left-0 after:w-[40px] after:h-[2px] after:bg-[#E8740C] tracking-[1.5px]">
              WhatsApp Channel
            </h4>
            <p className="text-[#e0e0e0] text-[0.9rem] mb-5">
              Join our active WhatsApp channel for quick portfolio updates, market briefings, and advisory support.
            </p>
            <a
              href="https://www.whatsapp.com/channel/0029VbCzSKm9RZAZ8MBQCS3I"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#2e7d32] border-2 border-[#2e7d32] !text-white px-5 py-[10px] rounded-[30px] text-[0.9rem] font-semibold transition-all hover:bg-[#388e3c]"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="text-[1.2rem] !text-white" /> Join Channel
            </a>
          </div>
        </div>

        {/* Compliance */}
        <div className="flex items-center justify-center gap-5 py-5 border-t border-white/10 flex-wrap mb-[10px]">
          <span className="text-[0.8rem] font-bold text-[#e0e0e0] uppercase tracking-[1px]">
            Registered &amp; Compliant With
          </span>
          <div className="flex items-center gap-[25px] flex-wrap">
            {compliance.map((c) => (
              <div key={c.label} className="flex items-center gap-[6px] text-[0.85rem] font-semibold text-[#e0e0e0] transition-all hover:text-white cursor-default">
                <FontAwesomeIcon icon={c.icon} className="text-[1rem] text-[#E8740C]" />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-5 border-t border-white/10 text-[#e0e0e0] text-[0.9rem] mb-[15px] gap-2.5">
          <p>© 2026 Phoenix Financial Services. All Rights Reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="!text-[#e0e0e0] hover:!text-white transition-colors">Privacy Policy</a>
            <a href="#" className="!text-[#e0e0e0] hover:!text-white transition-colors">Terms of Service</a>
          </div>
        </div>

        <p className="text-[0.75rem] text-[#b0b0b0] text-center">
          <strong>Disclaimer:</strong> Phoenix Financial Services is an AMFI-registered Mutual Fund Distributor and an authorised Sharekhan partner. Investments in securities markets are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future returns. This website is for informational purposes only and does not constitute investment advice.
        </p>
      </div>
    </footer>
  );
}
