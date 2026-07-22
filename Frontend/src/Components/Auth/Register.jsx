import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, User, Phone, Mail, Lock, ShieldCheck, Leaf, ShoppingCart, CheckCircle2, Percent, Headphones, CheckSquare } from "lucide-react";
import api from "../../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreed: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.agreed) {
      return toast.error("Please agree to the Terms & Conditions");
    }

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: "user",
        status: "active",
      };

      await api.post("/auth/register", payload);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-6xl w-full bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Side: Form Section */}
          <div className="flex-1 p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
            
            {/* Header / Logo */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <div className="text-[#3a8b28] relative">
                  <ShoppingCart className="w-8 h-8" strokeWidth={2.5} />
                  <Leaf className="w-4 h-4 absolute -top-1 -left-1 fill-current" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 leading-tight">Priyam</h1>
                  <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Supermarket</p>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-3 bg-green-50/50 border border-green-100 px-4 py-2 rounded-2xl">
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-[#3a8b28]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">100% Secure</p>
                  <p className="text-[10px] text-slate-500 font-medium">Your data is safe</p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 flex items-center gap-2 mb-3">
                Create Account <Leaf className="w-6 h-6 text-[#3a8b28] fill-current opacity-80" />
              </h2>
              <p className="text-slate-500 text-sm">
                Join <span className="font-bold text-[#3a8b28]">Priyam Supermarket</span> and get the best shopping experience
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    name="username"
                    placeholder="Full Name"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-[#3a8b28] focus:ring-4 focus:ring-[#3a8b28]/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-[#3a8b28] focus:ring-4 focus:ring-[#3a8b28]/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-[#3a8b28] focus:ring-4 focus:ring-[#3a8b28]/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-[#3a8b28] focus:ring-4 focus:ring-[#3a8b28]/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-[#3a8b28] focus:ring-4 focus:ring-[#3a8b28]/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <label className="relative flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="agreed"
                    checked={form.agreed}
                    onChange={handleChange}
                    className="peer sr-only" 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${form.agreed ? 'bg-[#3a8b28] border-[#3a8b28]' : 'border-slate-300 bg-white'}`}>
                    <svg className={`w-3 h-3 text-white pointer-events-none transition-opacity ${form.agreed ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </label>
                <span className="text-sm text-slate-600 font-medium">
                  I agree to the <a href="#" className="text-[#3a8b28] font-bold hover:underline">Terms & Conditions</a>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl text-white font-bold bg-[#3a8b28] hover:bg-[#2d731d] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-[0_8px_20px_rgba(58,139,40,0.25)] flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" /> Create Account
              </button>


              <p className="text-center text-sm font-medium text-slate-600 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-[#3a8b28] font-bold hover:underline">
                  Sign In
                </Link>
              </p>

            </form>
          </div>

          {/* Right Side: Image Section */}
          <div className="hidden lg:block lg:w-[45%] relative bg-green-50 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
              alt="Fresh Groceries" 
              className="absolute inset-0 w-full h-full object-cover object-center mix-blend-multiply opacity-90"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3a8b28]/80 via-transparent to-transparent"></div>
            
            {/* Floating Logo on Basket */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-2xl">
              <div className="text-white relative mb-1">
                <ShoppingCart className="w-12 h-12" strokeWidth={2} />
                <Leaf className="w-6 h-6 absolute -top-1.5 -left-1.5 fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">Priyam</h2>
              <p className="text-xs font-bold text-white/90 tracking-[0.2em] uppercase">Supermarket</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner Section */}
        <div className="bg-[#f2f8ef] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 mt-auto">
          
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-[#e4f1df] p-3 rounded-full text-[#3a8b28]">
              <CheckCircle2 className="w-6 h-6 fill-current text-[#e4f1df]" strokeWidth={1} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Quality Assured</h4>
              <p className="text-xs text-slate-500 font-medium">We ensure best quality products</p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-[#3a8b28]/20"></div>

          <div className="flex items-center gap-4 flex-1 sm:justify-center">
            <div className="bg-[#e4f1df] p-3 rounded-full text-[#3a8b28]">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Exclusive Offers</h4>
              <p className="text-xs text-slate-500 font-medium">Get exclusive offers and discounts</p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-[#3a8b28]/20"></div>

          <div className="flex items-center gap-4 flex-1 sm:justify-end">
            <div className="bg-[#e4f1df] p-3 rounded-full text-[#3a8b28]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">24/7 Support</h4>
              <p className="text-xs text-slate-500 font-medium">We are here for you anytime</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Register;