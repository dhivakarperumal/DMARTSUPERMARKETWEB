import React, { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiVideo,
    FiX,
    FiPlay,
    FiUploadCloud,
    FiList,
    FiGrid
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const VideoManagement = () => {
    const { videosCache, setVideosCache } = useAdmin();
    const { user } = useAuth();
    const [videos, setVideos] = useState(videosCache || []);
    const [loading, setLoading] = useState(!videosCache);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('table');
    const [filterType, setFilterType] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newVideo, setNewVideo] = useState({ 
        title: "", 
        videoId: "", 
        videoFile: null,
        thumbnailFile: null,
        type: "youtube" 
    });
    const [editingVideo, setEditingVideo] = useState({ 
        title: "", 
        videoId: "", 
        videoFile: null,
        thumbnailFile: null,
        type: "youtube" 
    });
    const [uploading, setUploading] = useState(false);
    const [thumbUploading, setThumbUploading] = useState(false);

    const fetchVideos = async () => {
        if (!videosCache) setLoading(true);
        try {
            const response = await api.get("/videos");
            const data = Array.isArray(response.data) ? response.data : [];
            setVideos(data);
            setVideosCache(data);
        } catch (error) {
            console.error("Error fetching videos:", error);
            toast.error("Failed to load videos");
            setVideos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const filteredVideos = videos.filter(v => {
        const matchesSearch = (v.title || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' ? true : (filterType === 'youtube' ? v.type === 'youtube' : v.type === 'custom');
        return matchesSearch && matchesType;
    });

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this video?")) return;
        try {
            await api.delete(`/videos/${id}`);
            setVideos(videos.filter(v => v.id !== id));
            toast.success("Video deleted successfully");
        } catch (error) {
            console.error("Error deleting video:", error);
            toast.error("Failed to delete video");
        }
    };

    const handleOpenAddModal = () => {
        setNewVideo({ title: "", videoId: "", videoFile: null, thumbnailFile: null, type: "youtube" });
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (video) => {
        setEditingVideo(video);
        setIsEditModalOpen(true);
    };

    const handleFileUploadAdd = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024 * 1024) {
            toast.error("File is too large! Max 500MB.");
            return;
        }

        setUploading(true);
        setNewVideo({ ...newVideo, videoFile: file, type: "custom" });
        setUploading(false);
        toast.success("Video file selected!");
    };

    const handleFileUploadEdit = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024 * 1024) {
            toast.error("File is too large! Max 500MB.");
            return;
        }

        setUploading(true);
        setEditingVideo({ ...editingVideo, videoFile: file });
        setUploading(false);
        toast.success("Video file selected!");
    };

    const handleThumbnailUploadAdd = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Thumbnail too large! Max 5MB.");
            return;
        }

        setThumbUploading(true);
        setNewVideo({ ...newVideo, thumbnailFile: file });
        setThumbUploading(false);
        toast.success("Thumbnail selected!");
    };

    const handleThumbnailUploadEdit = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Thumbnail too large! Max 5MB.");
            return;
        }

        setThumbUploading(true);
        setEditingVideo({ ...editingVideo, thumbnailFile: file });
        setThumbUploading(false);
        toast.success("Thumbnail selected!");
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", newVideo.title);
            formData.append("type", newVideo.type);
            formData.append("created_by", user?.user_id);

            if (newVideo.type === "youtube") {
                formData.append("videoId", newVideo.videoId);
            } else if (newVideo.type === "custom" && newVideo.videoFile) {
                formData.append("video", newVideo.videoFile);
            }

            if (newVideo.thumbnailFile) {
                formData.append("thumbnail", newVideo.thumbnailFile);
            }

            await api.post("/videos", formData);
            toast.success("Video added successfully");
            fetchVideos();
            setIsAddModalOpen(false);
            setNewVideo({ title: "", videoId: "", videoFile: null, thumbnailFile: null, type: "youtube" });
        } catch (error) {
            console.error("Error adding video:", error);
            toast.error(error.response?.data?.message || "Failed to add video");
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", editingVideo.title);
            formData.append("type", editingVideo.type);
            formData.append("updated_by", user?.user_id);

            if (editingVideo.type === "youtube") {
                formData.append("videoId", editingVideo.videoId);
            } else if (editingVideo.type === "custom" && editingVideo.videoFile) {
                formData.append("video", editingVideo.videoFile);
            }

            if (editingVideo.thumbnailFile) {
                formData.append("thumbnail", editingVideo.thumbnailFile);
            }

            await api.put(`/videos/${editingVideo.id}`, formData);
            toast.success("Video updated successfully");
            fetchVideos();
            setIsEditModalOpen(false);
            setEditingVideo({ title: "", videoId: "", videoFile: null, thumbnailFile: null, type: "youtube" });
        } catch (error) {
            console.error("Error updating video:", error);
            toast.error(error.response?.data?.message || "Failed to update video");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[600px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search videos by title..."
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* filter moved to right-side controls */}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm"
                        aria-label="Filter videos"
                    >
                        <option value="all">All</option>
                        <option value="youtube">YouTube</option>
                        <option value="custom">Uploaded</option>
                    </select>

                    <button
                        onClick={() => setViewMode('table')}
                        aria-label="Table view"
                        className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <FiList />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        aria-label="Card view"
                        className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <FiGrid />
                    </button>

                    <button
                        onClick={() => handleOpenAddModal()}
                        className="flex items-center justify-center gap-2 bg-[#1b7f29] hover:bg-[#166321]  text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <FiPlus />Add New Video
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <FiVideo className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-black tracking-widest">Total Videos</div>
                            <div className="text-2xl font-extrabold text-slate-800">{videos.length}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FiPlay className="text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-black tracking-widest">Active Videos</div>
                            <div className="text-2xl font-extrabold text-slate-800">{videos.filter(v => v.videoPath || v.videoId).length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-slate-800">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold">Loading videos...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                        <div />
                    </div>

                    <div className="overflow-x-auto">
                        {viewMode === 'table' ? (
                            <table className="w-full text-left border-collapse block md:table">
                                <thead className="hidden md:table-header-group">
                                    <tr className="bg-[#1b7f29]">
                                        <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Preview</th>
                                        <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Source</th>
                                        <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="block md:table-row-group divide-y divide-gray-50 text-slate-800 px-3 py-4 md:p-0">
                                    {filteredVideos.map((video) => (
                                        <tr key={video.id} className="hover:bg-blue-50/30 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview</span>
                                                    <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 hover:shadow-md transition-shadow">
                                                        {video.thumbnailUrl ? (
                                                            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : video.type === 'youtube' ? (
                                                            <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                                <FiVideo className="text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <FiPlay className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</span>
                                                    <p className="text-sm font-bold text-slate-800 text-right md:text-left">{video.title}</p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</span>
                                                    <div className="flex flex-col gap-1 items-end md:items-start">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block w-fit ${video.type === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {video.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[150px] text-right md:text-left">
                                                            {video.type === 'youtube' ? video.videoId : 'Uploaded File'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell text-right md:text-right">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleOpenEditModal(video)} className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm md:shadow-none" title="Edit"><FiEdit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(video.id)} className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm md:shadow-none" title="Delete"><FiTrash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                                {filteredVideos.map((video) => (
                                    <div key={video.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col">
                                        <div className="relative w-full h-44 rounded-lg overflow-hidden bg-gray-100 mb-4">
                                            {video.thumbnailUrl ? (
                                                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                            ) : video.type === 'youtube' ? (
                                                <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                    <FiVideo className="text-slate-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <FiPlay className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-2">{video.title}</h4>
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${video.type === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{video.type}</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenEditModal(video)} className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"><FiEdit2 /></button>
                                                    <button onClick={() => handleDelete(video.id)} className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><FiTrash2 /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredVideos.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 font-bold">No videos found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD VIDEO MODAL */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 px-4">
                    <div
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                    <FiPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none">
                                        Add New Video
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 leading-none">Media Studio</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-3 bg-white border border-gray-100 rounded-2xl transition-all text-gray-400 hover:text-red-500 hover:shadow-lg shadow-sm"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAdd} className="p-8 space-y-8">
                            <div className="space-y-6">
                                {/* Title Input */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-bold shadow-inner"
                                        placeholder="e.g. Fresh Arrivals Showcase"
                                        value={newVideo.title}
                                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                    />
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cover Thumbnail (Optional)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailUploadAdd}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`p-4 rounded-3xl border-2 border-dashed transition-all flex items-center gap-4 ${newVideo.thumbnailFile ? 'border-blue-500/30 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 group-hover:border-blue-200'}`}>
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border border-gray-100">
                                                {newVideo.thumbnailFile ? (
                                                    <img src={URL.createObjectURL(newVideo.thumbnailFile)} className="w-full h-full object-cover" alt="Preview" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FiUploadCloud size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-slate-800">{newVideo.thumbnailFile ? newVideo.thumbnailFile.name : "Upload Custom Cover"}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">PNG • JPG • WEBP (MAX 5MB)</p>
                                            </div>
                                            {thumbUploading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Source Toggle */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video Source</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setNewVideo({ ...newVideo, type: 'youtube', videoId: '' })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${newVideo.type === 'youtube' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                        >
                                            YouTube
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewVideo({ ...newVideo, type: 'custom' })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${newVideo.type === 'custom' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                        >
                                            Upload File
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Input Based on Type */}
                                {newVideo.type === 'youtube' ? (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">YouTube Video ID</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 transition-all text-slate-800 font-bold shadow-inner"
                                                placeholder="e.g. tgbNymZ7vqY"
                                                value={newVideo.videoId}
                                                onChange={(e) => setNewVideo({ ...newVideo, videoId: e.target.value })}
                                            />
                                            {newVideo.videoId && !newVideo.thumbnailFile && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100/50 flex items-center gap-3">
                                                    <img src={`https://img.youtube.com/vi/${newVideo.videoId}/maxresdefault.jpg`} className="w-16 h-10 object-cover rounded-lg" onError={(e) => e.target.src = 'https://via.placeholder.com/160x90?text=Wait...'} />
                                                    <p className="text-[9px] text-red-600 font-bold leading-relaxed">Preview detected! We'll use the YouTube cover unless you upload a custom one.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video File</label>
                                        <div className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all group ${newVideo.videoFile ? 'border-emerald-500/50 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-500/50 bg-gray-50/30'}`}>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleFileUploadAdd}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${newVideo.videoFile ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-white text-gray-400 shadow-lg shadow-gray-200/50'}`}>
                                                    {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiUploadCloud size={32} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{newVideo.videoFile ? newVideo.videoFile.name : 'Choose Video File'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">MP4 / MOV / WEBM (MAX 500MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || thumbUploading || !newVideo.title || (newVideo.type === 'youtube' && !newVideo.videoId) || (newVideo.type === 'custom' && !newVideo.videoFile)}
                                className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] ${uploading || thumbUploading || !newVideo.title || (newVideo.type === 'youtube' && !newVideo.videoId) || (newVideo.type === 'custom' && !newVideo.videoFile) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white shadow-slate-200'}`}
                            >
                                {uploading || thumbUploading ? "Processing Media..." : "Launch Showcase"}
                            </button>
                        </form>
                    </div>
                </div>
            , document.body)}

            {/* EDIT VIDEO MODAL */}
            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 px-4">
                    <div
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-500/20">
                                    <FiEdit2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none">
                                        Edit Video
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 leading-none">Media Studio</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-3 bg-white border border-gray-100 rounded-2xl transition-all text-gray-400 hover:text-red-500 hover:shadow-lg shadow-sm"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitEdit} className="p-8 space-y-8">
                            <div className="space-y-6">
                                {/* Title Input */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-bold shadow-inner"
                                        placeholder="e.g. Fresh Arrivals Showcase"
                                        value={editingVideo.title}
                                        onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                    />
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cover Thumbnail (Optional)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailUploadEdit}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`p-4 rounded-3xl border-2 border-dashed transition-all flex items-center gap-4 ${editingVideo.thumbnailFile ? 'border-blue-500/30 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 group-hover:border-blue-200'}`}>
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border border-gray-100">
                                                {editingVideo.thumbnailFile ? (
                                                    <img src={URL.createObjectURL(editingVideo.thumbnailFile)} className="w-full h-full object-cover" alt="Preview" />
                                                ) : editingVideo.thumbnailUrl ? (
                                                    <img src={editingVideo.thumbnailUrl} className="w-full h-full object-cover" alt="Current" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FiUploadCloud size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-slate-800">{editingVideo.thumbnailFile ? editingVideo.thumbnailFile.name : "Update Cover"}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">PNG • JPG • WEBP (MAX 5MB)</p>
                                            </div>
                                            {thumbUploading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Source Toggle */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video Source</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setEditingVideo({ ...editingVideo, type: 'youtube' })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editingVideo.type === 'youtube' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                        >
                                            YouTube
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingVideo({ ...editingVideo, type: 'custom' })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editingVideo.type === 'custom' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                        >
                                            Upload File
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Input Based on Type */}
                                {editingVideo.type === 'youtube' ? (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">YouTube Video ID</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 transition-all text-slate-800 font-bold shadow-inner"
                                                placeholder="e.g. tgbNymZ7vqY"
                                                value={editingVideo.videoId}
                                                onChange={(e) => setEditingVideo({ ...editingVideo, videoId: e.target.value })}
                                            />
                                            {editingVideo.videoId && !editingVideo.thumbnailFile && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100/50 flex items-center gap-3">
                                                    <img src={`https://img.youtube.com/vi/${editingVideo.videoId}/maxresdefault.jpg`} className="w-16 h-10 object-cover rounded-lg" onError={(e) => e.target.src = 'https://via.placeholder.com/160x90?text=Wait...'} />
                                                    <p className="text-[9px] text-red-600 font-bold leading-relaxed">Preview detected! We'll use the YouTube cover unless you upload a custom one.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Video File</label>
                                        <div className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all group ${editingVideo.videoFile ? 'border-emerald-500/50 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-500/50 bg-gray-50/30'}`}>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleFileUploadEdit}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${editingVideo.videoFile ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-white text-gray-400 shadow-lg shadow-gray-200/50'}`}>
                                                    {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiUploadCloud size={32} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{editingVideo.videoFile ? editingVideo.videoFile.name : 'Choose Video File'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">MP4 / MOV / WEBM (MAX 500MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || thumbUploading}
                                className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] ${uploading || thumbUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white shadow-slate-200'}`}
                            >
                                {uploading || thumbUploading ? "Processing Media..." : "Save Refinements"}
                            </button>
                        </form>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default VideoManagement;
