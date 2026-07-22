import React, { useState, useEffect, useRef, useContext } from "react";
import {
    FiArrowLeft, FiPlus, FiTrash2, FiSave, FiUser, FiPackage,
    FiSearch, FiPhone, FiCheckCircle, FiMic, FiMaximize, FiLayers, FiCamera, FiX
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";


const CreateBilling = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const barcodeInputRef = useRef(null);
    const addItemToBillRef = useRef(null);
    const html5QrcodeRef = useRef(null);
    const [cameraStatus, setCameraStatus] = useState("idle"); // idle | starting | active | error
    const [lastScannedCode, setLastScannedCode] = useState("");

    const [loading, setLoading] = useState(false);

    // Data States
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [productSearchTerm, setProductSearchTerm] = useState("");

    // UI States
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [dropdownValue, setDropdownValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [voiceLang, setVoiceLang] = useState("ta-IN");
    const [isScannerFocused, setIsScannerFocused] = useState(true);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [selectMode, setSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        user_id: "",
        customer_name: "",
        customer_phone: "",
        items: [],
        total_amount: 0,
        status: "Delivered",
        order_type: "Shop",
        payment_method: "Cash",
        shipping_address: {
            street: "",
            city: "",
            district: "",
            state: "",
            zip: "",
            country: "India"
        }
    });

    // Set user_id when user is loaded
    useEffect(() => {
        if (user?.user_id) {
            setFormData(prev => ({ ...prev, user_id: user.user_id }));
        }
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productRes = await api.get("/products?limit=200");
                const productsData = productRes.data;
                const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
                const processedProducts = productsArray.map(p => {
                    let parsedOptions = [];
                    if (p.pricing_options) {
                        try {
                            parsedOptions = typeof p.pricing_options === 'string' ? JSON.parse(p.pricing_options) : p.pricing_options;
                        } catch(e) {}
                    }
                    const mappedVariants = parsedOptions.length > 0 ? parsedOptions.map(opt => ({
                        quantity: opt.weight_volume,
                        unit: opt.unit,
                        mrp: opt.mrp,
                        sellingPrice: opt.selling_price,
                        stock: opt.stock_quantity
                    })) : [];
                    
                    return {
                        ...p,
                        variants: mappedVariants,
                        offer_price: p.offer_price || (mappedVariants.length > 0 ? mappedVariants[0].sellingPrice : 0),
                        price: p.price || (mappedVariants.length > 0 ? mappedVariants[0].mrp : 0)
                    };
                });
                setProducts(processedProducts);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load products");
            }
        };
        fetchData();

        const handleFocus = () => setIsScannerFocused(true);
        const handleBlur = () => setIsScannerFocused(false);
        const currentInput = barcodeInputRef.current;
        if (currentInput) {
            currentInput.addEventListener("focus", handleFocus);
            currentInput.addEventListener("blur", handleBlur);
            currentInput.focus();
        }
        return () => {
            if (currentInput) {
                currentInput.removeEventListener("focus", handleFocus);
                currentInput.removeEventListener("blur", handleBlur);
            }
        };
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            const tagName = e.target.tagName.toLowerCase();
            const ignoreTags = ["input", "textarea", "select", "button"];
            if (!ignoreTags.includes(tagName) && barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    // Helper for robust barcode matching
    const findProductByCode = (code) => {
        if (!code) return null;
        const normalized = code.trim().toLowerCase();
        
        // 1. Exact match (barcode or product_code)
        let found = products.find(p => 
            (p.barcode || "").trim().toLowerCase() === normalized || 
            (p.product_code || "").trim().toLowerCase() === normalized
        );

        // 2. Fallback: If no exact match, allow startsWith match for barcodes
        // This handles cases where a zero might be missing (e.g. SPM00200000 scanned vs SPM002000000 in DB)
        if (!found) {
            found = products.find(p => 
                (p.barcode || "").trim().toLowerCase().startsWith(normalized) ||
                (p.product_code || "").trim().toLowerCase().startsWith(normalized)
            );
        }
        return found;
    };

    // Camera scanner — auto-starts as soon as modal opens
    useEffect(() => {
        if (!showCameraScanner) {
            // Stop camera when modal closes
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.stop().catch(() => {});
                html5QrcodeRef.current = null;
            }
            setCameraStatus("idle");
            return;
        }

        setCameraStatus("starting");
        const qrCode = new Html5Qrcode("reader");
        html5QrcodeRef.current = qrCode;
        let isScanned = false; // Lock to prevent multiple rapid scans

        // Simple checkout beep sound
        const playBeep = () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) { console.error(e) }
        };

        const onSuccess = (decodedText) => {
            if (isScanned) return; // Ignore subsequent frames once we got a match

            const code = decodedText.trim();
            const product = findProductByCode(code);

            if (!product) {
                isScanned = true;
                toast.error(`❌ "${code}" — not registered`);
                setLastScannedCode(code);
                setTimeout(() => { isScanned = false; }, 2000); // Cool down
                return;
            }
            if (isOutOfStock(product)) {
                isScanned = true;
                toast.error(`"${product.name}" is out of stock`);
                setTimeout(() => { isScanned = false; }, 2000);
                return;
            }

            // SUCCESS! Lock the scanner
            isScanned = true;
            setLastScannedCode(code);
            playBeep();

            const variant = product.variants?.length > 0 ? product.variants[0] : null;
            
            // Add to bill immediately
            if (addItemToBillRef.current) {
                addItemToBillRef.current(product, variant);
            }
            toast.success(`✅ Added: ${product.name}${variant ? ` (${variant.quantity} ${variant.unit})` : ""}`);

            // CONTINUOUS SCANNING: Do not close the modal!
            // Wait 1.5 seconds, then unlock the scanner to allow the NEXT product to be scanned.
            setTimeout(() => { 
                isScanned = false; 
            }, 1500);
        };

        qrCode.start(
            { facingMode: "environment" },   // back camera first
            { fps: 10, qrbox: { width: 320, height: 160 }, aspectRatio: 1.333 },
            onSuccess,
            () => {}   // ignore per-frame decode errors
        )
        .then(() => setCameraStatus("active"))
        .catch(() => {
            // Fallback: try any available camera
            qrCode.start(
                { facingMode: "user" },
                { fps: 10, qrbox: { width: 320, height: 160 } },
                onSuccess,
                () => {}
            )
            .then(() => setCameraStatus("active"))
            .catch(() => {
                setCameraStatus("error");
                toast.error("Camera access denied. Allow camera permissions in browser.");
            });
        });

        // Cleanup function for when component unmounts or effect re-runs
        return () => {
            isScanned = true; // prevent any pending onSuccess calls
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.stop().catch(() => {});
                html5QrcodeRef.current = null;
            }
        };
    }, [showCameraScanner]);


    const filteredProducts = (products || []).filter(p => {
        const rawSearch = productSearchTerm.trim().toLowerCase();
        const productName = (p.name || "").toString().toLowerCase();
        const productCode = (p.product_code || "").toString().toLowerCase();
        const barcode = (p.barcode || "").toString().toLowerCase();
        
        return !rawSearch || productName.includes(rawSearch) || productCode.includes(rawSearch) || barcode.includes(rawSearch);
    });

    const liveSearchResults = productSearchTerm.trim() !== "" ? filteredProducts.slice(0, 8) : [];

    const startVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice search not supported in this browser");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = voiceLang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setProductSearchTerm(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                toast.error('Please allow microphone access for voice search');
            } else {
                toast.error('Voice search failed, please try typing');
            }
        };
    };

    const isOutOfStock = (product) => (product.total_stock ?? 0) <= 2;

    const handleBarcodeScan = (e) => {
        if (e.key === 'Enter') {
            const code = e.target.value.trim();
            if (code) {
                const product = findProductByCode(code);

                if (product) {
                    if (isOutOfStock(product)) {
                        toast.error(`"${product.name}" is out of stock`);
                    } else {
                        const variant = product.variants?.length > 0 ? product.variants[0] : null;
                        addItemToBill(product, variant);
                        toast.success(`✅ Added: ${product.name}${variant ? ` (${variant.quantity} ${variant.unit})` : ""}`);
                    }
                } else {
                    toast.error(`Product not found for code: "${code}"`);
                }
                e.target.value = "";
            }
        }
    };

    const getProductImage = (product) => {
        try {
            let imgUrl = null;
            
            if (product.thumbnail_image) {
                imgUrl = product.thumbnail_image;
            }
            
            if (!imgUrl && product.product_images) {
                const images = typeof product.product_images === 'string' ? JSON.parse(product.product_images) : (product.product_images || []);
                if (Array.isArray(images) && images.length > 0) imgUrl = images[0];
            }

            if (!imgUrl) return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=random`;
            if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
            return `${backendUrl}${cleanPath}`;
        } catch (e) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=random`;
        }
    };

    const handleProductClick = (product) => {
        if (isOutOfStock(product)) {
            toast.error(`"${product.name}" is out of stock`);
            return;
        }
        setSelectedProduct(product);
        if (product.variants && product.variants.length > 0) {
            setShowVariantModal(true);
        } else {
            addItemToBill(product, null);
        }
    };

    const addItemToBill = (product, variant) => {
        setFormData(prev => {
            const itemId = variant ? `${product.id}-${variant.quantity}-${variant.unit}` : product.id;
            
            const existingItemIndex = prev.items.findIndex(item => item.id === itemId);
            if (existingItemIndex !== -1) {
                const updatedItems = [...prev.items];
                updatedItems[existingItemIndex].quantity += 1;
                updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
                const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
                toast.success(`Increased quantity to ${updatedItems[existingItemIndex].quantity}`);
                return {
                    ...prev,
                    items: updatedItems,
                    total_amount: updatedTotal
                };
            }

            const price = variant ? parseFloat(variant.sellingPrice || variant.mrp || 0) : parseFloat(product.offer_price || product.price || 0);
            const newItem = {
                id: itemId,
                product_id: product.id,
                name: variant ? `${product.name} (${variant.quantity} ${variant.unit})` : product.name,
                price: price,
                quantity: 1,
                total: price,
                image: getProductImage(product),
                variant_info: variant ? { weight: variant.quantity, unit: variant.unit } : null
            };

            const updatedItems = [...prev.items, newItem];
            const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

            return {
                ...prev,
                items: updatedItems,
                total_amount: updatedTotal
            };
        });
        setShowVariantModal(false);
    };

    // Keep ref always pointing to latest addItemToBill (fixes stale closure in scanner)
    useEffect(() => {
        addItemToBillRef.current = addItemToBill;
    });

    const handleRemoveItem = (idx) => {
        const updatedItems = formData.items.filter((_, i) => i !== idx);
        updateTotal(updatedItems);
    };

    const handleQuantityChange = (idx, qty) => {
        const updatedItems = [...formData.items];
        updatedItems[idx].quantity = parseFloat(qty) || 1;
        updatedItems[idx].total = updatedItems[idx].price * updatedItems[idx].quantity;
        updateTotal(updatedItems);
    };

    const handleVariantChange = (idx, variantValue) => {
        const updatedItems = [...formData.items];
        const item = updatedItems[idx];
        const product = products.find(p => p.id === item.product_id);
        
        if (product && product.variants) {
            const [qty, unit] = variantValue.split('-');
            const newVariant = product.variants.find(v => v.quantity == qty && v.unit === unit);
            
            if (newVariant) {
                const newId = `${product.id}-${newVariant.quantity}-${newVariant.unit}`;
                
                // Check if this variant is already in another row
                const existingIndex = updatedItems.findIndex((it, i) => i !== idx && it.id === newId);
                if (existingIndex !== -1) {
                    // Merge into existing and remove this row
                    updatedItems[existingIndex].quantity += item.quantity;
                    updatedItems[existingIndex].total = updatedItems[existingIndex].price * updatedItems[existingIndex].quantity;
                    updatedItems.splice(idx, 1);
                } else {
                    const price = parseFloat(newVariant.sellingPrice || newVariant.mrp || 0);
                    item.id = newId;
                    item.name = `${product.name} (${newVariant.quantity} ${newVariant.unit})`;
                    item.variant_info = { weight: newVariant.quantity, unit: newVariant.unit };
                    item.price = price;
                    item.total = price * item.quantity;
                }
                updateTotal(updatedItems);
            }
        }
    };

    const updateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        setFormData(p => ({ ...p, items, total_amount: total }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customer_name || !formData.customer_phone) return toast.error("Enter customer details");
        if (formData.items.length === 0) return toast.error("Add products to bill");
        setLoading(true);
        try {
            await api.post("/orders", formData);
            toast.success("Bill finalized!");
            setTimeout(() => navigate("/admin/billing"), 1200);
        } catch (error) {
            toast.error("Failed to generate bill");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectItem = (product) => {
        setSelectedItems(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) return prev.filter(p => p.id !== product.id);
            return [...prev, product];
        });
    };

    const addSelectedToBill = () => {
        setFormData(prev => {
            const currentItems = [...prev.items];
            let addedCount = 0;

            selectedItems.forEach(p => {
                const variant = (p.variants && p.variants.length > 0) ? p.variants[0] : null;
                const itemId = variant ? `${p.id}-${variant.quantity}-${variant.unit}` : p.id;

                const existingItemIndex = currentItems.findIndex(item => item.id === itemId);
                if (existingItemIndex !== -1) {
                    currentItems[existingItemIndex].quantity += 1;
                    currentItems[existingItemIndex].total = currentItems[existingItemIndex].price * currentItems[existingItemIndex].quantity;
                    addedCount++;
                } else {
                    const price = variant ? parseFloat(variant.sellingPrice || variant.mrp || 0) : parseFloat(p.offer_price || p.price || 0);
                    const newItem = {
                        id: itemId,
                        product_id: p.id,
                        name: variant ? `${p.name} (${variant.quantity} ${variant.unit})` : p.name,
                        price: price,
                        quantity: 1,
                        total: price,
                        image: getProductImage(p),
                        variant_info: variant ? { weight: variant.quantity, unit: variant.unit } : null
                    };
                    currentItems.push(newItem);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                toast.success(`Processed ${addedCount} items`);
                return {
                    ...prev,
                    items: currentItems,
                    total_amount: currentItems.reduce((sum, i) => sum + i.total, 0)
                };
            } else {
                toast.error("No items were added");
                return prev;
            }
        });

        setSelectedItems([]);
        setSelectMode(false);
    };


    return (
        <div className="pb-20 p-2 md:p-6 bg-slate-50 min-h-screen">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <input ref={barcodeInputRef} type="text" className="opacity-0 fixed pointer-events-none" onKeyDown={handleBarcodeScan} autoFocus />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"><FiArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">New Bill</h1>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Quick Billing System</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCameraScanner(true)} className="p-3 bg-white border border-blue-100 rounded-2xl text-blue-500 hover:bg-blue-50 transition-all flex items-center gap-2">
                        <FiCamera size={18} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Camera</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Product Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FiUser className="text-blue-600" /> Order & Customer Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <select value={formData.order_type} onChange={(e) => setFormData(p => ({ ...p, order_type: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="Shop">Shop Order</option>
                                    <option value="Online">Online Order</option>
                                </select>
                                <select value={formData.payment_method} onChange={(e) => setFormData(p => ({ ...p, payment_method: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                </select>
                                <select value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="Delivered">Delivered</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Order Placed">Order Placed</option>
                                </select>
                                <input type="text" placeholder="Customer Name" value={formData.customer_name} onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold md:col-span-1" />
                                <input type="text" placeholder="Customer Phone" value={formData.customer_phone} onChange={(e) => setFormData(p => ({ ...p, customer_phone: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold md:col-span-2" />
                            </div>
                            {formData.order_type === 'Online' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-gray-100 pt-6 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipping Address</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="Street Address" 
                                            value={formData.shipping_address.street} 
                                            onChange={(e) => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, street: e.target.value } }))} 
                                            className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold outline-none md:col-span-2" 
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="City" 
                                            value={formData.shipping_address.city} 
                                            onChange={(e) => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, city: e.target.value } }))} 
                                            className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold outline-none" 
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="District" 
                                            value={formData.shipping_address.district} 
                                            onChange={(e) => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, district: e.target.value } }))} 
                                            className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold outline-none" 
                                        />
                                        <select 
                                            value={formData.shipping_address.state} 
                                            onChange={(e) => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, state: e.target.value } }))} 
                                            className="w-full px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                        >
                                            <option value="">Select State</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                            <option value="Telangana">Telangana</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Delhi">Delhi</option>
                                        </select>
                                        <div className="flex gap-4">
                                            <input 
                                                type="text" 
                                                placeholder="Zip Code" 
                                                value={formData.shipping_address.zip} 
                                                onChange={(e) => setFormData(p => ({ ...p, shipping_address: { ...p.shipping_address, zip: e.target.value } }))} 
                                                className="w-full flex-1 px-5 py-3.5 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm font-bold outline-none" 
                                            />
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={formData.shipping_address.country} 
                                                className="w-full flex-1 px-5 py-3.5 bg-gray-100 rounded-xl border-2 border-transparent text-sm font-bold text-slate-400 outline-none cursor-not-allowed" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <FiPackage className="text-blue-500" /> Products
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectMode(!selectMode);
                                            if (selectMode) setSelectedItems([]);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectMode ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                    >
                                        {selectMode ? "Cancel" : "Select Multiple"}
                                    </button>
                                    {selectMode && selectedItems.length > 0 && (
                                        <button
                                            onClick={addSelectedToBill}
                                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md"
                                        >
                                            Add {selectedItems.length}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 relative">
                                <div className="relative flex-1">
                                    <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search product name or code..."
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.toLowerCase().trim();
                                                if (!val) return;
                                                
                                                // 1. Check for exact barcode or product_code match first (using the robust helper)
                                                const exactMatch = findProductByCode(val);
                                                
                                                // 2. If no exact match, fallback to the first partial match
                                                const matched = exactMatch ? [exactMatch] : products.filter(p => 
                                                    (p.name || "").toString().toLowerCase().includes(val) || 
                                                    (p.product_code || "").toString().toLowerCase().includes(val) || 
                                                    (p.barcode || "").toString().toLowerCase().includes(val)
                                                );

                                                if (matched.length > 0) {
                                                    const p = matched[0];
                                                    if (selectMode) {
                                                        toggleSelectItem(p);
                                                    } else {
                                                        // Fast lane: Enter always adds the top result instantly
                                                        if (isOutOfStock(p)) {
                                                            toast.error(`"${p.name}" is out of stock`);
                                                        } else {
                                                            const variant = p.variants?.length > 0 ? p.variants[0] : null;
                                                            addItemToBill(p, variant);
                                                            toast.success(`✅ Added: ${p.name}`);
                                                            setProductSearchTerm("");
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-sm outline-none font-bold"
                                    />

                                    {liveSearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest px-3">Quick Select</p>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto">
                                                {liveSearchResults.map(p => {
                                                    const oos = isOutOfStock(p);
                                                    return (
                                                    <button
                                                        key={p.id}
                                                        disabled={oos}
                                                        onClick={() => {
                                                            if (oos) return;
                                                            if (selectMode) {
                                                                toggleSelectItem(p);
                                                            } else {
                                                                handleProductClick(p);
                                                                setProductSearchTerm("");
                                                            }
                                                        }}
                                                        className={`w-full px-5 py-3 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 group text-left
                                                            ${oos ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50 cursor-pointer'}
                                                            ${!oos && selectMode && selectedItems.find(si => si.id === p.id) ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center p-1 overflow-hidden border border-gray-100">
                                                                <img src={getProductImage(p)} alt="" className={`w-full h-full object-contain ${oos ? 'grayscale' : ''}`} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-bold uppercase transition-colors ${oos ? 'text-gray-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>{p.name}</p>
                                                                <p className="text-[10px] font-black text-gray-400"># {p.product_code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {oos ? (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm font-black text-slate-800">₹{parseFloat(p.offer_price || p.price || 0)}</p>
                                                                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">{p.total_stock} Units</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </button>
                                                );})}

                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={voiceLang}
                                        onChange={(e) => setVoiceLang(e.target.value)}
                                        className="bg-white border border-gray-200 rounded-xl text-[10px] font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ta-IN">Tamil</option>
                                        <option value="en-US">English</option>
                                    </select>
                                    <button
                                        onClick={startVoiceSearch}
                                        className={`p-3 rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-50 text-blue-500'}`}
                                        title="Voice search"
                                    >
                                        <FiMic size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {filteredProducts.slice(0, 12).map(p => {
                                    const oos = isOutOfStock(p);
                                    return (
                                    <button
                                        key={p.id}
                                        disabled={oos}
                                        onClick={() => {
                                            if (oos) return;
                                            selectMode ? toggleSelectItem(p) : handleProductClick(p);
                                        }}
                                        className={`p-3 rounded-2xl text-left transition-all border group relative
                                            ${oos
                                                ? 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed'
                                                : selectMode && selectedItems.find(si => si.id === p.id)
                                                    ? 'bg-blue-50 border-blue-200 cursor-pointer'
                                                    : 'bg-gray-50 border-transparent hover:bg-white hover:shadow-xl hover:border-blue-100 cursor-pointer'
                                            }`}
                                    >
                                        {/* Out of stock badge */}
                                        {oos && (
                                            <div className="absolute top-2 left-0 right-0 flex justify-center z-10 px-1">
                                                <span className="text-[8px] font-black uppercase tracking-wide text-white bg-red-500 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                                                    Out of Stock
                                                </span>
                                            </div>
                                        )}
                                        {/* Select checkbox — only for in-stock */}
                                        {selectMode && !oos && (
                                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedItems.find(si => si.id === p.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                                                {selectedItems.find(si => si.id === p.id) && <FiCheckCircle className="text-white" size={12} />}
                                            </div>
                                        )}
                                        <div className="aspect-square bg-white rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2">
                                            <img src={getProductImage(p)} alt={p.name} className={`w-full h-full object-contain ${oos ? 'grayscale' : ''}`} />
                                        </div>
                                        <p className={`text-[10px] font-black line-clamp-1 uppercase whitespace-normal ${oos ? 'text-gray-400' : ''}`}>{p.name}</p>
                                        {oos ? (
                                            <p className="text-[9px] font-black text-red-400 mt-1">Low / No Stock</p>
                                        ) : (
                                            <p className="text-[10px] font-bold text-blue-500 mt-1 italic">₹{parseFloat(p.offer_price || p.price || 0)}</p>
                                        )}
                                    </button>
                                );})}

                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400"><FiLayers className="text-blue-500" /> Bill Items</h3>
                            <div className="overflow-x-auto min-h-[250px]">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-slate-400 border-b border-gray-100 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-4 py-4 w-12 text-center">#</th>
                                            <th className="px-4 py-4">Product</th>
                                            <th className="px-4 py-4">Weight</th>
                                            <th className="px-4 py-4">Price</th>
                                            <th className="px-4 py-4 w-20">Qty</th>
                                            <th className="px-4 py-4 text-right">Total</th>
                                            <th className="px-4 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.items.length === 0 ? (
                                            <tr><td colSpan={7} className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-slate-500">No Items Added</td></tr>
                                        ) : formData.items.map((item, i) => {
                                            const product = products.find(p => p.id === item.product_id);
                                            const hasVariants = product && product.variants && product.variants.length > 0;
                                            return (
                                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="px-4 py-4 text-center font-black text-slate-400">{i + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
                                                            <img src={getProductImage(product)} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 leading-tight">{product ? product.name : item.name}</p>
                                                            {product && <p className="text-[9px] font-black text-gray-400 mt-0.5 uppercase tracking-widest">{product.product_code}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {hasVariants ? (
                                                        <select
                                                            value={item.variant_info ? `${item.variant_info.weight}-${item.variant_info.unit}` : ""}
                                                            onChange={(e) => handleVariantChange(i, e.target.value)}
                                                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-[10px] text-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                                        >
                                                            {product.variants.map((v, vIdx) => (
                                                                <option className="bg-white text-slate-800 font-bold" key={vIdx} value={`${v.quantity}-${v.unit}`}>
                                                                    {v.quantity} {v.unit}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="opacity-40 text-slate-400 font-bold">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-slate-500 font-bold">₹{item.price}</td>
                                                <td className="px-4 py-4"><input type="number" min="0.001" step="any" value={item.quantity} onChange={(e) => handleQuantityChange(i, e.target.value)} className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-2 text-center py-1.5 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></td>
                                                <td className="px-4 py-4 text-right font-black text-slate-800 text-sm">₹{item.total}</td>
                                                <td className="px-4 py-4 text-center"><button onClick={() => handleRemoveItem(i)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><FiTrash2 size={16} /></button></td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl sticky top-6 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-black uppercase text-gray-400 tracking-widest"><span>Subtotal</span> <span className="text-slate-800">₹{formData.total_amount}</span></div>
                                <div className="flex justify-between items-center text-xs font-black uppercase text-gray-400 tracking-widest"><span>Items</span> <span className="text-slate-800">{formData.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
                                <div className="flex justify-between items-center text-xs font-black uppercase text-emerald-500 tracking-widest"><span>Tax (0%)</span> <span className="text-emerald-600">₹0</span></div>
                            </div>
                            <div className="pt-8 border-t border-gray-50"><p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] mb-2 text-center text-blue-400">Grand Total</p><h2 className="text-5xl font-black text-center text-slate-800 tracking-tighter italic">₹{formData.total_amount}</h2></div>
                            <button onClick={handleSubmit} disabled={loading || formData.items.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-100 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-3">
                                {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <><FiCheckCircle size={22} /> <span>Finish Bill</span></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showVariantModal && selectedProduct && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-1">
                                    <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">{selectedProduct.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                                        Code: {selectedProduct.product_code} &nbsp;|&nbsp; Barcode: {selectedProduct.barcode}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowVariantModal(false)} className="text-gray-300 hover:text-red-400 transition-colors"><FiX size={20} /></button>
                        </div>

                        {/* Barcode image row */}
                        {selectedProduct.barcode_image && (
                            <div className="px-6 pt-4 flex items-center gap-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex-shrink-0">
                                    <img
                                        src={selectedProduct.barcode_image}
                                        alt="barcode"
                                        className="h-14 object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Scan this barcode</p>
                                    <p className="text-xs font-bold text-slate-700 font-mono">{selectedProduct.barcode}</p>
                                </div>
                            </div>
                        )}

                        {/* Variants */}
                        <div className="p-4 space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1 mb-3">Select a variant to add to bill</p>
                            {selectedProduct.variants?.map((v, i) => (
                                <button
                                    key={i}
                                    onClick={() => addItemToBill(selectedProduct, v)}
                                    className="w-full p-4 bg-gray-50 rounded-2xl flex justify-between items-center hover:bg-blue-50 border-2 border-transparent hover:border-blue-100 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="font-black text-sm text-slate-800 group-hover:text-blue-700">{v.quantity} {v.unit}</p>
                                        <p className="text-[9px] font-black uppercase text-gray-400 mt-0.5">Stock: {v.stock ?? "—"}</p>
                                    </div>
                                    <div className="text-right">
                                        {v.mrp && v.sellingPrice && parseFloat(v.mrp) > parseFloat(v.sellingPrice) && (
                                            <p className="text-[9px] text-gray-400 line-through">₹{v.mrp}</p>
                                        )}
                                        <p className="font-black text-blue-600 text-base">₹{v.sellingPrice || v.mrp}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showCameraScanner && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl">

                        {/* Header */}
                        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-500 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-white text-base flex items-center gap-2">
                                    <FiCamera /> Barcode Scanner
                                </h3>
                                <p className="text-[9px] uppercase tracking-widest text-blue-100 mt-0.5">
                                    {cameraStatus === "starting" && "Starting camera..."}
                                    {cameraStatus === "active" && "Point at barcode to scan"}
                                    {cameraStatus === "error" && "Camera not available"}
                                    {cameraStatus === "idle" && "Initializing..."}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCameraScanner(false)}
                                className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-xl transition-all"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Camera viewport */}
                        <div className="relative bg-black">
                            {/* The html5-qrcode renders the video into this div */}
                            <div id="reader" className="w-full" style={{ minHeight: 260 }} />

                            {/* Scanning animation overlay (shown while active) */}
                            {cameraStatus === "active" && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="relative w-[320px] h-[160px]">
                                        {/* Scanning line animation only (corners are handled natively by html5-qrcode) */}
                                        <div className="absolute left-1 right-1 h-0.5 bg-blue-400 opacity-80 animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.8)]" style={{ top: "50%" }} />
                                    </div>
                                </div>
                            )}

                            {/* Starting spinner */}
                            {cameraStatus === "starting" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-white text-xs font-bold">Opening camera...</p>
                                </div>
                            )}

                            {/* Error state */}
                            {cameraStatus === "error" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-6">
                                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <FiCamera className="text-red-400" size={28} />
                                    </div>
                                    <p className="text-white text-sm font-bold text-center">Camera access denied</p>
                                    <p className="text-gray-400 text-[11px] text-center">Click the camera icon in your browser address bar and allow camera access, then try again.</p>
                                    <button
                                        onClick={() => { setShowCameraScanner(false); setTimeout(() => setShowCameraScanner(true), 300); }}
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer — manual code entry fallback */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                            {lastScannedCode && (
                                <p className="text-[10px] text-gray-400 font-bold mb-2">
                                    Last scanned: <span className="font-black text-slate-700 font-mono">{lastScannedCode}</span>
                                </p>
                            )}
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Or type barcode manually</p>
                            <div className="flex gap-2">
                                <input
                                    id="manual-barcode-input"
                                    type="text"
                                    placeholder="e.g. SPM001000000"
                                    className="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const code = e.target.value.trim();
                                            if (!code) return;
                                            const product = findProductByCode(code);
                                            if (!product) { toast.error(`"${code}" not found`); return; }
                                            if (isOutOfStock(product)) { toast.error(`"${product.name}" is out of stock`); return; }
                                            const variant = product.variants?.length > 0 ? product.variants[0] : null;
                                            if (addItemToBillRef.current) addItemToBillRef.current(product, variant);
                                            toast.success(`✅ Added: ${product.name}`);
                                            setShowCameraScanner(false);
                                            e.target.value = "";
                                        }
                                    }}
                                />
                                <button
                                    className="px-3 py-2 bg-blue-500 text-white rounded-xl text-xs font-black"
                                    onClick={() => {
                                        const inp = document.getElementById("manual-barcode-input");
                                        if (inp) inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                                    }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateBilling;
