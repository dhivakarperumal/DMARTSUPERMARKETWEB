import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import api from "../api";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../PrivateRouter/StoreContext";

import "swiper/css";
import "swiper/css/effect-fade";
import PageContainer from "./CommenComponents/PageContainer";
import "swiper/css/pagination";

const defaultSlides = [
    {
        title: "Timeless Elegance",
        subtitle: "Premium Collection",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
        link: "/shop"
    }
];

export default function HeroSlider() {
    const { bannersCache, setBannersCache } = useContext(StoreContext);
    const [slides, setSlides] = useState(Array.isArray(bannersCache?.hero) ? bannersCache.hero : defaultSlides);
    const [loading, setLoading] = useState(!Array.isArray(bannersCache?.hero));

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                if (bannersCache.hero) {
                    setSlides(bannersCache.hero);
                    setLoading(false);
                    return;
                }

                const response = await api.get("/banners?type=hero&active=1");
                const activeBanners = Array.isArray(response.data) ? response.data : [];
                const finalSlides = activeBanners.length > 0 ? activeBanners : defaultSlides;
                setSlides(finalSlides);
                setBannersCache(prev => ({ ...prev, hero: finalSlides }));
            } catch (error) {
                console.error("Error fetching hero banners:", error);
                setSlides(defaultSlides);
                setBannersCache(prev => ({ ...prev, hero: defaultSlides }));
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, [bannersCache, setBannersCache]);

    if (loading) return (
        <div className="w-full h-[70vh] bg-slate-50 animate-pulse flex items-center justify-center">
            <p className="text-slate-300 font-serif italic text-xl">Curating Elegance...</p>
        </div>
    );


    return (
        <section className="w-full h-[75vh] md:h-screen overflow-hidden bg-slate-900">
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                loop={slides.length > 1}
                className="w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={index} className="!h-full">
                        <div className="relative w-full h-full overflow-hidden group">

                            {/* Background Image */}
                            <picture className="absolute inset-0 w-full h-full">
                                {slide.mobile_image && (
                                    <source
                                        media="(max-width:768px)"
                                        srcSet={slide.mobile_image}
                                    />
                                )}

                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover scale-110 blur-[2px] brightness-90 transition-all duration-[10000ms] group-hover:scale-105"
                                />
                            </picture>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/15 to-transparent"></div>

                            {/* Content */}
                            <div className="absolute inset-0 flex items-center justify-center text-center">
                                <PageContainer>
                                    <div className="max-w-4xl mx-auto px-4">

                                        <p className="mb-4 text-[10px] sm:text-xs md:text-sm uppercase tracking-[4px] md:tracking-[8px] text-amber-400 font-semibold">
                                            {slide.subtitle || "Premium Collection"}
                                        </p>

                                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-white leading-tight mb-4 md:mb-6 drop-shadow-2xl">
                                            {slide.title}
                                        </h1>

                                        {slide.description && (
                                            <p className="hidden md:block text-gray-200 text-lg lg:text-xl leading-10 max-w-2xl mx-auto mb-10">
                                                {slide.description}
                                            </p>
                                        )}

                                        <div className="flex justify-center">
                                            <Link
                                                to={slide.link || "/shop"}
                                                className="inline-flex items-center justify-center px-5 py-2.5 md:px-10 md:py-4 rounded-lg md:rounded-xl bg-green-600 hover:bg-green-700 text-sm md:text-base text-white font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-xl"
                                            >
                                                Shop Now →
                                            </Link>
                                        </div>

                                    </div>
                                </PageContainer>
                            </div>

                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>


        </section>

    );
}
