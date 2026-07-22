import React, { useEffect, useState, useContext } from "react";
import { ShoppingCart, Heart, Tag, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { useNavigate } from "react-router-dom";
import QuickViewModal from "../Products/QuickModel";
import AnimatedButton from "../AnimatedButton";

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

const getImage = (product) => {
  const candidates = [
    product.thumbnail_image,
    product.product_images,
    product.images,
    product.image,
    product.image_url,
  ];
  for (const candidate of candidates) {
    const list = normalizeImages(candidate);
    if (list.length > 0) {
      const resolved = resolveImage(list[0]);
      if (resolved) return resolved;
    }
  }
  // variant images fallback
  if (product.variants?.length > 0) {
    const variantImgs = normalizeImages(product.variants[0]?.images);
    if (variantImgs.length > 0) {
      const resolved = resolveImage(variantImgs[0]);
      if (resolved) return resolved;
    }
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    product.name || "Combo"
  )}&background=d1fae5&color=065f46&size=400`;
};

const isCombo = (p) => {
  return String(p.type) === "1";
};

const CATEGORIES = [];

const Combo = () => {
  const { toggleWishlist, wishlist, addToCart } = useContext(StoreContext);
  const [allCombos, setAllCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();
  const [quickView, setQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await api.get("/products");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.products)
            ? res.data.products
            : [];
        setAllCombos(data.filter(isCombo));
      } catch (error) {
        console.error("Error fetching combos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const filteredCombos =
    activeCategory === "All"
      ? allCombos
      : allCombos.filter(
        (c) =>
          c.category?.toLowerCase().includes(activeCategory.toLowerCase()) ||
          c.name?.toLowerCase().includes(activeCategory.toLowerCase())
      );



  return (
    <div className="bg-[#f8faf8] min-h-screen">

      <PageHeader title="Combo Products" />

      <PageContainer>
        <section className="mt-10 pb-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-700">Combo Collection</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Bundles made for every kitchen</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xl">Explore curated combo packs with savings, hand-picked items, and fast delivery.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === category
                      ? 'border-[#0e6827] bg-[#0e6827] text-white'
                      : 'border-gray-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-2 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-64 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                    <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                    <div className="h-12 bg-gray-200 rounded-2xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCombos.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Tag size={36} className="text-green-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Combos Found</h3>
              <p className="text-gray-400">No combo products are available yet. Add combos from the Admin panel.</p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-6 px-6 py-3 bg-[#0e6827] text-white rounded-2xl font-bold text-sm hover:bg-[#168637] transition"
              >
                Show All
              </button>
            </div>
          ) : (
            <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-8">
              {filteredCombos.map((combo) => {
                const price = parseFloat(
                  combo.offer_price || combo.selling_price || combo.price || 0
                );
                const mrp = parseFloat(combo.mrp || combo.price || 0);
                const discountPct =
                  mrp > 0 && price > 0 && mrp > price
                    ? Math.round((1 - price / mrp) * 100)
                    : 0;
                const savings = mrp > price ? (mrp - price).toFixed(2) : 0;
                const imgSrc = getImage(combo);
                const inWishlist = wishlist.some(
                  (w) => w.product_id === combo.id || w.id === combo.id
                );

                // Parse combo items for display
                let comboItems = [];
                if (Array.isArray(combo.combo_items) && combo.combo_items.length > 0) {
                  comboItems = combo.combo_items;
                }

                return (
                  <div
                    key={combo.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 group flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative flex-shrink-0">
                      <Link to={`/products/${combo.id}`}>
                        <img
                          src={imgSrc}
                          alt={combo.name}
                          className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              combo.name || "Combo"
                            )}&background=d1fae5&color=065f46&size=400`;
                          }}
                        />
                      </Link>
                      {discountPct > 0 && (
                        <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                          {discountPct}% OFF
                        </span>
                      )}
                      <span className="absolute top-4 left-4 mt-8 bg-[#0e6827] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        COMBO
                      </span>
                      <button
                        onClick={() => toggleWishlist(combo)}
                        className={`absolute top-4 right-4 p-2 rounded-full shadow transition ${inWishlist
                          ? "bg-red-500 text-white"
                          : "bg-white text-gray-500 hover:bg-red-500 hover:text-white"
                          }`}
                      >
                        <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Title + Rating */}
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/products/${combo.id}`} className="flex-1">
                          <h2
                            onClick={() => navigate(`/products/${combo.id}`)}
                            className="text-lg font-bold text-gray-800 line-clamp-2 hover:text-[#0e6827] transition-colors cursor-pointer hover:text-[#0e6827]"
                          >
                            {combo.name}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-1 text-yellow-500 font-semibold shrink-0">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm">{combo.rating || "4.5"}</span>
                        </div>
                      </div>

                      {/* Product Code */}
                      {combo.product_code && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1 self-start">
                          {combo.product_code}
                        </span>
                      )}

                      {/* Combo Items */}
                      {comboItems.length > 0 ? (
                        <div className="mt-4 space-y-1.5 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Includes
                          </p>
                          {comboItems.slice(0, 4).map((item, index) => (
                            <div key={index} className="flex items-center text-gray-600 text-sm">
                              <Tag size={12} className="mr-2 text-[#0e6827] shrink-0" />
                              <span className="line-clamp-1">
                                {item.product_name || item.name || `Item ${index + 1}`}
                                {item.quantity && item.quantity > 1
                                  ? ` × ${item.quantity}`
                                  : ""}
                              </span>
                            </div>
                          ))}
                          {comboItems.length > 4 && (
                            <p className="text-xs text-green-600 font-semibold">
                              +{comboItems.length - 4} more items
                            </p>
                          )}
                        </div>
                      ) : combo.description ? (
                        <p className="mt-3 text-sm text-gray-500 line-clamp-2 flex-1">
                          {combo.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* Pricing */}
                      <div className="mt-5 flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#0e6827]">
                          ₹{price.toFixed(2)}
                        </span>
                        {mrp > price && (
                          <span className="line-through text-gray-400 text-sm">₹{mrp.toFixed(2)}</span>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-red-500 font-semibold text-sm mt-1">
                          You save ₹{savings}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(combo);
                            setQuickView(true);
                          }}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-green-400 hover:bg-green-50 transition"
                        >
                          <Eye size={16} />
                          Quick View
                        </button>

                        <button
                          onClick={() => addToCart(combo)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#0e6827] px-4 py-3 text-sm font-semibold text-white hover:bg-[#168637] transition"
                        >
                          <ShoppingCart size={16} />
                          Add to Cart
                        </button>
                        {/* 
                      <Link
                        to={`/products/${combo.id}`}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[#0e6827] bg-white px-4 py-3 text-sm font-semibold text-[#0e6827] hover:border-transparent hover:bg-[#0e6827] hover:text-white transition"
                      >
                        <Eye size={16} />
                        View details
                      </Link> */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </PageContainer>
      {quickView && selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          onClose={() => {
            setQuickView(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Combo;