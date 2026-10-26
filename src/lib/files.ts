import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const allowedMimes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"]
]);

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export function uploadLimitBytes() {
  const mb = Number(process.env.UPLOAD_MAX_MB || 5);
  return mb * 1024 * 1024;
}

export function safeImageExtension(mime: string) {
  return allowedMimes.get(mime) ?? null;
}

function pngDimensions(buffer: Buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    offset += 2 + length;
  }
  return null;
}

export function imageDimensions(buffer: Buffer, mime: string) {
  if (mime === "image/png") return pngDimensions(buffer);
  if (mime === "image/jpeg") return jpegDimensions(buffer);
  return null;
}

/**
 * Normalize admin uploads for the web: auto-rotate from EXIF, cap the long
 * edge at 1600px, and store as WebP. Phone photos (3-8MB) typically shrink
 * to 100-300KB, which keeps Supabase storage usage ~10-20x lower.
 */
export async function optimizeImage(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

export async function saveUploadedImage(file: File) {
  const extension = safeImageExtension(file.type);
  if (!extension) throw new Error("Only JPG, PNG, WebP, or AVIF images are allowed.");
  if (file.size > uploadLimitBytes()) throw new Error("Image file is too large.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = imageDimensions(buffer, file.type);
  if (dimensions && (dimensions.width < 120 || dimensions.height < 120)) {
    throw new Error("Image dimensions are too small.");
  }

  const optimized = await optimizeImage(buffer);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;

  // Production: Supabase Storage (Vercel has an ephemeral filesystem, so local
  // uploads would disappear). Configure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
  // + SUPABASE_STORAGE_BUCKET to enable it; otherwise fall back to local disk.
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "wahaj-images";
  if (Boolean(supabaseUrl) !== Boolean(serviceKey)) {
    throw new Error("Permanent image storage is only partially configured.");
  }

  if (supabaseUrl && serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.storage.from(bucket).upload(`products/${filename}`, optimized, {
      contentType: "image/webp",
      upsert: false
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = supabase.storage.from(bucket).getPublicUrl(`products/${filename}`);
    return data.publicUrl;
  }

  if (process.env.VERCEL) {
    throw new Error("Permanent image storage is not configured for production uploads.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), optimized);
  return `/uploads/${filename}`;
}
