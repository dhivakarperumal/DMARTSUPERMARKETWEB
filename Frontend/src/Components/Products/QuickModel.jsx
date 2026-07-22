import React, { useState, useContext, useEffect } from "react";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import {
  FiHeart,
  FiShoppingCart,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";

const QuickViewModal = ({ product, onClose }) => {



  const resolveImage = (img) => {
    if (!img || typeof img !== "string") return null;

    const trimmed = img.trim();

    if (!trimmed) return null;

    if (trimmed.startsWith("http") || trimmed.startsWith("data:"))
      return trimmed;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const cleanPath = trimmed.replace(/\\/g, "/");

    const finalPath = cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`;

    return `${backendUrl}${finalPath}`;
  };

  const normalizeImageList = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) return value.filter(Boolean);

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.filter(Boolean)
          : [parsed];
      } catch {
        return [trimmed];
      }
    }

    return [value];
  };

  const getComboItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items.filter(Boolean);
    if (typeof items === "string") {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const isComboProduct = (item) => {
    if (!item) return false;
    return String(item.type) === "1";
  };

  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0],
  );
  const [selectedImage, setSelectedImage] = useState(
    product?.variants?.[0]?.images?.[0],
  );
  const [selectedSize, setSelectedSize] = useState(
    product?.variants?.[0]?.selectedSizes?.[0],
  );
  const [imgIndex, setImgIndex] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const isInWishlist = wishlist.some(
    (w) => w.product_id === product?.id || w.id === product?.id,
  );

  const comboItems = getComboItems(product?.combo_items);

  const imageCandidates = [
    selectedVariant?.images,
    product?.thumbnail_image,
    product?.product_images,
    product?.images,
    product?.image,
    product?.image_url,
  ];

  const allImages = React.useMemo(() => {
    return Array.from(
      new Set(
        imageCandidates
          .flatMap((item) => normalizeImageList(item))
          .map(resolveImage)
          .filter(Boolean)
      )
    );
  }, [selectedVariant, product]);

  // Update image whenever the selected variant changes
  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
      setImgIndex(0);
    }
  }, [selectedVariant, allImages]);

  useEffect(() => {
    setImgIndex(0);
  }, [selectedVariant]);

  // Disable body scrolling while modal is open   
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!product) return null;

  const parseStockNumber = (raw) => {
    if (raw === undefined || raw === null) return 0;
    const cleaned = String(raw).replace(/,/g, '').trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const getStockValue = (variant, productItem) => {
    // Use product-level `total_stock` exclusively (ignore variant-level stock)
    return parseStockNumber(productItem?.total_stock);
  };

  const formatStockValue = (value) => {
    const parsed = parseStockNumber(value);
    return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(3).replace(/\.0+$/, '') ;
  };

  const getVariantUnitSize = (variant) => {
    const val = variant?.quantity ?? variant?.weight_volume ?? variant?.weight ?? variant?.size ?? 1;
    const sizeNum = parseFloat(String(val || '').replace(/,/g, '').trim()) || 0;
    const unit = String(variant?.unit || '').trim().toLowerCase();
    if (!sizeNum || sizeNum <= 0) return 1;
    if (["g", "gram", "grams"].includes(unit)) return sizeNum / 1000;
    if (["ml", "milliliter", "millilitre", "milliliters", "millilitres"].includes(unit)) return sizeNum / 1000;
    return sizeNum;
  };

  const stock = getStockValue(selectedVariant, product);
  const isOutOfStock = (() => {
    const unitSize = getVariantUnitSize(selectedVariant);
    const maxQ = stock > 0 ? Math.floor(stock / unitSize) : 0;
    return maxQ < 1;
  })();
  const maxQuantity = stock > 0 ? Math.floor(stock / getVariantUnitSize(selectedVariant)) : 0;

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please login to buy products.");
      return;
    }

    const isCombo = String(product?.type) === "1";
    const needsVariant = product?.variants?.length > 0 && !isCombo;

    if (needsVariant && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    if (isOutOfStock) {
      return;
    }

    navigate("/checkout", {
      state: {
        product: product,
        variant: selectedVariant,
        size: selectedSize,
        quantity: quantity,
      },
    });
  };

  const prevImage = () => {
    setImgIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setImgIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <style>
        {`
        .quickview-scroll::-webkit-scrollbar{
          width:0;
          display:none;
        }
      `}
      </style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-green-100 flex flex-col"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:top-5 lg:right-5 z-[100] w-11 h-11 rounded-full bg-white border border-gray-200 shadow-xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center cursor-pointer"
        >
          <FiX size={22} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0e6827] via-[#168637] to-[#0b511d] px-8 py-5 text-white">
          <div className="flex items-start justify-between pr-16 lg:pr-20">
            <div>
              <p className="text-green-200 text-sm uppercase tracking-widest">
                Premium Grocery
              </p>

              <h2 className="text-3xl font-bold mt-1">
                {product.name}
              </h2>
            </div>

            {product.offer && (
              <div className="mr-2 lg:mr-4 bg-[#ffc107] text-black font-bold text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-full shadow-lg whitespace-nowrap">
                {Math.floor(product.offer)}% OFF
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row overflow-hidden flex-1">

          {/* ========================= */}
          {/* LEFT IMAGE SECTION */}
          {/* ========================= */}

          <div className="lg:w-1/2 bg-gradient-to-br from-green-50 via-white to-green-100 p-6 flex flex-col">

            {/* Main Image */}
            <div className="relative flex-1 min-h-[420px] rounded-3xl bg-white border border-green-100 shadow-md overflow-hidden flex items-center justify-center group">

              <img
                src={allImages[imgIndex] || allImages[0]}
                alt={product.name}
                className="w-full h-full object-contain p-8 transition duration-300 group-hover:scale-105"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-green-700 text-white hover:bg-green-800 shadow-xl flex items-center justify-center"
                  >
                    <FiChevronLeft size={20} />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-green-700 text-white hover:bg-green-800 shadow-xl flex items-center justify-center"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}

            </div>

            {/* Thumbnail Images */}

            {allImages.length > 1 && (
              <div className="flex gap-3 mt-5 overflow-x-auto pb-1">

                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setImgIndex(index);
                    }}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${imgIndex === index
                      ? "border-green-700 shadow-lg"
                      : "border-gray-200 hover:border-green-400"
                      }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* ========================= */}
          {/* RIGHT CONTENT */}
          {/* ========================= */}

          <div
            className="lg:w-1/2 p-7 overflow-y-auto quickview-scroll flex flex-col gap-6"
            style={{ scrollbarWidth: "none" }}
          >

            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                  {product.category}
                </span>
              )}

              {product.subcategory && (
                <span className="px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                  {product.subcategory}
                </span>
              )}

              <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                In Stock
              </span>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-2xl p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <span className="text-4xl font-bold text-green-700">
                  ₹{selectedVariant?.sellingPrice || selectedVariant?.selling_price || product.offer_price}
                </span>

                {(selectedVariant?.mrp || product.mrp) && (
                  <span className="text-lg text-gray-400 line-through">
                    ₹{selectedVariant?.mrp || product.mrp}
                  </span>
                )}

              </div>

              {(selectedVariant?.offer || product.offer) && (
                <div className="mt-2 text-sm font-semibold text-red-500">
                  Save {Math.floor(selectedVariant?.offer || product.offer)}%
                </div>
              )}

            </div>

            {/* Variant Quantities */}
            {product.variants?.length > 0 && (
              <div>

                <h3 className="font-bold text-gray-800 mb-3">
                  Available Variants
                </h3>

                <div className="flex gap-3 flex-wrap">

                  {product.variants.map((variant, index) => (

                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (variant.images?.[0]) setSelectedImage(resolveImage(variant.images?.[0]));
                        if (variant.selectedSizes?.[0]) setSelectedSize(variant.selectedSizes?.[0]);
                        setImgIndex(0);
                      }}
                      className={`px-4 py-2 rounded-xl border-2 transition font-semibold ${selectedVariant?.quantity === variant.quantity && selectedVariant?.unit === variant.unit
                        ? "border-green-700 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-green-400 text-gray-700"
                        }`}
                    >
                      {variant.quantity} {variant.unit}
                    </button>

                  ))}

                </div>

              </div>
            )}

            {/* Combo Items */}
            {isComboProduct(product) && comboItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Combo Includes:
                </h3>
                <div className="flex flex-col gap-3">
                  {comboItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {item.image && (
                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0 border border-gray-100 p-1">
                          <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        {item.variant_info && (
                           <p className="text-xs text-gray-500 font-semibold mt-0.5">{item.variant_info.weight} {item.variant_info.unit}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {item.offer_price > 0 || item.selling_price > 0 ? (
                            <>
                              <span className="text-sm font-black text-green-600">₹{item.offer_price || item.selling_price}</span>
                              {item.mrp > 0 && <span className="text-xs text-gray-400 line-through font-semibold">₹{item.mrp}</span>}
                              {(item.mrp > (item.offer_price || item.selling_price)) && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">
                                  {Math.round(((item.mrp - (item.offer_price || item.selling_price)) / item.mrp) * 100)}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm font-black text-gray-800">₹{item.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-indigo-100 text-indigo-700 font-black px-3 py-1 rounded-lg text-sm">
                        x{item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (

              <div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Product Description
                </h3>

                <p className="text-gray-600 leading-7 text-sm">
                  {product.description}
                </p>

              </div>

            )}

            {/* Return & Delivery */}

            <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-5">

              <h3 className="text-lg font-bold text-green-800 mb-5">
                Return & Delivery
              </h3>

              <div className="space-y-4">

                <div className="flex gap-4">

                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl">
                    🚚
                  </div>

                  <div>

                    <h4 className="font-semibold">
                      Fast Delivery
                    </h4>

                    <p className="text-sm text-gray-500">
                      Delivered within 1-2 business days.
                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

                  <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl">
                    🔄
                  </div>

                  <div>

                    <h4 className="font-semibold">
                      Easy Return
                    </h4>

                    <p className="text-sm text-gray-500">
                      Return eligible items within 7 days.
                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                    🔒
                  </div>

                  <div>

                    <h4 className="font-semibold">
                      Secure Payment
                    </h4>

                    <p className="text-sm text-gray-500">
                      100% safe and secure payment gateway.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Sizes */}

            {selectedVariant?.selectedSizes?.length > 0 && (

              <div>

                {!(
                  selectedVariant.selectedSizes.length === 1 &&
                  selectedVariant.selectedSizes[0].toLowerCase() === "free size"
                ) && (

                    <>

                      <h3 className="font-bold text-gray-800 mb-3">
                        Select Size
                      </h3>

                      <div className="flex flex-wrap gap-3">

                        {selectedVariant.selectedSizes.map((size, index) => (

                          <button
                            key={index}
                            onClick={() => setSelectedSize(size)}
                            className={`px-5 py-2 rounded-xl border transition font-medium ${selectedSize === size
                              ? "bg-green-700 border-green-700 text-white"
                              : "border-gray-200 hover:border-green-600"
                              }`}
                          >

                            {size}

                          </button>

                        ))}

                      </div>

                    </>

                  )}

                {selectedSize && (

                  <p className="mt-4 text-sm text-gray-600">

                    Available Stock :

                    <span className="ml-2 font-bold text-green-700">

                      {selectedVariant?.sizesStock?.[selectedSize] || 0}

                    </span>

                  </p>

                )}

              </div>

            )}

            {/* Quantity */}

            <div>

              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-bold text-gray-800">
                  Quantity
                </h3>
                <p className={`text-sm font-semibold ${isOutOfStock ? "text-red-500" : "text-green-700"}`}>
                  {isOutOfStock ? "Out of Stock" : `Available: ${formatStockValue(stock)} ${selectedVariant?.unit || product?.unit || "units"}`}
                </p>
              </div>

              <div className="flex items-center w-fit rounded-xl border border-green-200 bg-green-50 overflow-hidden">

                <button
                  onClick={() => {
                    if (quantity > 1) {
                      setQuantity(quantity - 1);
                    }
                  }}
                  className="w-12 h-12 text-xl font-bold hover:bg-green-700 hover:text-white transition"
                >

                  -

                </button>

                <div className="w-14 text-center font-bold">

                  {quantity}

                </div>

                <button
                  onClick={() => {
                    if (maxQuantity > 0 && quantity < maxQuantity) {
                      setQuantity(quantity + 1);
                    }
                  }}
                  className="w-12 h-12 text-xl font-bold hover:bg-green-700 hover:text-white transition"
                >

                  +

                </button>

              </div>


            </div>
            {/* Bottom Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-green-100 pt-5 mt-auto">
              {isOutOfStock ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                  This variant is currently out of stock.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">

                  {/* Add To Cart */}
                  <button
                    onClick={() => {
                      const isCombo = String(product?.type) === "1";
                      const needsVariant = product?.variants?.length > 0 && !isCombo;
                      if (needsVariant && !selectedVariant) {
                        toast.error("Please select a variant");
                        return;
                      }
                      addToCart(
                        product,
                        selectedVariant,
                        selectedSize,
                        quantity
                      );
                      onClose();
                    }}
                    className="flex-1 h-14 rounded-xl bg-gradient-to-r from-[#0e6827] to-[#168637] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <FiShoppingCart size={20} />
                    Add To Cart
                  </button>

                  {/* Buy Now */}
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 h-14 rounded-xl bg-[#ffc107] hover:bg-[#e7b100] text-black font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Buy Now
                  </button>

                  {/* Wishlist */}
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${isInWishlist
                      ? "border-red-400 bg-red-50 text-red-500"
                      : "border-green-200 hover:border-green-700 hover:bg-green-50 text-gray-600"
                      }`}
                  >
                    <FiHeart
                      size={22}
                      className={isInWishlist ? "fill-current" : ""}
                    />
                  </button>

                </div>
              )}

              {/* Trust Badges */}
              {/* <div className="mt-5 grid grid-cols-3 gap-3">

                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <div className="text-2xl">🌿</div>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    Fresh Products
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <div className="text-2xl">🚚</div>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    Fast Delivery
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <div className="text-2xl">💯</div>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    Quality Assured
                  </p>
                </div>

              </div> */}

            </div>

            {/* End Right Section */}
          </div>

          {/* End Main Flex */}
        </div>
      </div>
    </div>,

    document.body
  );

};

export default QuickViewModal;
