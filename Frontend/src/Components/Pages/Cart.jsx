import React, { useContext, useState, useEffect } from "react";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, budgetMode, budgetAmount, updateBudget } = useContext(StoreContext);
  const navigate = useNavigate();

  const [localBudgetMode, setLocalBudgetMode] = useState(budgetMode);
  const [localBudgetAmount, setLocalBudgetAmount] = useState(budgetAmount);

  useEffect(() => {
    setLocalBudgetMode(budgetMode);
    setLocalBudgetAmount(budgetAmount);
  }, [budgetMode, budgetAmount]);

  const subtotal = cart.reduce(
    (total, item) => total + parseFloat(item.price || 0) * item.quantity,
    0,
  );

  const handleBudgetModeChange = (mode) => {
    setLocalBudgetMode(mode);
    if (!mode) {
      updateBudget(false, localBudgetAmount);
    } else {
      updateBudget(true, localBudgetAmount);
    }
  };

  const handleBudgetAmountSave = () => {
    if (localBudgetAmount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    updateBudget(true, localBudgetAmount);
  };

  const isOverBudget = budgetMode && subtotal > budgetAmount;
  const isAtBudget = budgetMode && subtotal === budgetAmount;
  const isUnderBudget = budgetMode && subtotal < budgetAmount;

  return (
    <>
      <PageHeader title="My Cart" />
      <div className="min-h-screen bg-[#f7f8f3] py-8 sm:py-10">
        <PageContainer>
          <div className="">
            <div className="mb-8 rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Shopping bag</p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-900">Your Cart</h1>
                  <p className="mt-2 text-sm text-slate-500">Review your selections and continue to checkout with confidence.</p>
                </div>
                <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-[#0e6827]">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-green-200 bg-gradient-to-br from-green-50 to-white py-20 text-center shadow-[0_20px_50px_rgba(14,104,39,0.06)]">
                    <FiShoppingCart className="mx-auto mb-4 text-5xl text-[#0e6827]" />
                    <h2 className="text-xl font-semibold text-slate-800">Your cart is empty</h2>
                    <p className="mt-2 text-sm text-slate-500">Choose your favorite products and bring them to checkout.</p>
                    <button
                      onClick={() => navigate("/shop")}
                      className="mt-6 rounded-full bg-[#0e6827] px-6 py-3 font-semibold text-white transition hover:bg-[#168637]"
                    >
                      Go to Shop
                    </button>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const name = item.name || item.product_name || item.productName || "Product";
                    const image = item.image || item.product_image || item.thumbnail_image || item.product_images?.[0] || "/placeholder.png";
                    const price = item.price;
                    const mrp = item.mrp;

                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-6 rounded-[1.75rem] border border-green-100 bg-white p-5 shadow-[0_20px_40px_rgba(14,104,39,0.08)] transition hover:-translate-y-0.5 md:flex-row md:items-center"
                      >
                        <div className="h-40 w-full overflow-hidden rounded-[1.25rem] border border-green-100 bg-green-50 md:w-32">
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {item.category && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{item.category}</span>
                                )}
                                {item.subcategory && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{item.subcategory}</span>
                                )}
                              </div>
                            </div>
                            <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-[#0e6827]">
                              ₹{price}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {item.colorName && (
                              <div className="flex items-center gap-2 rounded-full bg-gray-50 px-2.5 py-1">
                                <span className="h-3.5 w-3.5 rounded-full border border-gray-400" style={{ backgroundColor: item.colorHex || "#ccc" }} />
                                <span className="font-semibold text-slate-700">{item.colorName}</span>
                              </div>
                            )}
                            {item.size && (
                              <span className="rounded-full bg-gray-50 px-2.5 py-1 text-slate-700">Size: {item.size}</span>
                            )}
                            {item.age && (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Age: {item.age}</span>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="rounded-full border border-gray-200 bg-gray-50 p-2 text-slate-700 transition hover:border-green-300 hover:bg-green-50 hover:text-[#0e6827]"
                              >
                                <FiMinus />
                              </button>
                              <span className="min-w-8 text-center text-base font-semibold text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                disabled={(item.quantity || 1) >= (item.total_stock ?? item.stock_quantity ?? 0)}
                                className={`rounded-full border border-gray-200 p-2 text-slate-700 transition ${
                                  (item.quantity || 1) >= (item.total_stock ?? item.stock_quantity ?? 0)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-gray-50 hover:border-green-300 hover:bg-green-50 hover:text-[#0e6827]'
                                }`}
                              >
                                <FiPlus />
                              </button>
                            </div>
                            {mrp && (
                              <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-full bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <aside className="lg:sticky lg:top-24 space-y-6">
                
                {/* Budget Setting Section */}
                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Budget Settings</h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="budgetMode" 
                        className="w-4 h-4 text-green-600 focus:ring-green-500" 
                        checked={!localBudgetMode}
                        onChange={() => handleBudgetModeChange(false)}
                      />
                      <span className="text-sm font-medium text-slate-700">Without Budget</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="budgetMode" 
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                        checked={localBudgetMode}
                        onChange={() => handleBudgetModeChange(true)}
                      />
                      <span className="text-sm font-medium text-slate-700">With Budget</span>
                    </label>
                  </div>

                  {localBudgetMode && (
                    <div className="mt-4 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">₹</span>
                        <input
                          type="number"
                          value={localBudgetAmount}
                          onChange={(e) => setLocalBudgetAmount(Number(e.target.value))}
                          placeholder="Enter budget"
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <button
                        onClick={handleBudgetAmountSave}
                        className="rounded-xl bg-[#0e6827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#168637]"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Summary Section */}
                <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
                  <div className="rounded-[1.25rem] bg-linear-to-r from-[#0e6827] via-[#168637] to-[#ffc107] p-5 text-white">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">Order summary</p>
                    <h2 className="mt-2 text-2xl font-bold">Ready to checkout?</h2>
                    <p className="mt-2 text-sm text-white/85">Delivery charges calculated at checkout based on location.</p>
                  </div>

                  <div className="mt-6 space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-slate-800">
                      <span>Total</span>
                      <span className="text-[#0e6827]">₹{subtotal}</span>
                    </div>
                  </div>

                  {budgetMode && (
                    <div className="mt-4 rounded-xl p-4 bg-gray-50 border border-gray-100">
                       <div className="flex justify-between text-sm mb-2">
                         <span className="font-medium text-slate-700">Budget Usage</span>
                         <span className="font-semibold text-slate-900">₹{subtotal} / ₹{budgetAmount}</span>
                       </div>
                       <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : isAtBudget ? 'bg-amber-500' : 'bg-[#0e6827]'}`}
                           style={{ width: `${Math.min((subtotal / (budgetAmount || 1)) * 100, 100)}%` }}
                         />
                       </div>
                       <div className="mt-2 text-xs font-medium">
                         {isOverBudget ? (
                           <span className="text-red-500">You have exceeded your budget by ₹{subtotal - budgetAmount}. Please remove items.</span>
                         ) : isAtBudget ? (
                           <span className="text-amber-600">You have reached your budget limit.</span>
                         ) : (
                           <span className="text-green-600">You can still buy items worth ₹{budgetAmount - subtotal}.</span>
                         )}
                       </div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/checkout")}
                    disabled={isOverBudget}
                    className={`mt-6 w-full rounded-full px-4 py-3 font-semibold text-white transition ${isOverBudget ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0e6827] hover:bg-[#168637]'}`}
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => navigate("/shop")}
                    className="mt-3 w-full rounded-full border border-green-200 bg-green-50 px-4 py-3 font-semibold text-[#0e6827] transition hover:bg-green-100"
                  >
                    Continue Shopping
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
}