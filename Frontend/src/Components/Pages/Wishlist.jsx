import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiEye, FiShoppingCart } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const resolveImage = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return trimmed;
  const cleanPath = trimmed.replace(/\\/g, "/");
  return cleanPath.startsWith("/")
    ? `${BACKEND_URL}${cleanPath}`
    : `${BACKEND_URL}/${cleanPath}`;
};

const normalizeImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
    } catch {
      if (trimmed.startsWith("[")) return [];
      return [trimmed];
    }
  }
  return [value];
};

const getItemImage = (item) => {
  const candidates = [
    item.thumbnail_image,
    item.product_images,
    item.images,
    item.image,
    item.image_url,
    item.product_image,
  ];
  for (const candidate of candidates) {
    const list = normalizeImages(candidate);
    if (list.length > 0) {
      const resolved = resolveImage(list[0]);
      if (resolved) return resolved;
    }
  }
  if (item.variants?.length > 0) {
    const variantImgs = normalizeImages(item.variants[0]?.images);
    if (variantImgs.length > 0) {
      const resolved = resolveImage(variantImgs[0]);
      if (resolved) return resolved;
    }
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    item.name || item.product_name || "Product"
  )}&background=d1fae5&color=065f46&size=400`;
};

export default function WishList() {
  const { wishlist, removeFromWishlist, addToCart } = useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="My Wishlist" />

      <div className="min-h-screen bg-[#f7f8f3] py-8 sm:py-10">
        <PageContainer>
          {/* Header Card */}
          <div className="mb-8 rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
                  Saved favorites
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">My Wishlist</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Keep your favorite products handy for the next visit.
                </p>
              </div>
              <div className="rounded-full bg-green-50 px-5 py-2 text-sm font-bold text-[#0e6827] border border-green-100">
                ❤️ {wishlist.length} saved item{wishlist.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {wishlist.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-green-200 bg-gradient-to-br from-green-50 to-white px-8 py-20 text-center shadow-[0_20px_50px_rgba(14,104,39,0.06)]">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-[#0e6827]">
                <FiHeart className="text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Your wishlist is empty</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Browse the collection and save your favorite products for later.
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="mt-6 rounded-full bg-[#0e6827] px-8 py-3 font-bold text-white transition hover:bg-[#168637] hover:scale-105"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlist.map((item) => {
                const id = item._id || item.id || item.product_id;
                const name = item?.name || item?.product_name || item?.productName || "Product";
                const imgSrc = getItemImage(item);
                const price = parseFloat(item?.offer_price || item?.price || item?.variants?.[0]?.selling_price || 0);
                const mrp = parseFloat(item?.mrp || item?.variants?.[0]?.mrp || 0);
                const discount = mrp > 0 && price > 0 && mrp > price
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : 0;

                return (
                  <div
                    key={id}
                    className="group overflow-hidden rounded-[1.75rem] border border-green-100 bg-white shadow-[0_10px_30px_rgba(14,104,39,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(14,104,39,0.14)] flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden flex-shrink-0 bg-gray-50">
                      <img
                        src={imgSrc}
                        alt={name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d1fae5&color=065f46&size=400`;
                        }}
                      />

                      {/* Discount badge */}
                      {discount > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                          {discount}% OFF
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromWishlist(id)}
                        className="absolute right-3 top-3 rounded-full bg-white p-2.5 text-red-500 shadow-md transition hover:bg-red-500 hover:text-white"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="line-clamp-2 font-bold text-slate-800 text-sm leading-snug flex-1">
                        {name}
                      </h3>

                      {/* Pricing */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-bold text-[#0e6827]">
                          ₹{price > 0 ? price.toFixed(2) : "—"}
                        </span>
                        {mrp > price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{mrp.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => addToCart(item)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0e6827] py-2.5 text-sm font-bold text-white transition hover:bg-[#168637]"
                        >
                          <FiShoppingCart size={15} />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => navigate(`/products/${item.product_id || item.id}`)}
                          className="flex items-center justify-center rounded-xl border-2 border-[#0e6827] p-2.5 text-[#0e6827] transition hover:bg-[#0e6827] hover:text-white"
                          title="View details"
                        >
                          <FiEye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageContainer>
      </div>
    </>
  );
}
