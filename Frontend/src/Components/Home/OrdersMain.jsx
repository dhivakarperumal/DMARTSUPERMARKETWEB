import React, { useEffect, useState, useContext } from "react";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { Printer } from "lucide-react";
import PageContainer from "../CommenComponents/PageContainer";
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

const OrdersMain = () => {
  const { user } = useContext(AuthContext);

  const handlePrint = () => {
    const itemsHtml = selectedOrder.items
      ?.map(
        (item) => `
    <tr>
      <td>${item.product_name}</td>
      <td>${item.variant_color || "-"}</td>
      <td>${item.variant_size || "-"}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price}</td>
      <td>₹${item.price * item.quantity}</td>
    </tr>
  `
      )
      .join("");

    const printContent = `
<html>
<head>
<title>Order Invoice</title>

<style>
body{
  font-family: Arial, sans-serif;
  padding:40px;
  background:#f8f8f8;
}

.card{
  max-width:800px;
  margin:auto;
  background:white;
  border-radius:10px;
  padding:30px;
  box-shadow:0 5px 20px rgba(0,0,0,0.1);
}

h2{
  margin-bottom:20px;
}

.section{
  margin-top:25px;
}

.row{
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid #eee;
  padding:8px 0;
  font-size:14px;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th,td{
  border:1px solid #ddd;
  padding:8px;
  text-align:left;
  font-size:14px;
}

th{
  background:#f5f5f5;
}

.total{
  font-weight:bold;
  font-size:16px;
  margin-top:15px;
}
</style>
</head>

<body>

<div class="card">

<h2>Order Details</h2>

<div class="row">
<span>Order ID</span>
<span>${selectedOrder.order_id || selectedOrder.id}</span>
</div>

<div class="row">
<span>Date</span>
<span>${new Date(selectedOrder.created_at).toLocaleDateString()}</span>
</div>

<div class="row">
<span>Status</span>
<span>${selectedOrder.status}</span>
</div>

<div class="row total">
<span>Total Amount</span>
<span>₹${selectedOrder.total_amount}</span>
</div>

<div class="section">
<h3>Shipping Address</h3>

<p><b>${address?.customer_name || ""}</b></p>
<p>${address?.street_address || ""}</p>
<p>${address?.city || ""}, ${address?.district || ""}</p>
<p>${address?.state || ""} - ${address?.zip_code || ""}</p>
<p>${address?.country || ""}</p>
<p>Phone: ${address?.customer_phone || ""}</p>
<p>Email: ${address?.customer_email || ""}</p>

</div>

<div class="section">

<h3>Products</h3>

<table>

<thead>
<tr>
<th>Product</th>
<th>Color</th>
<th>Size</th>
<th>Qty</th>
<th>Price</th>
<th>Subtotal</th>
</tr>
</thead>

<tbody>

${itemsHtml}

</tbody>

</table>

</div>

</div>

</body>
</html>
`;

    const printWindow = window.open("", "", "width=800,height=600");

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
    <div className="min-h-screen bg-[#FDFBF7] py-10">
      <PageContainer>
        <div className=" space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter Order ID"
                className="w-full md:w-56 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
              />
              <button
                onClick={handleTrackOrder}
                className="bg-primary text-white px-5 py-2 rounded-xl font-semibold hover:opacity-90 transition whitespace-nowrap cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => openOrderDetails(order)}
                  className="bg-white rounded-3xl border border-primary/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
                >

                  <div className="h-2 w-full bg-gradient-to-r from-primary-light via-primary-light to-secondary"></div>

                  {/* ORDER SUMMARY CARD */}

                  <div className="bg-gradient-to-br from-primary-light/10 via-white to-secondary/10 pt-6 px-6 pb-4">

                    {/* <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">
                        Order Summary
                      </h3>
                    </div> */}

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
                        className="flex gap-6 items-start border border-primary/10 rounded-2xl p-4 hover:shadow-lg hover:border-primary/30 transition bg-white group-hover:bg-primary/5"
                      >
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-24 h-28 object-cover rounded-xl shadow-md border border-primary/10"
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                          }}
                        />

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-semibold text-lg text-primary-dark group-hover:text-primary transition">
                              {item.product_name}
                            </h3>

                            <p className="font-bold text-primary text-lg bg-primary/10 px-3 py-1 rounded-lg">
                              ₹{item.price}
                            </p>
                          </div>

                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            {item.variant_color && (
                              <p>Color: {item.variant_color}</p>
                            )}

                            {item.variant_size && <p>Size: {item.variant_size}</p>}

                            <p>Quantity: {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {/* POPUP */}

      {showPopup && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* HEADER */}

            <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-primary-light to-secondary text-white">
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

              {/* ORDER SUMMARY CARD */}
              <div className="print-area bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    Order Summary
                  </h3>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:opacity-90 transition"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-y-3 gap-x-8 text-sm">

                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-gray-500">Order ID</span>
                    <span className="font-semibold">
                      {selectedOrder.order_id || selectedOrder.id}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-gray-500">Date</span>
                    <span className="font-semibold">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-gray-500">Status</span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>

                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-semibold">
                      {selectedOrder.customer_name}
                    </span>
                  </div>

                  {selectedOrder.tracking_number && (
                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Tracking ID</span>
                      <span className="font-semibold text-primary-dark">
                        {selectedOrder.tracking_number}
                      </span>
                    </div>
                  )}

                  {selectedOrder.courier_name && (
                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Courier</span>
                      <span className="font-semibold text-primary-dark">
                        {selectedOrder.courier_name}
                      </span>
                    </div>
                  )}



                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-semibold">
                      {selectedOrder.customer_phone}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold pt-2">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      ₹{selectedOrder.total_amount}
                    </span>
                  </div>



                </div>

              </div>
              {loadingOrder ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : (
                <>
                  {/* ORDER INFO */}

                  {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Order ID
                      </p>
                      <p className="font-medium">
                        {selectedOrder.order_id || selectedOrder.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        User ID
                      </p>
                      <p className="font-medium">{selectedOrder.user_id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Order Date
                      </p>
                      <p className="font-medium">
                        {new Date(
                          selectedOrder.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Payment Method
                      </p>
                      <p className="font-medium capitalize">
                        {selectedOrder.payment_method}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Payment Status
                      </p>
                      <p className="font-medium capitalize">
                        {selectedOrder.payment_status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Order Status
                      </p>
                      <StatusBadge status={selectedOrder.status} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Total Amount
                      </p>
                      <p className="font-bold text-primary-dark text-lg">
                        ₹{selectedOrder.total_amount}
                      </p>
                    </div>
                  </div> */}

                  {/* SHIPPING ADDRESS */}

                  <div>
                    <h3 className="text-lg font-bold text-primary-dark mb-4">
                      Shipping Address
                    </h3>

                    <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
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



                  {/* EXPANDED ORDER SUMMARY */}
                  <div>
                    <h3 className="text-lg font-bold text-primary-dark mb-4">
                      Expanded Order Summary
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

                  {/* PRODUCTS */}

                  <div>
                    <h3 className="text-lg font-bold text-primary-dark mb-4">
                      Products
                    </h3>

                    <div className="space-y-5">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
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
                                      <span className="font-medium">Size:</span>{" "}
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

                  {/* FOOTER */}

                  <div className="mt-6 border-t border-gray-100 pt-6 flex justify-between items-center">
                    <p className="text-xl font-bold text-primary-dark">
                      Total: ₹{selectedOrder.total_amount}
                    </p>

                    <button
                      onClick={() => setShowPopup(false)}
                      className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-2.5 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
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

      <style>
        {`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        `}
      </style>
    </div>
  );
};

export default OrdersMain;