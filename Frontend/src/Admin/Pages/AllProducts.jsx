import React, { useState, useEffect, useContext } from "react";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import { FaRupeeSign } from "react-icons/fa";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import {
    FiPlus,
    FiSearch,
    FiFilter,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiBox,
    FiGrid,
    FiList,
    FiChevronRight,
    FiPackage,
    FiLayout,
    FiDatabase,
    FiDownload
} from "react-icons/fi";

const AllProducts = () => {
    const navigate = useNavigate();
    const { productsCache, setProductsCached } = useAdmin();

    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const currentCacheKey = JSON.stringify({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: showLowStockOnly ? "Low Stock" : "All"
    });

    const pageData = productsCache[currentCacheKey];
    const [products, setProducts] = useState(pageData?.products || []);
    const [loading, setLoading] = useState(!pageData);
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
    const [productTab, setProductTab] = useState("Regular");

    // Stock Update Modal State
    const [currentProduct, setCurrentProduct] = useState(null);
    const [newStock, setNewStock] = useState("");
    const [updatingStock, setUpdatingStock] = useState(false);

    const [pagination, setPagination] = useState(pageData?.pagination || { total: 0, totalPages: 1 });
    const [stats, setStats] = useState(pageData?.stats || { total: 0, active: 0, lowStock: 0, outOfStock: 0, combos: 0 });

    const isCombo = (p) => {
        return String(p.type) === "1";
    };

    // Rapid Add Modal
    const [isRapidAddOpen, setIsRapidAddOpen] = useState(false);
    const [rapidSaving, setRapidSaving] = useState(false);
    const [rapidProd, setRapidProd] = useState({ name: "", mrp: "", status: "Active" });

    const handleRapidAdd = async (e, shouldContinue = false) => {
        if (e) e.preventDefault();
        if (!rapidProd.name || !rapidProd.mrp) return toast.error("Essentials missing!");

        setRapidSaving(true);
        try {
            await api.post("/products", {
                ...rapidProd,
                category: "Groceries",
                total_stock: "0",
                variants: []
            });
            toast.success("Boutique addition live!");
            if (shouldContinue) {
                setRapidProd({ name: "", mrp: "", status: "Active" });
            } else {
                setIsRapidAddOpen(false);
                setRapidProd({ name: "", mrp: "", status: "Active" });
            }
            fetchProducts();
        } catch (error) {
            toast.error("Process failed.");
        } finally {
            setRapidSaving(false);
        }
    };

    const fetchProducts = async () => {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            status: showLowStockOnly ? "Low Stock" : "All"
        };
        const cacheKey = JSON.stringify(params);
        if (!productsCache[cacheKey]) setLoading(true);

        try {
            const response = await api.get("/products", { params });
            const data = response.data;
            let finalData = {};
            if (Array.isArray(data)) {
                const computeStats = (arr) => ({
                    total: arr.length,
                    active: arr.filter(p => (p.status || "Active") === "Active").length,
                    lowStock: arr.filter(p => {
                        const s = p.total_stock ?? p.stock ?? 0;
                        return s > 0 && s < 10;
                    }).length,
                    outOfStock: arr.filter(p => (p.total_stock ?? p.stock ?? 0) <= 0).length,
                    combos: arr.filter(p => isCombo(p)).length,
                });
                finalData = {
                    products: data,
                    pagination: { total: data.length, totalPages: 1 },
                    stats: computeStats(data)
                };
            } else {
                finalData = {
                    products: Array.isArray(data.products) ? data.products : [],
                    pagination: data.pagination || { total: 0, totalPages: 1 },
                    stats: data.stats || { total: 0, active: 0, lowStock: 0, outOfStock: 0, combos: 0 }
                };
            }
            setProducts(finalData.products);
            setPagination(finalData.pagination);
            setStats(finalData.stats);
            setProductsCached(prev => ({ ...prev, [cacheKey]: finalData }));
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timeout);
    }, [currentPage, searchTerm, showLowStockOnly]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success("Product removed from vault.");
            fetchProducts();
        } catch (error) {
            toast.error("Deletion failed.");
            console.error("Error deleting product:", error);
        }
    };

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        if (!currentProduct || newStock === "") return;

        setUpdatingStock(true);
        try {
            // Send partial update - most backends handle this if we send just what changed, 
            // but for ours we might need to send all or use a specific endpoint.
            // Assuming current backend needs a full update based on our previous look.
            const updatedProduct = { ...currentProduct, total_stock: parseInt(newStock) };
            await api.put(`/products/${currentProduct.id}`, updatedProduct);

            toast.success("Stock updated instantly!");
            setProducts(products.map(p => p.id === currentProduct.id ? { ...p, total_stock: parseInt(newStock), status: parseInt(newStock) === 0 ? 'Out of Stock' : parseInt(newStock) < 10 ? 'Low Stock' : 'Active' } : p));
            setCurrentProduct(null);
        } catch (error) {
            toast.error("Failed to update stock");
        } finally {
            setUpdatingStock(false);
        }
    };


    const getStatusStyle = (status) => {
        switch (status) {
            case "Active": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "Low Stock": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Out of Stock": return "bg-rose-50 text-rose-600 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    // Simplified Pagination (Handled by backend)
    const totalPages = pagination.totalPages;
    const regularProducts = products.filter(p => !isCombo(p));
    const comboProducts = products.filter(p => isCombo(p));
    const currentItems = productTab === "Combo" ? comboProducts : regularProducts;

    // Helper to get combo items count
    const getComboItemsCount = (p) => {
        try {
            const items = typeof p.combo_items === 'string' ? JSON.parse(p.combo_items) : p.combo_items;
            return Array.isArray(items) ? items.length : 0;
        } catch { return 0; }
    };

    // Reset to page 1 when search/filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, showLowStockOnly]);

    const getProductImage = (product) => {
        let imgUrl = null;
        try {
            const processUrl = (url) => {
                if (!url || typeof url !== 'string') return null;
                if (url.startsWith('http') || url.startsWith('data:')) return url;
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const cleanPath = url.startsWith('/') ? url : `/${url}`;
                return `${backendUrl}${cleanPath}`;
            };

            // 1. Try thumbnail first
            if (product.thumbnail_image) {
                imgUrl = product.thumbnail_image;
            }

            // 2. Try product_images array
            if (!imgUrl && product.product_images) {
                const imgs = typeof product.product_images === 'string' ? JSON.parse(product.product_images) : product.product_images;
                if (Array.isArray(imgs) && imgs.length > 0) imgUrl = imgs[0];
            }

            const finalUrl = processUrl(imgUrl);
            if (finalUrl) return finalUrl;
        } catch (e) {
            console.error("Error getting product image:", e);
        }

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=random`;
    };

    const downloadBarcodesPDF = () => {
        if (!products || products.length === 0) {
            toast.error("No products available to generate barcodes.");
            return;
        }

        toast.loading("Generating Barcode PDF...", { id: "barcode-pdf" });
        const doc = new jsPDF();
        
        let x = 15;
        let y = 15;
        const boxWidth = 55;
        const boxHeight = 42;
        const paddingX = 7;
        const paddingY = 8;
        const columns = 3;
        const rows = 6; // Adjusted rows to fit height comfortably
        
        const canvas = document.createElement("canvas");

        products.forEach((product, index) => {
            if (index > 0 && index % (columns * rows) === 0) {
                doc.addPage();
                x = 15;
                y = 15;
            } else if (index > 0 && index % columns === 0) {
                x = 15;
                y += boxHeight + paddingY;
            }

            // Prefer actual barcode, fallback to generated internal code
            const barcodeValue = product.barcode || product.product_code || `SKU${product.id}`;
            
            try {
                // Render barcode on canvas
                JsBarcode(canvas, barcodeValue, {
                    format: "CODE128",
                    displayValue: false, 
                    margin: 0, // Remove internal margin to prevent scaling issues
                    width: 2, // Standard bar width
                    height: 60, // Standard bar height
                    background: "#ffffff",
                    lineColor: "#000000"
                });
                
                // Use PNG for lossless compression
                const imgData = canvas.toDataURL("image/png");
                
                // Draw label border
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.5);
                doc.rect(x, y, boxWidth, boxHeight);
                
                // Draw product name (bold, centered)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                const maxLen = 28;
                const nameStr = product.name.length > maxLen ? product.name.substring(0, maxLen - 3) + '...' : product.name;
                doc.text(nameStr, x + boxWidth / 2, y + 5, { align: "center" });

                // **CRITICAL FIX**: Preserve exact aspect ratio so scanner can read the bar widths!
                const targetWidth = 45;
                // Calculate proportional height based on actual canvas pixel dimensions
                const proportionalHeight = (canvas.height / canvas.width) * targetWidth;
                
                // Center the barcode horizontally and vertically within its designated area
                const xOffset = x + (boxWidth - targetWidth) / 2;
                const yOffset = y + 7 + (18 - proportionalHeight) / 2;

                doc.addImage(imgData, 'PNG', xOffset, yOffset, targetWidth, proportionalHeight);

                // Draw the barcode value perfectly crisp using native PDF text
                doc.setFont("courier", "bold");
                doc.setFontSize(9);
                doc.text(barcodeValue, x + boxWidth / 2, y + 30, { align: "center" });

                // Add Price / Weight if available (below barcode text)
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                
                let detailStr = "";
                if (product.variants && product.variants.length > 0) {
                     const v = product.variants[0];
                     detailStr = `Qty: ${v.quantity} ${v.unit}  |  Rs.${v.sellingPrice || v.mrp}`;
                } else if (product.sellingPrice || product.price) {
                     detailStr = `Price: Rs.${product.sellingPrice || product.price}`;
                }
                
                if (detailStr) {
                    doc.text(detailStr, x + boxWidth / 2, y + 38, { align: "center" });
                } else {
                    doc.text(`Code: ${product.product_code || '-'}`, x + boxWidth / 2, y + 38, { align: "center" });
                }

            } catch (e) {
                console.error("Barcode generation error", e);
            }
            x += boxWidth + paddingX;
        });

        doc.save("Product_Barcodes.pdf");
        toast.success("PDF Downloaded!", { id: "barcode-pdf" });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen pb-20">

            

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading products...</p>
                </div>
            ) : (
                <>
                    {/* ── Premium Stats Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            {
                                label: "Total Products",
                                value: stats.total,
                                sub: "In catalog",
                                icon: <FiBox size={20} />,
                                gradient: "from-blue-500 to-blue-600",
                                ring: "ring-blue-100",
                                pct: 100,
                                barColor: "bg-blue-400"
                            },
                            {
                                label: "Combos",
                                value: stats.combos,
                                sub: stats.total > 0 ? `${Math.round((stats.combos/stats.total)*100)}% of catalog` : "0%",
                                icon: <FiLayout size={20} />,
                                gradient: "from-indigo-500 to-indigo-600",
                                ring: "ring-indigo-100",
                                pct: stats.total > 0 ? (stats.combos/stats.total)*100 : 0,
                                barColor: "bg-indigo-400"
                            },
                            {
                                label: "Active",
                                value: stats.active,
                                sub: stats.total > 0 ? `${Math.round((stats.active/stats.total)*100)}% of catalog` : "0%",
                                icon: <FiCheckCircle size={20} />,
                                gradient: "from-emerald-500 to-emerald-600",
                                ring: "ring-emerald-100",
                                pct: stats.total > 0 ? (stats.active/stats.total)*100 : 0,
                                barColor: "bg-emerald-400"
                            },
                            {
                                label: "Low Stock",
                                value: stats.lowStock,
                                sub: "Need restocking",
                                icon: <FiAlertCircle size={20} />,
                                gradient: "from-amber-400 to-amber-500",
                                ring: "ring-amber-100",
                                pct: stats.total > 0 ? (stats.lowStock/stats.total)*100 : 0,
                                barColor: "bg-amber-400"
                            },
                            {
                                label: "Out of Stock",
                                value: stats.outOfStock,
                                sub: "Urgent attention",
                                icon: <FiXCircle size={20} />,
                                gradient: "from-rose-500 to-rose-600",
                                ring: "ring-rose-100",
                                pct: stats.total > 0 ? (stats.outOfStock/stats.total)*100 : 0,
                                barColor: "bg-rose-400"
                            },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                                <div className="p-5 md:p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ring-4 ${stat.ring} group-hover:scale-110 transition-transform duration-300`}>
                                            {stat.icon}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                            {stat.pct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-slate-800 leading-none tabular-nums">{stat.value}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
                                    <p className="text-[10px] text-gray-300 font-bold mt-0.5">{stat.sub}</p>
                                </div>
                                {/* Progress bar at bottom */}
                                <div className="h-1 bg-gray-50">
                                    <div className={`h-full ${stat.barColor} transition-all duration-700 rounded-full`} style={{width: `${stat.pct}%`}} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Tabs ── */}
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => setProductTab("Regular")}
                            className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm ${
                                productTab === "Regular"
                                    ? "bg-[#3a8b28] text-white shadow-lg shadow-green-200"
                                    : "bg-white text-gray-400 hover:text-slate-700 border border-gray-100"
                            }`}
                        >
                            <FiBox size={14} />
                            Standard Products
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                productTab === "Regular"
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-500"
                            }`}>
                                {regularProducts.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setProductTab("Combo")}
                            className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm ${
                                productTab === "Combo"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                    : "bg-white text-gray-400 hover:text-slate-700 border border-gray-100"
                            }`}
                        >
                            <FiLayout size={14} />
                            Combo Products
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                productTab === "Combo"
                                    ? "bg-white/20 text-white"
                                    : "bg-indigo-50 text-indigo-600"
                            }`}>
                                {comboProducts.length}
                            </span>
                        </button>
                    </div>

                    {/* ── Controls ── */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full md:max-w-lg group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={16}/>
                            <input
                                type="text"
                                placeholder="Search products by name, SKU or code..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs font-bold text-slate-700 placeholder:text-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                            <button
                                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                    showLowStockOnly
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100'
                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-white hover:text-slate-700'
                                }`}
                            >
                                <FiFilter size={13}/> {showLowStockOnly ? "Low Stock" : "All"}
                            </button>
                            <select className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 outline-none hover:bg-white hover:border-gray-200 transition-all cursor-pointer whitespace-nowrap">
                                <option>Newest First</option>
                                <option>Price: Low → High</option>
                                <option>Price: High → Low</option>
                                <option>Stock: Low → High</option>
                            </select>
                        </div>
                         <div className="flex items-center gap-2">
                    <button
                        onClick={downloadBarcodesPDF}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                    >
                        <FiDownload size={14}/> PDF Barcodes
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all text-sm ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}>
                            <FiList size={16}/>
                        </button>
                        <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all text-sm ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}>
                            <FiGrid size={16}/>
                        </button>
                    </div>
                    <button
                        onClick={() => navigate("/admin/products/add")}
                        className="flex items-center gap-2 bg-[#1b7f29] hover:bg-[#166321] text-white px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <FiPlus size={14}/> New Product
                    </button>
                    <button
                        onClick={() => navigate("/admin/combo/add")}
                        className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <FiPlus size={14}/> New Combo
                    </button>
                </div>
                    </div>

                    {viewMode === "table" ? (
                        /* Modern Table View */
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-[#1b7f29] border-b border-gray-100">
                                            <th className="px-4 py-4 w-12 text-center">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#3a8b28] focus:ring-[#3a8b28]" />
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">Product <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">SKU / Barcode <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">Category <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">Price <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">Stock <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white">
                                                <div className="flex items-center gap-1">Status <span className="text-white text-[10px]">↕</span></div>
                                            </th>
                                            <th className="px-4 py-4 text-xs font-bold text-white text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentItems.map((product) => {
                                            const stock = product.total_stock ?? product.stock ?? 0;
                                            const mrp = parseFloat(product.mrp || 0);
                                            const price = parseFloat(product.offer_price || product.selling_price || 0);
                                            
                                            const getCategoryStyle = (cat) => {
                                                const c = cat?.toLowerCase() || '';
                                                if (c.includes('beverage')) return 'bg-blue-50 text-blue-600';
                                                if (c.includes('dairy')) return 'bg-purple-50 text-purple-600';
                                                if (c.includes('snack')) return 'bg-orange-50 text-orange-600';
                                                if (c.includes('household')) return 'bg-pink-50 text-pink-600';
                                                if (c.includes('personal')) return 'bg-teal-50 text-teal-600';
                                                return 'bg-[#eefae6] text-[#3a8b28]'; // Default Grocery
                                            };

                                            const statusText = product.status || 'Active';
                                            const isActive = statusText === 'Active';
                                            const productIsCombo = isCombo(product);
                                            const comboCount = getComboItemsCount(product);

                                            return (
                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                                                <td className="px-4 py-3 text-center">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#3a8b28] focus:ring-[#3a8b28]" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                                             <img
                                                                src={getProductImage(product)}
                                                                alt={product.name}
                                                                loading="lazy"
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-800 max-w-[200px] truncate">{product.name}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">Brand: {product.brand || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{product.product_code || `SKU${product.id || '0000'}`}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{product.barcode || '8901030827451'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getCategoryStyle(product.category)}`}>
                                                            {product.category || 'Grocery'}
                                                        </span>
                                                        {productIsCombo && comboCount > 0 && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                                <FiPackage size={10} /> {comboCount} item{comboCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">₹ {price.toFixed(2)}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">MRP: ₹ {mrp.toFixed(2)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className={`text-sm font-bold ${stock > 0 ? 'text-[#3a8b28]' : 'text-red-600'}`}>{stock}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">{stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${isActive ? 'bg-[#eefae6] text-[#3a8b28]' : 'bg-red-50 text-red-600'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#3a8b28]' : 'bg-red-600'}`}></div>
                                                        {statusText}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link to={`/admin/products/${product.id}`} className="p-1.5 rounded-md bg-[#eefae6] text-[#3a8b28] hover:bg-[#d8f2ca] transition-colors" title="View">
                                                            <FiEye size={14} />
                                                        </Link>
                                                        {isCombo(product) ? (
                                                            <Link to={`/admin/combo/edit/${product.id}`} className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit Combo">
                                                                <FiEdit2 size={14} />
                                                            </Link>
                                                        ) : (
                                                            <Link to={`/admin/products/edit/${product.id}`} className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit">
                                                                <FiEdit2 size={14} />
                                                            </Link>
                                                        )}
                                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Delete">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Premium Grid View */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {currentItems.map((product) => {
                                const stock = product.total_stock ?? product.stock ?? 0;
                                const mrp = parseFloat(product.mrp || 0);
                                const price = parseFloat(product.offer_price || product.selling_price || 0);
                                const discount = mrp > 0 && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
                                const stockPct = Math.min((stock / 50) * 100, 100);
                                const stockColor = stock <= 0 ? "bg-rose-500" : stock < 10 ? "bg-amber-400" : "bg-emerald-500";
                                const comboCount = getComboItemsCount(product);
                                const productIsCombo = isCombo(product);

                                return (
                                    <div key={product.id} className={`group bg-white rounded-[2rem] border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${
                                        productIsCombo ? 'border-indigo-100 hover:border-indigo-200' : 'border-gray-100'
                                    }`}>

                                        {/* Image */}
                                        <div className={`relative overflow-hidden ${
                                            productIsCombo
                                                ? 'bg-gradient-to-br from-indigo-50 to-purple-100'
                                                : 'bg-gradient-to-br from-gray-50 to-gray-100'
                                        }`} style={{aspectRatio:"4/3"}}>
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=${productIsCombo ? '6366f1' : 'f1f5f9'}&color=${productIsCombo ? 'ffffff' : '94a3b8'}&size=400`}
                                            />

                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                                            {/* Top badges */}
                                            <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                                                {/* Combo badge OR Category pill */}
                                                {productIsCombo ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg border border-indigo-400">
                                                        <FiLayout size={9} />
                                                        Combo
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/90 backdrop-blur text-slate-700 border border-white/50 shadow-sm truncate max-w-[120px]">
                                                        {product.category || "General"}
                                                    </span>
                                                )}
                                                {/* Right badges container */}
                                                <div className="flex items-center gap-1.5">
                                                    {productIsCombo && comboCount > 0 && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black bg-amber-400 text-white shadow-lg shrink-0">
                                                            <FiPackage size={9} />
                                                            {comboCount} items
                                                        </span>
                                                    )}
                                                    {/* Discount badge */}
                                                    {discount > 0 && (
                                                        <span className="px-2.5 py-1 rounded-xl text-[9px] font-black bg-rose-500 text-white shadow-lg shrink-0">
                                                            -{discount}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover actions */}
                                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                <Link to={`/admin/products/${product.id}`} className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-lg border border-white/50 transition-colors" title="View">
                                                    <FiEye size={15} />
                                                </Link>
                                                {productIsCombo ? (
                                                    <Link to={`/admin/combo/edit/${product.id}`} className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 shadow-lg border border-white/50 transition-colors" title="Edit Combo">
                                                        <FiEdit2 size={15} />
                                                    </Link>
                                                ) : (
                                                    <Link to={`/admin/products/edit/${product.id}`} className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:text-emerald-600 shadow-lg border border-white/50 transition-colors" title="Edit">
                                                        <FiEdit2 size={15} />
                                                    </Link>
                                                )}
                                                <button onClick={() => handleDelete(product.id)} className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-lg border border-white/50 transition-colors" title="Delete">
                                                    <FiTrash2 size={15} />
                                                </button>
                                            </div>

                                            {/* Bottom: Name + Price over image */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h4 className="text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-sm">{product.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-base font-black text-white drop-shadow-sm">
                                                        {price > 0 ? `₹${price.toLocaleString()}` : "—"}
                                                    </span>
                                                    {mrp > 0 && mrp !== price && (
                                                        <span className="text-[10px] text-white/60 line-through font-bold">₹{mrp.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="p-4 flex flex-col gap-3">
                                            {/* SKU + Status row */}
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                                    productIsCombo
                                                        ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                                        : 'text-blue-500 bg-blue-50 border-blue-100'
                                                }`}>
                                                    {product.product_code || `#${product.id}`}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusStyle(product.status)}`}>
                                                    {product.status || "Active"}
                                                </span>
                                            </div>

                                            {/* Combo items info row (only for combos) */}
                                            {productIsCombo && comboCount > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                                    <FiPackage size={12} className="text-indigo-500 shrink-0" />
                                                    <span className="text-[10px] font-black text-indigo-700">
                                                        {comboCount} product{comboCount !== 1 ? 's' : ''} in this combo
                                                    </span>
                                                </div>
                                            )}

                                            {/* Stock bar */}
                                            <div
                                                className="cursor-pointer group/stock"
                                                onClick={() => { setCurrentProduct(product); setNewStock(stock || "0"); }}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Stock</span>
                                                    <span className={`text-[10px] font-black transition-colors underline decoration-dotted ${
                                                        productIsCombo ? 'text-indigo-600 group-hover/stock:text-indigo-800' : 'text-slate-600 group-hover/stock:text-blue-600'
                                                    }`}>{stock} units</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${
                                                        productIsCombo && stock > 0
                                                            ? (stock < 10 ? 'bg-amber-400' : 'bg-indigo-500')
                                                            : stockColor
                                                    } rounded-full transition-all duration-700`} style={{width:`${stockPct}%`}} />
                                                </div>
                                            </div>

                                            {/* Actions row */}
                                            <div className="flex gap-2 pt-1">
                                                <Link
                                                    to={`/admin/products/${product.id}`}
                                                    className="flex-1 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-xl border border-gray-100 hover:border-blue-600 transition-all"
                                                >
                                                    View
                                                </Link>
                                                {productIsCombo ? (
                                                    <Link
                                                        to={`/admin/combo/edit/${product.id}`}
                                                        className="flex-1 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 bg-gray-50 hover:bg-indigo-600 hover:text-white rounded-xl border border-gray-100 hover:border-indigo-600 transition-all"
                                                    >
                                                        Edit
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/admin/products/edit/${product.id}`}
                                                        className="flex-1 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 bg-gray-50 hover:bg-emerald-600 hover:text-white rounded-xl border border-gray-100 hover:border-emerald-600 transition-all"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-gray-50 hover:bg-rose-600 hover:text-white rounded-xl border border-gray-100 hover:border-rose-600 transition-all"
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                {/* Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} Items */}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 transition-all shadow-sm"
                                >
                                    Prev
                                </button>
                                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] md:max-w-none hide-scrollbar">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`min-w-[40px] h-10 rounded-xl text-[10px] font-black transition-all border shrink-0 ${currentPage === i + 1 ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 transition-all shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {currentItems.length === 0 && (
                        <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                                <FiBox size={40} />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Match Found</p>
                            <p className="text-slate-300 font-bold text-[10px] mt-2 italic px-8">"{searchTerm}" did not return any inventory records.</p>
                        </div>
                    )}


                </>
            )}

            {/* QUICK STOCK UPDATE MODAL */}
            {currentProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCurrentProduct(null)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><FiPackage size={80} /></div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight truncate">{currentProduct.name}</h2>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">AJAX Stock Controller</p>
                        </div>

                        <form onSubmit={handleStockUpdate} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Inventory</span>
                                    <span className="text-lg font-black text-slate-800">{currentProduct.total_stock} Units</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Stock Level</label>
                                    <input
                                        autoFocus
                                        type="number"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all text-2xl text-center"
                                        placeholder="0"
                                        value={newStock}
                                        onChange={(e) => setNewStock(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={updatingStock}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                            >
                                {updatingStock ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div> : "Sync Stock Record"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentProduct(null)}
                                className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-slate-800 uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* RAPID PRODUCT ADD MODAL */}
            {isRapidAddOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRapidAddOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><FiBox size={80} /></div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Rapid Addition</h2>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Instant AJAX Listing</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                                        placeholder="e.g. Traditional Silk"
                                        value={rapidProd.name}
                                        onChange={(e) => setRapidProd({ ...rapidProd, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (MRP)</label>
                                    <div className="relative">
                                        <FaRupeeSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                                            placeholder="2999"
                                            value={rapidProd.mrp}
                                            onChange={(e) => setRapidProd({ ...rapidProd, mrp: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={(e) => handleRapidAdd(e, true)}
                                    disabled={rapidSaving}
                                    className="w-full py-5 bg-white border-2 border-blue-100 hover:bg-blue-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    List & Add Another
                                </button>
                                <button
                                    onClick={(e) => handleRapidAdd(e, false)}
                                    disabled={rapidSaving}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                >
                                    {rapidSaving ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div> : "Save & Close"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsRapidAddOpen(false)}
                                className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-slate-800 uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// SVG Helper Components
const FiCheckCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
const FiAlertCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
const FiXCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>

export default AllProducts;
