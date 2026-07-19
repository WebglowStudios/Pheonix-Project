"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faEnvelope, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { submitContactForm } from "@/lib/actions";
import { supabase } from "@/lib/supabase";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [warning, setWarning] = useState("");
  const [heading, setHeading] = useState("Get in Touch");
  const [subheading, setSubheading] = useState("Speak with our expert advisors today — and take the first step toward structured, long-term wealth management");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "home_contact").single()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as { section_heading?: string; section_subheading?: string };
          if (c.section_heading) setHeading(c.section_heading);
          if (c.section_subheading) setSubheading(c.section_subheading);
        }
      });
  }, []);

  const handleServiceChange = (value: string) => {
    setWarning("");
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setWarning("Please select at least 1 service.");
      return;
    }
    setWarning("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await submitContactForm({
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        services: selectedServices,
        connect_time: formData.get("connect_time") as string,
        message: formData.get("message") as string,
        source: "home_page",
      });
      setLoading(false);
      setSubmitted(true);
      setSelectedServices([]);
      formRef.current?.reset();
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setLoading(false);
      setWarning("Something went wrong. Please try again.");
    }
  }

  const inputClass = "w-full px-[15px] py-[10px] border border-[#DDD] rounded-[8px] font-[inherit] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_#FFF3EB]";

  return (
    <section className="py-[100px] bg-white" id="contact">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-[50px] max-w-[700px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
            {heading.includes("Touch") ? (
              <>Get in <span className="text-[#E8740C]">Touch</span></>
            ) : heading}
          </h2>
          <p className="text-[1.1rem] text-[#444]">{subheading}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[50px] bg-[#F2F3F5] rounded-[8px] border border-[#DDD] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          {/* Info Panel */}
          <div className="p-[40px] order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-[#DDD]">
            <Image
              src="/support.png"
              alt="Friendly financial advisor ready to assist you"
              width={560}
              height={280}
              className="w-full h-[280px] object-cover object-center rounded-[8px] mb-[30px]"
            />
            <div className="flex flex-col gap-5">
              {/* Pune */}
              <div className="flex gap-[15px] items-start">
                <div className="w-[40px] h-[40px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>
                <div>
                  <h5 className="text-base text-[#333] font-semibold mb-1">Pune Office</h5>
                  <p className="text-[0.95rem] text-[#444]">708, Global Business Hub,<br />Kharadi, Pune 411014</p>
                  <a href="https://maps.google.com/?q=708+Global+Business+Hub+Kharadi+Pune+411014" target="_blank" rel="noopener noreferrer" className="text-[0.82rem] font-semibold text-[#E8740C] inline-flex items-center gap-1 mt-1 hover:text-[#FF9433]">
                    Get Directions <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                  </a>
                </div>
              </div>
              {/* Mumbai */}
              <div className="flex gap-[15px] items-start">
                <div className="w-[40px] h-[40px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>
                <div>
                  <h5 className="text-base text-[#333] font-semibold mb-1">Mumbai Office</h5>
                  <p className="text-[0.95rem] text-[#444]">11, Brahamsiddhi, Century Bazar Lane,<br />Worli, Mumbai 400025</p>
                  <a href="https://maps.google.com/?q=Century+Bazar+Lane+Worli+Mumbai+400025" target="_blank" rel="noopener noreferrer" className="text-[0.82rem] font-semibold text-[#E8740C] inline-flex items-center gap-1 mt-1 hover:text-[#FF9433]">
                    Get Directions <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                  </a>
                </div>
              </div>
              {/* Mobile */}
              <div className="flex gap-[15px] items-start">
                <div className="w-[40px] h-[40px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0">
                  <svg className="w-[18px] h-[18px] text-[#E8740C]" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-4H8V6h8v10z"></path></svg>
                </div>
                <div>
                  <h5 className="text-base text-[#333] font-semibold mb-1">Mobile</h5>
                  <p className="text-[0.95rem] text-[#444]">+91 70212 10788</p>
                </div>
              </div>
              {/* Phone */}
              <div className="flex gap-[15px] items-start">
                <div className="w-[40px] h-[40px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0">
                  <svg className="w-[18px] h-[18px] text-[#E8740C]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a1.003 1.003 0 0 0-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21a.994.994 0 0 0 .24-1c-.37-1.11-.57-2.3-.57-3.53C9.15 3.59 8.56 3 7.79 3H4.19C3.43 3 3 3.58 3 4.19c0 9.87 8.02 17.89 17.89 17.89 1.11 0 1.62-.5 1.62-1.26v-3.6c0-.77-.59-1.36-1.5-1.36z"></path></svg>
                </div>
                <div>
                  <h5 className="text-base text-[#333] font-semibold mb-1">Phone</h5>
                  <p className="text-[0.95rem] text-[#444]">020 6689 3715</p>
                </div>
              </div>
              {/* Email */}
              <div className="flex gap-[15px] items-start">
                <div className="w-[40px] h-[40px] bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div>
                  <h5 className="text-base text-[#333] font-semibold mb-1">Email Us</h5>
                  <p className="text-[0.95rem] text-[#444]">phoenixcfe@gmail.com<br /><span className="text-[0.8rem] text-[#444]">We reply within 24 hours</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-[40px] order-1 lg:order-2 lg:pl-0" id="contactForm">
            <h3 className="text-[1.8rem] text-[#333] font-bold mb-[10px] tracking-[1.5px]">Share your Aspirations</h3>
            <p className="text-[#444] mb-[30px]">Complete the form below and an advisor will contact you at your convenience</p>
            <form onSubmit={handleSubmit} ref={formRef}>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Full Name</label>
                <input type="text" name="name" placeholder="John Doe" required className={inputClass} />
              </div>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Phone Number</label>
                <input type="tel" name="phone" placeholder="+91 00000 00000" required className={inputClass} />
              </div>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" required className={inputClass} />
              </div>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Interested in Services</label>
                <div className="flex flex-wrap gap-2.5 mt-1.5">
                  <label className="cursor-pointer">
                    <input type="checkbox" name="services" value="advisory" className="sr-only peer" checked={selectedServices.includes("advisory")} onChange={() => handleServiceChange("advisory")} />
                    <span className="px-4 py-2 bg-white border border-[#DDD] rounded-[20px] transition-all block peer-checked:bg-[#FFF3EB] peer-checked:text-[#E8740C] peer-checked:border-[#E8740C] peer-checked:font-bold hover:border-[#E8740C]">
                      Advisory
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input type="checkbox" name="services" value="asset_management" className="sr-only peer" checked={selectedServices.includes("asset_management")} onChange={() => handleServiceChange("asset_management")} />
                    <span className="px-4 py-2 bg-white border border-[#DDD] rounded-[20px] transition-all block peer-checked:bg-[#FFF3EB] peer-checked:text-[#E8740C] peer-checked:border-[#E8740C] peer-checked:font-bold hover:border-[#E8740C]">
                      Asset Management
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input type="checkbox" name="services" value="fixed_income" className="sr-only peer" checked={selectedServices.includes("fixed_income")} onChange={() => handleServiceChange("fixed_income")} />
                    <span className="px-4 py-2 bg-white border border-[#DDD] rounded-[20px] transition-all block peer-checked:bg-[#FFF3EB] peer-checked:text-[#E8740C] peer-checked:border-[#E8740C] peer-checked:font-bold hover:border-[#E8740C]">
                      Fixed Income
                    </span>
                  </label>
                </div>
                {warning && (
                  <div className="text-[#dc3545] text-xs font-semibold mt-2">{warning}</div>
                )}
              </div>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Convenience Time to Connect</label>
                <select name="connect_time" required className={inputClass} defaultValue="">
                  <option value="" disabled>Select a time window...</option>
                  <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM - 3:00 PM)</option>
                  <option value="late_afternoon">Late Afternoon (3:00 PM - 6:00 PM)</option>
                  <option value="evening">Evening (6:00 PM - 8:00 PM)</option>
                  <option value="anytime">Anytime during office hours</option>
                </select>
              </div>
              <div className="mb-[14px]">
                <label className="block text-[0.9rem] font-semibold text-[#333] mb-[6px]">Message / Goals</label>
                <textarea name="message" rows={4} placeholder="Briefly describe your financial goals..." required className={inputClass + " resize-y"} />
              </div>
              <button type="submit" disabled={loading || submitted}
                className={`w-full px-6 py-3 rounded-[30px] font-semibold text-base text-white border-2 transition-all ${submitted ? "bg-[#28a745] border-[#28a745]" : "bg-[#E8740C] border-[#E8740C] hover:bg-[#FF9433] hover:border-[#FF9433]"}`}>
                {loading ? "Sending..." : submitted ? "✓ Request Received!" : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
