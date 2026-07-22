import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { toast } from "react-hot-toast";
import api from "../api";
import { AuthContext } from "./AuthContext";
import { normalizeApiData } from "../utils/normalizeApiData";

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user || null;
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loadingCart, setLoadingCart] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [productsCache, setProductsCache] = useState([]);
    const [videosCache, setVideosCache] = useState([]);
    const [bannersCache, setBannersCache] = useState({});
    const [categoriesCache, setCategoriesCache] = useState([]);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    const [budgetMode, setBudgetMode] = useState(user?.budget_mode || false);
    const [budgetAmount, setBudgetAmount] = useState(user?.budget_amount || 0);

    useEffect(() => {
        if (user) {
            setBudgetMode(user.budget_mode || false);
            setBudgetAmount(user.budget_amount || 0);
        } else {
            setBudgetMode(false);
            setBudgetAmount(0);
        }
    }, [user]);

    const updateBudget = async (mode, amount) => {
        if (!user?.user_id) return;
        try {
            await api.put(`/auth/users/budget/${user.user_id}`, { budget_mode: mode, budget_amount: amount });
            setBudgetMode(mode);
            setBudgetAmount(amount);
            if (authContext && authContext.setUser) {
                const updatedUser = { ...user, budget_mode: mode, budget_amount: amount };
                authContext.setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
            toast.success("Budget saved!");
        } catch (err) {
            console.error("Update budget error:", err);
            toast.error("Failed to save budget");
        }
    };

    // ─── Fetch cart from backend ─────────────────────────────────
    const fetchCart = useCallback(async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            setLoadingCart(true);
            const res = await api.get(`/cart/${user.user_id}`);
            setCart(normalizeApiData(res.data));
        } catch (err) {
            console.error("Fetch cart error:", err);
        } finally {
            setLoadingCart(false);
        }
    }, [user?.user_id]);

    // ─── Fetch wishlist from backend ─────────────────────────────
    const fetchWishlist = useCallback(async () => {
        if (!user?.user_id) { setWishlist([]); return; }
        try {
            setLoadingWishlist(true);
            const res = await api.get(`/wishlist/${user.user_id}`);
            setWishlist(normalizeApiData(res.data));
        } catch (err) {
            console.error("Fetch wishlist error:", err);
        } finally {
            setLoadingWishlist(false);
        }
    }, [user?.user_id]);

    // Load cart + wishlist when user logs in
    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, [fetchCart, fetchWishlist]);

    // ─── CART ACTIONS ────────────────────────────────────────────

    const addToCart = async (product, variant = null, size = null, qty = 1) => {
        if (!user?.user_id) {
            toast.error("Please login to add items to cart");
            return;
        }

        const selectedVariant = variant || product.variants?.[0] || null;
        const groceryVariantInfo = (selectedVariant?.quantity && selectedVariant?.unit) ? `${selectedVariant.quantity} ${selectedVariant.unit}` : null;
        const selectedSize = size || groceryVariantInfo || selectedVariant?.selectedSizes?.[0] || "Free Size";
        const variantColor = selectedVariant?.colorName || selectedVariant?.color || "Default";
        
        // Correctly parse images if they are stored as JSON strings
        const productImages = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
        const variantImage = selectedVariant?.images?.[0] || productImages[0] || null;
        
        const price = parseFloat(selectedVariant?.sellingPrice || selectedVariant?.selling_price || product.offer_price || product.price || 0);
        const categoryId = product.category_id || product.categoryId || null;

        if (budgetMode) {
            const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const itemTotal = price * qty;
            if (cartTotal + itemTotal > budgetAmount) {
                toast.error("Cannot add to cart. Budget exceeded!");
                return;
            }
        }

        try {
            await api.post("/cart", {
                user_id: user.user_id,
                product_id: product.id || product.product_id,
                category_id: categoryId,
                variant_color: variantColor,
                variant_size: selectedSize,
                image: variantImage,
                email: user.email || "",
                price: price,
                total_price: price * qty, 
                quantity: qty,
            });
            toast.success("Added to cart!");
            await fetchCart(); // Refresh from backend to get image + full details
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error("Failed to add to cart");
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            await api.delete(`/cart/${cartItemId}`);
            toast.error("Removed from cart");
            await fetchCart();
        } catch (err) {
            console.error("Remove cart error:", err);
            toast.error("Failed to remove item");
        }
    };

    const removeFromWishlist = async (wishlistItemId) => {
        if (!user?.user_id) {
            toast.error("Please login to manage wishlist");
            return;
        }

        const targetItem = wishlist.find((item) => item.id === wishlistItemId || item._id === wishlistItemId || item.product_id === wishlistItemId);
        const productId = targetItem?.product_id || wishlistItemId;

        try {
            await api.delete(`/wishlist/${user.user_id}/${productId}`);
            toast.success("Removed from favorites");
            await fetchWishlist();
        } catch (err) {
            console.error("Remove wishlist error:", err);
            toast.error("Failed to remove item");
        }
    };

    const updateCartQuantity = async (cartItemId, qty) => {
        if (qty < 1) return;
        const targetItem = cart.find(i => i.id === cartItemId);
        if (!targetItem) return;

        const availableStock = parseFloat(targetItem.total_stock ?? targetItem.stock_quantity ?? 0);
        if (qty > availableStock) {
            toast.error(
                availableStock > 0
                    ? `Only ${availableStock} item${availableStock === 1 ? '' : 's'} available in stock.`
                    : "This item is out of stock."
            );
            return;
        }

        if (budgetMode) {
            const currentQty = targetItem.quantity;
            if (qty > currentQty) {
                const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const addedAmount = targetItem.price * (qty - currentQty);
                if (cartTotal + addedAmount > budgetAmount) {
                    toast.error("Cannot increase quantity. Budget exceeded!");
                    return;
                }
            }
        }

        try {
            await api.put(`/cart/${cartItemId}`, {
                quantity: qty,
                price: targetItem.price
            });
            setCart(prev => prev.map(item =>
                item.id === cartItemId ? {
                    ...item,
                    quantity: qty,
                    total_price: item.price * qty
                } : item
            ));
        } catch (err) {
            console.error("Update qty error:", err);
            const message = err?.response?.data?.message || "Failed to update quantity";
            toast.error(message);
        }
    };

    const clearCart = async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            await api.delete(`/cart/clear/${user.user_id}`);
            setCart([]);
        } catch (err) {
            console.error("Clear cart error:", err);
        }
    };

    // ─── WISHLIST ACTIONS ────────────────────────────────────────

    const toggleWishlist = async (product, variant = null, size = null) => {
        if (!user?.user_id) {
            toast.error("Please login to manage wishlist");
            return;
        }

        const productId = product.id || product.product_id;
        const isAlready = wishlist.some(w => w.product_id === productId || w.id === productId);

        try {
            if (isAlready) {
                await api.delete(`/wishlist/${user.user_id}/${productId}`);
                toast.success("Removed from favorites");
            } else {
                const selectedVariant = variant || product.variants?.[0] || null;
                const groceryVariantInfo = (selectedVariant?.quantity && selectedVariant?.unit) ? `${selectedVariant.quantity} ${selectedVariant.unit}` : null;
                const selectedSize = size || groceryVariantInfo || selectedVariant?.selectedSizes?.[0] || "";
                const variantColor = selectedVariant?.colorName || selectedVariant?.color || "";
                
                // Correctly parse images if they are stored as JSON strings
                const productImages = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
                const variantImage = selectedVariant?.images?.[0] || productImages[0] || null;
                
                const price = parseFloat(selectedVariant?.sellingPrice || selectedVariant?.selling_price || product.offer_price || product.price || 0);

                await api.post("/wishlist", {
                    user_id: user.user_id,
                    product_id: productId,
                    variant_color: variantColor,
                    variant_size: selectedSize,
                    image: variantImage,
                    email: user.email || "",
                    price: price,
                    total_price: price,
                });
                toast.success("Added to favorites!");
            }
            await fetchWishlist();
        } catch (err) {
            console.error("Toggle wishlist error:", err);
            toast.error("Failed to update wishlist");
        }
    };

    return (
        <StoreContext.Provider value={{
            cart, wishlist,
            addToCart, removeFromCart, updateCartQuantity, clearCart,
            removeFromWishlist,
            toggleWishlist,
            loadingCart, loadingWishlist,
            fetchCart, fetchWishlist,
            productsCache, setProductsCache,
            videosCache, setVideosCache,
            bannersCache, setBannersCache,
            categoriesCache, setCategoriesCache,
            lastFetchTime, setLastFetchTime,
            budgetMode, budgetAmount, updateBudget
        }}>
            {children}
        </StoreContext.Provider>
    );
};
