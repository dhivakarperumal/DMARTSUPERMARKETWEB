import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import { StoreProvider } from "./PrivateRouter/StoreContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { AdminProvider } from "./PrivateRouter/AdminContext.jsx";
import { Toaster } from "react-hot-toast";
import Loader from "./Components/CommenComponents/Loader.jsx";
import Combo from "./Components/Pages/Combo.jsx";

// Lazy Load Main Components
const Home = React.lazy(() => import("./Components/Home/Home.jsx"));
const About = React.lazy(() => import("./Components/Home/About.jsx"));
const Shop = React.lazy(() => import("./Components/Home/Shop.jsx"));
const ContactUs = React.lazy(() => import("./Components/Home/ContactUs.jsx"));
const ProductDetails = React.lazy(() => import("./Components/Products/ProductDetails.jsx"));
const Cart = React.lazy(() => import("./Components/Pages/Cart.jsx"));
const Wishlist = React.lazy(() => import("./Components/Pages/Wishlist.jsx"));
const AllProductsPage = React.lazy(() => import("./Components/Pages/AllProducts.jsx"));
const Checkout = React.lazy(() => import("./Components/Pages/Checkout.jsx"));
const CategoryPage = React.lazy(() => import("./Components/Pages/CategoryPage.jsx"));
const Account = React.lazy(() => import("./Components/Pages/Account/Account.jsx"));
const TermsAndConditions = React.lazy(() => import("./Components/CommenComponents/TermsAndCondition.jsx"));
const OrdersMain = React.lazy(() => import("./Components/Home/OrdersMain.jsx"));
const Login = React.lazy(() => import("./Components/Auth/Login.jsx"));
const Register = React.lazy(() => import("./Components/Auth/Register.jsx"));

// Lazy Load Admin Components
const AdminPanel = React.lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = React.lazy(() => import("./Admin/Dashboard.jsx"));
const AllProducts = React.lazy(() => import("./Admin/Pages/AllProducts.jsx"));
const Category = React.lazy(() => import("./Admin/Pages/Category.jsx"));
const StockDetails = React.lazy(() => import("./Admin/Pages/StockDetails.jsx"));
const AddStock = React.lazy(() => import("./Admin/Pages/AddStock.jsx"));
const Orders = React.lazy(() => import("./Admin/Pages/Orders.jsx"));
const Users = React.lazy(() => import("./Admin/Pages/Users.jsx"));
const UserDetail = React.lazy(() => import("./Admin/Pages/UserDetail.jsx"));
const Billing = React.lazy(() => import("./Admin/Pages/Billing.jsx"));
const CreateBilling = React.lazy(() => import("./Admin/Pages/CreateBilling.jsx"));
const DealerDashboard = React.lazy(() => import("./Admin/Pages/DealerDashboard.jsx"));
const Dealers = React.lazy(() => import("./Admin/Pages/Dealers.jsx"));
const Reviews = React.lazy(() => import("./Admin/Pages/Reviews.jsx"));
const Reports = React.lazy(() => import("./Admin/Pages/Reports.jsx"));
const Settings = React.lazy(() => import("./Admin/Pages/Settings.jsx"));
const Coupons = React.lazy(() => import("./Admin/Pages/Coupons.jsx"));
const DeliveryCharges = React.lazy(() => import("./Admin/Pages/DeliveryCharges.jsx"));
const Profile = React.lazy(() => import("./Admin/Pages/Profile.jsx"));
const OrderDetail = React.lazy(() => import("./Admin/Pages/OrderDetail.jsx"));
const ProductDetail = React.lazy(() => import("./Admin/Pages/ProductDetail.jsx"));
const AddProducts = React.lazy(() => import("./Admin/Pages/AddProducts.jsx"));
const AddCombo = React.lazy(() => import("./Admin/Pages/AddCombo.jsx"));
const AddDealer = React.lazy(() => import("./Admin/Pages/AddDealer.jsx"));
const AddInvoice = React.lazy(() => import("./Admin/Pages/AddInvoice.jsx"));
const CreateOrder = React.lazy(() => import("./Admin/Pages/CreateOrder.jsx"));
const Staffs = React.lazy(() => import("./Admin/Staff/Staffs.jsx"));
const AddStaff = React.lazy(() => import("./Admin/Staff/AddStaff.jsx"));
const ViewStaff = React.lazy(() => import("./Admin/Staff/ViewStaff.jsx"));
const VideoManagement = React.lazy(() => import("./Admin/Pages/VideoManagement.jsx"));
const BannerManagement = React.lazy(() => import("./Admin/Pages/BannerManagement.jsx"));
const ErrorPage = React.lazy(() => import("./Admin/Pages/ErrorPage.jsx"));
const DealerDetail = React.lazy(() => import("./Admin/Pages/DealerDetail.jsx"));
const PurchaseOrder = React.lazy(() => import("./Admin/Pages/PurchaseOrder.jsx"));
const DealerProductMapping = React.lazy(() => import("./Admin/Pages/DealerProductMapping.jsx"));
const Attendance = React.lazy(() => import("./Admin/Staff/Attendance.jsx"));
const LeaveManagement = React.lazy(() => import("./Admin/Staff/LeaveManagement.jsx"));
const SalaryManagement = React.lazy(() => import("./Admin/Staff/SalaryManagement.jsx"));
const Payslip = React.lazy(() => import("./Admin/Staff/Payslip.jsx"));

// Lazy Load Purchase Components
const PurchaseDashboard = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseDashboard.jsx"));
const Suppliers = React.lazy(() => import("./Admin/Pages/Purchases/Suppliers.jsx"));
const PurchaseOrdersList = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseOrders.jsx"));
const PurchaseInvoices = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseInvoices.jsx"));
const PurchaseReturns = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseReturns.jsx"));
const PurchasePayments = React.lazy(() => import("./Admin/Pages/Purchases/PurchasePayments.jsx"));
const PurchaseReports = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseReports.jsx"));
const PurchaseImport = React.lazy(() => import("./Admin/Pages/Purchases/PurchaseImport.jsx"));


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/shop", element: <Shop /> },
      { path: "/combo", element: <Combo /> },
      { path: "/contactus", element: <ContactUs /> },
      { path: "/products/:id", element: <ProductDetails /> },
      { path: "/category/:categoryName", element: <CategoryPage /> },
      // { path: "/cart", element: <Cart /> },
      // { path: "/wishlist", element: <Wishlist /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/account", element: <Account /> },
      { path: "/ordersmain", element: <OrdersMain /> },
      { path: "/termsandconditions", element: <TermsAndConditions /> },

    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  
  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminProvider>
          <AdminPanel />
        </AdminProvider>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      // Products
      { path: "products/all", element: <AllProducts /> },
      { path: "products/add", element: <AddProducts /> },
      { path: "products/edit/:id", element: <AddProducts /> },
      { path: "combo/add", element: <AddCombo /> },
      { path: "combo/edit/:id", element: <AddCombo /> },
      { path: "products/category", element: <Category /> },
      { path: "products/stock", element: <StockDetails /> },
      { path: "products/stock/add", element: <AddStock /> },
      { path: "products/:id", element: <ProductDetail /> },
      // Orders
      { path: "orders/create", element: <CreateOrder /> },
      { path: "orders/new", element: <Orders statusFilter="Order Placed" dateFilter="today" /> },
      { path: "orders/all", element: <Orders statusFilter="All" /> },
      { path: "orders/delivery", element: <Orders statusFilter="Delivered" /> },
      { path: "orders/cancelled", element: <Orders statusFilter="Cancelled" /> },
      { path: "orders/:id", element: <OrderDetail /> },
      // Others
      { path: "users/all", element: <Users initialTab="All" /> },
      { path: "users/new", element: <Users initialTab="New" /> },
      { path: "users/:id", element: <UserDetail /> },
      { path: "staff", element: <Staffs /> },
      { path: "addstaff", element: <AddStaff /> },
      { path: "addstaff/:id", element: <AddStaff /> },
      { path: "viewstaff/:id", element: <ViewStaff /> },
      { path: "staff/attendance", element: <Attendance /> },
      { path: "staff/leave", element: <LeaveManagement /> },
      { path: "staff/salary", element: <SalaryManagement /> },
      { path: "staff/salary/payslip/:id", element: <Payslip /> },
      // Marketing & Support

      // Finance
      { path: "billing", element: <Billing /> },
      { path: "billing/create", element: <CreateBilling /> },
      // Dealers
      { path: "dealer", element: <DealerDashboard /> },
      { path: "dealer/dashboard", element: <DealerDashboard /> },
      { path: "dealer/all", element: <Dealers /> },
      { path: "dealer/:id", element: <DealerDetail /> },
      { path: "dealer/purchase-order/new", element: <PurchaseOrder /> },

      // Purchases
      { path: "purchases/dashboard", element: <PurchaseDashboard /> },
      { path: "purchases/suppliers", element: <Suppliers /> },
      { path: "purchases/orders", element: <PurchaseOrdersList /> },
      { path: "purchases/all", element: <PurchaseInvoices /> },
      { path: "purchases/returns", element: <PurchaseReturns /> },
      { path: "purchases/payments", element: <PurchasePayments /> },
      { path: "purchases/reports", element: <PurchaseReports /> },
      { path: "purchases/import", element: <PurchaseImport /> },

      { path: "dealer/mapping", element: <DealerProductMapping /> },
      { path: "dealer/add", element: <AddDealer /> },
      { path: "dealer/orders", element: <Orders statusFilter="All" /> },
      // Legacy routes (keep to avoid broken links)
      { path: "dealers", element: <Dealers /> },
      { path: "dealers/add", element: <AddDealer /> },
      { path: "invoices/add", element: <AddInvoice /> },
      { path: "reviews", element: <Reviews /> },
      { path: "reports", element: <Reports /> },
      { path: "videos", element: <VideoManagement /> },
      { path: "banners", element: <BannerManagement /> },
      { path: "coupons", element: <Coupons /> },
      { path: "delivery-charges", element: <DeliveryCharges /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <StoreProvider>
        <Toaster position="top-left" reverseOrder={false} />
        <React.Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </React.Suspense>
      </StoreProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
