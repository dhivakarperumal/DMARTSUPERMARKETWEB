import React from "react";
import Heading from "../Heading";
import AnimatedButton from "../AnimatedButton";
import PageContainer from "../CommenComponents/PageContainer";
import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaShippingFast,
  FaTags,
  FaShieldAlt,
} from "react-icons/fa";

export default function About() {
  return (
    <section className="py-20 bg-gradient-to-b from-green-50 via-white to-white">
      <PageContainer>

        <div className="grid lg:grid-cols-2 gap-16 items-center mt-10">

          {/* Left Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="/aboutimagesupermarket.png"
                alt="Supermarket"
                className="w-full h-[500px] object-cover hover:scale-105 transition duration-700"
              />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-8 left-8 bg-green-600 text-white px-8 py-5 rounded-2xl shadow-xl">
              <p className="text-3xl font-bold">10+</p>
              <p className="text-sm opacity-90">
                Years Serving Freshness
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div>

            <span className="inline-block mb-5 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              🌿 Fresh • Healthy • Affordable
            </span>

            <Heading title="Where Freshness Meets Convenience" />

            {/* <p className="   text-gray-600 leading-8 text-lg">
              We provide farm-fresh fruits, vegetables, groceries,
              dairy products, beverages, household essentials, and
              daily needs at affordable prices. Our mission is to make
              grocery shopping easy, convenient, and enjoyable for every
              family.
            </p> */}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">

              {/* Card 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-green-500 bg-white p-6 shadow-2xl transition-all duration-300 hover:border-green-100 hover:shadow-md">

                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-lime-400 scale-x-100 group-hover:scale-x-0 transition-transform duration-300 origin-left"></div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl mt-1 transition-all duration-300 group-hover:bg-green-100 group-hover:text-green-600">
                    <FaLeaf />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Best Prices
                    </h4>

                    <p className="text-gray-500 text-sm leading-6 mt-2">
                      Enjoy daily deals, exclusive discounts, and unbeatable grocery prices.
                    </p>
                  </div>
                </div>

              </div>

              {/* Card 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-green-500 bg-white p-6 shadow-2xl transition-all duration-300 hover:border-green-100 hover:shadow-md">

                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-lime-400 scale-x-100 group-hover:scale-x-0 transition-transform duration-300 origin-left"></div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl mt-1 transition-all duration-300 group-hover:bg-green-100 group-hover:text-green-600">
                    <FaShippingFast />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Fast Delivery
                    </h4>

                    <p className="text-gray-500 text-sm leading-6 mt-2">
                      Same-day delivery with secure packaging to keep your groceries fresh.
                    </p>
                  </div>
                </div>

              </div>

              {/* Card 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-green-500 bg-white p-6 shadow-2xl transition-all duration-300 hover:-translate-y-0 hover:border-green-100 hover:shadow-md">

                {/* Top Line */}
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-lime-400 scale-x-100 group-hover:scale-x-0 transition-transform duration-300 origin-left"></div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl mt-1 transition-all duration-300 group-hover:bg-green-100 group-hover:text-green-600">
                    <FaLeaf />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Farm Fresh
                    </h4>

                    <p className="text-gray-500 text-sm leading-6 mt-2">
                      Fresh fruits and vegetables sourced directly from trusted local farms every day.
                    </p>
                  </div>
                </div>

              </div>

              {/* Card 4 */}
              <div className="group relative overflow-hidden rounded-2xl border border-green-500 bg-white p-6 shadow-2xl transition-all duration-300 hover:border-green-100 hover:shadow-md">

                {/* Top Line */}
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-lime-400 scale-x-100 group-hover:scale-x-0 transition-transform duration-300 origin-left"></div>

                <div className="flex items-start gap-4">

                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl mt-1 transition-all duration-300 group-hover:bg-green-100 group-hover:text-green-600">
                    <FaShieldAlt />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Quality Assured
                    </h4>

                    <p className="text-gray-500 text-sm leading-6 mt-2">
                      Every product is carefully inspected to ensure premium quality and freshness before delivery.
                    </p>
                  </div>

                </div>

              </div>

            </div>

            <div className="mt-10 flex">
              <Link to="/about">
                <AnimatedButton text="Explore More" />
              </Link>
            </div>

          </div>
        </div>
      </PageContainer>
    </section>
  );
}