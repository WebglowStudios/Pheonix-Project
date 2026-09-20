import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const PUBLIC_DIR = path.join(process.cwd(), "public");
const SUPABASE_BUCKET = "media";
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"];
const EXCLUDE_FILES = ["vercel.svg", "next.svg", "window.svg", "file.svg", "globe.svg"];

function getContentType(ext) {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function runSync() {
  console.log("Starting media sync from public/ to Supabase CDN storage...");

  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === SUPABASE_BUCKET);
  if (!exists) {
    console.log(`Creating public bucket '${SUPABASE_BUCKET}' in Supabase...`);
    await supabaseAdmin.storage.createBucket(SUPABASE_BUCKET, { public: true });
  }

  const files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || EXCLUDE_FILES.includes(file)) continue;

    const filePath = path.join(PUBLIC_DIR, file);
    const buffer = fs.readFileSync(filePath);

    console.log(`Uploading ${file} to Supabase CDN...`);
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(file, buffer, {
        contentType: getContentType(ext),
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload ${file}:`, error.message);
    } else {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(file);
      console.log(`✓ ${file} -> ${publicUrlData.publicUrl}`);
    }
  }

  console.log("\nMedia sync completed successfully!");
}

runSync().catch((err) => console.error(err));
