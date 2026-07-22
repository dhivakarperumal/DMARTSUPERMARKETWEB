import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiImage,
    FiX,
    FiUploadCloud,
    FiLink,
    FiFileText
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBanner, setCurrentBanner] = useState({
        title: "",
        subtitle: "",
        description: "",
        image: "",
        mobile_image: "",
        link: "",
        type: "hero",
        active: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [mobileUploading, setMobileUploading] = useState(false);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const response = await api.get("/banners");
            setBanners(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching banners:", error);
            toast.error("Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) return;
        try {
            await api.delete(`/banners/${id}`);
            setBanners(banners.filter(b => b.id !== id));
            toast.success("Banner deleted successfully");
        } catch (error) {
            console.error("Error deleting banner:", error);
            toast.error("Failed to delete banner");
        }
    };

    const handleOpenModal = (banner = { title: "", subtitle: "", description: "", image: "", mobile_image: "", link: "", type: "hero", active: true }) => {
        setCurrentBanner(banner);
        setIsEditing(!!banner.id);
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e, isMobile = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image too large! Max 10MB.");
            return;
        }

        if (isMobile) setMobileUploading(true);
        else setUploading(true);

        // Compress image using canvas before storing as base64
        const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        let width = img.width;
                        let height = img.height;
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", quality));
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            });
        };

        try {
            const compressed = await compressImage(file, isMobile ? 800 : 1400, 0.75);
            if (isMobile) {
                setCurrentBanner(prev => ({ ...prev, mobile_image: compressed }));
                setMobileUploading(false);
            } else {
                setCurrentBanner(prev => ({ ...prev, image: compressed }));
                setUploading(false);
            }
            toast.success(`${isMobile ? 'Mobile' : 'Desktop'} image ready!`);
        } catch (err) {
            toast.error("Failed to process image.");
            if (isMobile) setMobileUploading(false);
            else setUploading(false);
        }
    };

    const handleSubmit = async (e, shouldContinue = false) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/banners/${currentBanner.id}`, currentBanner);
                toast.success("Banner updated successfully");
            } else {
                await api.post("/banners", currentBanner);
                toast.success("Banner added successfully");
            }
            fetchBanners();

            if (shouldContinue && !isEditing) {
                // Reset form for next entry
                setCurrentBanner({
                    title: "",
                    subtitle: "",
                    description: "",
                    image: "",
                    mobile_image: "",
                    link: "",
                    type: currentBanner.type, // Keep the same type for convenience
                    active: true
                });
                toast.success("Ready for next banner!");
            } else {
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error saving banner:", error);
            toast.error("Failed to save banner");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[600px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>

                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <FiPlus /> New Promotion
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-slate-800">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold">Synchronizing studio assets...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                    <div className="p-6 border-b border-gray-50">
                        <div className="relative max-w-md">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter banners by title..."
                                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto hide-scrollbar">
                        <table className="w-full text-left border-collapse block md:table">
                            <thead className="hidden md:table-header-group">
                                <tr className="bg-[#1b7f29]">
                                    <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Visual Assets</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Promotion Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Configuration</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-gray-50 text-slate-800 px-3 py-4 md:p-0">
                                {banners
                                    .filter(b => (b.title || "").toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((banner) => (
                                        <tr key={banner.id} className="hover:bg-indigo-50/30 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual Assets</span>
                                                    <div className="flex items-center gap-3 justify-end md:justify-start">
                                                        <div className="relative w-20 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 shadow-sm">
                                                            <img src={banner.image} className="w-full h-full object-cover" alt="" />
                                                            <div className="absolute top-0.5 right-0.5 bg-white/90 text-[7px] px-1 rounded font-black uppercase tracking-tighter shadow-sm border border-gray-100">D</div>
                                                        </div>
                                                        {banner.mobile_image && (
                                                            <div className="relative w-8 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 shadow-sm">
                                                                <img src={banner.mobile_image} className="w-full h-full object-cover" alt="" />
                                                                <div className="absolute top-0.5 right-0.5 bg-white/90 text-[7px] px-1 rounded font-black uppercase tracking-tighter shadow-sm border border-gray-100">M</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion Details</span>
                                                    <div className="flex flex-col gap-0.5 text-right md:text-left">
                                                        <p className="text-sm font-black text-slate-800 truncate max-w-[200px]">{banner.title}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold truncate max-w-[180px]">{banner.subtitle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</span>
                                                    <div className="flex flex-col gap-1 items-end md:items-start">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block w-fit ${banner.type === 'hero' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {banner.type} Section
                                                        </span>
                                                        <div className="flex items-center gap-1.5 md:ml-1 mt-1 md:mt-0">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${banner.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{banner.active ? 'Published' : 'Draft'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell text-right md:text-right">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(banner)}
                                                            className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm md:shadow-none"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(banner.id)}
                                                            className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm md:shadow-none"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {banners.filter(b => (b.title || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                            <div className="text-center py-20">
                                <FiImage className="mx-auto text-gray-200 mb-4" size={48} />
                                <p className="text-gray-400 font-bold tracking-tight">No creative banners discovered.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
                    <div
                        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                    <FiImage size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none">
                                        {isEditing ? "Refine Creation" : "New Promotion"}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 leading-none">Banner Studio</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-3 bg-white border border-gray-100 rounded-2xl transition-all text-gray-400 hover:text-red-500 hover:shadow-lg shadow-sm"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Visual Asset Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Media Assets</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Desktop Asset */}
                                    <div className="relative border-2 border-dashed rounded-[2rem] p-4 transition-all group border-gray-200 hover:border-indigo-500/50 bg-gray-50/30 overflow-hidden min-h-[160px] flex flex-col items-center justify-center text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, false)}
                                            required={!isEditing}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        {currentBanner.image ? (
                                            <div className="absolute inset-0">
                                                <img src={currentBanner.image} className="w-full h-full object-cover" alt="Desktop Preview" />
                                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <FiUploadCloud size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <FiUploadCloud size={24} className="text-gray-300" />
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Desktop Visual</p>
                                            </div>
                                        )}
                                        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                        <div className="absolute top-3 left-3 bg-white/90 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm border border-gray-100">Desktop</div>
                                    </div>

                                    {/* Mobile Asset */}
                                    <div className="relative border-2 border-dashed rounded-[2rem] p-4 transition-all group border-gray-200 hover:border-indigo-500/50 bg-gray-50/30 overflow-hidden min-h-[160px] flex flex-col items-center justify-center text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, true)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        {currentBanner.mobile_image ? (
                                            <div className="absolute inset-0">
                                                <img src={currentBanner.mobile_image} className="w-full h-full object-cover" alt="Mobile Preview" />
                                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <FiUploadCloud size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <FiUploadCloud size={24} className="text-gray-300" />
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Mobile Visual</p>
                                            </div>
                                        )}
                                        {mobileUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                        <div className="absolute top-3 left-3 bg-white/90 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm border border-gray-100">Mobile</div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Headline</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 font-bold shadow-inner text-sm"
                                            placeholder="Catchy main title"
                                            value={currentBanner.title}
                                            onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Captivating Subtitle</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 font-bold shadow-inner text-sm"
                                            placeholder="Supporting tag line"
                                            value={currentBanner.subtitle}
                                            onChange={(e) => setCurrentBanner({ ...currentBanner, subtitle: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Detailed Description</label>
                                    <div className="relative">
                                        <FiFileText className="absolute left-6 top-5 text-gray-400" />
                                        <textarea
                                            rows="3"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 font-bold shadow-inner text-sm resize-none hide-scrollbar"
                                            placeholder="Describe the offer or collection details..."
                                            value={currentBanner.description}
                                            onChange={(e) => setCurrentBanner({ ...currentBanner, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Action Destination (Link)</label>
                                    <div className="relative">
                                        <FiLink className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 font-bold shadow-inner text-sm"
                                            placeholder="e.g. /shop or https://..."
                                            value={currentBanner.link}
                                            onChange={(e) => setCurrentBanner({ ...currentBanner, link: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Configuration Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Target Section</label>
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentBanner({ ...currentBanner, type: 'hero' })}
                                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentBanner.type === 'hero' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                            >
                                                Hero Sec
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentBanner({ ...currentBanner, type: 'offer' })}
                                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentBanner.type === 'offer' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                            >
                                                Offers
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Visibility</label>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentBanner({ ...currentBanner, active: !currentBanner.active })}
                                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${currentBanner.active ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${currentBanner.active ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            {currentBanner.active ? 'Published on Website' : 'Held as Draft'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                {!isEditing && (
                                    <button
                                        type="button"
                                        disabled={uploading || mobileUploading || !currentBanner.image}
                                        onClick={(e) => handleSubmit(e, true)}
                                        className={`flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 active:scale-[0.98] ${uploading || mobileUploading || !currentBanner.image ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200'}`}
                                    >
                                        Save & Add Another
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={uploading || mobileUploading || !currentBanner.image}
                                    className={`flex-[1.5] py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-[0.98] ${uploading || mobileUploading || !currentBanner.image ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white shadow-slate-300'}`}
                                >
                                    {uploading || mobileUploading ? "Processing..." : isEditing ? "Save Changes" : "Save & Close"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default BannerManagement;
