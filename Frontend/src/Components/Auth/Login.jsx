import { useState, useContext } from "react";
import api from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ShoppingCart } from "lucide-react";

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
    <div className="h-screen w-full overflow-hidden bg-[#eef2ee] p-3 md:p-6 flex items-center justify-center">
      <div className="flex w-full max-w-[1280px] h-full overflow-hidden rounded-[28px] border border-[#dfeae0] bg-white shadow-[0_25px_80px_rgba(14,104,39,0.12)]">
        <div className="w-full md:w-[52%] bg-white px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0e6827] text-white shadow-md">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b7a6b]">Supermarket</div>
                <div className="text-2xl font-black tracking-tight text-[#0d3d2c]">D-Mart</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#dfeee2] bg-[#f2faf4] px-3 py-2 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-[#0e6827]" />
              <span className="text-[11px] font-semibold text-[#245841]">100% Secure</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.05em] text-[#123a2d] leading-none">
              Welcome Back! <span className="inline-block align-middle text-[#1ca05d]">✦</span>
            </h1>
            <p className="mt-3 text-sm text-[#51665d]">
              Sign in to continue to <span className="font-bold text-[#0e6827]">D-Mart</span> Supermarket
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-grow flex flex-col justify-center">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7d8e85]" />
              <input
                name="identifier"
                type="text"
                placeholder="Email or Phone Number"
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#dfe7df] bg-[#fdfdfd] py-3.5 pl-12 pr-4 text-[15px] text-[#1d2b24] outline-none transition focus:border-[#0e6827] focus:ring-2 focus:ring-[#dbeee0]"
                required
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7d8e85]" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#dfe7df] bg-[#fdfdfd] py-3.5 pl-12 pr-12 text-[15px] text-[#1d2b24] outline-none transition focus:border-[#0e6827] focus:ring-2 focus:ring-[#dbeee0]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7d8e85] transition hover:text-[#1d2b24]"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[#4a5d52]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#c9d7ca] text-[#0e6827] focus:ring-[#0e6827]" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-[#0e6827] transition hover:text-[#0a4f20]">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f6d2f] to-[#168637] py-3.5 text-base font-bold text-white shadow-[0_12px_25px_rgba(14,104,39,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_30px_rgba(14,104,39,0.28)]"
            >
              <Lock className="h-5 w-5" />
              Sign In
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e4e9e3]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d8e85]">or continue with</span>
            <div className="h-px flex-1 bg-[#e4e9e3]" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="relative flex items-center justify-center gap-2 rounded-2xl border border-[#dfe7df] bg-white py-3.5 shadow-sm transition hover:bg-[#f8faf8]">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
              <span className="text-sm font-semibold text-[#2b3933]">Google</span>
              <div className="absolute inset-0 opacity-0">
                <GoogleLogin onSuccess={handleSuccess} onError={() => console.log("Login Failed")} type="standard" theme="outline" size="large" />
              </div>
            </div>

            <button type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-[#dfe7df] bg-white py-3.5 shadow-sm transition hover:bg-[#f8faf8]">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5" />
              <span className="text-sm font-semibold text-[#2b3933]">Facebook</span>
            </button>
          </div>

          <p className="text-center text-sm text-[#4d6159]">
            Don't have an account?
            <Link to="/register" className="ml-2 font-bold text-[#0e6827] hover:text-[#0b511d]">
              Register Now
            </Link>
          </p>
        </div>

        <div className="hidden md:block md:w-[48%] relative overflow-hidden bg-[#dfe8d4]">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop"
            alt="Fresh groceries"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] via-[rgba(0,0,0,0.1)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-10">
            <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f8f5] text-[#0e6827]">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="text-white">
                <div className="text-3xl font-black tracking-tight">D-Mart</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.38em] text-white/80">Supermarket</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;