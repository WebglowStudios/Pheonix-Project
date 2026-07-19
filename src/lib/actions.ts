"use server";

import { createClient } from "@supabase/supabase-js";
import { sendLeadNotification } from "@/lib/mailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function submitContactForm(data: {
  name: string;
  phone: string;
  email: string;
  services: string[];
  connect_time: string;
  message: string;
  source: string;
}) {
  // 1. Save to Supabase
  const { error } = await supabaseAdmin.from("contact_submissions").insert([data]);
  if (error) throw new Error(error.message);

  // 2. Send email notification (non-blocking — don't fail the form if email fails)
  try {
    await sendLeadNotification(data);
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
    // Form submission still succeeds even if email fails
  }

  return { success: true };
}
