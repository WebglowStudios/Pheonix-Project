import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"];

// GET: List all image files in public/
export async function GET() {
  try {
    if (!fs.existsSync(PUBLIC_DIR)) {
      return NextResponse.json({ success: true, images: [] });
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

    return NextResponse.json({ success: true, images });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload a new image file
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Only standard images are allowed." }, { status: 400 });
    }

    // Sanitize filename to prevent any path injections
    const cleanName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_{2,}/g, "_"); // replace multiple consecutive underscores
    
    if (!fs.existsSync(PUBLIC_DIR)) {
      await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
    }

    const filePath = path.join(PUBLIC_DIR, cleanName);
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, name: cleanName, url: `/${cleanName}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an image file from public/
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    // Security check: defend against directory traversal attacks
    if (name.includes("/") || name.includes("\\") || name.includes("..")) {
      return NextResponse.json({ success: false, error: "Invalid filename path" }, { status: 400 });
    }

    const filePath = path.join(PUBLIC_DIR, name);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    await fs.promises.unlink(filePath);
    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
