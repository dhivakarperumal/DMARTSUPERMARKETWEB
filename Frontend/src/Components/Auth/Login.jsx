import { useState, useContext } from "react";
import api from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Leaf, Tag, Truck, ShoppingCart } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      const userData = res.data.user || res.data;
      const role = String(userData?.role || "user").toLowerCase();

      login(userData, res.data.token);
      toast.success("Login successful!");

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        googleId: decoded.sub
      };

      // send to backend
      const res = await api.post(
        "/auth/google-login",
        googleUser
      );

      const userData = res.data.user || res.data;
      const role = String(userData?.role || "user").toLowerCase();

      login(userData, res.data.token);

      toast.success("Google Login Successful!");

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.response?.data?.message || error.message || "Google Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gray-50">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-[700px]">
        
        {/* Left Side (Form) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="leading-none">
                <h1 className="text-xl font-bold text-gray-900">Priyam</h1>
                <span className="text-[10px] tracking-widest text-gray-500 font-semibold uppercase">Supermarket</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
              <ShieldCheck className="text-green-600 w-5 h-5" />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">100% Secure</p>
                <p className="text-gray-500">Your data is safe</p>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Welcome Back! <Leaf className="text-green-500 w-7 h-7" />
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to continue to <span className="text-green-600 font-semibold">Priyam</span> Supermarket
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="identifier"
                type="text"
                placeholder="Email or Phone Number"
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-gray-600 font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-green-600 font-bold hover:text-green-700 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold bg-[#3e8e41] hover:bg-[#327a35] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Lock className="w-5 h-5" /> Sign In
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">or continue with</span>
            <div className="flex-1 h-[1px] bg-gray-200"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="relative group cursor-pointer border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 py-3">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span className="font-semibold text-gray-700 text-sm">Google</span>
              {/* Invisible GoogleLogin to keep functionality while matching UI */}
              <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer z-10 flex items-center justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => console.log("Login Failed")}
                  type="standard"
                  theme="outline"
                  size="large"
                />
              </div>
            </div>
            
            <button type="button" className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
              <span className="font-semibold text-gray-700 text-sm">Facebook</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mb-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-600 font-bold hover:underline">
              Register Now
            </Link>
          </p>

          {/* Bottom Features */}
          <div className="bg-[#f2f9f2] rounded-2xl p-5 flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-3 w-1/3">
              <div className="p-2.5 bg-green-100 rounded-full text-green-600 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Best Prices</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">We offer best prices for you</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-1/3 border-l border-green-200 pl-3">
              <div className="p-2.5 bg-green-100 rounded-full text-green-600 shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Fresh Products</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">100% fresh and quality</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-1/3 border-l border-green-200 pl-3">
              <div className="p-2.5 bg-green-100 rounded-full text-green-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Fast Delivery</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">Get your order fast</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side (Image/Banner) */}
        <div className="hidden md:block md:w-1/2 relative bg-green-50">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
            alt="Groceries" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Green overlay to simulate the green bag effect if needed, but a raw grocery image looks good too. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12">
             <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center gap-3 text-white mb-2">
                    <ShoppingCart className="w-10 h-10" />
                    <h2 className="text-4xl font-bold">Priyam</h2>
                </div>
                <p className="text-white/80 tracking-[0.3em] text-sm font-semibold uppercase">Supermarket</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;