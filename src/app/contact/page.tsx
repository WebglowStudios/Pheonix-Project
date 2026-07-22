"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faClock, faLocationDot, faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { submitContactForm } from "@/lib/actions";
import { supabase } from "@/lib/supabase";

const inputClass = "w-full px-[15px] py-[12px] border border-[#DDD] rounded-[8px] font-[inherit] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_#FFF3EB]";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [warning, setWarning] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formServices, setFormServices] = useState<string[]>(["Advisory", "Asset Management", "Fixed Income"]);
  const formRef = useRef<HTMLFormElement>(null);

  interface ContactInfo {
    phone_landline: string;
    phone_mobile: string;
    whatsapp_number: string;
    email: string;
    pune_address: string;
    mumbai_address: string;
  }

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone_landline: "020 6689 3715",
    phone_mobile: "+91 70212 10788",
    whatsapp_number: "917021210788",
    email: "connect@phoenixfiserv.co.in",
    pune_address: "708, Global Business Hub, Kharadi, Pune 411014",
    mumbai_address: "11, Brahamsiddhi, Century Bazar Lane, Worli, Mumbai 400025",
  });

  const officeInfoBlocks = [
    { icon: faClock, label: "Office Hours", lines: ["Mon–Fri: 9 AM – 6 PM", "Sat: 10 AM – 2 PM"] },
    { icon: faPhone, label: "Phone", lines: [contactInfo.phone_landline, contactInfo.phone_mobile] },
    { icon: faClock, label: "Email", lines: [contactInfo.email] },
  ];

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "contact_info").single()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as any;
          setContactInfo({
            phone_landline: c.phone_landline || "020 6689 3715",
            phone_mobile: c.phone_mobile || "+91 70212 10788",
            whatsapp_number: c.whatsapp_number || c.whatsapp || "917021210788",
            email: c.email || "connect@phoenixfiserv.co.in",
            pune_address: c.pune_address || "708, Global Business Hub, Kharadi, Pune 411014",
            mumbai_address: c.mumbai_address || "11, Brahamsiddhi, Century Bazar Lane, Worli, Mumbai 400025",
          });
          if (c.services && Array.isArray(c.services)) {
            setFormServices(c.services);
          }
        }
      });
  }, []);

  useEffect(() => {
    setMounted(true);
    const updateStatus = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istOffset = 5.5;
      const istTime = new Date(utc + (3600000 * istOffset));

      const day = istTime.getDay();
      const hour = istTime.getHours();
      const minute = istTime.getMinutes();
      const timeVal = hour + (minute / 60);

      let open = false;
      if (day >= 1 && day <= 5) {
        if (timeVal >= 9 && timeVal < 18) open = true;
      } else if (day === 6) {
        if (timeVal >= 10 && timeVal < 14) open = true;
      }
      setIsOpen(open);
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleServiceChange = (value: string) => {
    setWarning("");
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setWarning("Please select at least 1 service.");
      return;
    }
    setWarning("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    submitContactForm({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      services: selectedServices,
      connect_time: formData.get("connect_time") as string,
      message: formData.get("message") as string,
      source: "contact_page",
    }).then(() => {
      setLoading(false);
      setSubmitted(true);
      setSelectedServices([]);
      formRef.current?.reset();
      setTimeout(() => setSubmitted(false), 3000);
    }).catch(() => {
      setLoading(false);
      setWarning("Something went wrong. Please try again.");
    });
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] text-center border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Get in Touch</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[700px] mx-auto">
              Speak with our expert advisors today — and take the first step toward structured, long-term wealth management
            </p>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="py-[80px] bg-white">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-[50px]">

              {/* Channels column */}
              <div className="flex flex-col gap-[30px] order-2 lg:order-1">

                {/* Phone card */}
                <div className="bg-white border border-[#DDD] rounded-[8px] p-[25px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all hover:border-[#E8740C] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-[15px] mb-[15px]">
                    <div className="w-[45px] h-[45px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[1.3rem]">
                      <FontAwesomeIcon icon={faPhone} />
                    </div>
                    <div>
                      <h4 className="text-[1.1rem] font-bold text-[#333] tracking-[1.5px]">Client Desk</h4>
                      <p className="text-[0.8rem] text-[#444]">Call and speak to our client desk</p>
                    </div>
                  </div>
                  <p className="text-[0.95rem] text-[#444] mb-[15px]">Reach our advisory team directly for prompt, personalized assistance.</p>
                  <div className="flex flex-col gap-2">
                    <a href={`tel:${contactInfo.phone_landline.replace(/\s+/g, "")}`} className="flex justify-between items-center font-semibold !text-[#E8740C] text-[0.95rem] transition-all hover:!text-[#FF9433]">
                      <span>{contactInfo.phone_landline} (Landline)</span>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </a>
                    <a href={`tel:${contactInfo.phone_mobile.replace(/\s+/g, "")}`} className="flex justify-between items-center font-semibold !text-[#E8740C] text-[0.95rem] transition-all hover:!text-[#FF9433]">
                      <span>{contactInfo.phone_mobile} (Mobile)</span>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </a>
                  </div>
                </div>

                {/* WhatsApp card */}
                <div className="bg-white border border-[#DDD] rounded-[8px] p-[25px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all hover:border-[#E8740C] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-[15px] mb-[15px]">
                    <div className="w-[45px] h-[45px] rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-[1.3rem]">
                      <FontAwesomeIcon icon={faWhatsapp} />
                    </div>
                    <div>
                      <h4 className="text-[1.1rem] font-bold text-[#333] tracking-[1.5px]">Connect on WhatsApp</h4>
                      <p className="text-[0.8rem] text-[#444]">Message our active chat channel</p>
                    </div>
                  </div>
                  <p className="text-[0.95rem] text-[#444] mb-[15px]">Reach our advisory team directly for investment queries and personalised portfolio guidance.</p>
                  <a href={`https://wa.me/${contactInfo.whatsapp_number.replace(/\D/g, "")}?text=Hello%20Phoenix%20Financial%20Services`} target="_blank" rel="noopener noreferrer"
                    className="flex justify-between items-center font-semibold !text-[#2E7D32] text-[0.95rem] transition-all hover:!text-[#4CAF50]">
                    <span>Start WhatsApp Chat</span>
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  </a>
                </div>

                {/* Office Hours widget */}
                <div className="border border-[#DDD] rounded-[8px] p-[25px] bg-[#F2F3F5]">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#DDD]">
                    <span className="font-bold text-[#333] text-[1.1rem] tracking-[1.5px]">Office Hours</span>
                    {mounted && (
                      <span className={`flex items-center gap-1.5 text-xs font-bold uppercase px-[10px] py-1 rounded-xl ${isOpen ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFEBEE] text-[#C62828]"}`}>
                        <span className={`w-2 h-2 rounded-full inline-block ${isOpen ? "bg-[#2E7D32] animate-pulse" : "bg-[#C62828]"}`} />
                        {isOpen ? "Open Now" : "Closed"}
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-[10px]">
                    <li className="flex justify-between text-[0.9rem] text-[#444]"><span>Monday – Friday</span><span>9:00 AM – 6:00 PM</span></li>
                    <li className="flex justify-between text-[0.9rem] text-[#444]"><span>Saturday</span><span>10:00 AM – 2:00 PM</span></li>
                    <li className="flex justify-between text-[0.9rem] text-[#444]"><span>Sunday</span><span>Closed</span></li>
                  </ul>
                </div>
              </div>

              {/* Form */}
              <div className="bg-[#F2F3F5] border border-[#DDD] rounded-[8px] p-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] order-1 lg:order-2">
                <h3 className="text-[1.8rem] font-bold text-[#333] mb-[10px] tracking-[1.5px]">Share your Aspirations</h3>
                <p className="text-[#444] mb-[30px]">Complete the form below and an advisor will contact you at your convenience</p>
                <form onSubmit={handleSubmit} id="contactForm" ref={formRef}>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Full Name</label>
                    <input type="text" name="name" placeholder="John Doe" required className={inputClass} />
                  </div>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Phone Number</label>
                    <input type="tel" name="phone" placeholder="+91 00000 00000" required className={inputClass} />
                  </div>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Email Address</label>
                    <input type="email" name="email" placeholder="john@example.com" required className={inputClass} />
                  </div>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Interested in Services</label>
                    <div className="flex flex-wrap gap-2.5 mt-1.5">
                      {formServices.map((srv) => (
                        <label key={srv} className="cursor-pointer">
                          <input
                            type="checkbox"
                            name="services"
                            value={srv}
                            className="sr-only peer"
                            checked={selectedServices.includes(srv)}
                            onChange={() => handleServiceChange(srv)}
                          />
                          <span className="px-4 py-2 bg-white border border-[#DDD] rounded-[20px] transition-all block peer-checked:bg-[#FFF3EB] peer-checked:text-[#E8740C] peer-checked:border-[#E8740C] peer-checked:font-bold hover:border-[#E8740C]">
                            {srv}
                          </span>
                        </label>
                      ))}
                    </div>
                    {warning && (
                      <div className="text-[#dc3545] text-xs font-semibold mt-2">{warning}</div>
                    )}
                  </div>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Convenience Time to Connect</label>
                    <select name="connect_time" required className={inputClass + " cursor-pointer"} defaultValue="">
                      <option value="" disabled>Select a time window...</option>
                      <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                      <option value="afternoon">Afternoon (12:00 PM - 3:00 PM)</option>
                      <option value="late_afternoon">Late Afternoon (3:00 PM - 6:00 PM)</option>
                      <option value="evening">Evening (6:00 PM - 8:00 PM)</option>
                      <option value="anytime">Anytime during office hours</option>
                    </select>
                  </div>
                  <div className="mb-[20px]">
                    <label className="block text-[0.9rem] font-semibold text-[#333] mb-[8px]">Message / Goals</label>
                    <textarea name="message" rows={5} placeholder="Briefly describe your financial goals..." required className={inputClass + " resize-y"} />
                  </div>
                  <button type="submit" disabled={loading || submitted}
                    className={`w-full px-6 py-3 rounded-[30px] font-semibold text-base text-white border-2 transition-all ${submitted ? "bg-[#28a745] border-[#28a745]" : "bg-[#E8740C] border-[#E8740C] hover:bg-[#FF9433] hover:border-[#FF9433]"}`}>
                    {loading ? "Submitting..." : submitted ? "✓ Request Registered!" : "Submit Request"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Office Locations */}
        <section className="pb-[80px] bg-white">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="text-center mb-[50px] max-w-[600px] mx-auto">
              <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
                Our <span className="text-[#E8740C]">Locations</span>
              </h2>
              <p className="text-[1.1rem] text-[#444]">
                Visit us at either of our offices. Both teams are fully equipped to handle your wealth planning needs.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">

              {/* Pune */}
              <div className="border border-[#DDD] rounded-[8px] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)] bg-white transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C]">
                <div className="h-[280px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d66508.12174203241!2d73.87320859047757!3d18.553631100000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c3007f16599f%3A0x100dafd4f70c35a7!2sGlobal%20business%20hub%20kharadi%20pune!5e0!3m2!1sen!2sin!4v1783014074350!5m2!1sen!2sin"
                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[0.8rem] font-bold text-[#E8740C] uppercase tracking-[1px] mb-1.5">● Pune — Headquarters</p>
                    <h4 className="text-[1.2rem] font-extrabold text-[#333] mb-2 tracking-[1.5px]">Global Business Hub</h4>
                    <p className="text-sm text-[#444] leading-relaxed mb-4 whitespace-pre-line">{contactInfo.pune_address}</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.pune_address)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border-2 border-[#333] !text-[#333] px-4 py-2 rounded-[30px] text-sm font-semibold transition-all hover:bg-[#E8740C] hover:!text-white hover:border-[#E8740C]">
                      <FontAwesomeIcon icon={faLocationDot} /> Get Directions
                    </a>
                  </div>
                  <div className="pl-0 sm:pl-5 border-t sm:border-t-0 sm:border-l border-[#DDD] pt-5 sm:pt-0 flex flex-col gap-[14px]">
                    {officeInfoBlocks.map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          <FontAwesomeIcon icon={item.icon} />
                        </div>
                        <div>
                          <p className="text-[0.72rem] font-bold text-[#444] uppercase mb-1">{item.label}</p>
                          {item.lines.map((l, i) => <p key={i} className="text-sm text-[#333]">{l}</p>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mumbai */}
              <div className="border border-[#DDD] rounded-[8px] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)] bg-white transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C]">
                <div className="h-[280px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1846.577829993373!2d72.82909457788026!3d19.013519139883286!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7cec05ba5e1a3%3A0x134a3f9dde8f42ca!2sBrahmasiddhi%20Apartments!5e0!3m2!1sen!2sin!4v1783014704776!5m2!1sen!2sin"
                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[0.8rem] font-bold text-[#E8740C] uppercase tracking-[1px] mb-1.5">● Mumbai</p>
                    <h4 className="text-[1.2rem] font-extrabold text-[#333] mb-2 tracking-[1.5px]">Brahamsiddhi, Worli</h4>
                    <p className="text-sm text-[#444] leading-relaxed mb-4 whitespace-pre-line">{contactInfo.mumbai_address}</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.mumbai_address)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border-2 border-[#333] !text-[#333] px-4 py-2 rounded-[30px] text-sm font-semibold transition-all hover:bg-[#E8740C] hover:!text-white hover:border-[#E8740C]">
                      <FontAwesomeIcon icon={faLocationDot} /> Get Directions
                    </a>
                  </div>
                  <div className="pl-0 sm:pl-5 border-t sm:border-t-0 sm:border-l border-[#DDD] pt-5 sm:pt-0 flex flex-col gap-[14px]">
                    {officeInfoBlocks.map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          <FontAwesomeIcon icon={item.icon} />
                        </div>
                        <div>
                          <p className="text-[0.72rem] font-bold text-[#444] uppercase mb-1">{item.label}</p>
                          {item.lines.map((l, i) => <p key={i} className="text-sm text-[#333]">{l}</p>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
