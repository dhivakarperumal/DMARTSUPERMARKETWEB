import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import PageHeader from "../CommenComponents/PageHeader";
import toast from "react-hot-toast";
import { FiMapPin, FiPackage, FiCreditCard, FiShield, FiCheckCircle } from "react-icons/fi";
import PageContainer from "../CommenComponents/PageContainer";

const Checkout = () => {
  const { cart, clearCart } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [onlinePaymentType, setOnlinePaymentType] = useState("upi");
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowProduct = location.state?.product;
  const buyNowVariant = location.state?.variant;
  const buyNowSize = location.state?.size;
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState({ loading: false, error: "", distanceKm: null });
  const [deliveryCharges, setDeliveryCharges] = useState(null);
  const [deliveryChargeError, setDeliveryChargeError] = useState("");
  const [taxSettings, setTaxSettings] = useState(null);
  const [taxAmount, setTaxAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const buyNowQuantity = location.state?.quantity || 1;
  const [locationData, setLocationData] = useState({
    address: "",
    latitude: "",
    longitude: "",
  });

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = trimmed.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const normalizeImageList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [value];
      }
    }
    return [value];
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get(`/addresses/user/${user.user_id}`);
      const userAddresses = res.data || [];
      setAddresses(userAddresses);

      const defaultAddr = userAddresses.find((a) => a.is_default) || userAddresses[0];
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
        setForm((prev) => ({
          ...prev,
          customer_name: defaultAddr.customer_name || "",
          customer_email: defaultAddr.customer_email || "",
          customer_phone: defaultAddr.customer_phone || "",
          street_address: defaultAddr.street_address || "",
          city: defaultAddr.city || "",
          district: defaultAddr.district || "",
          state: defaultAddr.state || "",
          country: defaultAddr.country || "India",
          zip_code: defaultAddr.zip_code || "",
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectAddress = (address) => {
    setSelectedAddress(address.id);
    setForm((prev) => ({
      ...prev,
      customer_name: address.customer_name,
      customer_email: address.customer_email || "",
      customer_phone: address.customer_phone || "",
      street_address: address.street_address,
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      country: address.country || "India",
      zip_code: address.zip_code || "",
    }));
  };

  useEffect(() => {
    if (user?.user_id) fetchAddresses();
  }, [user]);

  const fetchDeliveryCharges = async () => {
    try {
      const res = await api.get("/delivery-charges");
      console.log("Delivery charges API response:", res.data);

      let chargesData = null;
      // API returns { success: true, data: settings }
      if (res.data?.data) {
        chargesData = res.data.data;
      } else if (res.data && !res.data.success) {
        // Fallback: handle both array and object responses
        if (Array.isArray(res.data)) {
          chargesData = res.data.length > 0 ? res.data[0] : null;
        } else if (typeof res.data === 'object') {
          chargesData = res.data;
        }
      }

      if (chargesData && chargesData.id) {
        setDeliveryCharges(chargesData);
        console.log("Delivery charges set to:", chargesData);
        setDeliveryChargeError("");
      } else {
        console.warn("No delivery charges data found");
        setDeliveryChargeError("No delivery charges configured");
      }
    } catch (error) {
      console.error("Error fetching delivery charges:", error);
      setDeliveryChargeError("Unable to fetch delivery charges");
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await api.get("/settings/payment");
      if (response.data?.success && response.data?.data) {
        const dbData = response.data.data;
        const mappedSettings = {
          cashSupport: dbData.cash_support !== 0 && dbData.cash_support !== "0",
          onlinePaymentSupport: dbData.online_payment_support !== 0 && dbData.online_payment_support !== "0",
          upiSupport: dbData.upi_support !== 0 && dbData.upi_support !== "0",
          paymentType: dbData.payment_type || "upi",
          razorpayEnabled: dbData.razorpay_enabled !== 0 && dbData.razorpay_enabled !== "0",
          razorpayKey: dbData.razorpay_key || "",
          cardNumber: dbData.card_number || "",
          cardExpiry: dbData.card_expiry || "",
          cardCvv: dbData.card_cvv || "",
        };
        setPaymentSettings(mappedSettings);
        const availableMethods = [];
        if (mappedSettings.cashSupport) availableMethods.push("cash");
        if (mappedSettings.onlinePaymentSupport) availableMethods.push("online");
        if (availableMethods.length === 1) {
          setPaymentMethod(availableMethods[0]);
        }
        setOnlinePaymentType("upi");
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const fetchTaxSettings = async () => {
    try {
      // Try to use locally cached store settings first (saved from admin settings)
      const cached = localStorage.getItem('store_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setStoreSettings(parsed);
        } catch (e) {
          console.warn('Failed to parse cached store settings', e);
        }
      }

      const response = await api.get("/settings/store");
      if (response.data?.success && response.data?.data) {
        if (Object.keys(response.data.data).length > 0) {
          setStoreSettings(response.data.data);
          try {
            localStorage.setItem('store_settings', JSON.stringify(response.data.data));
          } catch (e) {
            console.warn('Unable to persist store settings to localStorage', e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
    }
  };

  useEffect(() => {
    fetchDeliveryCharges();
    fetchPaymentSettings();
    fetchTaxSettings();
  }, []);

  // Recalculate delivery charge when distance or charges change
  useEffect(() => {
    if (distanceInfo.distanceKm && deliveryCharges) {
      console.log("Recalculating delivery charge with distance:", distanceInfo.distanceKm, "and charges:", deliveryCharges);
    }
  }, [distanceInfo.distanceKm, deliveryCharges]);

  // Check if user is a new customer and auto-apply coupon
  useEffect(() => {
    const checkAndApplyNewCustomerCoupon = async () => {
      try {
        // Check if user has any previous orders
        const userOrders = await api.get(`/orders/user/${user?.user_id}`);
        const isNewCustomer = !userOrders.data || userOrders.data.length === 0;

        if (isNewCustomer) {
          // Fetch coupons
          const couponsRes = await api.get("/coupons");
          const newCustomerCoupons = couponsRes.data?.coupons?.filter(
            (c) => c.coupon_scope === "new_customers_only" && c.status === "active"
          );

          if (newCustomerCoupons && newCustomerCoupons.length > 0) {
            const coupon = newCustomerCoupons[0];
            setAppliedCoupon(coupon);
            setCouponCode(coupon.code);
            toast.success(`Welcome! Coupon "${coupon.code}" automatically applied`);
            console.log("Auto-applied new customer coupon:", coupon);
          }
        }
      } catch (error) {
        console.error("Error checking new customer status:", error);
      }
    };

    if (user?.user_id) {
      checkAndApplyNewCustomerCoupon();
    }
  }, [user?.user_id]);

  const checkoutItems = buyNowProduct
    ? [
      {
        id: buyNowProduct.id,
        name: buyNowProduct.name,
        image: (() => {
          const vImages = normalizeImageList(buyNowVariant?.images);
          if (vImages.length > 0) return vImages[0];
          const pImages = normalizeImageList(buyNowProduct?.images);
          if (pImages.length > 0) return pImages[0];
          const tImage = normalizeImageList(buyNowProduct?.thumbnail_image);
          if (tImage.length > 0) return tImage[0];
          const pProdImages = normalizeImageList(buyNowProduct?.product_images);
          if (pProdImages.length > 0) return pProdImages[0];
          return "/placeholder.png";
        })(),
        price: buyNowProduct.offer_price || buyNowProduct.price,
        quantity: buyNowQuantity,
        size: buyNowSize,
        colorName: buyNowVariant?.color,
      },
    ]
    : cart;

  // Validate applied coupon when cart changes
  useEffect(() => {
    if (!appliedCoupon || checkoutItems.length === 0) return;

    const validateAppliedCoupon = () => {
      // For specific products coupons
      if (appliedCoupon.coupon_scope === "specific_products") {
        try {
          let applicableProductIds = [];
          if (typeof appliedCoupon.applicable_product_ids === "string") {
            applicableProductIds = JSON.parse(appliedCoupon.applicable_product_ids);
          } else if (Array.isArray(appliedCoupon.applicable_product_ids)) {
            applicableProductIds = appliedCoupon.applicable_product_ids;
          }

          const hasApplicableProduct = checkoutItems.some(item => {
            const itemProductId = item.product_id || item.id;
            return applicableProductIds.includes(parseInt(itemProductId));
          });

          if (!hasApplicableProduct) {
            setCouponError("Applied coupon is no longer valid for your cart");
            setAppliedCoupon(null);
            setCouponCode("");
          }
        } catch (err) {
          console.error("Error validating coupon on cart change:", err);
        }
      }

      // For specific categories coupons
      if (appliedCoupon.coupon_scope === "specific_categories") {
        try {
          let applicableCategoryIds = [];
          if (typeof appliedCoupon.applicable_category_ids === "string") {
            applicableCategoryIds = JSON.parse(appliedCoupon.applicable_category_ids);
          } else if (Array.isArray(appliedCoupon.applicable_category_ids)) {
            applicableCategoryIds = appliedCoupon.applicable_category_ids;
          }

          const hasApplicableCategory = checkoutItems.some(item => {
            const itemCategoryId = item.category_id || item.categoryId;
            return itemCategoryId && applicableCategoryIds.includes(parseInt(itemCategoryId));
          });

          if (!hasApplicableCategory) {
            setCouponError("Applied coupon is no longer valid for your cart");
            setAppliedCoupon(null);
            setCouponCode("");
          }
        } catch (err) {
          console.error("Error validating coupon on cart change:", err);
        }
      }
    };

    validateAppliedCoupon();
  }, [checkoutItems, appliedCoupon]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await api.get("/coupons");
      const coupons = res.data?.coupons || [];

      const coupon = coupons.find(
        (c) => c.code.toLowerCase() === couponCode.toLowerCase() && c.status === "active"
      );

      if (!coupon) {
        setCouponError("Invalid or inactive coupon code");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      // Check expiry
      if (new Date(coupon.expiry_date) < new Date()) {
        setCouponError("This coupon has expired");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      // Check minimum order value
      if (subtotal < parseFloat(coupon.min_order_value)) {
        setCouponError(`Minimum order value should be ₹${coupon.min_order_value}`);
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      // Check if new customer coupon
      if (coupon.coupon_scope === "new_customers_only") {
        try {
          const userOrders = await api.get(`/orders/user/${user?.user_id}`);
          if (userOrders.data && userOrders.data.length > 0) {
            setCouponError("This coupon is only for new customers");
            setAppliedCoupon(null);
            setCouponLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error checking customer orders:", err);
        }
      }

      // Check if specific products coupon
      if (coupon.coupon_scope === "specific_products") {
        try {
          let applicableProductIds = [];

          // Parse applicable_product_ids - handle both JSON string and array formats
          if (typeof coupon.applicable_product_ids === "string") {
            applicableProductIds = JSON.parse(coupon.applicable_product_ids);
          } else if (Array.isArray(coupon.applicable_product_ids)) {
            applicableProductIds = coupon.applicable_product_ids;
          }

          if (applicableProductIds.length > 0) {
            // Check if any cart item matches the applicable products
            const hasApplicableProduct = checkoutItems.some(item => {
              const itemProductId = item.product_id || item.id;
              return applicableProductIds.includes(parseInt(itemProductId));
            });

            if (!hasApplicableProduct) {
              setCouponError(`This coupon is only applicable for specific products. Your cart doesn't contain eligible products.`);
              setAppliedCoupon(null);
              setCouponLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error parsing product IDs:", err);
        }
      }

      // Check if specific categories coupon
      if (coupon.coupon_scope === "specific_categories") {
        try {
          let applicableCategoryIds = [];

          // Parse applicable_category_ids - handle both JSON string and array formats
          if (typeof coupon.applicable_category_ids === "string") {
            applicableCategoryIds = JSON.parse(coupon.applicable_category_ids);
          } else if (Array.isArray(coupon.applicable_category_ids)) {
            applicableCategoryIds = coupon.applicable_category_ids;
          }

          if (applicableCategoryIds.length > 0) {
            // Check if any cart item matches the applicable categories
            const hasApplicableCategory = checkoutItems.some(item => {
              const itemCategoryId = item.category_id || item.categoryId;
              return itemCategoryId && applicableCategoryIds.includes(parseInt(itemCategoryId));
            });

            if (!hasApplicableCategory) {
              setCouponError(`This coupon is only applicable for specific categories. Your cart doesn't contain eligible products.`);
              setAppliedCoupon(null);
              setCouponLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error parsing category IDs:", err);
        }
      }

      setAppliedCoupon(coupon);
      toast.success("Coupon applied successfully!");
      setCouponError("");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Error validating coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.success("Coupon removed");
  };

  const calculateDeliveryCharge = (distanceKm, orderSubtotal) => {
    if (!deliveryCharges) return { charge: 0, message: "Delivery charges not available" };

    // If delivery charges are disabled globally in admin, waive all fees
    if (deliveryCharges.is_enabled === 0 || deliveryCharges.is_enabled === false) {
      return { charge: 0, message: "Delivery charges are currently waived/disabled" };
    }

    if (distanceKm === null || distanceKm === undefined) return { charge: 0, message: "" };

    const baseCharge = parseFloat(deliveryCharges.base_delivery_charge) || 0;
    const perKmCharge = parseFloat(deliveryCharges.per_km_delivery_charge) || 0;
    const maxDistance = parseFloat(deliveryCharges.maximum_delivery_distance) || 100;
    const freeDeliveryThreshold = parseFloat(deliveryCharges.free_delivery_minimum_order_amount) || 0;
    const freeDeliveryKm = parseFloat(deliveryCharges.free_delivery_km) || 0;

    // Check if distance exceeds maximum delivery distance
    if (distanceKm > maxDistance) {
      return {
        charge: 0,
        message: `Delivery not available beyond ${maxDistance} km. Current distance: ${distanceKm} km`,
        isError: true,
      };
    }

    // Apply free delivery if order is above threshold
    if (orderSubtotal >= freeDeliveryThreshold) {
      return { charge: 0, message: `Free delivery on orders ₹${freeDeliveryThreshold} and above` };
    }

    // Apply free delivery if within free delivery distance
    if (freeDeliveryKm > 0 && distanceKm <= freeDeliveryKm) {
      return { charge: 0, message: `Free delivery for locations within ${freeDeliveryKm} km` };
    }

    // Calculate delivery charge
    const calculatedCharge = baseCharge + distanceKm * perKmCharge;
    return {
      charge: Math.round(calculatedCharge * 100) / 100,
      message: `Base ₹${baseCharge} + ${distanceKm}km × ₹${perKmCharge}/km`,
    };
  };

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const detectDistanceToShop = () => {
    if (!navigator.geolocation) {
      setDistanceInfo({ loading: false, error: "Location access is not supported by this browser.", distanceKm: null });
      return;
    }

    setDistanceInfo((prev) => ({ ...prev, loading: true, error: "" }));

    // Fetch user's current position and compute distance to shop using admin-configured storeSettings.
    navigator.permissions && navigator.permissions.query
      ? navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        if (perm.state === 'denied') {
          setDistanceInfo({ loading: false, error: 'Location permission is denied. Please enable location access in your browser.', distanceKm: null });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const userLat = position.coords.latitude;
              const userLng = position.coords.longitude;

              // Use shop coordinates only from storeSettings (do not overwrite or fetch them here)
              if (!storeSettings || !storeSettings.latitude || !storeSettings.longitude) {
                setDistanceInfo({ loading: false, error: 'Store location is not configured by admin.', distanceKm: null });
                return;
              }

              const shopLat = parseFloat(storeSettings.latitude);
              const shopLng = parseFloat(storeSettings.longitude);
              const distance = calculateDistanceKm(userLat, userLng, shopLat, shopLng);

              // attempt to refresh delivery charges
              try {
                const res = await api.get('/delivery-charges');
                if (res.data) setDeliveryCharges(Array.isArray(res.data) ? res.data[0] : res.data);
              } catch (err) { console.warn('Error fetching delivery charges', err); }

              // Reverse geocode to fill form address fields (user's address only)
              try {
                const reverseResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLat}&lon=${userLng}&addressdetails=1`
                );

                if (reverseResponse.ok) {
                  const reverseData = await reverseResponse.json();
                  const address = reverseData?.address || {};

                  const fullAddress =
                    reverseData.display_name ||
                    [
                      address.house_number,
                      address.road,
                      address.suburb,
                      address.city || address.town || address.village,
                      address.state,
                      address.postcode,
                      address.country,
                    ]
                      .filter(Boolean)
                      .join(", ");

                  setLocationData({
                    address: fullAddress,
                    latitude: userLat,
                    longitude: userLng,
                  });

                  setForm((prev) => ({
                    ...prev,
                    street_address:
                      [address.house_number, address.road, address.suburb]
                        .filter(Boolean)
                        .join(" ") || prev.street_address,
                    city:
                      address.city ||
                      address.town ||
                      address.village ||
                      prev.city,
                    district:
                      address.district ||
                      address.county ||
                      address.state_district ||
                      prev.district,
                    state: address.state || prev.state,
                    country: address.country || "India",
                    zip_code: address.postcode || prev.zip_code,
                  }));
                }
              } catch (err) { console.warn('Reverse geocode failed', err); }

              setDistanceInfo({ loading: false, error: '', distanceKm: Number(distance.toFixed(1)) });
            } catch (error) {
              console.error(error);
              setDistanceInfo({ loading: false, error: 'We could not calculate the distance right now.', distanceKm: null });
            }
          },
          (error) => {
            let message = 'We could not access your location.';
            if (error.code === 1) message = 'Location permission was denied. Please allow location access to see the distance.';
            else if (error.code === 2) message = 'Your location is currently unavailable.';
            else if (error.code === 3) message = 'Location request timed out.';
            setDistanceInfo({ loading: false, error: message, distanceKm: null });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      })
      : (() => {
        // Browser doesn't support permissions API; proceed to geolocation and hope for the best
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setLocationData({
              latitude: userLat,
              longitude: userLng,
              address: "",
            });
            if (!storeSettings || !storeSettings.latitude || !storeSettings.longitude) {
              setDistanceInfo({ loading: false, error: 'Store location is not configured by admin.', distanceKm: null });
              return;
            }
            const shopLat = parseFloat(storeSettings.latitude);
            const shopLng = parseFloat(storeSettings.longitude);
            const distance = calculateDistanceKm(userLat, userLng, shopLat, shopLng);
            setDistanceInfo({ loading: false, error: '', distanceKm: Number(distance.toFixed(1)) });
          } catch (err) {
            console.error(err);
            setDistanceInfo({ loading: false, error: 'We could not calculate the distance right now.', distanceKm: null });
          }
        }, (error) => {
          let message = 'We could not access your location.';
          if (error.code === 1) message = 'Location permission was denied. Please allow location access to see the distance.';
          else if (error.code === 2) message = 'Your location is currently unavailable.';
          else if (error.code === 3) message = 'Location request timed out.';
          setDistanceInfo({ loading: false, error: message, distanceKm: null });
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      })();
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
  ];



  const [form, setForm] = useState({
    user_id: user?.user_id || "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    street_address: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    zip_code: "",
    payment_method: "Online Payment",
  });

  const subtotal = checkoutItems.reduce((total, item) => total + parseFloat(item.price || 0) * item.quantity, 0);
  const deliveryInfo = calculateDeliveryCharge(distanceInfo.distanceKm, subtotal);
  const shipping = deliveryMethod === "pickup" ? 0 : deliveryInfo.charge;
  const availablePaymentMethods = [];
  if (paymentSettings?.cashSupport) availablePaymentMethods.push({ value: "cash", label: "Cash" });
  if (paymentSettings?.onlinePaymentSupport) availablePaymentMethods.push({ value: "online", label: "Online Payment" });

  // Calculate coupon discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = (subtotal * parseFloat(appliedCoupon.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(appliedCoupon.discount_value);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
  }

  // Calculate Tax
  let calculatedTax = 0;
  let taxLabel = "";
  if (taxSettings && taxSettings.enable_gst === 1) {
    const gstStr = taxSettings.default_gst_percentage || "0%";
    const gstPercent = parseFloat(gstStr.replace("%", "")) || 0;

    if (taxSettings.tax_mode === 'Tax Inclusive') {
      calculatedTax = ((subtotal - discountAmount) * gstPercent) / (100 + gstPercent);
      taxLabel = `Includes GST (${gstPercent}%)`;
    } else {
      calculatedTax = ((subtotal - discountAmount) * gstPercent) / 100;
      taxLabel = `GST (${gstPercent}%)`;
    }
  }

  const taxAmountValue = Math.round(calculatedTax * 100) / 100;

  let total = 0;
  if (taxSettings?.enable_gst === 1 && taxSettings?.tax_mode === 'Tax Inclusive') {
    total = Math.round((subtotal - discountAmount + shipping) * 100) / 100;
  } else {
    total = Math.round((subtotal - discountAmount + taxAmountValue + shipping) * 100) / 100;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });

  const saveOrder = async (paymentId = null) => {
    try {
      const orderItems = checkoutItems.map((item) => ({
        product_id: item.product_id || item.id,
        name: item.name,
        quantity: item.quantity,
        variant_color: item.variant_color || item.colorName || "",
        variant_size: item.variant_size || item.size || "",
        price: item.price,
        image: item.image,
        email: form.customer_email,
        user_id: user?.user_id,
        variant_info: item.variant_info || (item.variant ? {
          weight: item.variant.quantity,
          unit: item.variant.unit,
        } : null),
      }));

      const orderData = {
        ...form,
        user_id: user?.user_id,
        email: form.customer_email,
        payment_status: paymentMethod === "online" ? "paid" : "pending",
        payment_method: paymentMethod === "online" ? "Online Payment" : "Cash",
        payment_id: paymentId,
        items: orderItems,
        total_amount: total,
        delivery_charge: shipping,
        delivery_method: deliveryMethod,
        distance_km: deliveryMethod === "pickup" ? 0 : distanceInfo.distanceKm,
        coupon_code: appliedCoupon?.code || null,
        coupon_discount: discountAmount || 0,
        subtotal_before_discount: subtotal,
        created_at: new Date().toISOString(),
      };

      await api.post("/orders", orderData);
      await clearCart();

      setForm({
        user_id: user?.user_id || "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        street_address: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        zip_code: "",
        payment_method: "Cash",
      });

      toast.success("Order Placed Successfully!");
      navigate("/account?tab=orders");
    } catch (error) {
      console.error(error);
      alert("Order failed");
    }
  };

  const handleOrder = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.customer_email.trim()) {
      toast.error("Please enter email");
      return;
    }
    if (!form.customer_phone.trim()) {
      toast.error("Please enter phone number");
      return;
    }
    if (deliveryMethod === "delivery") {
      if (!form.street_address.trim()) {
        toast.error("Please enter street address");
        return;
      }
      if (!form.city.trim()) {
        toast.error("Please enter city");
        return;
      }
      if (!form.district.trim()) {
        toast.error("Please enter district");
        return;
      }
      if (!form.state.trim()) {
        toast.error("Please select state");
        return;
      }
      if (!form.zip_code.trim()) {
        toast.error("Please enter zip code");
        return;
      }
      if (deliveryInfo.isError) {
        toast.error(deliveryInfo.message || "Delivery not available for this location");
        return;
      }
    }

    if (!checkoutItems.length) {
      alert("No product to checkout");
      return;
    }

    try {
      if (paymentMethod === "cash") {
        await saveOrder();
        return;
      }

      if (!paymentSettings?.razorpayEnabled || !paymentSettings?.razorpayKey?.trim()) {
        toast.error("Razorpay is not configured yet.");
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay SDK failed to load");
        return;
      }

      const options = {
        key: paymentSettings.razorpayKey,
        amount: total * 100,
        currency: "INR",
        name: "Priyam Supermarket",
        description: "Order Payment",
        handler: async function (response) {
          console.log("Payment Success:", response);
          await saveOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.customer_phone,
        },
        theme: {
          color: "#0e6827",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }
  };

  return (
    <>
      <PageHeader title="Checkout" />

      <div className="min-h-screen bg-[#f7f8f3] py-8 sm:py-10">
        <PageContainer>
          <div className="mx-auto ">
            <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
              <div className="space-y-6">

                {/* Delivery Method Toggle */}
                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                  <div className="mb-4 flex items-center gap-2">
                    <FiPackage className="text-[#0e6827]" />
                    <h2 className="text-lg font-semibold text-slate-800">Order Type</h2>
                  </div>
                  <div className="flex gap-4">
                    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 font-semibold transition ${deliveryMethod === "delivery" ? "border-[#0e6827] bg-green-50 text-[#0e6827]" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}>
                      <input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} className="hidden" />
                      Home Delivery
                    </label>
                    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 font-semibold transition ${deliveryMethod === "pickup" ? "border-[#0e6827] bg-green-50 text-[#0e6827]" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}>
                      <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="hidden" />
                      Store Pickup
                    </label>
                  </div>
                </div>

                {deliveryMethod === "delivery" && (
                  <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                    <div className="mb-4 flex items-center gap-2">
                      <FiMapPin className="text-[#0e6827]" />
                      <h2 className="text-lg font-semibold text-slate-800">Delivery Distance</h2>
                    </div>
                    <p className="text-sm text-slate-500">Click the button below to fetch your current location and estimate the distance to our shop.</p>


                    <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
                      <p className="text-slate-700">
                        <span className="font-semibold">Max Delivery Distance:</span> {deliveryCharges?.maximum_delivery_distance || "N/A"} km
                      </p>
                    </div>

                    <div className="mt-4 rounded-[1.25rem] border border-green-100 bg-green-50 p-4">
                      {/* Always show shop address if available */}
                      {storeSettings ? (
                        <div className="mb-3">
                          <p className="text-sm text-slate-500">Shop address</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{[storeSettings.address, storeSettings.city, storeSettings.state, storeSettings.zip_code].filter(Boolean).join(", ")}</p>
                          {storeSettings.latitude && storeSettings.longitude && (
                            <p className="text-xs text-slate-500">Coordinates: {storeSettings.latitude}, {storeSettings.longitude}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-sm text-slate-500">Shop address not configured</p>
                        </div>
                      )}

                      {distanceInfo.loading ? (
                        <p className="text-sm text-slate-600">Fetching your current location...</p>
                      ) : distanceInfo.distanceKm !== null ? (
                        <>
                          {/* <p className="text-sm text-slate-600">Shop address</p> */}
                          {/* <p className="mt-1 text-sm font-semibold text-slate-800">
                            {storeSettings ? (
                              [storeSettings.address, storeSettings.city, storeSettings.state, storeSettings.zip_code]
                                .filter(Boolean)
                                .join(", ")
                            ) : (
                              "Store address not available"
                            )}
                          </p> */}

                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-sm text-slate-500">Estimated distance</p>
                              <p className="text-2xl font-bold text-[#0e6827]">{distanceInfo.distanceKm} km</p>
                              {deliveryCharges && distanceInfo.distanceKm !== null && (
                                <p className="mt-2 text-xs text-slate-600">
                                  {deliveryInfo.isError ? (
                                    <span className="text-red-600">{deliveryInfo.message}</span>
                                  ) : (
                                    <span className="text-green-600">{deliveryInfo.message}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <button type="button" onClick={detectDistanceToShop} className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-[#0e6827] transition hover:border-green-300 hover:bg-green-100">
                              Fetch location
                            </button>
                          </div>
                          {locationData.address && (
                            <div className="mt-4 rounded-xl bg-white border border-green-200 p-4">
                              <p className="text-sm font-semibold text-slate-700">
                                Your Current Location
                              </p>

                              <p className="mt-2 text-sm text-slate-600 break-words">
                                {locationData.address}
                              </p>

                              <div className="mt-3 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500">Latitude</p>
                                  <p className="font-semibold text-[#0e6827]">
                                    {locationData.latitude}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-500">Longitude</p>
                                  <p className="font-semibold text-[#0e6827]">
                                    {locationData.longitude}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600">{distanceInfo.error || "We could not calculate the distance right now."}</p>
                          <button type="button" onClick={detectDistanceToShop} className="mt-3 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-[#0e6827] transition hover:border-green-300 hover:bg-green-100">
                            Fetch location
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* {addresses.length > 0 && (
                  <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                    <div className="mb-4 flex items-center gap-2">
                      <FiMapPin className="text-[#0e6827]" />
                      <h2 className="text-lg font-semibold text-slate-800">Saved Addresses</h2>
                    </div>
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => selectAddress(addr)}
                          className={`cursor-pointer rounded-[1.25rem] border p-4 transition ${selectedAddress === addr.id ? "border-[#0e6827] bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                        >
                          <p className="text-sm leading-6 text-slate-700">
                            <span className="font-semibold text-slate-900">{addr.customer_name}</span>
                            <br />
                            {addr.street_address}
                            <br />
                            {addr.city}, {addr.district}
                            <br />
                            {addr.state} - {addr.zip_code}
                            <br />
                            {addr.country}
                            <br />
                            Phone: {addr.customer_phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                  <div className="mb-4 flex items-center gap-2">
                    <FiPackage className="text-[#0e6827]" />
                    <h2 className="text-lg font-semibold text-slate-800">Customer Details</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="customer_name" placeholder="Full Name" value={form.customer_name} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                    <input name="customer_email" placeholder="Email" value={form.customer_email} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                    <input name="customer_phone" placeholder="Phone Number" value={form.customer_phone} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                  </div>
                </div>
                {deliveryMethod === "delivery" && (
                  <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                    <div className="mb-4 flex items-center gap-2">
                      <FiMapPin className="text-[#0e6827]" />
                      <h2 className="text-lg font-semibold text-slate-800">Shipping Address</h2>
                    </div>
                    <textarea name="street_address" placeholder="Street Address" value={form.street_address} onChange={handleChange} rows={3} className="mb-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                    <div className="grid gap-4 md:grid-cols-3">
                      <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                      <input name="district" placeholder="District" value={form.district} onChange={handleChange} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                      <select name="state" value={form.state} onChange={handleChange} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100">
                        <option value="">Select State</option>
                        {indianStates.map((state, i) => (
                          <option key={i} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <input name="zip_code" placeholder="Zip Code" value={form.zip_code} onChange={handleChange} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100" />
                      <input name="country" value="India" readOnly className="cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5 text-sm text-slate-500 outline-none" />
                    </div>
                  </div>
                )}

              </div>

              <aside className="lg:sticky lg:top-24 space-y-6">
                {/* Products */}
                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Products ({checkoutItems.length})
                    </h2>
                  </div>

                  <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-2">
                    {checkoutItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                      >
                        <img
                          src={resolveImageUrl(item.image) || "/placeholder.png"}
                          alt={item.name}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => (e.target.src = "/placeholder.png")}
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-800">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Qty: {item.quantity}
                            {item.size && ` • ${item.size}`}
                          </p>

                          {item.colorName && (
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full border"
                                style={{
                                  backgroundColor:
                                    item.colorHex || item.color || "#ccc",
                                }}
                              />
                              <span className="text-xs text-slate-500">
                                {item.colorName}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0e6827]">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">

                  <div className="mt-6 space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className={shipping === 0 ? "font-semibold text-green-600" : "font-semibold text-slate-800"}>
                        {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    {deliveryMethod === "delivery" && deliveryInfo.message && (
                      <div className={`text-xs ${deliveryInfo.isError ? "text-red-600" : "text-green-600"}`}>
                        {deliveryInfo.message}
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span className="font-semibold text-green-600">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {taxSettings?.enable_gst === 1 && (
                      <div className="flex justify-between">
                        <span>{taxLabel}</span>
                        <span className="font-semibold text-slate-800">
                          {taxSettings.tax_mode === 'Tax Inclusive' ? `(₹${taxAmountValue.toFixed(2)})` : `₹${taxAmountValue.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-slate-800">
                      <span>Total</span>
                      <span className="text-[#0e6827]">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.25rem] border border-green-100 bg-green-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0e6827]">
                      🎟️
                      <span>Apply Coupon</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={appliedCoupon !== null}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0e6827] focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                      />
                      {appliedCoupon ? (
                        <button
                          onClick={removeCoupon}
                          className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={applyCoupon}
                          disabled={couponLoading}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {couponLoading ? "Applying..." : "Apply"}
                        </button>
                      )}
                    </div>
                    {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="mt-2 text-xs text-green-600">
                        ✓ Coupon applied: {appliedCoupon.discount_value}% off
                      </p>
                    )}
                  </div>

                  <div className="mt-6 rounded-[1.25rem] border border-green-100 bg-green-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0e6827]">
                      <FiCreditCard />
                      <span>Payment Method</span>
                    </div>
                    <div className="space-y-3">
                      {availablePaymentMethods.map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white bg-white px-3 py-3 text-sm text-slate-700 shadow-sm">
                          <input type="radio" name="payment" value={option.value} checked={paymentMethod === option.value} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {paymentMethod === "online" && (
                      <div className="mt-3 rounded-xl border border-green-100 bg-white p-3">
                        <p className="text-sm text-slate-600">
                          You’ll be redirected to Razorpay for secure UPI payment.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
                    <FiShield />
                    <span>Secure payments and trusted delivery support.</span>
                  </div>

                  <button onClick={handleOrder} className="mt-6 w-full rounded-full bg-[#0e6827] px-4 py-3 font-semibold text-white transition hover:bg-[#168637]">
                    Place Order
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <FiCheckCircle className="text-green-600" />
                    <span>Fast checkout with order confirmation.</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </PageContainer>
      </div>

    </>
  );
};

export default Checkout;
