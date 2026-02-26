import Config from 'react-native-config';

/**
 * Helper utilities for resolving attachment URLs.
 * Supports both new file-path-based attachments and legacy base64 data URIs.
 */

const getBaseUrl = (): string => {
  // Remove /api suffix to get the server root
  const apiUrl = Config.API_BASE_URL || 'http://localhost:3000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Resolve the display URL for an attachment object.
 * Handles multiple formats:
 * - New format: `path` field with relative path (e.g., "uploads/orders/email/title/file.jpg")
 * - Legacy format: `data` field with base64 data URI (e.g., "data:image/jpeg;base64,...")
 * - HTTP URLs (already absolute)
 */
export const getAttachmentUrl = (att: any): string => {
  if (!att) return '';

  // 1. Check for base64 data URI in `data` field (legacy)
  if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
    return att.data;
  }

  // 2. Check for file path in `path`, `file_path`, or `filename` fields
  const rawPath = att.path || att.file_path || '';
  if (!rawPath) return '';

  // Already an absolute URL
  if (rawPath.startsWith('http')) return rawPath;

  // Already a data URI
  if (rawPath.startsWith('data:')) return rawPath;

  // Build URL from relative path
  const baseUrl = getBaseUrl();

  // Extract the part after "uploads/" if present, to normalize different path formats
  const uploadsIdx = rawPath.indexOf('uploads/');
  if (uploadsIdx !== -1) {
    const relativePart = rawPath.substring(uploadsIdx); // keeps "uploads/..."
    return `${baseUrl}/${relativePart}`;
  }

  // Path without "uploads/" prefix — assume it's relative to uploads/
  return `${baseUrl}/uploads/${rawPath}`;
};

/**
 * Check if an attachment is an image based on mime_type or type field.
 */
export const isImageAttachment = (att: any): boolean => {
  if (!att) return false;
  const mime = att.mime_type || att.type || '';
  if (mime.startsWith('image/') || mime === 'image') return true;
  if (att.data && typeof att.data === 'string' && att.data.startsWith('data:image/')) return true;
  // Check file extension in path
  const path = att.path || att.filename || att.original_name || '';
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
};

/**
 * Check if an attachment is a video.
 */
export const isVideoAttachment = (att: any): boolean => {
  if (!att) return false;
  const mime = att.mime_type || att.type || '';
  if (mime.startsWith('video/') || mime === 'video') return true;
  const path = att.path || att.filename || att.original_name || '';
  return /\.(mp4|mov|avi|webm|mpeg)$/i.test(path);
};

/**
 * Check if an attachment is a document (not image, not video).
 */
export const isDocumentAttachment = (att: any): boolean => {
  if (!att) return false;
  if (att.type === 'document') return true;
  return !isImageAttachment(att) && !isVideoAttachment(att);
};

/**
 * Get the display name for an attachment.
 */
export const getAttachmentName = (att: any): string => {
  return att.original_name || att.filename || att.name || 'Arquivo';
};
