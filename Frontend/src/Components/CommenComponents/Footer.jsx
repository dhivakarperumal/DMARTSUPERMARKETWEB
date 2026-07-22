import React from "react";
import { Link } from "react-router-dom";
import PageContainer from "./PageContainer";
import { useState, useEffect } from "react";
import api from "../../api";
import { normalizeApiData } from "../../utils/normalizeApiData";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTwitter,
} from "react-icons/fa";
import {
  SiVisa,
  SiMastercard,
  SiPaytm,
} from "react-icons/si";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Home,
  ShoppingBag,
  Info,
  PhoneCall,
  User,
  Package,
  RotateCcw,
  HelpCircle,
  Shield,
  FileText,
  Truck,
  RefreshCw,
  Apple,
  ShoppingBasket,
  Milk,
  Coffee,
  Heart,
} from "lucide-react";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(normalizeApiData(res.data));
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);
  return (
    <footer className="bg-gradient-to-r from-[#0b5b1c] via-[#084b17] to-[#063914] text-white ">

      <PageContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 py-12">

          {/* Logo */}
          <div className="lg:col-span-2">

            <Link to="/" className="flex items-center gap-3 mb-5">

              <img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />

              <div>

                <h2 className="text-2xl font-bold tracking-wide">
                  PRIYAM SUPERMARKET
                </h2>

                <p className="text-xs text-green-200 uppercase">
                  Supermarket Shopping Cart
                </p>

              </div>

            </Link>

            <p className="text-sm text-green-100 leading-7 max-w-sm">
              Your trusted destination for all your daily needs.
              Fresh vegetables, fruits, groceries, dairy products,
              beverages and household essentials at affordable prices.
            </p>

            <div className="flex gap-4 mt-6">

              <a href="#">
                <FaFacebookF className="hover:text-blue-400 transition text-lg" />
              </a>

              <a href="#">
                <FaInstagram className="hover:text-pink-400 transition text-lg" />
              </a>

              <a href="#">
                <FaTwitter className="hover:text-sky-400 transition text-lg" />
              </a>

              <a href="#">
                <FaYoutube className="hover:text-red-500 transition text-lg" />
              </a>

            </div>

          </div>

          {/* Company */}
          <div>

            <h3 className="uppercase text-sm font-semibold mb-5 tracking-wider">
              Company
            </h3>

            <ul className="space-y-3 text-sm text-green-100">

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <Home size={16} className="text-green-300" />
                  Home
                </Link>
              </li>

              <li>
                <Link to="/shop" className="flex items-center gap-2 hover:text-white transition">
                  <ShoppingBag size={16} className="text-green-300" />
                  Shop
                </Link>
              </li>

              <li>
                <Link to="/about" className="flex items-center gap-2 hover:text-white transition">
                  <Info size={16} className="text-green-300" />
                  About Us
                </Link>
              </li>

              <li>
                <Link to="/contactus" className="flex items-center gap-2 hover:text-white transition">
                  <PhoneCall size={16} className="text-green-300" />
                  Contact Us
                </Link>
              </li>

            </ul>

          </div>

          {/* Customer */}
          <div>

            <h3 className="uppercase text-sm font-semibold mb-5 tracking-wider">
              Customer Care
            </h3>

            <ul className="space-y-3 text-sm text-green-100">

              <li>
                <Link to="/profile" className="flex items-center gap-2 hover:text-white transition">
                  <User size={16} className="text-green-300" />
                  My Account
                </Link>
              </li>

              <li>
                <Link to="/orders" className="flex items-center gap-2 hover:text-white transition">
                  <Package size={16} className="text-green-300" />
                  Track Order
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <RotateCcw size={16} className="text-green-300" />
                  Returns & Refunds
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <HelpCircle size={16} className="text-green-300" />
                  FAQ
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <HelpCircle size={16} className="text-green-300" />
                  Help Center
                </Link>
              </li>

            </ul>

          </div>

          {/* Policies */}
          <div>

            <h3 className="uppercase text-sm font-semibold mb-5 tracking-wider">
              Policies
            </h3>

            <ul className="space-y-3 text-sm text-green-100">

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <Shield size={16} className="text-green-300" />
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <FileText size={16} className="text-green-300" />
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <Truck size={16} className="text-green-300" />
                  Shipping Policy
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <RefreshCw size={16} className="text-green-300" />
                  Return Policy
                </Link>
              </li>

              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                  <RefreshCw size={16} className="text-green-300" />
                  Cancellation Policy
                </Link>
              </li>

            </ul>

          </div>

          {/* Categories */}
          <div>

            <h3 className="uppercase text-sm font-semibold mb-5 tracking-wider">
              Categories
            </h3>

            <ul className="space-y-3 text-sm text-green-100">
              {categories.length > 0 ? (
                categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/category/${category.slug || category.name}`}
                      className="flex items-center gap-2 hover:text-white transition"
                    >
                      <ChevronRight size={15} className="text-green-300" />
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-green-300">No Categories Found</li>
              )}
            </ul>

          </div>

        </div>

      </PageContainer>

      {/* Contact Row */}

      <div className="border-t border-green-700">

        <PageContainer>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 text-sm text-green-100">

            <div className="flex items-center gap-3">

              <MapPin size={18} />

              <span>Tirupattur, Tamil Nadu 635602</span>

            </div>

            <div className="flex items-center gap-3">

              <Phone size={18} />

              <span>+91 98765 43210</span>

            </div>

            <div className="flex items-center gap-3">

              <Mail size={18} />

              <span>support@priyam.com</span>

            </div>

            <div className="flex items-center gap-3">

              <Clock size={18} />

              <span>Mon - Sun : 6AM - 11PM</span>

            </div>

          </div>

        </PageContainer>

      </div>

      {/* Bottom */}

      <div className="bg-[#052f12] border-t border-green-800">

        <PageContainer>

          <div className="py-5 flex flex-col lg:flex-row items-center justify-between gap-5">

            <p className="text-sm text-green-100">
              © {new Date().getFullYear()} Priyam Supermarket. All Rights Reserved.
            </p>

            <div className="flex items-center gap-5">

              <span className="text-sm text-green-100">
                We Accept
              </span>

              <SiVisa className="text-3xl" />

              <SiMastercard className="text-3xl" />

              <span className="font-bold text-lg">
                RuPay
              </span>

              <span className="font-bold text-lg">
                UPI
              </span>

              <SiPaytm className="text-3xl" />

            </div>

          </div>

        </PageContainer>

      </div>

    </footer>
  );
};

export default Footer;