import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "/api";

export const API_URL = rawApiUrl.endsWith("/")
  ? rawApiUrl.slice(0, -1)
  : rawApiUrl;

// ======================================================
// BACKEND URL
// ======================================================
export const BACKEND_URL = (() => {
  const envBackend =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5000";

  let url = envBackend || origin;

  if (url.startsWith("/")) {
    url = origin.replace(/\/+$/, "") + url;
  }

  url = url.replace(/\/+$/, "");
  url = url.replace(/\/api\/?$/i, "");
  url = url.replace(/\/uploads.*$/i, "");

  return url;
})();

// ======================================================
// AXIOS
// ======================================================
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// AUTH TOKEN
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// ======================================================
// NORMALIZE IMAGE LIST
// ======================================================
export function normalizeImageList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeImageList(item))
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return [
      value.url,
      value.image,
      value.path,
      value.src,
      value.file,
      ...(Array.isArray(value.images) ? value.images : []),
      ...(Array.isArray(value.product_images)
        ? value.product_images
        : []),
    ]
      .flatMap((item) => normalizeImageList(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    let text = value.trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed) || typeof parsed === "object") {
        return normalizeImageList(parsed);
      }

      if (typeof parsed === "string") {
        return [parsed];
      }

      return [String(parsed)];
    } catch {
      // ignore invalid JSON and fall back to string parsing
    }

    if (text.includes(",")) {
      return text
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    return [text];
  }

  return [String(value)];
}

// ======================================================
// CACHE BUSTER
// ======================================================
const buildResolvedUrl = (
  url,
  cacheBust = true,
  cacheKey = Date.now()
) => {
  if (!url) return null;

  if (url.startsWith("data:")) {
    return url;
  }

  if (!cacheBust) {
    return url;
  }

  try {
    const u = new URL(url);

    u.searchParams.set("v", cacheKey);

    return u.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}v=${cacheKey}`;
  }
};

// ======================================================
// FILE URL
// ======================================================
export function getFileUrl(rawPath, options = {}) {
  const {
    cacheBust = true,
    cacheKey = Date.now(),
  } = options;

  if (!rawPath) return null;

  let path = String(rawPath).trim();

  // Remove surrounding quotes
  if (
    (path.startsWith('"') && path.endsWith('"')) ||
    (path.startsWith("'") && path.endsWith("'"))
  ) {
    path = path.slice(1, -1).trim();
  }

  if (!path) return null;

  // Base64 image
  if (path.startsWith("data:")) {
    const commaIndex = path.indexOf(",");
    if (commaIndex === -1) return null;
    const payload = path.slice(commaIndex + 1);
    if (!payload.trim()) return null;
    return path;
  }

  // Full URL
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path);
      let normalizedPath = parsed.pathname
        .replace(/(^|\/)api\/uploads\/uploads\//gi, "$1api/uploads/")
        .replace(/(^|\/)uploads\/uploads\//gi, "$1uploads/")
        .replace(/\/+/g, "/");

      if (/^\/uploads\//i.test(normalizedPath)) {
        normalizedPath = normalizedPath.replace(/^\/uploads\//i, "/api/uploads/");
      }

      if (/^\/(?:api\/)?uploads\//i.test(normalizedPath)) {
        return buildResolvedUrl(
          `${parsed.origin}${normalizedPath}`,
          cacheBust,
          cacheKey
        );
      }
    } catch (error) {
      // Ignore absolute URL parsing errors and fall back to the original path
      console.warn("getFileUrl parse error:", error.message);
    }

    return buildResolvedUrl(path, cacheBust, cacheKey);
  }

  // Windows path
  path = path.replace(/\\/g, "/");

  // Remove domain
  path = path.replace(/^https?:\/\/[^/]+/i, "");

  // Remove duplicate slashes
  path = path.replace(/\/+/g, "/");

  // Normalize duplicate upload segments
  path = path.replace(/(?:^|\/)api\/uploads\/uploads\//gi, "$1api/uploads/");
  path = path.replace(/(?:^|\/)uploads\/uploads\//gi, "$1uploads/");

  // Remove leading slash
  path = path.replace(/^\/+/, "");

  // Remove "./"
  path = path.replace(/^\.\//, "");

  // ----------------------------------------------------
  // API proxy paths
  // ----------------------------------------------------

  if (path.startsWith("proxy?")) {
    return buildResolvedUrl(
      `${API_URL}/${path}`,
      cacheBust,
      cacheKey
    );
  }

  const uploadsPath = path.replace(/^api\//i, "");
  const backendUploadsBase = `${BACKEND_URL.replace(/\/+$/, "")}/api`;

  // ----------------------------------------------------
  // uploads/... or api/uploads/...
  // ----------------------------------------------------

  if (/^(?:uploads|api\/uploads)\//i.test(path)) {
    return buildResolvedUrl(
      `${backendUploadsBase}/${uploadsPath}`,
      cacheBust,
      cacheKey
    );
  }

  // ----------------------------------------------------
  // API paths
  // ----------------------------------------------------

  if (path.startsWith("api/")) {
    return buildResolvedUrl(
      `${API_URL}/${path.replace(/^api\//, "")}`,
      cacheBust,
      cacheKey
    );
  }

  // ----------------------------------------------------
  // products/... becomes uploads/products/...
  // ----------------------------------------------------

  if (path.startsWith("products/")) {
    return buildResolvedUrl(
      `${BACKEND_URL.replace(/\/+$/, "")}/api/uploads/${path}`,
      cacheBust,
      cacheKey
    );
  }

  // ----------------------------------------------------
  // Filename only
  // ----------------------------------------------------

  if (
    !path.startsWith("uploads/") &&
    !path.startsWith("products/")
  ) {
    path = `uploads/products/${path}`;
  }

  return buildResolvedUrl(
    `${BACKEND_URL.replace(/\/+$/, "")}/api/${path.replace(/^api\//i, "")}`,
    cacheBust,
    cacheKey
  );
}
// ======================================================
// PRODUCT IMAGE
// ======================================================
const isPlaceholderImage = (rawPath) => {
  if (!rawPath) return false;
  const path = String(rawPath).trim().toLowerCase();
  return (
    path.endsWith("/images/logo.png") ||
    path === "/logo.png" ||
    path.endsWith("/logo.png") ||
    path.includes("ui-avatars.com") ||
    path.includes("placeholder") ||
    path.includes("/images/default")
  );
};

export function getProductImageUrl(product) {
  if (!product) return null;

  const candidates = [
    product.product_images,
    product.images,
    product.image,
    product.product_image,
    product.image_url,
    product.featured_image,
    product.thumbnail_image,
    product.thumbnail,
    product.thumbnailImage,
    product.variant_image,

    // Variant images
    ...(Array.isArray(product.variants)
      ? product.variants.flatMap((variant) => [
          variant.images,
          variant.image,
          variant.image_url,
          variant.thumbnail,
        ])
      : []),
  ];

  const imageUrls = [];

  candidates.forEach((candidate) => {
    normalizeImageList(candidate).forEach((img) => {
      if (isPlaceholderImage(img)) return;

      const url = getFileUrl(img);

      if (
        url &&
        typeof url === "string" &&
        !imageUrls.includes(url)
      ) {
        imageUrls.push(url);
      }
    });
  });

  return imageUrls.length ? imageUrls[0] : null;
}

// ======================================================
// PRODUCT GALLERY
// ======================================================
export function getProductImages(product) {
  if (!product) return [];

  const candidates = [
    product.product_images,
    product.images,
    product.image,
    product.product_image,
    product.image_url,
    product.featured_image,
    product.thumbnail_image,
    product.thumbnail,
    product.thumbnailImage,
    product.variant_image,

    ...(Array.isArray(product.variants)
      ? product.variants.flatMap((variant) => [
          variant.images,
          variant.image,
          variant.image_url,
        ])
      : []),
  ];

  const imageUrls = [];

  candidates.forEach((candidate) => {
    normalizeImageList(candidate).forEach((img) => {
      if (isPlaceholderImage(img)) return;

      const url = getFileUrl(img);

      if (
        url &&
        typeof url === "string" &&
        !imageUrls.includes(url)
      ) {
        imageUrls.push(url);
      }
    });
  });

  return imageUrls;
}