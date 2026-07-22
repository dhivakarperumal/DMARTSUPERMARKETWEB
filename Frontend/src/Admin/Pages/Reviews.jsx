import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import {
  Star, Search, MessageSquare, CheckCircle, AlertCircle,
  Trash2, Send, Loader2, ShieldAlert, Package, ArrowUpRight,
  Reply, X, Plus, Camera, ThumbsUp, Sparkles, LayoutList, LayoutGrid, ChevronDown
} from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

/* ── Helpers ── */
const Stars = ({ rating, size = "sm" }) => {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${cls} ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
};

const StatusPill = ({ status }) => {
  const cfg = {
    Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending:   "bg-amber-100  text-amber-700  border-amber-200",
    Flagged:   "bg-red-100    text-red-600    border-red-200",
  }[status] || "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
};

const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];
const avatarGrad = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const Reviews = () => {
  const { reviewsCache, setReviewsCache } = useAdmin();

  /* View mode — "table" is default */
  const [viewMode, setViewMode] = useState("table");

  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);

  const currentCacheKey = `${filter}-${selectedRating}-${searchQuery}`;
  const cachedData = reviewsCache[currentCacheKey];

  const [reviews, setReviews] = useState(cachedData?.reviews || []);
  const [stats, setStats]     = useState(cachedData?.stats   || null);
  const [loading, setLoading] = useState(!cachedData);

  const [replyText,     setReplyText]     = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyModalItem, setReplyModalItem] = useState(null);

  /* Add Review */
  const [showAddModal, setShowAddModal] = useState(false);
  const [products,     setProducts]     = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [newReview, setNewReview] = useState({
    product_id: "", user_name: "", user_email: "", rating: 5, comment: "", review_image: null
  });

  /* ── Fetchers ── */
  const fetchReviews = async () => {
    try {
      const cacheKey = `${filter}-${selectedRating}-${searchQuery}`;
      if (!reviewsCache[cacheKey]) setLoading(true);
      const params = {};
      if (filter !== "All") params.status = filter;
      if (selectedRating)   params.rating = selectedRating;
      if (searchQuery)      params.search = searchQuery;
      const res  = await api.get("/reviews/admin/all", { params });
      const data = { reviews: res.data.reviews || [], stats: res.data.stats || null };
      setReviews(data.reviews);
      setStats(data.stats);
      setReviewsCache(prev => ({ ...prev, [cacheKey]: data }));
    } catch { toast.error("Failed to load reviews"); }
    finally  { setLoading(false); }
  };

  const fetchProducts = async () => {
    try { const r = await api.get("/products"); setProducts(r.data || []); } catch {}
  };

  useEffect(() => { fetchReviews(); }, [filter, selectedRating]);
  useEffect(() => { if (showAddModal) fetchProducts(); }, [showAddModal]);
  useEffect(() => {
    const t = setTimeout(fetchReviews, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ── Actions ── */
  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/reviews/admin/${id}/status`, { status });
      toast.success(`Review ${status.toLowerCase()}`);
      fetchReviews();
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try { await api.delete(`/reviews/admin/${id}`); toast.success("Deleted"); fetchReviews(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await api.put(`/reviews/admin/${id}/reply`, { admin_reply: replyText });
      toast.success("Reply posted!");
      setReplyText(""); setActiveReplyId(null); setReplyModalItem(null);
      fetchReviews();
    } catch { toast.error("Failed to post reply"); }
  };

  const handleSubmitNewReview = async (e) => {
    e?.preventDefault();
    if (!newReview.product_id || !newReview.user_name || !newReview.comment) {
      toast.error("Please fill in all required fields"); return;
    }
    try {
      setSubmitting(true);
      await api.post("/reviews", newReview);
      toast.success("Review created!");
      setShowAddModal(false);
      setNewReview({ product_id: "", user_name: "", user_email: "", rating: 5, comment: "", review_image: null });
      fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally      { setSubmitting(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewReview(p => ({ ...p, review_image: reader.result }));
    reader.readAsDataURL(file);
  };

  const filterTabs = ["All", "Pending", "Published", "Flagged"];
  const tabCounts  = {
    All: stats?.total, Pending: stats?.pending,
    Published: stats?.published, Flagged: stats?.flagged,
  };

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[2rem] p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-pulse" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Priyam Super Market</p>
                <h1 className="text-2xl font-black text-white leading-none">Customer Reviews</h1>
              </div>
            </div>
            <p className="text-sm text-white/50 font-medium">Moderate, respond, and analyze all customer feedback.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 hover:text-white transition-all active:scale-95 shadow-2xl shadow-black/30 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Review
          </button>
        </div>

        {/* Stats strip */}
        <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",     val: stats?.total      ?? "—", icon: MessageSquare, color: "text-blue-300"    },
            { label: "Avg Rating",val: stats?.avg_rating ?? "—", icon: Star,          color: "text-amber-300"   },
            { label: "Pending",   val: stats?.pending    ?? "—", icon: ShieldAlert,   color: "text-rose-300"    },
            { label: "Published", val: stats?.published  ?? "—", icon: ThumbsUp,      color: "text-emerald-300" },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <div>
                <p className="text-lg font-black text-white leading-none">{val}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Side: Status Select & Search */}
        <div className="flex w-full lg:w-auto items-center gap-3 flex-1">
          {/* Status filter dropdown */}
          <div className="relative shrink-0">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-100 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-sm cursor-pointer uppercase tracking-widest min-w-[160px]"
            >
              {filterTabs.map((tab) => (
                <option key={tab} value={tab}>
                  {tab} {tabCounts[tab] != null ? `(${tabCounts[tab]})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
            <input
              type="text"
              placeholder="Search by customer, product or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full min-h-[52px] bg-white border border-slate-100 rounded-2xl pl-11 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all placeholder:text-slate-300 shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Star filter & View Mode */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto hide-scrollbar shrink-0">
          {/* Star filter */}
          <div className="flex bg-white border border-slate-100 rounded-2xl shadow-sm p-1.5 gap-1 shrink-0">
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRating(selectedRating === r ? null : r)}
                className={`flex-1 min-w-[40px] py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all
                  ${selectedRating === r ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : "text-slate-400 hover:bg-amber-50 hover:text-amber-500"}`}
              >
                <span className="text-xs font-black">{r}</span>
                <Star className={`w-3 h-3 ${selectedRating === r ? "fill-white" : ""}`} />
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white border border-slate-100 rounded-2xl shadow-sm p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                ${viewMode === "table" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                ${viewMode === "card" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div className="min-h-[420px] flex flex-col items-center justify-center gap-5 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-slate-800 animate-spin" />
            <Star className="w-5 h-5 text-amber-400 fill-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Feedback...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="min-h-[420px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-slate-200" />
          </div>
          <p className="text-slate-800 font-black text-xl">No reviews found</p>
          <p className="text-slate-400 text-sm font-medium">Try adjusting your filters or search query</p>
          <button
            onClick={() => { setFilter("All"); setSelectedRating(null); setSearchQuery(""); }}
            className="mt-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === "table" ? (

        /* ══ TABLE VIEW ══ */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {/* Table header row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
              {(filter !== "All" || selectedRating || searchQuery) && (
                <button
                  onClick={() => { setFilter("All"); setSelectedRating(null); setSearchQuery(""); }}
                  className="ml-3 text-indigo-500 hover:text-indigo-700 normal-case font-bold flex items-center gap-1 inline-flex"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-100 bg-[#1b7f29]">
                  {["S No", "Customer", "Product", "Rating", "Comment", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reviews.map((item, index) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    index={index}
                    onApprove={() => handleStatusUpdate(item.id, "Published")}
                    onFlag={()    => handleStatusUpdate(item.id, "Flagged")}
                    onDelete={()  => handleDelete(item.id)}
                    onReply={()   => { setReplyModalItem(item); setReplyText(""); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* ══ CARD VIEW ══ */
        <>
          <div className="flex items-center gap-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-800">{reviews.length}</span> reviews
            </p>
            {(filter !== "All" || selectedRating || searchQuery) && (
              <button
                onClick={() => { setFilter("All"); setSelectedRating(null); setSearchQuery(""); }}
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 ml-2"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {reviews.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                activeReplyId={activeReplyId}
                replyText={replyText}
                setReplyText={setReplyText}
                setActiveReplyId={setActiveReplyId}
                onApprove={() => handleStatusUpdate(item.id, "Published")}
                onFlag={()    => handleStatusUpdate(item.id, "Flagged")}
                onDelete={()  => handleDelete(item.id)}
                onReply={()   => handleReply(item.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── REPLY MODAL (for table row) ── */}
      {replyModalItem && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && setReplyModalItem(null)}
        >
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative bg-gradient-to-r from-slate-900 to-indigo-900 px-7 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Reply className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Official Reply</p>
                  <p className="text-sm font-black text-white">Replying to {replyModalItem.user_name}</p>
                </div>
              </div>
              <button onClick={() => setReplyModalItem(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original review snippet */}
            <div className="px-7 pt-5 pb-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stars rating={replyModalItem.rating} />
                  <span className="text-[10px] text-slate-400 font-bold ml-1">{replyModalItem.product_name}</span>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">"{replyModalItem.comment}"</p>
              </div>
              <textarea
                rows={4}
                placeholder="Write your official response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-sm font-semibold text-slate-700 resize-none transition-all"
                autoFocus
              />
            </div>
            <div className="px-7 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setReplyModalItem(null)} className="px-5 py-2.5 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleReply(replyModalItem.id)}
                disabled={!replyText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-40 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Post Reply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ADD REVIEW MODAL ── */}
      {showAddModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
            <div className="relative bg-gradient-to-r from-slate-900 to-indigo-900 px-8 py-6 flex items-center justify-between overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-1">Admin Panel</p>
                <h2 className="text-xl font-black text-white">Create Manual Review</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewReview} className="flex-1 overflow-y-auto p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Product *</label>
                  <select required value={newReview.product_id} onChange={(e) => setNewReview(p => ({ ...p, product_id: e.target.value }))}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-sm font-semibold transition-all">
                    <option value="">Select a Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Customer Name *</label>
                  <input required type="text" placeholder="e.g. Rahul Sharma" value={newReview.user_name}
                    onChange={(e) => setNewReview(p => ({ ...p, user_name: e.target.value }))}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-sm font-semibold transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Customer Email</label>
                  <input type="email" placeholder="email@example.com" value={newReview.user_email}
                    onChange={(e) => setNewReview(p => ({ ...p, user_email: e.target.value }))}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-sm font-semibold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rating</label>
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setNewReview(p => ({ ...p, rating: star }))} className="hover:scale-125 transition-transform">
                        <Star className={`w-6 h-6 ${star <= newReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      </button>
                    ))}
                    <span className="ml-auto text-xs font-black text-slate-500">{newReview.rating}/5</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Review Comment *</label>
                <textarea required rows={4} placeholder="Write the customer's feedback here..." value={newReview.comment}
                  onChange={(e) => setNewReview(p => ({ ...p, comment: e.target.value }))}
                  className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-sm font-semibold transition-all resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Review Image (Optional)</label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="w-full p-7 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-300 transition-all">
                    {newReview.review_image ? (
                      <div className="relative">
                        <img src={newReview.review_image} className="w-28 h-28 rounded-2xl object-cover shadow-xl" alt="Preview" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setNewReview(p => ({ ...p, review_image: null })); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-20">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Click to upload photo</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG or WEBP · Max 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSubmitNewReview} disabled={submitting}
                className="flex items-center gap-2 px-7 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {submitting ? "Creating..." : "Create Review"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   TABLE ROW
══════════════════════════════════════════ */
const TableRow = ({ item, index, onApprove, onFlag, onDelete, onReply }) => {
  const grad = avatarGrad(item.user_name);
  return (
    <tr className="group hover:bg-slate-50/70 transition-colors">
      {/* S No */}
      <td className="px-5 py-4 text-xs font-black text-slate-400">
        #{String(index + 1).padStart(2, '0')}
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-black shadow shrink-0`}>
            {item.user_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 whitespace-nowrap">{item.user_name}</p>
            {item.user_email && <p className="text-[10px] text-slate-400 font-medium">{item.user_email}</p>}
          </div>
        </div>
      </td>

      {/* Product */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 max-w-[160px]">
          <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600 truncate">{item.product_name || "—"}</span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Stars rating={item.rating} />
          <span className="text-xs font-black text-slate-500">{item.rating}.0</span>
        </div>
      </td>

      {/* Comment */}
      <td className="px-5 py-4 max-w-[260px]">
        <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">"{item.comment}"</p>
        {item.admin_reply && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Reply className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
            <p className="text-[10px] text-indigo-500 font-bold line-clamp-1 italic">{item.admin_reply}</p>
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-5 py-4 whitespace-nowrap">
        <StatusPill status={item.status} />
      </td>

      {/* Date */}
      <td className="px-5 py-4 whitespace-nowrap">
        <p className="text-xs font-bold text-slate-500">
          {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.status !== "Published" && (
            <button onClick={onApprove} title="Approve"
              className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {item.status !== "Flagged" && (
            <button onClick={onFlag} title="Flag"
              className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100">
              <AlertCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onReply} title="Reply"
            className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100">
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} title="Delete"
            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-slate-100">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ══════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════ */
const ReviewCard = ({ item, activeReplyId, replyText, setReplyText, setActiveReplyId, onApprove, onFlag, onDelete, onReply }) => {
  const isReplyOpen = activeReplyId === item.id;
  const grad = avatarGrad(item.user_name);

  return (
    <div className={`group relative bg-white rounded-[2rem] border flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1
      ${item.status === "Pending"   ? "border-amber-200 shadow-md shadow-amber-500/5"  : ""}
      ${item.status === "Flagged"   ? "border-red-200   shadow-md shadow-red-500/5"    : ""}
      ${item.status === "Published" ? "border-slate-100 shadow-sm"                     : ""}
      ${!["Pending","Flagged","Published"].includes(item.status) ? "border-slate-100 shadow-sm" : ""}
    `}>
      {/* Color accent bar */}
      <div className={`h-1 w-full
        ${item.status === "Published" ? "bg-gradient-to-r from-emerald-400 to-teal-500"  : ""}
        ${item.status === "Pending"   ? "bg-gradient-to-r from-amber-400  to-orange-500" : ""}
        ${item.status === "Flagged"   ? "bg-gradient-to-r from-red-400    to-rose-500"   : ""}
        ${!["Pending","Flagged","Published"].includes(item.status) ? "bg-slate-100" : ""}
      `} />

      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-black shadow-lg shrink-0`}>
            {item.user_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-800 text-sm truncate">{item.user_name}</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="px-5 pb-3"><Stars rating={item.rating} /></div>

      <div className="flex-1 px-5 space-y-3">
        <div className="relative">
          <span className="absolute -top-1 -left-1 text-4xl text-slate-100 font-black leading-none select-none">"</span>
          <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-4 min-h-[5rem] pl-3">{item.comment}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <p className="text-[10px] font-black text-slate-600 truncate">{item.product_name || "Deleted Product"}</p>
          {item.product_id && (
            <span className="ml-auto text-[8px] font-black bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded shrink-0">#{item.product_id}</span>
          )}
        </div>
        {item.review_image && (
          <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-100 group/img">
            <img src={item.review_image} alt="Review" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <ArrowUpRight className="text-white w-6 h-6" />
            </div>
          </div>
        )}
        {item.admin_reply && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Reply className="w-2.5 h-2.5" /> Official Reply
            </p>
            <p className="text-[11px] font-medium text-slate-500 italic leading-snug line-clamp-2">{item.admin_reply}</p>
          </div>
        )}
      </div>

      <div className="p-4 mt-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-1">
          {item.status !== "Published" && (
            <button onClick={onApprove} title="Approve" className="p-2.5 bg-white text-emerald-500 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {item.status !== "Flagged" && (
            <button onClick={onFlag} title="Flag" className="p-2.5 bg-white text-red-400 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm">
              <AlertCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setActiveReplyId(isReplyOpen ? null : item.id)}
            className={`p-2.5 rounded-xl border transition-all shadow-sm
              ${isReplyOpen ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-500 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"}`}
          >
            <Reply className="w-4 h-4" />
          </button>
        </div>
        <button onClick={onDelete} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Reply slide-up */}
      {isReplyOpen && (
        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-5 flex flex-col animate-in slide-in-from-bottom-full duration-300 rounded-[2rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Reply className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Official Reply</span>
            </div>
            <button onClick={() => setActiveReplyId(null)} className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            Replying to <span className="text-slate-700">{item.user_name}</span>
          </div>
          <textarea
            placeholder="Write your official response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-xs font-semibold text-slate-700 resize-none mb-4 transition-all"
          />
          <button
            onClick={onReply}
            disabled={!replyText.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Send className="w-3 h-3" /> Send Reply
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;
