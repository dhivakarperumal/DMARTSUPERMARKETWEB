import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import {
    FiArrowLeft, FiEdit, FiTrash2, FiPackage, FiTag, FiTruck,
    FiCalendar, FiGlobe, FiStar, FiCheckCircle, FiAlertCircle,
    FiImage, FiDollarSign, FiBarChart2, FiInfo, FiLayers,
    FiShoppingBag, FiRefreshCw, FiClock
} from "react-icons/fi";
import { BsQrCode, BsBox, BsBoxSeam, BsUpc } from "react-icons/bs";
import { MdOutlineLocalOffer, MdVerified } from "react-icons/md";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const processUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return url.startsWith("/") ? `${BACKEND_URL}${url}` : `${BACKEND_URL}/${url}`;
};

const Badge = ({ label, color = "blue" }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        red: "bg-red-50 text-red-600 border-red-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[color]}`}>
            {label}
        </span>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => {
    if (!value && value !== 0 && value !== false) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-700 break-words">{String(value)}</p>
            </div>
        </div>
    );
};

const Section = ({ title, icon: Icon, children, accent = false }) => (
    <div className={`bg-white rounded-[2rem] border ${accent ? "border-blue-100 shadow-blue-50" : "border-gray-100"} shadow-sm overflow-hidden`}>
        <div className={`px-8 py-5 border-b ${accent ? "border-blue-50 bg-blue-50/30" : "border-gray-50 bg-gray-50/30"} flex items-center gap-3`}>
            {Icon && <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}><Icon size={15} /></div>}
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-8">{children}</div>
    </div>
);

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [deleting, setDeleting] = useState(false);

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
        } catch (error) {
            toast.error("Failed to load product.");
            navigate("/admin/products/all");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        setDeleting(true);
        try {
            await api.delete(`/products/${id}`);
            toast.success("Product deleted.");
            navigate("/admin/products/all");
        } catch (error) {
            toast.error("Delete failed.");
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">Loading product details...</p>
        </div>
    );
    if (!product) return null;

    // ─── Derived Data ───
    const getDisplayImages = () => {
        if (product.product_images) {
            try {
                const imgs = typeof product.product_images === "string"
                    ? JSON.parse(product.product_images) : product.product_images;
                if (Array.isArray(imgs) && imgs.length > 0)
                    return imgs.map(processUrl).filter(Boolean);
            } catch (e) {}
        }
        if (product.thumbnail_image) {
            const u = processUrl(product.thumbnail_image);
            if (u) return [u];
        }
        return [];
    };
    const displayImages = getDisplayImages();

    const pricingOptions = (() => {
        try {
            if (!product.pricing_options) return [];
            return typeof product.pricing_options === "string"
                ? JSON.parse(product.pricing_options) : product.pricing_options;
        } catch (e) { return []; }
    })();

    const barcodeImageSrc = product.barcode_image
        ? (product.barcode_image.startsWith("data:") ? product.barcode_image : processUrl(product.barcode_image))
        : null;

    const statusColor = product.status === "Active" ? "green" : "red";
    const stockStatus = product.total_stock <= 0 ? "Out of Stock"
        : product.total_stock < 10 ? "Low Stock" : "In Stock";
    const stockColor = product.total_stock <= 0 ? "red"
        : product.total_stock < 10 ? "amber" : "green";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            <Toaster position="top-right" />

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/products/all" className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                        <FiArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-slate-800">{product.name}</h1>
                            <Badge label={product.status || "Active"} color={statusColor} />
                            <Badge label={stockStatus} color={stockColor} />
                        </div>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
                            {product.product_code && `SKU: ${product.product_code}`}
                            {product.product_code && product.category && " • "}
                            {product.category}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={`/admin/products/edit/${id}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                    >
                        <FiEdit size={14} /> Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-60"
                    >
                        <FiTrash2 size={14} /> {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ── LEFT: Image Gallery ── */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
                            {displayImages.length > 0 ? (
                                <img
                                    src={displayImages[activeImage] || displayImages[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-all duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                                    <FiImage size={40} />
                                    <p className="text-xs font-bold">No images uploaded</p>
                                </div>
                            )}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.featured_product && <Badge label="Featured" color="purple" />}
                                {product.best_seller && <Badge label="Best Seller" color="amber" />}
                                {product.todays_deal && <Badge label="Today's Deal" color="red" />}
                            </div>
                        </div>
                        {/* Thumbnail Strip */}
                        {displayImages.length > 1 && (
                            <div className="p-4 flex gap-3 overflow-x-auto hide-scrollbar">
                                {displayImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`w-16 h-16 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-blue-500 ring-2 ring-blue-50" : "border-gray-100 opacity-60 hover:opacity-100"}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Thumbnail & Barcode */}
                    <Section title="Barcode & Identification" icon={BsUpc}>
                        <div className="space-y-4">
                            {barcodeImageSrc && (
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2">
                                    <img src={barcodeImageSrc} alt="Barcode" className="w-full max-h-24 object-contain" />
                                    {product.barcode && <p className="text-[11px] font-bold text-gray-400 tracking-widest">{product.barcode}</p>}
                                </div>
                            )}
                            {!barcodeImageSrc && product.barcode && (
                                <InfoRow icon={BsUpc} label="Barcode" value={product.barcode} />
                            )}
                            <InfoRow icon={FiTag} label="SKU / Product Code" value={product.product_code} />
                        </div>
                    </Section>

                    {/* QR Code */}
                    <Section title="Product Passport" icon={BsQrCode}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <QRCodeCanvas value={window.location.href} size={120} level="H" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Scan to view product</p>
                        </div>
                    </Section>
                </div>

                {/* ── RIGHT: All Details ── */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Pricing Summary Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Selling Price</p>
                                <p className="text-4xl font-black">₹{parseFloat(product.offer_price || product.selling_price || 0).toLocaleString()}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    {product.mrp > 0 && (
                                        <p className="text-blue-300 line-through text-sm font-bold">₹{parseFloat(product.mrp).toLocaleString()} MRP</p>
                                    )}
                                    {product.offer > 0 && (
                                        <span className="bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded-lg">{product.offer}% OFF</span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "MRP", value: `₹${parseFloat(product.mrp || 0).toLocaleString()}` },
                                    { label: "Selling Price", value: `₹${parseFloat(product.selling_price || 0).toLocaleString()}` },
                                    { label: "Total Stock", value: `${product.total_stock || 0} Units` },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                                        <p className="text-blue-200 text-[9px] font-black uppercase tracking-wider">{s.label}</p>
                                        <p className="text-white font-black text-sm mt-1">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <Section title="Basic Information" icon={FiInfo}>
                        <div className="space-y-1">
                            <InfoRow icon={FiShoppingBag} label="Product Name" value={product.name} />
                            <InfoRow icon={FiTag} label="Category" value={product.category} />
                            <InfoRow icon={FiLayers} label="Sub Category" value={product.subcategory} />
                            <InfoRow icon={BsBoxSeam} label="Brand" value={product.brand} />
                            <InfoRow icon={FiStar} label="Rating" value={product.rating ? `${product.rating} ★  (${product.review_count || 0} reviews)` : null} />
                        </div>
                        {product.description && (
                            <div className="mt-6 pt-6 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</p>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{product.description}</p>
                            </div>
                        )}
                    </Section>

                    {/* Pricing Options Table */}
                    {pricingOptions.length > 0 && (
                        <Section title="Pricing Options / Variants" icon={MdOutlineLocalOffer} accent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-blue-50 rounded-xl">
                                            {["Variant / Weight", "MRP", "Offer %", "Selling Price", "Stock"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest first:rounded-l-2xl last:rounded-r-2xl">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingOptions.map((opt, i) => {
                                            // Build the variant label from weight_volume + unit
                                            const variantLabel =
                                                opt.weight_volume && opt.unit
                                                    ? `${opt.weight_volume} ${opt.unit}`
                                                    : opt.weight_volume || opt.label || opt.variant || opt.weight || `Option ${i + 1}`;

                                            const offerVal = parseFloat(opt.offer || opt.offer_percent || 0);
                                            const mrpVal   = parseFloat(opt.mrp || 0);
                                            const spVal    = parseFloat(opt.selling_price || opt.price || 0);
                                            const stockVal = opt.stock_quantity ?? opt.stock ?? null;

                                            return (
                                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-4 font-black text-slate-700 text-sm">{variantLabel}</td>
                                                    <td className="px-4 py-4 text-sm font-bold text-gray-500">
                                                        {mrpVal > 0 ? `₹${mrpVal.toLocaleString()}` : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {offerVal > 0 ? (
                                                            <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-1 rounded-lg border border-rose-100">{offerVal}%</span>
                                                        ) : <span className="text-gray-300 text-sm">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-black text-blue-600">
                                                        {spVal > 0 ? `₹${spVal.toLocaleString()}` : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                                        {stockVal !== null ? `${stockVal} units` : <span className="text-gray-300">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    )}

                    {/* Combo Items */}
                    {product.category === "COMBO" && Array.isArray(product.combo_items) && product.combo_items.length > 0 && (
                        <Section title="Combo Items" icon={FiPackage} accent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-blue-50 rounded-xl">
                                            {["Image", "Item Name", "Variant", "Quantity", "Price"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest first:rounded-l-2xl last:rounded-r-2xl">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.combo_items.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    {item.image ? (
                                                        <img src={processUrl(item.image)} alt={item.name} className="w-10 h-10 object-contain rounded-lg border border-gray-100 bg-white" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                                                            <FiImage size={16} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 font-black text-slate-700 text-sm">{item.name}</td>
                                                <td className="px-4 py-4 text-xs font-bold text-gray-500">
                                                    {item.variant_info ? `${item.variant_info.weight} ${item.variant_info.unit}` : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-black text-blue-600">x{item.quantity}</td>
                                                <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                                    {item.offer_price || item.selling_price > 0 ? `₹${item.offer_price || item.selling_price}` : `₹${item.mrp || 0}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    )}

                    {/* Inventory & Sourcing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="Inventory" icon={BsBox}>
                            <div className="space-y-1">
                                <InfoRow icon={FiBarChart2} label="Total Stock" value={`${product.total_stock || 0} Units`} />
                                <InfoRow icon={FiPackage} label="Stock Quantity" value={product.stock_quantity ? `${product.stock_quantity} Units` : null} />
                                <div className="flex items-start gap-3 py-3 border-b border-gray-50">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                        <FiAlertCircle size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stock Status</p>
                                        <Badge label={stockStatus} color={stockColor} />
                                    </div>
                                </div>
                                <InfoRow icon={FiClock} label="Delivery Time" value={product.delivery_time} />
                                <div className="flex items-start gap-3 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                        <FiRefreshCw size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Return Available</p>
                                        <Badge label={product.return_available ? "Yes" : "No"} color={product.return_available ? "green" : "slate"} />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Sourcing & Origin" icon={FiTruck}>
                            <div className="space-y-1">
                                <InfoRow icon={FiTruck} label="Supplier" value={product.supplier} />
                                <InfoRow icon={FiGlobe} label="Country of Origin" value={product.country_of_origin} />
                                <InfoRow icon={FiCalendar} label="Manufacturing Date" value={product.manufacturing_date} />
                                <InfoRow icon={FiCalendar} label="Expiry Date" value={product.expiry_date} />
                            </div>
                        </Section>
                    </div>

                    {/* Flags & Timestamps */}
                    <Section title="Flags & Metadata" icon={MdVerified}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {[
                                { label: "Featured Product", val: product.featured_product, color: "purple" },
                                { label: "Best Seller", val: product.best_seller, color: "amber" },
                                { label: "Today's Deal", val: product.todays_deal, color: "red" },
                            ].map((f, i) => (
                                <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${f.val ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}>
                                    {f.val
                                        ? <FiCheckCircle className="text-emerald-500 shrink-0" />
                                        : <FiAlertCircle className="text-gray-300 shrink-0" />}
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{f.label}</p>
                                        <p className={`text-xs font-black mt-0.5 ${f.val ? "text-emerald-600" : "text-gray-400"}`}>{f.val ? "Yes" : "No"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                            <InfoRow icon={FiCalendar} label="Created At" value={product.created_at ? new Date(product.created_at).toLocaleString() : null} />
                            <InfoRow icon={FiCalendar} label="Last Updated" value={product.updated_at ? new Date(product.updated_at).toLocaleString() : null} />
                        </div>
                    </Section>

                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
