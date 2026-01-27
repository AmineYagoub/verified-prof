export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

export const AVATAR_VALIDATION_ERRORS = {
  INVALID_TYPE: `Invalid file type. Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
  FILE_TOO_LARGE: 'File too large. Max size: 5MB',
  NO_FILE: 'No file uploaded',
} as const;
