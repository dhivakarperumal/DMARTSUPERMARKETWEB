import React, { useState, useContext } from "react";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { FiPlus, FiHeart, FiShare2 } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import QuickViewModal from "./QuickModel";
import { FaStar } from "react-icons/fa";
import ReactDOM from "react-dom";
import AnimatedButton from "../AnimatedButton";

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const isInWishlist = wishlist.some(
    (p) => p.product_id === product.id || p.id === product.id,
  );

  if (!product) return null;

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const productUrl = `${window.location.origin}/products/${product.id}`;

  const handleShare = async (e) => {
    e.stopPropagation();

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: "Check out this product!",
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        alert("Product link copied!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to resolve image URLs
  const resolveImage = (img) => {
    if (!img || typeof img !== 'string') return null;
    const trimmed = img.trim();
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

  const imageCandidates = [
    product?.thumbnail_image,
    product?.product_images,
    product?.images,
    product?.image,
    product?.image_url,
    product?.thumbnail,
    product?.variants?.[0]?.images,
  ];

  const images = Array.from(
    new Set(
      imageCandidates
        .flatMap((candidate) => normalizeImageList(candidate))
        .map((img) => resolveImage(img))
        .filter(Boolean)
    )
  );

  if (images.length === 0) {
    images.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || "Product")}&background=random`);
  }

  const image = hovered && images[1] ? images[1] : images[0];

  return (
    <>
      <div
        onClick={handleClick}
        className="relative bg-white rounded-xl border border-gray-200 p-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
      >
        {/* Icons */}
        {/* <div
          className="absolute top-2 right-2 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => toggleWishlist(product)}
            className={`bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition duration-300 ${isInWishlist
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500"
              }`}
          >
            <FiHeart
              className={`text-sm ${isInWishlist ? "fill-current" : ""}`}
            />
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setQuickView(true);
            }}
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-primary transition duration-300"
            title="Quick View"
          >
            <FiPlus className="text-sm" />
          </div>

          <div
            onClick={handleShare}
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-primary transition duration-300"
          >
            <FiShare2 className="text-sm" />
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowQR(true);
            }}
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-primary transition duration-300"
          >
            <BsQrCode className="text-sm" />
          </div>
        </div> */}

        {/* Image Area */}
        <div
          className="relative  h-48 w-full flex items-center justify-center mb-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Top Left Tags */}
          <div className="absolute top-0 left-0 z-10 flex flex-col gap-1">
            {product?.bestseller ? (
              <span className="bg-green-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Bestseller
              </span>
            ) : product?.offer ? (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                {Math.floor(product.offer)}% OFF
              </span>
            ) : null}
          </div>

          {/* Default Image */}
          <img
            src={images[0]}
            alt={product?.name}
            className={`max-w-full max-h-full object-cover transition-opacity duration-500 ${hovered && images[1] ? "opacity-0" : "opacity-100"
              }`}
          />

          {/* Hover Image */}
          {images[1] && (
            <img
              src={images[1]}
              alt={product?.name}
              className={`absolute max-w-full max-h-full object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"
                }`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-2 min-h-[40px]">
            <h2 className="text-sm text-gray-700 font-medium line-clamp-2 flex-1">
              {product?.name}
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className={`flex-shrink-0 transition ${isInWishlist
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
                }`}
            >
              <FiHeart
                className={`text-lg ${isInWishlist ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 mb-2 text-sm">
            <FaStar className="text-orange-400 text-xs" />
            <span className="text-orange-500 font-medium text-xs">{product?.rating || '4.6'}</span>
            <span className="text-gray-400 text-xs">({product?.reviews_count || '1.2k'})</span>
          </div>

          {/* Price & Add to Cart Container */}
          <div className="mt-auto">
            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-gray-900 text-lg">
                ₹{product?.offer_price || product?.price}
              </span>
              {product?.mrp && (
                <span className="text-gray-400 line-through text-xs">
                  ₹{product?.mrp}
                </span>
              )}
              {product?.offer && (
                <span className="text-green-600 text-xs font-bold">
                  {Math.floor(product.offer)}% OFF
                </span>
              )}
            </div>

            {/* Quick ViewButton */}
            <AnimatedButton
              text="Quick View"
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="mt-2 rounded-md py-2 px-4 text-sm"
            />
          </div>
        </div>
      </div>

      {/* QR Popup */}
      {showQR &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-lg mb-4">Scan to view product</h3>

              <div className="flex justify-center">
                <QRCodeCanvas value={productUrl} size={200} />
              </div>

              <p className="text-sm text-gray-500 mt-3">{product?.name}</p>

              <button
                onClick={() => setShowQR(false)}
                className="mt-5 cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
      {quickView && (
        <QuickViewModal product={product} onClose={() => setQuickView(false)} />
      )}
    </>
  );
};

export default ProductCard;
