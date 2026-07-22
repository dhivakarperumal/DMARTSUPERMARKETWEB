import React, { useEffect, useState, useContext } from "react";
import PageContainer from "../../CommenComponents/PageContainer";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          classes: "bg-emerald-50 text-emerald-600 border-emerald-200",
          icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
        };

      case "shipped":
        return {
          classes: "bg-blue-50 text-blue-600 border-blue-200",
          icon: <Truck className="w-4 h-4 mr-1.5 animate-pulse" />,
        };

      case "processing":
        return {
          classes: "bg-amber-50 text-amber-600 border-amber-200",
          icon: <Clock className="w-4 h-4 mr-1.5 animate-spin-slow" />,
        };

      default:
        return {
          classes: "bg-gray-50 text-gray-600 border-gray-200",
          icon: <Package className="w-4 h-4 mr-1.5" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${config.classes}`}
    >
      {config.icon}
      {status}
    </span>
  );
};

export default function Orders() {
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [address, setAddress] = useState(null);
  const [trackOrderId, setTrackOrderId] = useState("");

  const handleTrackOrder = () => {
    if (!trackOrderId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }
    
    const foundOrder = orders.find(
      (o) => o.id.toString() === trackOrderId.trim() || o.order_id === trackOrderId.trim()
    );

    if (foundOrder) {
      openOrderDetails(foundOrder);
    } else {
      toast.error("Order not found or invalid Order ID");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");

        const allOrders = res.data || [];

        const userOrders = allOrders.filter(
          (order) => order.user_id === user?.user_id,
        );

        setOrders(userOrders);
      } catch (error) {
        console.error("Failed to load orders", error);
      }
    };

    if (user?.user_id) fetchOrders();
  }, [user]);

  const openOrderDetails = async (order) => {
    setLoadingOrder(true);

    try {
      // fetch order details
      const orderRes = await api.get(`/orders/${order.id}`);
      setSelectedOrder(orderRes.data);

      setShowPopup(true);
    } catch (error) {
      console.error("Failed to load order details", error);
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f3] py-8 sm:py-10">
      <PageContainer>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Orders</p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">My Orders</h1>
                <p className="mt-2 text-sm text-gray-500">Track your purchases and view order details in one place.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Order ID"
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e6827]"
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                />
                <button
                  onClick={handleTrackOrder}
                  className="bg-[#0e6827] text-white px-5 py-2 rounded-xl font-semibold hover:bg-[#168637] transition whitespace-nowrap cursor-pointer"
                >
                  Track Order
                </button>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => openOrderDetails(order)}
                className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-green-100 bg-white shadow-[0_20px_40px_rgba(14,104,39,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(14,104,39,0.14)]"
              >
                {/* top gradient */}
                <div className="h-2 w-full bg-linear-to-r from-[#0e6827] via-[#168637] to-[#ffc107]"></div>

                {/* ORDER SUMMARY CARD */}
                <div className="bg-linear-to-br from-green-50 via-white to-amber-50 px-6 pb-4 pt-6">
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Order ID</span>
                      <span className="font-semibold">
                        {order.order_id || order.id}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Status</span>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex justify-between pt-2 text-base font-bold bg-primary/5 px-3 py-2 rounded-lg">
                      <span>Total Amount</span>
                      <span className="text-primary">
                        ₹{order.total_amount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="px-6 pt-4 pb-0 space-y-6">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-6 rounded-[1.25rem] border border-green-100 bg-white p-4 transition hover:border-green-300 hover:shadow-md group-hover:bg-green-50"
                    >
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="h-28 w-24 rounded-xl border border-green-100 object-cover shadow-sm"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-semibold text-primary-dark transition group-hover:text-[#0e6827]">
                            {item.product_name}
                          </h3>

                          <p className="rounded-lg bg-green-50 px-3 py-1 text-lg font-bold text-[#0e6827]">
                            ₹{item.price}
                          </p>
                        </div>

                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          {item.variant_color && (
                            <p>Color: {item.variant_color}</p>
                          )}

                          {item.variant_size && (
                            <p>Size: {item.variant_size}</p>
                          )}

                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        {showPopup && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
              {/* HEADER */}

              <div className="flex items-center justify-between bg-linear-to-r from-[#0e6827] via-[#168637] to-[#ffc107] px-8 py-6 text-white">
                <h2 className="text-2xl font-bold tracking-wide">
                  Order Details
                </h2>

                <button
                  onClick={() => setShowPopup(false)}
                  className="text-white text-2xl hover:scale-110 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* CONTENT */}

              <div className="p-8 overflow-y-auto space-y-8">
                {loadingOrder ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* ORDER TRACKING TIMELINE */}
                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Order Tracking
                      </h3>
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>

                          {/* Steps */}
                          <div className="space-y-6">
                            {selectedOrder.status?.toLowerCase() === "cancelled" ? (
                              <div className="relative flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center z-10 bg-red-100 text-red-600">
                                  <XCircle size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-red-600">Cancelled</h4>
                                  <p className="text-xs text-red-500">Order was cancelled</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Step 1: Order Placed */}
                                <div className="relative flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 bg-green-100 text-[#0e6827]`}>
                                    <Package size={20} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-gray-800`}>Order Placed</h4>
                                    <p className="text-xs text-gray-500">We have received your order</p>
                                  </div>
                                </div>

                                {/* Step 2: Packing */}
                                <div className="relative flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${["packing", "shipping", "out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "bg-green-100 text-[#0e6827]" : "bg-gray-100 text-gray-400"}`}>
                                    <Package size={20} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${["packing", "shipping", "out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "text-gray-800" : "text-gray-400"}`}>Packing</h4>
                                    <p className="text-xs text-gray-500">Your order is being packed</p>
                                  </div>
                                </div>

                                {/* Step 3: Shipping */}
                                <div className="relative flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${["shipping", "out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "bg-green-100 text-[#0e6827]" : "bg-gray-100 text-gray-400"}`}>
                                    <Truck size={20} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${["shipping", "out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "text-gray-800" : "text-gray-400"}`}>Shipping</h4>
                                    <p className="text-xs text-gray-500">Your order is on the way</p>
                                  </div>
                                </div>
                                
                                {/* Step 4: Out for Delivery */}
                                <div className="relative flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${["out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "bg-green-100 text-[#0e6827]" : "bg-gray-100 text-gray-400"}`}>
                                    <Truck size={20} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${["out for delivery", "delivered"].includes(selectedOrder.status?.toLowerCase()) ? "text-gray-800" : "text-gray-400"}`}>Out for Delivery</h4>
                                    <p className="text-xs text-gray-500">Your order is out for delivery</p>
                                  </div>
                                </div>

                                {/* Step 5: Delivered */}
                                <div className="relative flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${selectedOrder.status?.toLowerCase() === "delivered" ? "bg-green-100 text-[#0e6827]" : "bg-gray-100 text-gray-400"}`}>
                                    <CheckCircle size={20} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${selectedOrder.status?.toLowerCase() === "delivered" ? "text-gray-800" : "text-gray-400"}`}>Delivered</h4>
                                    <p className="text-xs text-gray-500">Order has been delivered</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* ORDER INFO */}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order ID
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {selectedOrder.order_id || selectedOrder.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          User ID
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {selectedOrder.user_id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order Date
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {new Date(
                            selectedOrder.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Payment Method
                        </p>
                        <p className="font-semibold capitalize text-primary-dark">
                          {selectedOrder.payment_method}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Payment Status
                        </p>
                        <p className="font-semibold capitalize text-primary-dark">
                          {selectedOrder.payment_status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order Status
                        </p>
                        <StatusBadge status={selectedOrder.status} />
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Total Amount
                        </p>
                        <p className="font-bold text-primary text-lg">
                          ₹{selectedOrder.total_amount}
                        </p>
                      </div>

                      {selectedOrder.tracking_number && (
                        <div>
                          <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                            Tracking ID
                          </p>
                          <p className="font-semibold text-primary-dark">
                            {selectedOrder.tracking_number}
                          </p>
                        </div>
                      )}

                      {selectedOrder.courier_name && (
                        <div>
                          <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                            Courier
                          </p>
                          <p className="font-semibold text-primary-dark">
                            {selectedOrder.courier_name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SHIPPING ADDRESS */}

                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Shipping Address
                      </h3>

                      <div className="border border-gray-100 rounded-2xl p-6 bg-linear-to-br from-primary/5 to-transparent shadow-sm">
                        {selectedOrder ? (() => {
                          let addr = selectedOrder.shipping_address;
                          if (typeof addr === 'string') {
                            try { addr = JSON.parse(addr); } catch (e) { }
                          }
                          const cName = addr?.customer_name || selectedOrder.customer_name;
                          const sAddr = addr?.street_address || selectedOrder.street_address;
                          const city = addr?.city || selectedOrder.city;
                          const dist = addr?.district || selectedOrder.district;
                          const state = addr?.state || selectedOrder.state;
                          const zip = addr?.zip_code || selectedOrder.zip_code;
                          const country = addr?.country || selectedOrder.country;
                          const phone = addr?.customer_phone || selectedOrder.customer_phone;
                          const email = addr?.customer_email || selectedOrder.customer_email;

                          return (
                            <div className="text-sm text-gray-700 space-y-1">
                              <p className="font-semibold">{cName || 'N/A'}</p>
                              <p>{sAddr}</p>
                              <p>{city}, {dist}</p>
                              <p>{state} {zip ? `- ${zip}` : ''}</p>
                              <p>{country}</p>
                              <p>Phone: {phone}</p>
                              <p>Email: {email}</p>
                            </div>
                          );
                        })() : (
                          <p className="text-gray-500">Address not available</p>
                        )}
                      </div>
                    </div>

                    {/* PRODUCT DETAILS */}

                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Products
                      </h3>

                      <div className="space-y-5">
                        {selectedOrder.items &&
                          selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, index) => {
                            const subtotal = item.price * item.quantity;

                            return (
                              <div
                                key={index}
                                className="flex gap-5 border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                              >
                                <img
                                  src={item.image}
                                  alt={item.product_name}
                                  className="w-24 h-28 object-cover rounded-xl"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.png";
                                  }}
                                />

                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <h4 className="font-semibold text-lg text-primary-dark">
                                      {item.product_name}
                                    </h4>

                                    <p className="font-bold text-primary text-lg">
                                      ₹{item.price}
                                    </p>
                                  </div>

                                  <div className="text-sm text-gray-600 mt-3 space-y-1">
                                    {(item.color || item.variant_color) && (
                                      <p>
                                        <span className="font-medium">
                                          Color:
                                        </span>{" "}
                                        {item.color || item.variant_color}
                                      </p>
                                    )}

                                    {(item.size || item.variant_size) && (
                                      <p>
                                        <span className="font-medium">
                                          Size:
                                        </span>{" "}
                                        {item.size || item.variant_size}
                                      </p>
                                    )}

                                    <p>
                                      <span className="font-medium">
                                        Quantity:
                                      </span>{" "}
                                      {item.quantity}
                                    </p>

                                    <p>
                                      <span className="font-medium">
                                        Subtotal:
                                      </span>{" "}
                                      ₹{subtotal}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center py-6">
                            No items in this order
                          </p>
                        )}
                      </div>
                    </div>



                    {/* ORDER SUMMARY (INCLUDING BUDGET, COUPON, DELIVERY) */}
                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Order Summary
                      </h3>
                      <div className="bg-[#f8faec] border border-green-100 rounded-2xl p-6 shadow-sm">
                        <div className="space-y-3 text-sm text-gray-700">

                          <div className="flex justify-between items-center">
                            <span className="font-medium">Subtotal (Before Discount)</span>
                            <span className="font-bold">₹{selectedOrder.subtotal_before_discount || selectedOrder.total_amount}</span>
                          </div>

                          {selectedOrder.coupon_code && (
                            <div className="flex justify-between items-center text-green-700">
                              <span className="font-medium">Coupon Discount ({selectedOrder.coupon_code})</span>
                              <span className="font-bold">-₹{selectedOrder.coupon_discount || 0}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="font-medium">Delivery Method</span>
                            <span className="font-bold capitalize">{selectedOrder.delivery_method || 'delivery'}</span>
                          </div>

                          <div className="flex justify-between items-center text-gray-600">
                            <span className="font-medium">Delivery Charges</span>
                            <span className="font-bold">
                              {selectedOrder.delivery_charge > 0 ? `₹${selectedOrder.delivery_charge}` : "Free"}
                            </span>
                          </div>

                        </div>

                        <div className="mt-4 pt-4 border-t border-green-200 flex justify-between items-center">
                          <span className="text-lg font-bold text-primary-dark">Total Paid</span>
                          <span className="text-xl font-bold text-[#0e6827]">₹{selectedOrder.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-6 border-t border-gray-100 pt-6 flex justify-end items-center">


                      <button
                        onClick={() => setShowPopup(false)}
                        className="cursor-pointer rounded-full bg-[#0e6827] px-8 py-2.5 font-semibold text-white shadow-md transition hover:bg-[#168637]"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <style>
        {`
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
          `}
      </style>
    </div>
  );
}
