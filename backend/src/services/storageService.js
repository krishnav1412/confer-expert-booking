/**
 * Storage service — provider-abstracted file uploads.
 *
 * Adapter selection by STORAGE_PROVIDER env var:
 *   - 'local' (default):  writes files to /uploads inside the backend container
 *                         and serves them under /static/uploads/. Suitable for
 *                         single-instance deployments and local dev. NOT
 *                         suitable for multi-instance horizontal scaling.
 *   - 'cloudinary':       lazy-loads the cloudinary SDK and uploads to your
 *                         Cloudinary account. Recommended for production.
 *
 * Public API:
 *   storageService.upload(buffer, { folder, filename, mimetype }) → { url, publicId, provider }
 *   storageService.delete(publicId)                               → boolean
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const validate = ({ buffer, mimetype }) => {
  if (!buffer || !buffer.length) throw new Error('Empty file');
  if (buffer.length > MAX_BYTES) throw new Error('File too large (max 5MB)');
  if (mimetype && !ALLOWED_MIME.has(mimetype)) throw new Error('Unsupported file type');
};

// --- Local adapter -----------------------------------------------------------
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_ROOT || './uploads');
const PUBLIC_PREFIX = '/static/uploads';

const localAdapter = {
  async upload(buffer, { folder = 'misc', filename, mimetype } = {}) {
    validate({ buffer, mimetype });
    const ext = path.extname(filename || '') || mimetypeToExt(mimetype);
    const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const dir = path.join(UPLOAD_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, id);
    await fs.writeFile(filePath, buffer);
    return {
      url: `${PUBLIC_PREFIX}/${folder}/${id}`,
      publicId: `${folder}/${id}`,
      provider: 'local',
    };
  },
  async delete(publicId) {
    if (!publicId) return false;
    const filePath = path.join(UPLOAD_ROOT, publicId);
    try { await fs.unlink(filePath); return true; }
    catch { return false; }
  },
};

// --- Cloudinary adapter (lazy) ----------------------------------------------
let cld = null;
const cloudinaryAdapter = {
  async upload(buffer, { folder = 'confer', filename, mimetype } = {}) {
    validate({ buffer, mimetype });
    if (!cld) {
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      cld = cloudinary;
    }
    return new Promise((resolve, reject) => {
      const stream = cld.uploader.upload_stream(
        { folder, public_id: filename, resource_type: 'image' },
        (err, result) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' });
        }
      );
      stream.end(buffer);
    });
  },
  async delete(publicId) {
    if (!cld || !publicId) return false;
    try { await cld.uploader.destroy(publicId); return true; }
    catch { return false; }
  },
};

const mimetypeToExt = (m) => {
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return '';
};

const adapters = { local: localAdapter, cloudinary: cloudinaryAdapter };
const adapter = adapters[provider] || localAdapter;

export const upload = (buffer, opts) => adapter.upload(buffer, opts);
export const remove = (publicId) => adapter.delete(publicId);
export const currentProvider = () => provider;
export const localUploadRoot = () => UPLOAD_ROOT;
export const localPublicPrefix = () => PUBLIC_PREFIX;

export default { upload, remove, currentProvider, localUploadRoot, localPublicPrefix };
