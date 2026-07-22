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
    image: "/bannersm1.png",
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
    image: "/banner2.png",
    bg: "from-yellow-50 to-orange-100",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  
  {
    id: 3,
    title: "SUPER SAVER",
    subtitle: "Top Grocery Brands",
    desc: "Best Prices Everyday",
    button: "Shop Deals",
    image: "/bannersm4.png",
    bg: "from-orange-50 to-yellow-100",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  {
    id: 4,
    title: "FREE DELIVERY",
    subtitle: "On Orders Above",
    desc: "₹499",
    button: "Order Now",
    image: "/withoubgbanner3.png",
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
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.bg} p-6 h-[240px] shadow-md hover:shadow-xl transition-all duration-500 group`}
            >
              {/* Offer Badge */}
              {item.badge && (
                <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-xs font-bold text-center shadow-lg rotate-12">
                  {item.badge}
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 w-[50%] h-full flex flex-col justify-center">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  {item.title}
                </h3>

                <p className="mt-2 text-base md:text-lg font-semibold text-gray-700">
                  {item.subtitle}
                </p>

                <p className="mt-1 text-sm md:text-base text-gray-600">
                  {item.desc}
                </p>

                <Link
                  to="/shop"
                  className={`${item.btn} mt-4 inline-flex w-fit items-center justify-center px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105`}
                >
                  {item.button}
                </Link>
              </div>

              {/* Banner Image */}
              <img
                src={item.image}
                alt={item.title}
                className="absolute right-0 bottom-0 h-[95%] w-auto object-contain group-hover:scale-105 transition-transform duration-500"
              />

              {/* Decorative Circle */}
              <div className="absolute -right-12 -bottom-12 w-36 h-36 rounded-full bg-white/20"></div>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}