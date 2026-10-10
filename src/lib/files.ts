import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedMimes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"]
]);

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

export async function saveUploadedImage(file: File) {
  const extension = safeImageExtension(file.type);
  if (!extension) throw new Error("Only JPG, PNG, WebP, or AVIF images are allowed.");
  if (file.size > uploadLimitBytes()) throw new Error("Image file is too large.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = imageDimensions(buffer, file.type);
  if (dimensions && (dimensions.width < 120 || dimensions.height < 120)) {
    throw new Error("Image dimensions are too small.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
