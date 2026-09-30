"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp, faSeedling, faBriefcase, faShieldHalved,
  faHandHoldingDollar, faCoins, faPercent, faBuildingColumns,
  faVault, faCheck, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { publicApi } from "@/lib/api";

const ICON_MAP: Record<string, IconDefinition> = {
  faArrowTrendUp, faSeedling, faBriefcase, faShieldHalved,
  faHandHoldingDollar, faCoins, faPercent, faBuildingColumns, faVault,
};

interface Product {
  id: string;
  category: string;
  icon_name: string;
  icon_img: string | null;
  title: string;
  description: string;
  features: string[];
  sort_order: number;
}

const filters = [
  { key: "all", label: "Suite" },
  { key: "growth", label: "Growth" },
  { key: "anchor", label: "Anchor" },
  { key: "pinnacle", label: "Pinnacle" },
];

export default function ServicesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getServices()
      .then((res) => {
        const list = (res.services || (res.data as any)?.services || []) as Product[];
        setProducts(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeFilter === "all"
    ? products
    : products.filter((p) => p.category === activeFilter);

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] text-center border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Our Products &amp; Offerings</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[700px] mx-auto">
              We provide a comprehensive range of financial instruments tailored to individual risk appetites, helping you build a diversified portfolio managed by experts.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-[40px] bg-white border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex justify-center gap-[12px] w-full max-w-[600px] mx-auto">
              {filters.map((f) => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`flex-1 text-center py-[10px] px-[15px] border rounded-[20px] font-semibold cursor-pointer transition-all text-[0.95rem] font-[inherit] whitespace-nowrap min-w-0 ${
                    activeFilter === f.key
                      ? "border-[#E8740C] text-[#E8740C] bg-[#FFF3EB]"
                      : "border-[#DDD] text-[#444] bg-white hover:border-[#E8740C] hover:text-[#E8740C] hover:bg-[#FFF3EB]"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-[80px] bg-[#F2F3F5]">
          <div className="max-w-[1200px] mx-auto px-5">
            {loading ? (
              <div className="flex justify-center py-20">
                <FontAwesomeIcon icon={faSpinner} className="text-[#E8740C] text-3xl animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-[30px]">
                {filtered.map((p, index) => {
                  const isAlt = index % 2 === 1;
                  const icon = ICON_MAP[p.icon_name];
                  return (
                    <div key={p.id} className="bg-white border border-[#DDD] rounded-[8px] p-[40px] flex flex-col md:flex-row gap-[25px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C]">
                      <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center text-[1.8rem] flex-shrink-0 text-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${isAlt ? "bg-gradient-to-br from-[#666] to-[#333]" : "bg-gradient-to-br from-[#FF9433] to-[#E8740C]"}`}>
                        {p.icon_img ? (
                          <img src={p.icon_img} alt={p.title} className="w-[36px] h-[36px] object-contain block" />
                        ) : icon ? (
                          <FontAwesomeIcon icon={icon} />
                        ) : null}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-[1.4rem] font-extrabold text-[#E8740C] mb-[15px] tracking-[1.5px]">{p.title}</h3>
                        <p className="text-[#444] text-[0.95rem] leading-[1.5] mb-5">{p.description}</p>
                        <ul className="flex flex-col gap-2">
                          {(p.features ?? []).map((feat) => (
                            <li key={feat} className="flex items-center gap-2 text-[0.9rem] font-medium text-[#333]">
                              <FontAwesomeIcon icon={faCheck} className="text-[#E8740C] text-[0.85rem]" /> {feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
