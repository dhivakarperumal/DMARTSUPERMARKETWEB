import React from "react";
import { Link } from "react-router-dom";
const BannerImage = "/images/bannersection.png"; // served from Frontend/public
import PageContainer from "./CommenComponents/PageContainer";

export default function Banner() {
  return (
    <PageContainer>
    <section className="w-full">
      <div className="max-w-8xl mx-auto">

        <div className="relative h-[180px] md:h-[260px] overflow-hidden rounded-2xl shadow-xl">

          {/* Background Banner */}
          <img
            src={BannerImage}
            alt="Supermarket Offer"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Left Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="pl-6 md:pl-10 max-w-lg text-white">

              <h2 className="text-3xl md:text-5xl font-extrabold uppercase leading-tight">
                TOP OFFERS FOR YOU
              </h2>

              <p className="mt-2 text-sm md:text-lg text-green-100">
                Grab the best deals on top brands
              </p>

              <Link
                to="/shop"
                className="inline-block mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition"
              >
                Explore All Offers
              </Link>

            </div>
          </div>

          {/* Offer Badge */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex">
            <div className="w-32 h-32 rounded-full bg-yellow-400 flex flex-col items-center justify-center shadow-xl">

              <span className="text-sm font-bold">
                UP TO
              </span>

              <span className="text-5xl font-black leading-none">
                60%
              </span>

              <span className="text-lg font-bold">
                OFF
              </span>

            </div>
          </div>

        </div>

      </div>
    </section>
    </PageContainer>
  );
}