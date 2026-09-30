"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { publicApi } from "@/lib/api";

export default function WhatsAppFloat() {
  const [whatsappNumber, setWhatsappNumber] = useState("917021210788");

  useEffect(() => {
    publicApi.getContent("contact_info").then((res) => {
      const c = (res.content || (res.data as { content?: Record<string, string> })?.content) as Record<string, string> | undefined;
      if (c) {
        const num = c.whatsapp_number || c.whatsapp;
        if (num) {
          setWhatsappNumber(num.replace(/\D/g, ""));
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=Hello%20Phoenix%20Financial%20Services,%20I%20am%20interested%20in%20your%20wealth%20management%20solutions.`}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat on WhatsApp"
      className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] bg-[#25D366] text-white rounded-full flex items-center justify-center text-[30px] shadow-lg z-[9999] transition-all duration-300 hover:bg-[#128C7E] hover:-translate-y-1.5"
    >
      <FontAwesomeIcon icon={faWhatsapp} className="!text-white" />
    </a>
  );
}
