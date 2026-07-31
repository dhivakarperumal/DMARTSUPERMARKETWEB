import { toast } from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { API_URL } from "../api";

const trimmedApiUrl = API_URL.replace(/\/$/, "");
const UPLOAD_URL = trimmedApiUrl.endsWith("/api")
  ? `${trimmedApiUrl}/upload`
  : `${trimmedApiUrl}/api/upload`;

/**
 * Upload files to the GoDaddy server via upload.php
 * @param {File[]} files - Array of File objects to upload
 * @param {string} category - Upload category folder (products, categories, banners, dealers, staff, reviews)
 * @returns {Promise<string[]>} - Array of uploaded file URLs
 */
export const uploadFiles = async (files, category = "products") => {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file, i) =>
    formData.append("files[]", file, file.name || `file_${i}`)
  );
  formData.append("category", category);

  const toastId = toast.loading(`Uploading ${files.length} file(s)...`);
  const categoryUrl = category && category !== "products" ? `/${encodeURIComponent(category)}` : "";
  const uploadUrl = `${UPLOAD_URL}${categoryUrl}`;

  try {
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    toast.dismiss(toastId);

    if (!res.ok || !data) {
      console.error("Upload failed response:", res.status, data);
      toast.error(`Upload failed: server responded ${res.status}`);
      return [];
    }

    if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
      toast.success(`Uploaded ${data.urls.length} file(s) successfully`);
      return data.urls;
    }

    console.error("Upload response (no urls):", data);
    toast.error("Upload failed: no URLs returned from server");
    return [];
  } catch (err) {
    toast.dismiss(toastId);
    console.error("Upload error:", err);
    toast.error(`Upload failed: ${err.message || "network error"}`);
    return [];
  }
};

/**
 * Compress an image file before upload
 * @param {File} file - Image file to compress
 * @param {object} options - Compression options
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 5,
    maxWidthOrHeight: 3000,
    useWebWorker: true,
    ...options,
  };

  const shouldCompress =
    file.size > defaultOptions.maxSizeMB * 1024 * 1024 ||
    options.fileType ||
    options.initialQuality ||
    (options.maxWidthOrHeight && options.maxWidthOrHeight < defaultOptions.maxWidthOrHeight);

  if (!shouldCompress) {
    return file;
  }

  const compressed = await imageCompression(file, defaultOptions);
  return new File([compressed], file.name || "image.jpg", {
    type: compressed.type,
  });
};

/**
 * Compress and upload image files in one step
 * @param {File[]} files - Array of image files
 * @param {string} category - Upload category folder
 * @param {object} compressionOptions - Optional compression settings
 * @returns {Promise<string[]>} - Array of uploaded file URLs
 */
export const compressAndUpload = async (
  files,
  category = "products",
  compressionOptions = {}
) => {
  const compressedFiles = await Promise.all(
    files.map(async (file) => {
      const compressed = await compressImage(file, compressionOptions);
      return compressed;
    })
  );
  return uploadFiles(compressedFiles, category);
};
