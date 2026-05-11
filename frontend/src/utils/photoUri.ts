import type { ImagePickerAsset } from "expo-image-picker";

const DATA_URI_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

export function isUsableImageUri(uri?: string | null): uri is string {
  if (typeof uri !== "string") return false;

  const trimmed = uri.trim();
  if (!trimmed) return false;

  return !trimmed.toLowerCase().startsWith("blob:");
}

export function normalizeStoredImageUri(uri?: string | null): string | null {
  if (!isUsableImageUri(uri)) return null;
  return uri.trim();
}

export function getDurableImageUri(asset: ImagePickerAsset): string | null {
  if (asset.base64 && !DATA_URI_PATTERN.test(asset.uri || "")) {
    const mimeType = asset.mimeType || "image/jpeg";
    return `data:${mimeType};base64,${asset.base64}`;
  }

  return normalizeStoredImageUri(asset.uri);
}
