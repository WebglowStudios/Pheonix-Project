import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase";
import { r2Client, r2BucketName, r2PublicUrl, isR2Configured } from "@/lib/r2";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"];
const SUPABASE_BUCKET = "media";

let bucketChecked = false;
async function ensureSupabaseBucket() {
  if (bucketChecked) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === SUPABASE_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(SUPABASE_BUCKET, {
        public: true,
      });
    }
    bucketChecked = true;
  } catch (err) {
    console.error("Supabase bucket check warning:", err);
  }
}

// GET: List all image files (R2 -> Supabase Storage CDN -> Local fallback)
export async function GET() {
  try {
    // 1. Cloudflare R2 (If configured)
    if (isR2Configured && r2Client) {
      const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const command = new ListObjectsV2Command({ Bucket: r2BucketName });
      const response = await r2Client.send(command);
      const objects = response.Contents || [];

      const images = objects
        .filter((obj) => {
          if (!obj.Key) return false;
          const ext = path.extname(obj.Key).toLowerCase();
          return ALLOWED_EXTENSIONS.includes(ext);
        })
        .map((obj) => ({
          name: obj.Key!,
          url: r2PublicUrl
            ? `${r2PublicUrl}/${obj.Key}`
            : `https://${r2BucketName}.r2.cloudflarestorage.com/${obj.Key}`,
          size: obj.Size || 0,
        }));

      return NextResponse.json({ success: true, storage: "cloudflare_r2", images });
    }

    // 2. Supabase Storage (100% Free CDN, No Credit Card Required)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await ensureSupabaseBucket();
      const { data: files, error } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (!error && files) {
        const images = files
          .filter((file) => {
            const ext = path.extname(file.name).toLowerCase();
            return ALLOWED_EXTENSIONS.includes(ext);
          })
          .map((file) => {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from(SUPABASE_BUCKET)
              .getPublicUrl(file.name);
            return {
              name: file.name,
              url: publicUrlData.publicUrl,
              size: file.metadata?.size || 0,
            };
          });

        return NextResponse.json({ success: true, storage: "supabase", images });
      }
    }

    // 3. Fallback: Local filesystem
    if (!fs.existsSync(PUBLIC_DIR)) {
      return NextResponse.json({ success: true, storage: "local", images: [] });
    }

    const files = await fs.promises.readdir(PUBLIC_DIR);
    const images = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ALLOWED_EXTENSIONS.includes(ext);
      })
      .map((file) => {
        const filePath = path.join(PUBLIC_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          url: `/${file}`,
          size: stats.size,
        };
      });

    return NextResponse.json({ success: true, storage: "local", images });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload a new image file (R2 -> Supabase Storage CDN -> Local fallback)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only standard images are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanName = `${Date.now()}_${file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_{2,}/g, "_")}`;

    // 1. Cloudflare R2 (If configured)
    if (isR2Configured && r2Client) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const command = new PutObjectCommand({
        Bucket: r2BucketName,
        Key: cleanName,
        Body: buffer,
        ContentType: file.type || "image/png",
      });

      await r2Client.send(command);
      const url = r2PublicUrl
        ? `${r2PublicUrl}/${cleanName}`
        : `https://${r2BucketName}.r2.cloudflarestorage.com/${cleanName}`;

      return NextResponse.json({ success: true, storage: "cloudflare_r2", name: cleanName, url });
    }

    // 2. Supabase Storage CDN (No Credit Card Required)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await ensureSupabaseBucket();
      const { error: uploadError } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .upload(cleanName, buffer, {
          contentType: file.type || "image/png",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(cleanName);

        return NextResponse.json({
          success: true,
          storage: "supabase",
          name: cleanName,
          url: publicUrlData.publicUrl,
        });
      } else {
        console.error("Supabase storage upload error:", uploadError);
      }
    }

    // 3. Fallback: Save to local public/
    if (!fs.existsSync(PUBLIC_DIR)) {
      await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
    }

    const filePath = path.join(PUBLIC_DIR, cleanName);
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      storage: "local",
      name: cleanName,
      url: `/${cleanName}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an image file (R2 -> Supabase Storage CDN -> Local fallback)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    // 1. Cloudflare R2 (If configured)
    if (isR2Configured && r2Client) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const command = new DeleteObjectCommand({
        Bucket: r2BucketName,
        Key: name,
      });

      await r2Client.send(command);
      return NextResponse.json({
        success: true,
        storage: "cloudflare_r2",
        message: "File deleted successfully from Cloudflare CDN",
      });
    }

    // 2. Supabase Storage CDN
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .remove([name]);

      if (!error) {
        return NextResponse.json({
          success: true,
          storage: "supabase",
          message: "File deleted successfully from Supabase CDN",
        });
      }
    }

    // 3. Fallback: Local filesystem
    if (name.includes("/") || name.includes("\\") || name.includes("..")) {
      return NextResponse.json({ success: false, error: "Invalid filename path" }, { status: 400 });
    }

    const filePath = path.join(PUBLIC_DIR, name);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    await fs.promises.unlink(filePath);
    return NextResponse.json({
      success: true,
      storage: "local",
      message: "File deleted successfully from local storage",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
