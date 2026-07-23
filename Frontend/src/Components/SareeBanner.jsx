import React from "react";
import { Link } from "react-router-dom";
import PageContainer from "./CommenComponents/PageContainer";

const banners = [
  {
    id: 1,
    title: "100% ORGANIC",
    subtitle: "Fresh & Healthy",
    desc: "Farm Fresh Vegetables",
    button: "Shop Organic",
    image: "/images/bannersm1.png",
    bg: "from-green-50 to-green-100",
    btn: "bg-green-700 hover:bg-green-800",
  },
  {
    id: 2,
    title: "COMBO OFFERS",
    subtitle: "More Essentials",
    desc: "More Savings",
    // badge: "SAVE ₹250",
    button: "Shop Now",
    image: "/images/banner2.png",
    bg: "from-yellow-50 to-orange-100",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },

  {
    id: 3,
    title: "SUPER SAVER",
    subtitle: "Top Grocery Brands",
    desc: "Best Prices Everyday",
    button: "Shop Deals",
    image: "/images/bannersm4.png",
    bg: "from-orange-50 to-yellow-100",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  {
    id: 4,
    title: "FREE DELIVERY",
    subtitle: "On Orders Above",
    desc: "₹499",
    button: "Order Now",
    image: "/images/withoubgbanner3.png",
    bg: "from-blue-50 to-indigo-100",
    btn: "bg-primary hover:bg-primary-dark",
  },
];

export default function OfferBanner() {
  return (
    <section className="py-12">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((item) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.bg} h-[240px] p-6 shadow-md hover:shadow-xl transition-all duration-500 group`}
            >
              {/* Offer Badge */}
              {item.badge && (
                <div className="absolute top-4 right-4 z-20 bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-xs font-bold text-center shadow-lg rotate-12">
                  {item.badge}
                </div>
              )}

              {/* Left Content */}
              <div className="relative z-10 flex flex-col justify-center h-full max-w-[55%]">
                <h3 className="text-3xl font-extrabold leading-tight text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-2xl font-semibold text-gray-700">
                  {item.subtitle}
                </p>

                <p className="mt-2 text-base text-gray-600 leading-relaxed">
                  {item.desc}
                </p>

                <Link
                  to="/shop"
                  className={`${item.btn} mt-6 inline-flex w-fit items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-white transition duration-300 hover:scale-105`}
                >
                  {item.button}
                </Link>
              </div>

              {/* Right Image */}
              <div className="absolute right-4 bottom-0 w-[42%] h-full flex items-end justify-center pointer-events-none">
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-[92%] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Decoration */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/20"></div>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}