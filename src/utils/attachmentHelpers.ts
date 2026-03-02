import Config from 'react-native-config';

const getBaseUrl = (): string => {
  const apiUrl = Config.API_BASE_URL || 'http://localhost:3000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export const getAttachmentUrl = (att: any): string => {
  if (!att) return '';

  if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
    return att.data;
  }

  const rawPath = att.path || att.file_path || '';
  if (!rawPath) return '';

  if (rawPath.startsWith('http')) return rawPath;

  if (rawPath.startsWith('data:')) return rawPath;

  const baseUrl = getBaseUrl();

  const uploadsIdx = rawPath.indexOf('uploads/');
  if (uploadsIdx !== -1) {
    const relativePart = rawPath.substring(uploadsIdx);
    return `${baseUrl}/${relativePart}`;
  }

  return `${baseUrl}/uploads/${rawPath}`;
};

export const isImageAttachment = (att: any): boolean => {
  if (!att) return false;
  const mime = att.mime_type || att.type || '';
  if (mime.startsWith('image/') || mime === 'image') return true;
  if (att.data && typeof att.data === 'string' && att.data.startsWith('data:image/')) return true;
  const path = att.path || att.filename || att.original_name || '';
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
};

export const isVideoAttachment = (att: any): boolean => {
  if (!att) return false;
  const mime = att.mime_type || att.type || '';
  if (mime.startsWith('video/') || mime === 'video') return true;
  const path = att.path || att.filename || att.original_name || '';
  return /\.(mp4|mov|avi|webm|mpeg)$/i.test(path);
};

export const isDocumentAttachment = (att: any): boolean => {
  if (!att) return false;
  if (att.type === 'document') return true;
  return !isImageAttachment(att) && !isVideoAttachment(att);
};

export const getAttachmentName = (att: any): string => {
  return att.original_name || att.filename || att.name || 'Arquivo';
};
