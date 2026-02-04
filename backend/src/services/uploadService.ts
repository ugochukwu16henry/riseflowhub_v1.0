/**
 * Cloudinary upload service. When env vars are set, uploads to cloud; otherwise returns a placeholder or errors.
 * Validates file type and size. Allowed: resume/cv (pdf, docx), portfolio (pdf, docx, jpg, png), avatar (jpg, png), project_media (jpg, png, mp4).
 */

import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export const UPLOAD_TYPES = ['resume', 'cv', 'portfolio', 'avatar', 'project_media'] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];

const ALLOWED: Record<UploadType, string[]> = {
  resume: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  cv: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  portfolio: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  project_media: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
};

const MAX_SIZE_BYTES: Record<UploadType, number> = {
  resume: 10 * 1024 * 1024,   // 10 MB
  cv: 10 * 1024 * 1024,
  portfolio: 10 * 1024 * 1024,
  avatar: 5 * 1024 * 1024,   // 5 MB
  project_media: 100 * 1024 * 1024, // 100 MB for video
};

export function isUploadEnabled(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

export function validateFile(
  type: UploadType,
  mimetype: string,
  size: number
): { ok: true } | { ok: false; error: string } {
  const allowed = ALLOWED[type];
  const mime = (mimetype || '').toLowerCase();
  if (!allowed.includes(mime)) {
    return { ok: false, error: `Invalid file type for ${type}. Allowed: ${allowed.join(', ')}` };
  }
  if (size > MAX_SIZE_BYTES[type]) {
    const maxMb = Math.round(MAX_SIZE_BYTES[type] / (1024 * 1024));
    return { ok: false, error: `File too large. Max for ${type}: ${maxMb} MB` };
  }
  return { ok: true };
}

/** Get resource_type for Cloudinary: image, video, or raw (for PDF/doc) */
function resourceType(type: UploadType, mimetype: string): 'image' | 'video' | 'raw' {
  if (type === 'project_media' && mimetype === 'video/mp4') return 'video';
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mimetype)) return 'image';
  return 'raw';
}

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

export async function uploadToCloud(
  buffer: Buffer,
  type: UploadType,
  mimetype: string,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  if (!isUploadEnabled()) {
    throw new Error('Cloud upload not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }
  const resource_type = resourceType(type, mimetype);
  const uniqueId = fileName ? fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_') : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        public_id: uniqueId,
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error('No URL returned from Cloudinary'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );
    uploadStream.end(buffer);
  });
}
