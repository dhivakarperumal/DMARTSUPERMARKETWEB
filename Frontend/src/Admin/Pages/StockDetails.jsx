import React, { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
    FiBox,
    FiAlertCircle,
    FiTrendingDown,
    FiPackage,
    FiFilter,
    FiSearch,
    FiSave,
    FiPlus,
    FiX,
    FiGrid,
    FiList
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const StockDetails = () => {
    const navigate = useNavigate();
    const { stockCache, setStockCached } = useAdmin();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // UI states
    const [viewMode, setViewMode] = useState("table");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

    const currentCacheKey = JSON.stringify({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
    });
    
    const pageData = stockCache[currentCacheKey];
    const [products, setProducts] = useState(pageData?.products || []);
    const [loading, setLoading] = useState(!pageData);
    const [isSyncing, setIsSyncing] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pagination, setPagination] = useState(pageData?.pagination || { total: 0, totalPages: 1 });
    const [stats, setStats] = useState(pageData?.stats || { total: 0, active: 0, lowStock: 0, outOfStock: 0 });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [updatedVariants, setUpdatedVariants] = useState([]);
    const [manualTotalStock, setManualTotalStock] = useState("0");
    const [isUpdating, setIsUpdating] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);



    const fetchProducts = async () => {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm
        };
        const cacheKey = JSON.stringify(params);
        if (!stockCache[cacheKey]) setLoading(true);

        try {
            const response = await api.get("/products", { params });
            const data = response.data;
            let finalData = {};
 
            if (Array.isArray(data)) {
                finalData = { products: data, pagination: { total: data.length, totalPages: 1 }, stats: { total: 0, active: 0, lowStock: 0, outOfStock: 0 }};
            } else {
                finalData = {
                    products: Array.isArray(data.products) ? data.products : [],
                    pagination: data.pagination || { total: 0, totalPages: 1 },
                    stats: data.stats || { total: 0, active: 0, lowStock: 0, outOfStock: 0 }
                };
            }
            setProducts(finalData.products);
            setPagination(finalData.pagination);
            setStats(finalData.stats);
            setStockCached(prev => ({ ...prev, [cacheKey]: finalData }));
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [currentPage, searchTerm]);

    const handleSync = () => {
        setIsSyncing(true);
        fetchProducts();
    };

    const getStockLevel = (product) => {
        const stock = product.total_stock ?? product.stock ?? 0;
        return stock;
    };

    const getStatusStyle = (status) => {
        let normalizedStatus = status ? status.toLowerCase() : "";
        if (normalizedStatus.includes("out of stock")) return "bg-red-100 text-red-700";
        if (normalizedStatus.includes("low stock")) return "bg-amber-100 text-amber-700";
        if (normalizedStatus.includes("active") || normalizedStatus.includes("in stock")) return "bg-emerald-100 text-emerald-700";
        return "bg-gray-100 text-gray-700";
    };

    const deriveStatus = (stock) => {
        if (stock <= 0) return "Out of Stock";
        if (stock < 10) return "Low Stock";
        return "In Stock";
    };

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
            if (product.thumbnail_image) {
                imgUrl = product.thumbnail_image;
            }
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

    const totalPages = pagination.totalPages;
    let currentItems = products;
    if (showLowStockOnly) {
        currentItems = currentItems.filter(p => getStockLevel(p) < 10);
    }
    if (sortBy === "stockAsc") {
        currentItems = [...currentItems].sort((a, b) => getStockLevel(a) - getStockLevel(b));
    } else if (sortBy === "stockDesc") {
        currentItems = [...currentItems].sort((a, b) => getStockLevel(b) - getStockLevel(a));
    }

    // Reset page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const outOfStockCount = stats.outOfStock;
    const lowStockCount = stats.lowStock;

    const totalInventoryValue = products.reduce((acc, p) => {
        const stock = getStockLevel(p);
        const price = parseFloat(p.offer_price || p.discount_price || p.price || p.mrp || 0);
        return acc + (stock * price);
    }, 0);

    // Modal Handlers
    const openUpdateModal = async (product) => {
        setIsModalOpen(true);
        setSelectedProduct(product);
        setUpdatedVariants(Array.isArray(product.variants) ? product.variants : []);
        setManualTotalStock(product.total_stock?.toString() || "0");
        setFetchingDetail(true);

        try {
            // Fetch full product details to ensure we have complete variant objects
            const res = await api.get(`/products/${product.id}`);
            const fullP = res.data;
            let vars = [];
            if (fullP.variants) {
                vars = typeof fullP.variants === 'string' ? JSON.parse(fullP.variants) : fullP.variants;
            }
            setSelectedProduct(fullP);
            setUpdatedVariants(Array.isArray(vars) ? vars : []);
            setManualTotalStock(fullP.total_stock?.toString() || "0");
        } catch (e) {
            console.error("Failed to fetch full product details", e);
            toast.error("Failed to fetch detailed stock data");
        } finally {
            setFetchingDetail(false);
        }
    };

    const closeUpdateModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setUpdatedVariants([]);
    };

    const handleVariantStockChange = (vIndex, size, value) => {
        const newVars = [...updatedVariants];
        if (!newVars[vIndex].sizesStock) newVars[vIndex].sizesStock = {};
        newVars[vIndex].sizesStock[size] = parseInt(value) || 0;
        setUpdatedVariants(newVars);
    };

    const handleSaveStock = async () => {
        if (!selectedProduct) return;
        setIsUpdating(true);
        try {
            let newTotalStock = 0;
            const vars = Array.isArray(updatedVariants) ? updatedVariants : [];
            const hasVariantsWithSizes = vars.some(v => v.sizesStock && Object.keys(v.sizesStock).length > 0);

            if (hasVariantsWithSizes) {
                vars.forEach(v => {
                    Object.values(v.sizesStock || {}).forEach(qty => {
                        newTotalStock += parseInt(qty) || 0;
                    });
                });
            } else {
                newTotalStock = parseInt(manualTotalStock) || 0;
            }

            const status = newTotalStock <= 0 ? "Out of Stock" : newTotalStock < 10 ? "Low Stock" : "Active";

            const payload = {
                ...selectedProduct,
                total_stock: newTotalStock.toString(),
                status: status,
                variants: vars
            };

            await api.put(`/products/${selectedProduct.id}`, payload);

            setProducts(products.map(p =>
                p.id === selectedProduct.id
                    ? { ...p, total_stock: newTotalStock, variants: vars, status: status }
                    : p
            ));

            toast.success("Stock updated successfully");
            closeUpdateModal();
        } catch (error) {
            console.error("Failed to update stock:", error);
            toast.error("Failed to update stock");
        } finally {
            setIsUpdating(false);
        }
    };



    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />
          

            {/* Stock Alerts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border-2 border-amber-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                        <FiAlertCircle />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Alerts</p>
                        <p className="text-2xl font-black text-slate-800">{lowStockCount} items</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-red-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                        <FiTrendingDown />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out of Stock</p>
                        <p className="text-2xl font-black text-slate-800">{outOfStockCount} items</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                        <FiPackage />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Inventory Value</p>
                        <p className="text-2xl font-black text-slate-800">₹{totalInventoryValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full md:max-w-md group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search sku or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold text-slate-800"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar justify-end">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}
                        >
                            <FiList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}
                        >
                            <FiGrid size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${showLowStockOnly ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-slate-800 hover:bg-white'}`}
                    >
                        <FiFilter /> {showLowStockOnly ? "Showing Low Stock" : "All Inventory"}
                    </button>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 outline-none hover:bg-white transition-all cursor-pointer whitespace-nowrap"
                    >
                        <option value="newest">Newest First</option>
                        <option value="stockAsc">Sort: Stock Low to High</option>
                        <option value="stockDesc">Sort: Stock High to Low</option>
                    </select>
                </div>
                <button
                    onClick={() => navigate('/admin/products/stock/add')}
                    className="flex items-center justify-center gap-2 bg-[#1b7f29] hover:bg-[#166321]  text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                    <FiPlus /> Add Stock
                </button>
            </div>

            {/* Inventory Listing */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold text-sm">Loading stock details...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <FiPackage className="mx-auto text-4xl text-gray-200 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">No stock data found.</p>
                        </div>
                    ) : (
                        currentItems.map((item) => {
                            const stock = getStockLevel(item);
                            const status = item.status && item.status !== "Active" ? item.status : deriveStatus(stock);
                            return (
                                <div key={item.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all flex flex-col">
                                    <div className="aspect-square relative overflow-hidden bg-gray-50 group-hover:scale-[1.02] transition-transform duration-500">
                                        <img
                                            src={getProductImage(item)}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm backdrop-blur-md border border-white/20 ${getStatusStyle(status)}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1 leading-none">{item.product_code || `#SKU-${1000 + item.id}`}</p>
                                            <h4 className="text-sm font-black text-slate-800 leading-tight mt-1 line-clamp-2">{item.name}</h4>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Stock: {stock}</span>
                                            </div>
                                            <button onClick={() => openUpdateModal(item)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                                Quick Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                <div className="overflow-x-auto text-slate-800">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold text-sm">Loading stock details...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse block md:table">
                            <thead className="hidden md:table-header-group">
                                <tr className="bg-[#1b7f29]">
                                    <th className="px-8 py-4 text-xs text-white uppercase tracking-widest leading-none">Product</th>
                                    <th className="px-8 py-4 text-xs text-white uppercase tracking-widest leading-none">Category</th>
                                    <th className="px-8 py-4 text-xs text-white uppercase tracking-widest leading-none">Current Stock</th>
                                    <th className="px-8 py-4 text-xs text-white uppercase tracking-widest leading-none">Status</th>
                                    <th className="px-8 py-4 text-xs text-white uppercase tracking-widest leading-none text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-gray-50 px-3 py-4 md:p-0">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item) => {
                                        const stock = getStockLevel(item);
                                        const status = item.status && item.status !== "Active" ? item.status : deriveStatus(stock);
                                        const minStock = 10; // Threshold for warning

                                        return (
                                            <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                                <td className="px-4 py-5 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex flex-col md:block w-full gap-3 md:gap-0">
                                                        <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-widest">Product</span>
                                                        <div className="flex items-center gap-4 text-left w-full min-w-0">
                                                            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                                                                <img
                                                                    src={getProductImage(item)}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1 md:flex-none">
                                                                <p className="font-bold text-slate-800 text-sm break-words whitespace-normal leading-tight md:truncate md:whitespace-nowrap md:max-w-[200px] lg:max-w-xs">{item.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                                                    {item.product_code || `#SKU-${1000 + item.id}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 md:px-8 md:py-6 text-sm font-bold text-gray-500 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex flex-col md:block w-full gap-3 md:gap-0">
                                                        <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                                                        <span className="text-left block">{item.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex flex-col md:block w-full gap-3 md:gap-0">
                                                        <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-widest">Current Stock</span>
                                                        <div className="flex items-center gap-4 justify-start">
                                                            <span className="font-black text-slate-700 w-8 text-left">{stock}</span>
                                                            <div className="flex-1 w-[120px] md:w-auto md:max-w-[100px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${stock <= 0 ? 'bg-red-500' : stock < minStock ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${Math.min((stock / 50) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex flex-col md:block w-full gap-3 md:gap-0">
                                                        <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                                        <div>
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${getStatusStyle(status)}`}>
                                                                {status === "Out of Stock" && <FiTrendingDown className="w-3 h-3" />}
                                                                {status === "Low Stock" && <FiAlertCircle className="w-3 h-3" />}
                                                                {status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 md:px-8 md:py-6 text-left md:text-right block md:table-cell">
                                                    <div className="flex flex-col md:block w-full gap-3 md:gap-0">
                                                        <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                        <div className="flex items-center justify-start md:justify-end gap-3 w-full">
                                                            <button
                                                                onClick={() => openUpdateModal(item)}
                                                                className="inline-block px-5 py-3.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest text-blue-600 transition-all shadow-sm active:scale-95 md:shadow-none w-full md:w-auto text-center"
                                                            >
                                                                Quick Update
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className="block md:table-row">
                                        <td colSpan="5" className="px-8 py-10 text-center text-gray-400 font-bold block md:table-cell">
                                            No stock data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            )}

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                    <div className="p-8 flex items-center justify-between bg-gray-50/30">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} Stock Records
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all border border-transparent hover:border-gray-100 rounded-lg"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none hide-scrollbar">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-slate-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all border border-transparent hover:border-gray-100 rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock Update Modal */}
            {isModalOpen && selectedProduct && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Quick Stock Update</h3>
                                <p className="text-xs font-bold text-gray-500 mt-1">{selectedProduct.name}</p>
                            </div>
                            <button onClick={closeUpdateModal} className="p-2 bg-white rounded-xl text-gray-400 hover:text-slate-800 hover:bg-gray-100 transition-colors shadow-sm">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {fetchingDetail ? (
                                <div className="py-10 flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs font-bold text-gray-400">Loading variants...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {updatedVariants.length > 0 && updatedVariants.some(v => v.sizesStock && Object.keys(v.sizesStock).length > 0) ? (
                                        // Variant Based Stock
                                        <div className="space-y-4">
                                            {updatedVariants.map((variant, vIndex) => (
                                                <div key={vIndex} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-6 h-6 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: variant.color }}></div>
                                                        <span className="text-sm font-black text-slate-800">{variant.colorName || 'Default Shade'}</span>
                                                    </div>

                                                    {variant.sizesStock && Object.keys(variant.sizesStock).length > 0 ? (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {Object.entries(variant.sizesStock).map(([size, currentQty]) => (
                                                                <div key={size} className="bg-white border border-gray-200 p-3 rounded-xl">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <label className="text-[10px] font-black text-gray-400 uppercase">{size}</label>
                                                                        <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Curr: {currentQty}</span>
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={variant.sizesStock?.[size] ?? currentQty}
                                                                        onChange={(e) => handleVariantStockChange(vIndex, size, e.target.value)}
                                                                        className="w-full text-base font-black text-slate-800 outline-none placeholder:text-gray-300 bg-transparent border-b border-gray-100 focus:border-blue-400 transition-colors pb-1"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 font-medium">No sizes configured for this variant.</p>
                                                    )}
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-400 font-medium text-center bg-blue-50/50 p-3 rounded-xl text-blue-600">
                                                Total stock will be auto-calculated from variants.
                                            </p>
                                        </div>
                                    ) : (
                                        // Manual Total Stock
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Total Available Stock</label>
                                            <div className="relative">
                                                <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={manualTotalStock}
                                                    onChange={(e) => setManualTotalStock(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all text-xl font-black text-slate-800 shadow-sm"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1">Update the master stock count directly.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                            <button
                                onClick={closeUpdateModal}
                                disabled={isUpdating}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStock}
                                disabled={isUpdating || fetchingDetail}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isUpdating ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
                                ) : (
                                    <><FiSave /> Save Details</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

        </div>
    );
};

export default StockDetails;

