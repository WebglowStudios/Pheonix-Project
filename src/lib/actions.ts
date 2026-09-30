"use server";

import { createClient } from "@supabase/supabase-js";
import { sendLeadNotification, sendUserThankYouEmail } from "@/lib/mailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://92.4.77.226:5000";

export async function submitContactForm(data: {
  name: string;
  phone: string;
  email: string;
  services: string[];
  connect_time: string;
  message: string;
  source: string;
}) {
  // 1. Save to Phoenix Engine MongoDB Atlas (Primary Lead Storage)
  try {
    await fetch(`${API_URL}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Failed to save lead to Phoenix Engine MongoDB:", err);
  }

  // 2. Dual-write to Supabase as redundancy backup
  try {
    await supabaseAdmin.from("contact_submissions").insert([data]);
  } catch (err) {
    console.warn("Supabase backup insert error (non-fatal):", err);
  }

  // 3. Send email notifications (Admin notification + User Thank-You confirmation email)
  try {
    await Promise.allSettled([
      sendLeadNotification(data),
      sendUserThankYouEmail(data),
    ]);
  } catch (emailError) {
    console.error("Email notifications failed:", emailError);
    // Form submission still succeeds even if an email dispatch fails
  }

  return { success: true };
}
