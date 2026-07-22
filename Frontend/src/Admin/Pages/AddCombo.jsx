import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiSave,
  FiLayers,
  FiUploadCloud,
  FiTrash2,
  FiInfo,
  FiImage,
  FiPackage,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import imageCompression from "browser-image-compression";
import Barcode from "react-barcode";

const AddCombo = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    name: "",
    product_code: "",
    barcode: "",
    category: "",
    subcategory: "",
    brand: "",
    description: "",
    barcode_image: "",
    weight_volume: "",
    unit: "kg",
    mrp: "",
    selling_price: "",
    offer: "",
    price_plus: "",
    offer_price: "",
    stock_quantity: "0",
    // combo options: array of products included in the combo
    combo_items: [
      {
        product_id: "",
        quantity: "1",
      },
    ],
    total_stock: "0",
    expiry_date: "",
    manufacturing_date: "",
    country_of_origin: "",
    supplier: "",
    product_images: [],
    thumbnail_image: "",
    status: "Active",
    featured_product: "No",
    best_seller: "No",
    todays_deal: "No",
    delivery_time: "",
    return_available: "No",
    rating: "5",
    review_count: "0",
    created_at: "",
    updated_at: "",
  });

  const computeTotalStock = (options) => {
    const opts = Array.isArray(options)
      ? options
      : formData.pricing_options || [];
    return opts.reduce(
      (sum, o) => sum + (Number(o.stock_quantity || 0) || 0),
      0,
    );
  };

  const generateComboCode = (existingProducts) => {
    // Find all existing combo codes like SPMC001, SPMC002, etc.
    const comboCodes = (existingProducts || [])
      .map(p => String(p.product_code || "").toUpperCase())
      .filter(code => /^SPMC\d+$/.test(code))
      .map(code => parseInt(code.replace("SPMC", ""), 10))
      .filter(n => !isNaN(n));

    const nextNum = comboCodes.length > 0 ? Math.max(...comboCodes) + 1 : 1;
    return `SPMC${String(nextNum).padStart(3, "0")}`;
  };

  // Parse products API response — handles both array and {products:[]} shapes
  const parseProducts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  // Returns only regular (non-combo) products for the selector
  const filterNonCombo = (list) =>
    list.filter(p => !String(p.product_code || '').toUpperCase().startsWith('SPMC'));

  // Keep generateProductCode for edit compatibility (reading existing codes)
  const generateProductCode = (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (/^SPMC\d{3,}$/.test(normalized)) return normalized;
    if (/^SPM\d{3,}$/.test(normalized)) return normalized;
    return "SPMC001";
  };

  const generateBarcode = (value) => {
    const cleaned = String(value || "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    if (!cleaned) return `BAR${Date.now()}`;
    return cleaned.length >= 12
      ? cleaned.slice(0, 12)
      : cleaned.padEnd(12, "0");
  };

  const handleGenerateBarcode = () => {
    setFormData((prev) => ({
      ...prev,
      barcode: generateBarcode(prev.product_code),
    }));
  };

  const renderBarcodeSvg = (value) => {
    const code = String(value || "")
      .trim()
      .toUpperCase();
    if (!code) {
      return (
        <div className="w-full h-32 rounded-3xl border border-teal-100 bg-teal-50/30 flex items-center justify-center text-sm text-teal-400">
          No barcode available
        </div>
      );
    }

    return (
      <div className="w-full rounded-3xl border border-teal-100 bg-white p-1">
        <Barcode
          value={code}
          format="CODE128"
          displayValue={true}
          width={2}
          height={80}
          margin={8}
          background="#ffffff"
          lineColor="#0f172a"
        />
      </div>
    );
  };

  // selling price is derived from MRP and Discount when those fields change

  useEffect(() => {
    const fetchEssentialData = async () => {
      try {
        if (isEdit) {
          const [catRes, prodRes, editRes] = await Promise.all([
            api.get("/categories"),
            api.get("/products"),
            api.get(`/products/${id}`),
          ]);

          setCategories(Array.isArray(catRes.data) ? catRes.data : []);
          const allProducts = parseProducts(prodRes.data);
          setAvailableProducts(filterNonCombo(allProducts));

          const p = editRes.data;
          setFormData((prev) => ({
            ...prev,
            name: p.name || "",
            product_code: p.product_code || "",
            barcode: p.barcode || generateBarcode(p.product_code || ""),
            barcode_image: p.barcode_image || "",
            category: p.category || "",
            subcategory: p.subcategory || "",
            brand: p.brand || "",
            description: p.description || "",
            weight_volume: p.weight_volume || "",
            unit: p.unit || "kg",
            mrp: p.mrp?.toString() || "",
            selling_price: p.selling_price?.toString() || "",
            offer: p.offer?.toString() || "",
            price_plus: p.price_plus?.toString() || "",
            offer_price: p.offer_price?.toString() || "",
            stock_quantity: p.stock_quantity?.toString() || "0",
            total_stock:
              p.total_stock?.toString() ||
              p.stock_quantity?.toString() || "0",
            minimum_stock: p.minimum_stock?.toString() || "0",
            maximum_stock: p.maximum_stock?.toString() || "",
            expiry_date: p.expiry_date || "",
            manufacturing_date: p.manufacturing_date || "",
            country_of_origin: p.country_of_origin || "",
            supplier: p.supplier || "",
            product_images: Array.isArray(p.product_images)
              ? p.product_images
              : [],
            thumbnail_image: p.thumbnail_image || "",
            status: p.status || "Active",
            featured_product: p.featured_product ? "Yes" : "No",
            best_seller: p.best_seller ? "Yes" : "No",
            todays_deal: p.todays_deal ? "Yes" : "No",
            delivery_time: p.delivery_time || "",
            return_available: p.return_available ? "Yes" : "No",
            rating: p.rating?.toString() || "5",
            review_count: p.review_count?.toString() || "0",
            combo_items: Array.isArray(p.combo_items) && p.combo_items.length > 0
              ? p.combo_items
              : prev.combo_items || [{ product_id: "", quantity: "1" }],
            created_at: p.created_at || "",
            updated_at: p.updated_at || "",
          }));
        } else {
          const [catRes, prodRes] = await Promise.all([
            api.get("/categories"),
            api.get("/products"),
          ]);
          const categoriesData = Array.isArray(catRes.data) ? catRes.data : [];
          const allProducts = parseProducts(prodRes.data);
          const nonCombo = filterNonCombo(allProducts);
          console.log("AddCombo ALL PRODUCTS: ", allProducts.length, "NON-COMBO: ", nonCombo.length);
          setAvailableProducts(nonCombo);
          const defaultCategory = categoriesData[0]?.name || "";

          // Generate next SPMC code from ALL products (including combos)
          const initialSku = generateComboCode(allProducts);

          setCategories(categoriesData);
          setFormData((prev) => ({
            ...prev,
            category: defaultCategory,
            product_code: initialSku,
            barcode: generateBarcode(initialSku),
          }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Unable to load product form data.");

        if (!isEdit) {
          const fallbackSku = "SPMC001";
          setFormData((prev) => ({
            ...prev,
            product_code: fallbackSku,
            barcode: generateBarcode(fallbackSku),
          }));
        }
      } finally {
        setFetching(false);
      }
    };

    fetchEssentialData();
  }, [id, isEdit]);

  // derive subcategories from selected category instead of storing in state
  const derivedSubcategories = (() => {
    const selectedCat = categories.find((c) => c.name === formData.category);
    return selectedCat && selectedCat.subcategory
      ? selectedCat.subcategory
      : [];
  })();

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // derive barcode when SKU changes
      if (name === "product_code") {
        updated.barcode = generateBarcode(value);
      }

      // derive selling price immediately when mrp or offer changes
      if (name === "mrp" || name === "offer") {
        const mrpValue = parseFloat(name === "mrp" ? value : updated.mrp) || 0;
        const offerValue =
          parseFloat(name === "offer" ? value : updated.offer) || 0;
        if (mrpValue > 0) {
          const calculatedPrice = mrpValue - mrpValue * (offerValue / 100);
          updated.selling_price = Math.round(calculatedPrice).toString();
        } else {
          updated.selling_price = "";
        }
      }

      // ensure subcategory reset when category changes
      if (name === "category") {
        updated.subcategory = derivedSubcategories[0] || "";
      }

      // if global offer changed, update each pricing option's selling_price
      if (name === "offer") {
        const offerValue = parseFloat(value) || 0;
        updated.pricing_options = (updated.pricing_options || []).map((opt) => {
          const mrpVal = parseFloat(opt.mrp) || 0;
          if (mrpVal > 0) {
            const calc = mrpVal - mrpVal * (offerValue / 100);
            return {
              ...opt,
              selling_price: Math.round(calc).toString(),
              offer: value,
            };
          }
          return { ...opt, offer: value };
        });
      }

      return updated;
    });
  };

  const addPricingOption = () => {
    setFormData((prev) => ({
      ...prev,
      pricing_options: [
        ...(prev.pricing_options || []),
        {
          weight_volume: "",
          unit: prev.unit || "kg",
          mrp: "",
          selling_price: "",
          offer: "",
          stock_quantity: "0",
        },
      ],
    }));
  };

  const removePricingOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricing_options: prev.pricing_options.filter((_, i) => i !== index),
    }));
  };

  const handlePricingChange = (index, field, value) => {
    setFormData((prev) => {
      const options = Array.isArray(prev.pricing_options)
        ? [...prev.pricing_options]
        : [];
      options[index] = { ...options[index], [field]: value };

      // if mrp or offer changed, auto-calc selling_price for this option using its offer percent or global discount
      const option = options[index];
      const mrpVal = parseFloat(option.mrp) || 0;
      const offerPct =
        field === "offer"
          ? parseFloat(value) || 0
          : parseFloat(option.offer) || 0;
      const currentOffer = parseFloat(prev.offer) || 0;
      if (field === "offer" && offerPct > 0 && mrpVal > 0) {
        const calc = mrpVal - mrpVal * (offerPct / 100);
        options[index].selling_price = Math.round(calc).toString();
      } else if (field === "mrp") {
        const effectiveOffer = offerPct > 0 ? offerPct : currentOffer;
        if (mrpVal > 0) {
          const calc = mrpVal - mrpVal * (effectiveOffer / 100);
          options[index].selling_price = Math.round(calc).toString();
        } else {
          options[index].selling_price = "";
        }
      }

      return {
        ...prev,
        pricing_options: options,
      };
    });
  };

  const handleMultipleImageUpload = async (e) => {
    try {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      if ((formData.product_images?.length || 0) + files.length > 8) {
        toast.error("Maximum 8 product images allowed.");
        return;
      }

      const imagesArray = await Promise.all(
        files.map(async (file) => {
          const options = {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          const compressed = await imageCompression(file, options);
          return imageCompression.getDataUrlFromFile(compressed);
        }),
      );

      setFormData((prev) => ({
        ...prev,
        product_images: [...(prev.product_images || []), ...imagesArray],
      }));
      toast.success(`${files.length} image(s) added.`);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Image upload failed.");
    }
  };

  const handleThumbnailUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      const imageUrl = await imageCompression.getDataUrlFromFile(compressed);
      setFormData((prev) => ({ ...prev, thumbnail_image: imageUrl }));
      toast.success("Thumbnail updated.");
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error("Thumbnail upload failed.");
    }
  };

  const handleBarcodeUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      const imageUrl = await imageCompression.getDataUrlFromFile(compressed);
      setFormData((prev) => ({ ...prev, barcode_image: imageUrl }));
      toast.success("Barcode image uploaded.");
    } catch (error) {
      console.error("Barcode upload error:", error);
      toast.error("Barcode upload failed.");
    }
  };

  const removeProductImage = (imgIndex) => {
    setFormData((prev) => ({
      ...prev,
      product_images: prev.product_images.filter(
        (_, index) => index !== imgIndex,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasCategory = formData.category && formData.category.trim() !== "";
    const hasMrp = formData.mrp || (formData.pricing_options && formData.pricing_options.length > 0 && formData.pricing_options[0].mrp);

    if (!formData.name || !hasCategory || !hasMrp) {
      console.warn("[AddCombo] Validation failed", {
        name: formData.name,
        category: formData.category,
        mrp: formData.mrp,
      });
      toast.error("Please fill in the required product details (Name, Category, and at least one MRP).");
      return;
    }

    const normalizedComboItems = Array.isArray(formData.combo_items)
      ? formData.combo_items.filter((item) => item?.product_id && String(item.product_id).trim() !== "")
      : [];

    if (!normalizedComboItems.length) {
      console.warn("[AddCombo] Validation failed: no combo items selected");
      toast.error("Please add at least one product to the combo.");
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find((cat) => cat.name === formData.category);
      const finalData = {
        ...formData,
        type: 1,
        category: selectedCategory?.name || formData.category || "General",
        category_id: selectedCategory?.id || null,
        combo_items: normalizedComboItems,
        pricing_options: [], // empty for combos
        minimum_stock: Number(formData.minimum_stock || 0),
        maximum_stock: Number(formData.maximum_stock || 0),
        offer: Number(formData.offer || 0),
        price_plus: Number(formData.price_plus || 0),
        offer_price: Number(formData.offer_price || 0),
        rating: Number(formData.rating || 0),
        review_count: Number(formData.review_count || 0),
        featured_product: formData.featured_product === "Yes",
        best_seller: formData.best_seller === "Yes",
        todays_deal: formData.todays_deal === "Yes",
        return_available: formData.return_available === "Yes",
        created_at: formData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set pricing directly from formData
      finalData.mrp = Number(formData.mrp || 0);
      finalData.selling_price = Number(formData.selling_price || 0);
      finalData.offer = Number(formData.offer || 0);
      finalData.offer_price = Number(formData.offer_price || formData.selling_price || 0);
      finalData.stock_quantity = Number(formData.stock_quantity || formData.total_stock || 0);

      // explicitly use the edited total stock value
      finalData.total_stock = Number(formData.total_stock || 0);

      console.info("[AddCombo] Saving combo product", {
        isEdit,
        id,
        payload: finalData,
      });

      let response;
      if (isEdit) {
        response = await api.put(`/products/${id}`, finalData);
        toast.success("Product updated successfully.");
      } else {
        response = await api.post("/products", finalData);
        toast.success("Product added successfully.");
      }

      console.info("[AddCombo] Save success", response?.data);
      setTimeout(() => navigate("/admin/products/all"), 1500);
    } catch (error) {
      console.error("[AddCombo] Save failed", {
        error,
        response: error?.response?.data,
        status: error?.response?.status,
        payload: formData,
      });
      toast.error(error.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── shared input class ─── */
  const inputCls =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all placeholder:text-gray-400";

  const selectCls =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all";

  const cardCls =
    "bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6";

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold">Fetching product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-teal-600 hover:border-teal-300 transition-all shadow-sm"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              {isEdit ? "Edit Combo" : "Add Combo Product"}
            </h1>
            <p className="text-sm text-gray-400">
              Manage combo details, inventory, media, and status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEdit && (
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  name: "Test Organic Apples",
                  brand: "FarmFresh",
                  description: "Fresh, juicy, and organically grown apples from the best farms. Perfect for a healthy snack or baking.",
                  country_of_origin: "India",
                  supplier: "Green Valley Farms",
                  delivery_time: "1-2 Days",
                  pricing_options: [{
                    weight_volume: "1",
                    unit: "kg",
                    mrp: "200",
                    offer: "10",
                    selling_price: "180",
                    stock_quantity: "50"
                  }],
                  total_stock: "50"
                }));
              }}
              className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              Fill Test Data
            </button>
          )}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
            SKU: {formData.product_code || "Generating..."}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ════════════════════════════════════
            Main Content — Left Side
        ════════════════════════════════════ */}
        <div className="xl:col-span-2 space-y-8">

          {/* ── Basic Information ── */}
          <div className={cardCls}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <FiLayers size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-800">Basic Information</h2>
                <p className="text-xs text-gray-400">Core product identity and description</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter product name"
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="5"
                  placeholder="Describe the product details..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* ── Combo Included Products ── */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <FiPackage size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Combo Products</h2>
                  <p className="text-xs text-gray-400">Select the products included in this combo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, combo_items: [...(prev.combo_items || []), { product_id: "", quantity: "1" }] }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-sm hover:bg-teal-700 hover:shadow-md transition-all"
                title="Add Product"
              >
                + Add Product
              </button>
            </div>

            <div className="space-y-4">
              {(formData.combo_items || []).map((opt, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border border-teal-100 rounded-2xl bg-teal-50/30 hover:bg-teal-50/60 transition-colors"
                >
                  <div className="md:col-span-12 flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-100 px-2.5 py-1 rounded-full">
                      Item {idx + 1}
                    </span>
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Select Product
                    </label>
                    <select
                      value={opt.product_id ? `${opt.product_id}_base` : ""}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (!selectedVal) return;
                        
                        const pId = selectedVal.split('_')[0];
                        const selectedProduct = availableProducts.find(p => p.id.toString() === pId);
                        const newItems = [...formData.combo_items];
                        
                        if (selectedProduct) {
                          newItems[idx] = {
                            ...newItems[idx],
                            product_id: pId,
                            variant_index: "base",
                            name: selectedProduct.name,
                            mrp: selectedProduct.mrp || 0,
                            selling_price: selectedProduct.selling_price || 0,
                            offer_price: selectedProduct.offer_price || 0,
                            image: selectedProduct.thumbnail_image || (Array.isArray(selectedProduct.product_images) && selectedProduct.product_images[0]) || "",
                            variant_info: {
                                weight: selectedProduct.weight_volume || "1",
                                unit: selectedProduct.unit || "kg"
                            }
                          };
                        } else {
                          newItems[idx].product_id = pId;
                        }
                        
                        setFormData({ ...formData, combo_items: newItems });
                      }}
                      className={selectCls}
                    >
                      <option value="">-- Choose a product --</option>
                      {availableProducts.map(p => (
                         <option key={p.id} value={`${p.id}_base`}>
                            {p.name}
                         </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Weight / Size
                    </label>
                    <select
                      value={opt.product_id ? `${opt.product_id}_${opt.variant_index || 'base'}` : ""}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (!selectedVal) return;
                        
                        const [pId, vIdxStr] = selectedVal.split('_');
                        const selectedProduct = availableProducts.find(p => p.id.toString() === pId);
                        const newItems = [...formData.combo_items];
                        
                        if (selectedProduct) {
                          let vWeight = selectedProduct.weight_volume || "1";
                          let vUnit = selectedProduct.unit || "kg";
                          let vMrp = selectedProduct.mrp || 0;
                          let vSellingPrice = selectedProduct.selling_price || 0;
                          let vOfferPrice = selectedProduct.offer_price || 0;

                          if (vIdxStr !== 'base' && Array.isArray(selectedProduct.pricing_options) && selectedProduct.pricing_options[Number(vIdxStr)]) {
                             const pOpt = selectedProduct.pricing_options[Number(vIdxStr)];
                             vWeight = pOpt.weight_volume || vWeight;
                             vUnit = pOpt.unit || vUnit;
                             vMrp = pOpt.mrp || vMrp;
                             vSellingPrice = pOpt.selling_price || pOpt.price || vSellingPrice;
                             vOfferPrice = pOpt.offer_price || vOfferPrice;
                          }

                          newItems[idx] = {
                            ...newItems[idx],
                            product_id: pId,
                            variant_index: vIdxStr,
                            name: selectedProduct.name,
                            mrp: vMrp,
                            selling_price: vSellingPrice,
                            offer_price: vOfferPrice,
                            variant_info: {
                                weight: vWeight,
                                unit: vUnit
                            }
                          };
                        }
                        
                        setFormData({ ...formData, combo_items: newItems });
                      }}
                      className={selectCls}
                      disabled={!opt.product_id}
                    >
                      <option value="">-- Choose Weight --</option>
                      {opt.product_id && availableProducts.find(p => p.id.toString() === opt.product_id) && (
                        (() => {
                          const p = availableProducts.find(p => p.id.toString() === opt.product_id);
                          const options = [];
                          const baseWeightStr = p.weight_volume ? p.weight_volume : "";
                          const baseUnitStr = p.unit ? p.unit : "";
                          const baseVariantStr = (baseWeightStr || baseUnitStr) ? `${baseWeightStr} ${baseUnitStr}`.trim() : "Base";
                          options.push(
                            <option key={`${p.id}_base`} value={`${p.id}_base`}>
                              {baseVariantStr} - ₹{p.offer_price || p.selling_price || p.mrp}
                            </option>
                          );
                          if (Array.isArray(p.pricing_options) && p.pricing_options.length > 0) {
                            p.pricing_options.forEach((po, i) => {
                              const weightStr = po.weight_volume ? po.weight_volume : "";
                              const unitStr = po.unit ? po.unit : "";
                              const variantStr = (weightStr || unitStr) ? `${weightStr} ${unitStr}`.trim() : `Variant ${i+1}`;
                              options.push(
                                <option key={`${p.id}_${i}`} value={`${p.id}_${i}`}>
                                  {variantStr} - ₹{po.offer_price || po.selling_price || po.price || po.mrp}
                                </option>
                              );
                            });
                          }
                          return options;
                        })()
                      )}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={opt.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.combo_items];
                        newItems[idx].quantity = e.target.value;
                        setFormData({ ...formData, combo_items: newItems });
                      }}
                      className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-semibold text-slate-800 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all"
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, combo_items: prev.combo_items.filter((_, i) => i !== idx) }))}
                      className="w-full sm:w-auto px-4 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none text-sm font-semibold"
                      disabled={formData.combo_items.length === 1}
                      title={formData.combo_items.length === 1 ? "Keep at least one product" : "Remove product"}
                    >
                      <FiTrash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Combo MRP (₹)
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleFormChange}
                  placeholder="Total MRP"
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Offer %
                </label>
                <input
                  type="number"
                  name="offer"
                  value={formData.offer}
                  onChange={handleFormChange}
                  placeholder="Discount %"
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleFormChange}
                  placeholder="Final Price"
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Total Combo Stock
                </label>
                <input
                  type="number"
                  name="total_stock"
                  value={formData.total_stock}
                  onChange={handleFormChange}
                  placeholder="Enter total stock"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Media ── */}
          <div className={cardCls}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <FiImage size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-800">Media</h2>
                <p className="text-xs text-gray-400">Product images and barcode</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Product Images
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-violet-200 rounded-2xl py-8 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors group">
                <FiUploadCloud size={28} className="text-violet-400 group-hover:text-violet-600 transition-colors" />
                <span className="mt-3 text-sm font-semibold text-slate-600">
                  Click to upload product images
                </span>
                <span className="text-xs text-gray-400 mt-1">Max 8 images · JPG, PNG, WEBP</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={handleMultipleImageUpload}
                />
              </label>
              {formData.product_images?.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
                  {formData.product_images.map((img, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-2xl shadow-sm border border-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeProductImage(index)}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              {/* Thumbnail */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Thumbnail Image
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-teal-200 rounded-2xl h-32 cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 transition-colors group">
                  <FiUploadCloud size={20} className="text-teal-400 group-hover:text-teal-600 transition-colors" />
                  <span className="mt-2 text-xs font-semibold text-slate-600">
                    Upload thumbnail
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                  />
                </label>
                {formData.thumbnail_image && (
                  <div className="relative group">
                    <img
                      src={formData.thumbnail_image}
                      alt="Thumbnail"
                      className="h-32 w-full object-cover rounded-2xl shadow-sm border border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, thumbnail_image: ""}))}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Barcode Image */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Barcode Image (Optional)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-200 rounded-2xl h-32 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 transition-colors group">
                  <FiUploadCloud size={20} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
                  <span className="mt-2 text-xs font-semibold text-slate-600">
                    Upload barcode
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleBarcodeUpload}
                  />
                </label>
                {formData.barcode_image && (
                  <div className="relative group">
                    <img
                      src={formData.barcode_image}
                      alt="Barcode"
                      className="h-32 w-full object-contain rounded-2xl shadow-sm border border-gray-100 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, barcode_image: ""}))}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════
            Sidebar — Right Side
        ════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Organization ── */}
          <div className={cardCls}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FiPackage size={18} />
              </span>
              <h3 className="text-lg font-black text-slate-800">Organization</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className={selectCls}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleFormChange}
                  className={selectCls}
                  disabled={derivedSubcategories.length === 0}
                >
                  <option value="">Select subcategory</option>
                  {derivedSubcategories.map((sub, index) => (
                    <option key={index} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleFormChange}
                  placeholder="Brand name"
                  className={inputCls}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Product Code (SKU)
                  </label>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-lg">
                    Auto-Generated
                  </span>
                </div>
                <input
                  type="text"
                  name="product_code"
                  value={formData.product_code}
                  readOnly
                  placeholder="Auto-generated"
                  className="w-full px-4 py-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-sm font-bold text-teal-800 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Generated Barcode Preview
                </label>
                <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  {renderBarcodeSvg(formData.barcode)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sourcing & Dates ── */}
          <div className={cardCls}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                <FiInfo size={18} />
              </span>
              <h3 className="text-lg font-black text-slate-800">Sourcing & Dates</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleFormChange}
                  placeholder="Supplier name"
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Country of Origin
                </label>
                <input
                  type="text"
                  name="country_of_origin"
                  value={formData.country_of_origin}
                  onChange={handleFormChange}
                  placeholder="e.g. India"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Mfg Date
                  </label>
                  <input
                    type="date"
                    name="manufacturing_date"
                    value={formData.manufacturing_date}
                    onChange={handleFormChange}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleFormChange}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Visibility & Badges ── */}
          <div className={cardCls}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <FiLayers size={18} />
              </span>
              <h3 className="text-lg font-black text-slate-800">Visibility & Badges</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className={selectCls}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Featured
                  </label>
                  <select
                    name="featured_product"
                    value={formData.featured_product}
                    onChange={handleFormChange}
                    className={selectCls}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Best Seller
                  </label>
                  <select
                    name="best_seller"
                    value={formData.best_seller}
                    onChange={handleFormChange}
                    className={selectCls}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Today's Deal
                  </label>
                  <select
                    name="todays_deal"
                    value={formData.todays_deal}
                    onChange={handleFormChange}
                    className={selectCls}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Returnable
                  </label>
                  <select
                    name="return_available"
                    value={formData.return_available}
                    onChange={handleFormChange}
                    className={selectCls}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Delivery Time
                </label>
                <input
                  type="text"
                  name="delivery_time"
                  value={formData.delivery_time}
                  onChange={handleFormChange}
                  placeholder="e.g. 2-3 Days"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Save Button ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 text-white py-4 px-8 rounded-3xl text-base font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:pointer-events-none"
            style={{
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
            }}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <FiSave size={20} />
                <span>{isEdit ? "Update Product" : "Save Product"}</span>
              </>
            )}
          </button>
        </div>
      </form>
      <Toaster position="top-right" />
    </div>
  );
};

export default AddCombo;
