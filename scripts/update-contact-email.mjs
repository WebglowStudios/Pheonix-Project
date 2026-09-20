import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function updateEmail() {
  console.log("Updating contact_info email in Supabase site_content table...");

  const { data } = await supabaseAdmin
    .from("site_content")
    .select("content")
    .eq("id", "contact_info")
    .single();

  const currentContent = data?.content || {
    phone_landline: "020 6689 3715",
    phone_mobile: "+91 70212 10788",
    whatsapp_number: "917021210788",
    pune_address: "708, Global Business Hub, Kharadi, Pune 411014",
    mumbai_address: "11, Brahamsiddhi, Century Bazar Lane, Worli, Mumbai 400025",
  };

  const updatedContent = {
    ...currentContent,
    email: "connect@phoenixfiserv.co.in",
  };

  const { error } = await supabaseAdmin
    .from("site_content")
    .upsert({ id: "contact_info", content: updatedContent }, { onConflict: "id" });

  if (error) {
    console.error("Failed to update contact_info email:", error.message);
  } else {
    console.log("✓ Successfully updated contact_info email to connect@phoenixfiserv.co.in in Supabase!");
  }
}

updateEmail().catch(err => console.error(err));
