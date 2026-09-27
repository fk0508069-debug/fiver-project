import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export const runtime = "nodejs";

// Write into public/uploads so Next.js serves them as static files
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 8;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: Request) {
  const { res } = await requireAdmin();
  if (res) return res;

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES} per upload)` },
      { status: 400 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}". Use JPG, PNG, WebP, or AVIF.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" is too large (max 5 MB)` },
        { status: 400 }
      );
    }

    const ext = EXT[file.type] ?? "bin";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);
    urls.push(`${PUBLIC_PREFIX}/${filename}`);
  }

  return NextResponse.json({ urls });
}