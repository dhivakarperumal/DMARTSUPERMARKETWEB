import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import api from "../../api";
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiMoreVertical,
    FiX,
    FiImage,
    FiUploadCloud,
    FiSearch,
    FiGrid,
    FiList,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiEyeOff,
    FiSliders
} from "react-icons/fi";
import imageCompression from "browser-image-compression";
import { toast, Toaster } from "react-hot-toast";

const Category = () => {
    // ---- Global State ----
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get("/categories");
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    // ---- View & Pagination State ----
    const [viewMode, setViewMode] = useState("table"); // "grid" or "table"
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // ---- Modal State ----
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        catId: "",
        name: "",
        description: "",
        subcategory: "",
        image: "",
        show_in_navbar: true
    });

    // ---- Navbar Visibility Popup ----
    const [navbarPopupOpen, setNavbarPopupOpen] = useState(false);
    const [navbarChecked, setNavbarChecked] = useState({});  // { catId: true/false }
    const [navbarSaving, setNavbarSaving] = useState(false);

    const openNavbarPopup = () => {
        // Initialise checkboxes from current categories state
        const initial = {};
        categories.forEach(c => { initial[c.catId] = c.show_in_navbar !== false; });
        setNavbarChecked(initial);
        setNavbarPopupOpen(true);
    };

    const saveNavbarVisibility = async () => {
        setNavbarSaving(true);
        try {
            const visibleIds = Object.entries(navbarChecked)
                .filter(([, v]) => v)
                .map(([k]) => k);
            await api.patch("/categories/navbar", { catIds: visibleIds });
            // Reflect in local state so UI is immediately consistent
            setCategories(prev => prev.map(c => ({ ...c, show_in_navbar: navbarChecked[c.catId] !== false })));
            toast.success("Navbar visibility saved!");
            setNavbarPopupOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save navbar settings.");
        } finally {
            setNavbarSaving(false);
        }
    };

    // Subcategories Multiple Input Logic
    const [subcategories, setSubcategories] = useState([]);
    const [subInput, setSubInput] = useState("");

    // ---- Derived Data (Search & Pagination) ----
    const filteredCategories = useMemo(() => {
        const q = String(searchQuery || "").toLowerCase();
        return categories.filter(cat => {
            const name = String(cat?.name || "").toLowerCase();
            const catId = String(cat?.catId || "").toLowerCase();
            return name.includes(q) || catId.includes(q);
        });
    }, [categories, searchQuery]);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
    const currentCategories = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ---- Event Handlers ----
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const addSubcategory = () => {
        const value = subInput.trim();
        if (!value) return;
        if (!subcategories.includes(value)) {
            setSubcategories([...subcategories, value]);
        }
        setSubInput("");
    };

    const handleAddSubcategory = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubcategory();
        }
    };

    const removeSubcategory = (subToRemove) => {
        setSubcategories(subcategories.filter(sub => sub !== subToRemove));
    };

    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    // Image Upload with Compression
    const handleImageUpload = async (e) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only JPG, PNG, and WEBP images are allowed.");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be 5MB or smaller.");
                return;
            }

            // Aggressively compress to avoid max_allowed_packet limits
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.5,  // Reduced from 5MB to 500KB
                maxWidthOrHeight: 800,  // Reduced from 1200 to 800px
                useWebWorker: true,
                fileType: "image/jpeg",  // Force JPEG for better compression
                initialQuality: 0.7,  // Reduce quality
            });

            const imageUrl = await imageCompression.getDataUrlFromFile(compressed);
            
            // Warn if base64 is still large
            if (imageUrl.length > 2 * 1024 * 1024) {
                toast.warning("Image is still large, compression may take a moment");
            }

            setFormData((p) => ({
                ...p,
                image: imageUrl,
            }));
            toast.success("Category image added!");
        } catch (error) {
            console.error("Image upload failed:", error);
            toast.error("Image upload failed");
        }
    };

    const removeImage = () => {
        setFormData(p => ({
            ...p,
            image: ""
        }));
    };

    // Submitting the Form
    const handleSaveCategory = async () => {
        if (!formData.catId || !formData.name || !formData.image) {
            toast.error("Please fill category name and image before saving.");
            return;
        }

        const newCatData = {
            catId: formData.catId,
            name: formData.name,
            description: formData.description,
            subcategory: subcategories,
            images: formData.image ? [formData.image] : [],
            show_in_navbar: formData.show_in_navbar
        };

        try {
            if (isEditing) {
                await api.put(`/categories/${formData.catId}`, newCatData);
                setCategories(categories.map(cat =>
                    cat.catId === formData.catId ? { ...newCatData, id: cat.id } : cat
                ));
            } else {
                const response = await api.post("/categories", newCatData);
                // Add to the beginning of the list for immediate visibility
                setCategories([{ ...newCatData, id: response.data.id }, ...categories]);
                toast.success("Category created successfully!");
            }
            setIsModalOpen(false);
            resetModalForm();
        } catch (error) {
            console.error("Failed to save category:", error);
            toast.error(error.response?.data?.message || "Failed to save category.");
        }
    };

    const handleDeleteCategory = async (catIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await api.delete(`/categories/${catIdToDelete}`);
                setCategories(categories.filter(cat => cat.catId !== catIdToDelete));

                // Adjust pagination if deleted last item on page
                if (currentCategories.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } catch (error) {
                console.error("Failed to delete category:", error);
                alert("Failed to delete category.");
            }
        }
    };

    const resetModalForm = () => {
        setFormData({ catId: "", name: "", description: "", subcategory: "", image: "", show_in_navbar: true });
        setSubcategories([]);
        setIsEditing(false);
    };

    const openAddModal = () => {
        let nextId = "CAT001";
        if (categories.length > 0) {
            const existingIds = categories.map(c => {
                const match = c.catId.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            });
            const maxId = Math.max(...existingIds);
            nextId = `CAT${String(maxId + 1).padStart(3, '0')}`;
        }
        resetModalForm();
        setFormData(prev => ({ ...prev, catId: nextId }));
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setFormData({
            catId: category.catId,
            name: category.name,
            description: category.description,
            subcategory: "",
            image: Array.isArray(category.images) ? category.images[0] || "" : category.images || "",
            show_in_navbar: category.show_in_navbar !== false
        });
        setSubcategories(category.subcategory || []);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    // ---- Renderers ----
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />
            {/* Header Section */}
            <div className="bg-white flex items-center justify-between rounded-[2rem] border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center">
                <div>
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-white border border-gray-200 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* View Toggles */}
                    <div className="flex items-center bg-gray-100 p-2 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiGrid />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiList />
                        </button>
                    </div>

                    {/* Manage Navbar Button */}
                    <button
                        onClick={openNavbarPopup}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-5 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        <FiSliders className="text-lg" /> Manage Navbar
                    </button>

                    {/* Add Button */}
                    <button
                        onClick={openAddModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1b7f29] hover:bg-[#166321] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <FiPlus className="text-lg" /> New Category
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-slate-800">Loading Categories</h3>
                    <p className="text-gray-500 mt-2">Please wait while we fetch your catalog.</p>
                </div>
            ) : currentCategories.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <FiSearch className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No categories found</h3>
                    <p className="text-gray-500 mt-2">We couldn't find anything matching your search query.</p>
                </div>
            ) : (
                <>
                    {/* GRID VIEW */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {currentCategories.map((cat) => (
                                <div key={cat.catId} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white bg-gray-100 flex items-center justify-center relative shrink-0">
                                            {cat.images && cat.images.length > 0 ? (
                                                <img src={Array.isArray(cat.images) ? cat.images[0] : cat.images} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FiImage className="text-gray-400 text-2xl" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase px-2 py-1 rounded-lg">
                                                {cat.catId}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{cat.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4 line-clamp-2">
                                            {cat.description || "No description provided."}
                                        </p>

                                        {cat.subcategory && cat.subcategory.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {cat.subcategory.slice(0, 3).map((sub, i) => (
                                                        <span key={i} className="inline-block bg-gray-50 text-gray-600 border border-gray-100 text-xs px-2 py-1 rounded-md font-medium">
                                                            {sub}
                                                        </span>
                                                    ))}
                                                    {cat.subcategory.length > 3 && (
                                                        <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md font-bold">
                                                            +{cat.subcategory.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-2 relative z-10 shrink-0">
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiEdit2 /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.catId)}
                                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm transition-all"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TABLE VIEW */}
                    {viewMode === "table" && (
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse block md:table">
                                    <thead className="hidden md:table-header-group">
                                        <tr className="bg-[#1b7f29] text-white text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                                            <th className="px-6 py-4">S No</th>
                                            <th className="px-6 py-4">Cat ID</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Image</th>
                                            <th className="px-6 py-4">Subcategories</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group divide-y divide-gray-100 px-3 py-4 md:p-0">
                                        {currentCategories.map((cat, ind) => (
                                            <tr key={cat.catId} className="hover:bg-blue-50/10 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                                {/* S No */}
                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex md:block items-center justify-between w-full">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">S No</span>
                                                        <span className="text-sm font-bold text-gray-500">
                                                            {(currentPage - 1) * itemsPerPage + ind + 1}
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Cat ID */}
                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex md:block items-center justify-between w-full">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Cat ID</span>
                                                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase px-2.5 py-1.5 rounded-lg">
                                                            {cat.catId}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex md:block items-center justify-between w-full">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</span>
                                                        <span className="bg-blue-50 text-gray-900 text-[10px] font-black tracking-wider uppercase px-2.5 py-1.5 rounded-lg">
                                                            {cat.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex md:block items-center justify-between w-full">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Image</span>
                                                        <div className="flex items-center gap-4 text-right md:text-left">
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                                                {cat.images && cat.images.length > 0 ? (
                                                                    <img src={Array.isArray(cat.images) ? cat.images[0] : cat.images} alt={cat.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <FiImage className="text-gray-400 text-xl" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top block md:table-cell border-b border-gray-50 md:border-b-0">
                                                    <div className="flex md:block flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest w-full">Subcategories</span>
                                                        <div className="flex flex-wrap gap-1.5 max-w-[250px] justify-start mt-2 md:mt-0">
                                                            {cat.subcategory && cat.subcategory.length > 0 ? (
                                                                <>
                                                                    {cat.subcategory.slice(0, 3).map((sub, i) => (
                                                                        <span key={i} className="inline-block bg-gray-50 border border-gray-200 text-gray-900 text-[10px] px-2 py-1 rounded">
                                                                            {sub}
                                                                        </span>
                                                                    ))}
                                                                    {cat.subcategory.length > 3 && (
                                                                        <span className="inline-block bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded font-bold">
                                                                            +{cat.subcategory.length - 3}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 md:px-6 md:py-4 align-top text-right block md:table-cell">
                                                    <div className="flex md:block items-center justify-between w-full">
                                                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                        <div className="flex items-center justify-end gap-2 transition-opacity">
                                                            <button
                                                                onClick={() => openEditModal(cat)}
                                                                className="p-2 text-gray-900 border border-gray-200 bg-gray-30 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 />
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteCategory(cat.catId)}
                                                                className="p-2 text-gray-900 border border-gray-200 bg-gray-30 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm mt-6">
                            <span className="text-sm font-medium text-gray-500">
                                Showing <span className="text-slate-800 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800 font-bold">{Math.min(currentPage * itemsPerPage, filteredCategories.length)}</span> of <span className="text-slate-800 font-bold">{filteredCategories.length}</span> categories
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronLeft />
                                </button>
                                <span className="text-sm font-bold text-slate-800 px-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Category Modal */}
            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {isEditing ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                {isEditing && <p className="text-xs text-gray-500 mt-1">Editing ID: <span className="font-bold">{formData.catId}</span></p>}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Inputs */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category ID (Auto Generated)</label>
                                        <input
                                            type="text"
                                            name="catId"
                                            value={formData.catId}
                                            readOnly
                                            className="w-full bg-gray-100 border border-gray-200 text-slate-500 font-medium rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter category name"
                                            className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Enter category description"
                                            rows="4"
                                            className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    
                                    {/* Toggle: Show in Navbar */}
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">Show in Navbar</h4>
                                            <p className="text-xs text-gray-500">Toggle to display this category in the main navigation menu.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="show_in_navbar"
                                                className="sr-only peer"
                                                checked={formData.show_in_navbar}
                                                onChange={handleInputChange}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column: Advanced */}
                                <div className="space-y-5">
                                    {/* Multiple Subcategories Input */}
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                            <span>Subcategories</span>
                                            <span className="text-[10px] text-gray-400 lowercase font-normal">Press enter to add</span>
                                        </label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[140px] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {subcategories.map((sub, idx) => (
                                                    <span key={idx} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                                        {sub}
                                                        <button
                                                            onClick={() => removeSubcategory(sub)}
                                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={subInput}
                                                    onChange={(e) => setSubInput(e.target.value)}
                                                    onKeyDown={handleAddSubcategory}
                                                    placeholder={subcategories.length === 0 ? "Type and press Enter..." : "Add another..."}
                                                    className="flex-1 bg-transparent border-none outline-none text-slate-800 px-1 py-1 text-sm placeholder:text-gray-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addSubcategory}
                                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 text-white px-3 py-2 text-xs font-semibold hover:bg-blue-700 transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Dropzone */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category Image *</label>

                                        {formData.image ? (
                                            <div className="relative w-full h-44 rounded-3xl overflow-hidden shadow-sm border border-gray-200 mb-3">
                                                <img src={formData.image} alt="Category" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-3 right-3 p-2 bg-white/95 hover:bg-red-50 text-red-500 rounded-full transition-all shadow-sm"
                                                >
                                                    <FiX className="text-sm" />
                                                </button>
                                            </div>
                                        ) : null}

                                        <label className="relative border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 rounded-3xl overflow-hidden transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center min-h-[160px]">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mb-3 text-blue-500 border border-gray-100">
                                                <FiUploadCloud className="text-xl" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Upload category image</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP • Max 5MB</p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                disabled={!formData.name || !formData.image}
                                className="px-8 py-3 bg-[#1b7f29] hover:bg-[#166321] disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                            >
                                {isEditing ? 'Update Category' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* ─── Manage Navbar Visibility Popup ─── */}
            {navbarPopupOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FiSliders className="text-indigo-500" /> Manage Navbar Categories
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">✅ Checked categories appear in the navbar • ☐ Unchecked are hidden</p>
                            </div>
                            <button onClick={() => setNavbarPopupOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        {/* Select All / Deselect All */}
                        <div className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {Object.values(navbarChecked).filter(Boolean).length} of {categories.length} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const all = {};
                                        categories.forEach(c => { all[c.catId] = true; });
                                        setNavbarChecked(all);
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                >Select All</button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => {
                                        const none = {};
                                        categories.forEach(c => { none[c.catId] = false; });
                                        setNavbarChecked(none);
                                    }}
                                    className="text-xs font-bold text-red-400 hover:underline"
                                >Deselect All</button>
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-2">
                            {categories.map((cat) => {
                                const checked = navbarChecked[cat.catId] !== false;
                                return (
                                    <label
                                        key={cat.catId}
                                        className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                                            checked
                                                ? 'border-indigo-400 bg-indigo-50'
                                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                    >
                                        {/* Category image thumbnail */}
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                                            {cat.images && cat.images.length > 0 ? (
                                                <img src={Array.isArray(cat.images) ? cat.images[0] : cat.images} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FiImage className="text-gray-400" />
                                            )}
                                        </div>

                                        {/* Name + ID */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{cat.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.catId}</p>
                                        </div>

                                        {/* Visibility icon */}
                                        <span className={`shrink-0 ${checked ? 'text-indigo-500' : 'text-gray-300'}`}>
                                            {checked ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                                        </span>

                                        {/* Checkbox (hidden, label handles click) */}
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => setNavbarChecked(prev => ({ ...prev, [cat.catId]: e.target.checked }))}
                                            className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer shrink-0"
                                        />
                                    </label>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setNavbarPopupOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNavbarVisibility}
                                disabled={navbarSaving}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-2"
                            >
                                {navbarSaving ? (
                                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                                ) : (
                                    <><FiEye size={15} /> Save Navbar Settings</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default Category;
