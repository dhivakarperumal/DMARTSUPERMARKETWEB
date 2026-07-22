import React, { useEffect, useState } from "react";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useContext } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import ProductCard from "../Products/ProductsCard";
import Heading from "../Heading";
import PageContainer from "../CommenComponents/PageContainer";

const SareeSwiper = () => {
  const { productsCache, setProductsCache, lastFetchTime, setLastFetchTime } = useContext(StoreContext);
  const initialSarees = Array.isArray(productsCache) ? productsCache.filter(p => p.category?.toLowerCase() === "saree") : [];
  const [sarees, setSarees] = useState(initialSarees);

  const fetchSarees = async () => {
    try {
      const res = await api.get("/products");
      const data = Array.isArray(res.data) ? res.data : [];
      // If we still want to show all products or just specific ones, we can just use data
      // since this is a supermarket now, let's just show top 10 products if no "saree" category exists
      const filtered = data.filter((p) => p.category?.toLowerCase() === "saree");
      setSarees(filtered.length > 0 ? filtered : data.slice(0, 10));
    } catch (error) {
      console.error("Error fetching products:", error);
      setSarees([]);
    }
  };

  useEffect(() => {
    fetchSarees();
  }, []);

  if (sarees.length === 0) {
    return (
      <PageContainer>
        <div className="py-5">
          <Heading title="Latest Products" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="w-full h-80 bg-gray-100"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-8">
        <Heading title="Latest Products" />

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Flash Sale Card */}
          <div className="lg:w-[260px] w-full shrink-0">
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl border border-orange-100 h-full p-6 flex flex-col justify-between shadow-sm">

              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  ⚡ Flash Sale
                </h2>

                <p className="text-gray-500 mt-2">
                  Hurry up! Deals end in
                </p>

                <div className="flex gap-3 mt-6">

                  <div className="flex-1 bg-white rounded-xl shadow-sm py-3">
                    <h3 className="text-red-600 text-2xl font-bold text-center">
                      02
                    </h3>
                    <p className="text-xs text-center text-gray-500">
                      Hours
                    </p>
                  </div>

                  <div className="flex-1 bg-white rounded-xl shadow-sm py-3">
                    <h3 className="text-red-600 text-2xl font-bold text-center">
                      15
                    </h3>
                    <p className="text-xs text-center text-gray-500">
                      Mins
                    </p>
                  </div>

                  <div className="flex-1 bg-white rounded-xl shadow-sm py-3">
                    <h3 className="text-red-600 text-2xl font-bold text-center">
                      30
                    </h3>
                    <p className="text-xs text-center text-gray-500">
                      Secs
                    </p>
                  </div>

                </div>
              </div>

              <button className="mt-8 bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-semibold transition">
                View All Deals
              </button>

            </div>
          </div>

          {/* Product Swiper */}

          <div className="flex-1 min-w-0 overflow-hidden">

            <Swiper
              modules={[Autoplay, Navigation]}
              navigation={{
                nextEl: ".latest-next",
                prevEl: ".latest-prev",
              }}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              loop={sarees.length > 4}
              spaceBetween={18}
              breakpoints={{
                0: {
                  slidesPerView: 2,
                },
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                1024: {
                  slidesPerView: 4,
                },
                1280: {
                  slidesPerView: 4,
                },
              }}
            >
              {sarees.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  <div className="w-full min-w-0">
                    <ProductCard product={product} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

          </div>

        </div>
      </div>
    </PageContainer>
  );
};

export default SareeSwiper;
