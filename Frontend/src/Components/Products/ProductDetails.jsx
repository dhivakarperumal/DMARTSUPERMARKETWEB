import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { FaStar, FaShareAlt, FaPlus, FaMinus, FaHeart, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import {
  FiHeart,
  FiShoppingCart,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import RelatedProducts from "./RelatedProducts";
import PageHeader from "../CommenComponents/PageHeader";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const ProductDetails = () => {
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);

  const { id } = useParams();
  console.log("Current Product ID:", id);
  const { user } = useAuth();
  console.log("Logged User:", user);
  const navigate = useNavigate();



  const [product, setProduct] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reviewImage, setReviewImage] = useState(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [userReviewed, setUserReviewed] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0,
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    console.log("Component Mounted for Product:", id);
  }, [id]);

  const [zoomed, setZoomed] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState("50% 50%");
  const zoomLevel = 2.5;

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data?.reviews || []);
      setReviewStats(
        res.data?.stats || {
          total_reviews: 0,
          average_rating: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = trimmed.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const normalizeImageList = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
      } catch {
        if (trimmed.startsWith('[')) return [];
        return [trimmed];
      }
    }

    return [value];
  };

  const getComboItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items.filter(Boolean);
    if (typeof items === 'string') {
      try {
        const parsedItems = JSON.parse(items);
        return Array.isArray(parsedItems) ? parsedItems.filter(Boolean) : [];
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

  const getDisplayImages = (data, variant) => {
    const candidates = [
      variant?.images,
      data?.thumbnail_image,
      data?.product_images,
      data?.images,
      data?.image,
      data?.image_url,
      data?.thumbnail,
      variant?.image,
      variant?.image_url,
    ];

    const images = Array.from(
      new Set(
        candidates
          .flatMap((candidate) => normalizeImageList(candidate))
          .map((img) => resolveImageUrl(img))
          .filter(Boolean)
      )
    );

    if (images.length > 0) {
      return images;
    }

    return [
      `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || "Product")}&background=random`
    ];
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data;
      if (!data) throw new Error("Product data not found");

      setProduct(data);
      console.log("Fetched Product:", data);

      if (data.variants?.length > 0) {
        const firstVariant = data.variants[0];
        const normalizedVariant = {
          ...firstVariant,
          images: normalizeImageList(firstVariant.images),
        };

        setSelectedVariant(normalizedVariant);
        const images = getDisplayImages(data, normalizedVariant);
        setSelectedImage(images[0]);
        setSelectedSize(normalizedVariant.selectedSizes?.[0] || null);
      } else {
        const images = getDisplayImages(data, null);
        setSelectedVariant(null);
        setSelectedImage(images[0]);
        setSelectedSize(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const parseStockNumber = (raw) => {
    if (raw === undefined || raw === null) return 0;
    // Allow strings like "27.750" or "27,750" or extra whitespace
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

  const availableStock = getStockValue(selectedVariant, product);
  const variantUnitSize = getVariantUnitSize(selectedVariant);
  const maxQuantity = availableStock > 0 ? Math.floor(availableStock / variantUnitSize) : 0;
  const isOutOfStock = maxQuantity < 1;

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
        quantity: quantity
      }
    });

  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setBackgroundPosition(`${x}% ${y}%`);
  };

  const increaseQty = () => {
    setQuantity((prev) => {
      if (maxQuantity > 0 && prev < maxQuantity) return prev + 1;
      return prev;
    });
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // review submitting section
  const submitReview = async () => {
    try {
      if (!rating) {
        alert("Please select rating");
        return;
      }
      console.log("Submitting Review:", {
        product_id: product.id,
        user_name: user?.name,
        user_email: user?.email,
        rating,
        comment: reviewText,
      });

      await api.post("/reviews", {
        product_id: product.id,
        user_name: user?.name,
        user_email: user?.email,
        user_id: user?.id || user?.user_id,
        rating: rating,
        comment: reviewText,
        review_image: reviewImage,
      });

      alert("Review submitted successfully!");

      setRating(0);
      setReviewText("");
      setReviewImage(null);
      setShowReviewForm(false);

      // ⭐ IMPORTANT
      setUserReviewed(true);
      fetchReviews(); // Refresh the reviews list immediately
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "Failed to submit review";
      alert(errorMsg);

      if (errorMsg.includes("already submitted")) {
        setUserReviewed(true);
        setShowReviewForm(false);
      }
    }
  };

  //  check if the user already submitted a review for this product
  const checkUserReview = async () => {
    try {
      const uId = user?.id || user?.user_id;
      if (!uId) {
        setUserReviewed(false);
        return;
      }

      const res = await api.get(`/reviews/check/${id}/${uId}`);
      console.log("Check Review Response:", res.data);

      if (res.data.hasReviewed) {
        setUserReviewed(true);
      } else {
        setUserReviewed(false);
      }
    } catch (err) {
      console.log("Review check error:", err);
      setUserReviewed(false);
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setReviewImage(reader.result); // base64 string
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    setUserReviewed(false);
  }, [id]);

  useEffect(() => {
    if (user) {
      checkUserReview();
    }
  }, [user, id]);

  const displayImages = product ? getDisplayImages(product, selectedVariant) : [];
  const comboItems = getComboItems(product?.combo_items);
  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || "Product")}&background=random`;

  if (!product)
    return (
      <>
        <PageHeader title="Loading..." />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 grid lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
          {/* LEFT IMAGE SKELETON */}
          <div>
            <div className="w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-gray-200 rounded-xl"></div>

            <div className="flex gap-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* RIGHT DETAILS SKELETON */}
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded"></div>

            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>

            <div className="h-6 w-32 bg-gray-200 rounded mt-6"></div>

            <div className="flex gap-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-14 h-10 bg-gray-200 rounded-lg"></div>
              ))}
            </div>

            <div className="h-32 bg-gray-200 rounded-xl mt-6"></div>

            <div className="flex gap-4 mt-6">
              <div className="h-12 flex-1 bg-gray-200 rounded-lg"></div>
              <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <PageHeader title={product.name} />
      <div className="bg-gradient-to-b from-green-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12">
          <div className="rounded-[2rem] border border-green-100 bg-white p-3 sm:p-5 shadow-[0_20px_60px_rgba(16,185,129,0.10)]">
            <div
              className="relative h-[320px] sm:h-[420px] lg:h-[500px] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-green-50 to-white"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={selectedImage || displayImages[0] || fallbackImage}
                alt={product.name}
                className="h-full w-full object-cover object-top transition duration-500"
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />

              {product?.offer && (
                <div className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-lg">
                  {Math.floor(product.offer)}% OFF
                </div>
              )}

              {zoomed && (
                <div
                  className="absolute left-full top-0 ml-4 hidden h-[480px] w-[520px] overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-2xl lg:block"
                  style={{
                    backgroundImage: `url(${selectedImage || displayImages[0] || fallbackImage})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${zoomLevel * 100}%`,
                    backgroundPosition: backgroundPosition,
                  }}
                />
              )}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {displayImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${selectedImage === img ? "border-primary shadow-md" : "border-gray-200 hover:border-green-300"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  {product.category}
                </span>
              )}
              {product.subcategory && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                  {product.subcategory}
                </span>
              )}
              {product?.offer && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-600">
                  Best Deal
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold text-primary-dark sm:text-4xl">
              {product.name}
            </h1>

            {reviewStats.total_reviews > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={14}
                      className={
                        i < Math.round(reviewStats.average_rating)
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span>
                  {reviewStats.average_rating.toFixed(1)} • {reviewStats.total_reviews} reviews
                </span>
              </div>
            )}

            <p className="mt-4 text-base leading-7 text-gray-600">{product.description}</p>

            <div className="mt-6 rounded-[1.5rem] border border-green-100 bg-gradient-to-r from-green-50 to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold text-green-700">₹{selectedVariant?.sellingPrice || selectedVariant?.selling_price || product.offer_price}</span>
                {(selectedVariant?.mrp || product.mrp) && (
                  <span className="text-lg text-gray-400 line-through">₹{selectedVariant?.mrp || product.mrp}</span>
                )}
                {(selectedVariant?.offer || product.offer) && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    Save {Math.floor(selectedVariant?.offer || product.offer)}%
                  </span>
                )}
              </div>
            </div>

            {/* Variant Selection */}
            <div className="mt-6 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
              {product?.variants?.length > 0 && (
                <>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Available Variants
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const normalizedVariant = {
                            ...variant,
                            images: normalizeImageList(variant.images),
                          };
                          const images = getDisplayImages(product, normalizedVariant);
                          setSelectedVariant(normalizedVariant);
                          if (images.length > 0) setSelectedImage(images[0]);
                          if (normalizedVariant.selectedSizes?.[0]) setSelectedSize(normalizedVariant.selectedSizes[0]);
                          setQuantity(1);
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedVariant?.quantity === variant.quantity && selectedVariant?.unit === variant.unit ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-700 hover:border-primary"}`}
                      >
                        {variant.quantity} {variant.unit}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* <p className="mt-3 text-sm text-gray-600">
                Stock Available: <span className="font-semibold text-gray-800">{selectedVariant?.stock || selectedVariant?.stock_quantity || product?.stock_quantity || 0}</span>
              </p> */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Quantity</p>
                  <p className={`text-sm font-semibold ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
                    {isOutOfStock ? "Out of Stock" : `Available: ${formatStockValue(availableStock)} ${selectedVariant?.unit || product?.unit || "units"}`}
                  </p>
                </div>
                <div className="flex w-fit items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                  <button onClick={decreaseQty} className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100">
                    -
                  </button>
                  <span className="border-x border-gray-200 px-5 py-2 font-semibold text-gray-700">
                    {quantity}
                  </span>
                  <button onClick={increaseQty} className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100">
                    +
                  </button>
                </div>
              </div>
            </div>

            {isComboProduct(product) && comboItems.length > 0 && (
              <div className="mt-6 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Combo Includes
                </p>
                <div className="flex flex-col gap-3">
                  {comboItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {item.image && (
                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0 border border-gray-100 p-1">
                          <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
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
                              <span className="text-sm font-black text-primary">₹{item.offer_price || item.selling_price}</span>
                              {item.mrp > 0 && <span className="text-xs text-gray-400 line-through font-semibold">₹{item.mrp}</span>}
                              {(item.mrp > (item.offer_price || item.selling_price)) && (
                                <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black">
                                  {Math.round(((item.mrp - (item.offer_price || item.selling_price)) / item.mrp) * 100)}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm font-black text-gray-800">₹{item.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-primary/10 text-primary font-black px-3 py-1 rounded-lg text-sm">
                        x{item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOutOfStock ? (
              <div className="mt-8 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                This variant is currently out of stock.
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    const isCombo = String(product?.type) === "1";
                    const needsVariant = product?.variants?.length > 0 && !isCombo;
                    if (needsVariant && !selectedVariant) {
                      toast.error("Please select a variant");
                      return;
                    }
                    addToCart(product, selectedVariant, selectedSize, quantity);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-green-100 transition hover:scale-[1.01]"
                >
                  <FiShoppingCart size={18} />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex flex-1 items-center justify-center rounded-full bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toggleWishlist(product, selectedVariant)}
                  className={`flex items-center justify-center rounded-full border px-5 py-3 font-semibold transition ${wishlist.some((w) => w.product_id === product.id) ? "border-rose-300 bg-rose-50 text-rose-500" : "border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500"}`}
                >
                  <FiHeart size={18} className={wishlist.some((w) => w.product_id === product.id) ? "fill-current" : ""} />
                </button>
              </div>
            )}

            <div className="mt-8 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-dark">Product Details</h3>
                <button onClick={() => setShowDetails(!showDetails)} className="text-primary transition hover:text-primary-dark">
                  {showDetails ? <FiChevronUp size={22} /> : <FiChevronDown size={22} />}
                </button>
              </div>

              {showDetails && (
                <div className="mt-4 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2">
                  {product.material && <><span className="text-gray-500">Material</span><span className="font-medium text-gray-800">{product.material}</span></>}
                  {product.color && <><span className="text-gray-500">Color</span><span className="font-medium text-gray-800">{product.color}</span></>}
                  {product.wash_care && <><span className="text-gray-500">Wash Care</span><span className="font-medium text-gray-800">{product.wash_care}</span></>}
                  {product.saree_length && <><span className="text-gray-500">Saree Length</span><span className="font-medium text-gray-800">{product.saree_length}</span></>}
                  {product.blouse_length && <><span className="text-gray-500">Blouse Length</span><span className="font-medium text-gray-800">{product.blouse_length}</span></>}
                  {product.work_type && <><span className="text-gray-500">Work Type</span><span className="font-medium text-gray-800">{product.work_type}</span></>}
                  {product.zari_color && <><span className="text-gray-500">Zari Color</span><span className="font-medium text-gray-800">{product.zari_color}</span></>}
                  {product.top_length && <><span className="text-gray-500">Top Length</span><span className="font-medium text-gray-800">{product.top_length}</span></>}
                  {product.bottom_length && <><span className="text-gray-500">Bottom Length</span><span className="font-medium text-gray-800">{product.bottom_length}</span></>}
                  {product.dupatta_length && <><span className="text-gray-500">Dupatta Length</span><span className="font-medium text-gray-800">{product.dupatta_length}</span></>}
                  {product.gown_length && <><span className="text-gray-500">Gown Length</span><span className="font-medium text-gray-800">{product.gown_length}</span></>}
                  {product.sleeve_type && <><span className="text-gray-500">Sleeve Type</span><span className="font-medium text-gray-800">{product.sleeve_type}</span></>}
                  {product.neck_type && <><span className="text-gray-500">Neck Type</span><span className="font-medium text-gray-800">{product.neck_type}</span></>}
                  {product.fit_type && <><span className="text-gray-500">Fit Type</span><span className="font-medium text-gray-800">{product.fit_type}</span></>}
                  {product.age && <><span className="text-gray-500">Age</span><span className="font-medium text-gray-800">{product.age}</span></>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <RelatedProducts
        category={product?.category}
        currentProductId={product?.id}
      />

      {/* REVIEW SECTION */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-20">
        {/* HEADER */}

        <div className="flex items-center justify-between border-t border-gray-200 pt-10 mb-6">
          <h2 className="text-2xl font-bold text-primary-light">Add Reviews</h2>

          {userReviewed ? (
            <p className="text-green-600 font-semibold">
              You already reviewed this product
            </p>
          ) : (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-6 py-2 rounded-xl font-semibold text-white 
    bg-gradient-to-r from-primary-light to-secondary 
    shadow-md hover:scale-105 transition cursor-pointer"
            >
              {showReviewForm ? "Hide Review Form" : "Write Review"}
            </button>
          )}
        </div>

        {/* REVIEW FORM */}

        {showReviewForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm max-w-4xl">
            <h3 className="text-lg font-semibold mb-6">
              Share your experience
            </h3>

            {/* STAR RATING */}

            <div className="mb-6">
              <p className="font-medium mb-2">Rating</p>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    size={22}
                    className={`cursor-pointer transition
                ${star <= (hoverRating || rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                      }
              `}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            {/* REVIEW TEXT */}

            <div className="mb-6">
              <p className="font-medium mb-2">Review</p>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mb-6">
              <p className="font-medium mb-2">Upload Image (optional)</p>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded-xl p-2"
              />

              {reviewImage && (
                <img
                  src={reviewImage}
                  alt="preview"
                  className="mt-4 w-32 h-32 object-cover rounded-lg border"
                />
              )}
            </div>

            {/* SUBMIT BUTTON */}

            <button
              onClick={submitReview}
              className="bg-gradient-to-r from-primary-light to-secondary text-white 
  px-6 py-3 rounded-xl font-semibold shadow-md hover:scale-105 transition"
            >
              Submit Review
            </button>
          </div>
        )}
      </div>

      {/* REVIEWS LIST & STATS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mb-20 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* STATS LEFT */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-6">Customer Reviews</h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-bold text-gray-800">
                {reviewStats.average_rating}
              </div>
              <div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={
                        i < Math.round(reviewStats.average_rating)
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Based on {reviewStats.total_reviews} reviews
                </p>
              </div>
            </div>

            {/* PROGRESS BARS */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  reviewStats[
                  `${star === 5
                    ? "five"
                    : star === 4
                      ? "four"
                      : star === 3
                        ? "three"
                        : star === 2
                          ? "two"
                          : "one"
                  }_star`
                  ] || 0;
                const percentage =
                  reviewStats.total_reviews > 0
                    ? (count / reviewStats.total_reviews) * 100
                    : 0;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-3">{star}</span>
                    <FaStar className="text-yellow-400" size={12} />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REVIEWS LIST RIGHT */}
          <div className="lg:col-span-2">
            {loadingReviews ? (
              <div className="animate-pulse space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border-b pb-6">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <Swiper
                modules={[Pagination, Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 2 }
                }}
                autoplay={{ delay: 3000 }}
                className="review-swiper pb-12"
              >
                {reviews.map((review) => (
                  <SwiperSlide key={review.id}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            {review.user_name}
                          </h4>
                          <div className="flex text-yellow-400 gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                size={14}
                                className={
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-200"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-600 leading-relaxed italic">
                        "{review.comment}"
                      </p>

                      {review.review_image && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 w-fit">
                          <img
                            src={review.review_image}
                            alt="Review"
                            className="w-40 h-40 object-cover hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {review.admin_reply && (
                        <div className="mt-6 bg-primary/5 p-4 rounded-xl border-l-4 border-primary/30">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                            Response from Seller
                          </p>
                          <p className="text-gray-600 text-sm italic">
                            "{review.admin_reply}"
                          </p>
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-gray-500 font-medium">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
