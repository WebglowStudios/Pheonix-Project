"use server";

import { createClient } from "@supabase/supabase-js";

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
  const { error } = await supabaseAdmin.from("contact_submissions").insert([data]);
  if (error) throw new Error(error.message);
  return { success: true };
}
