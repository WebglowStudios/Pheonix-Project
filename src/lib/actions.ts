"use server";

import { createClient } from "@supabase/supabase-js";
import { sendLeadNotification, sendUserThankYouEmail } from "@/lib/mailer";

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

  // 2. Send email notifications (Admin notification + User Thank-You confirmation email)
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
