import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import api, { getFileUrl } from "../api";
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
        <section className="w-full h-[75vh] md:h-[78vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 relative">
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
                            {/* Background Image with Advanced Zoom Effect */}
                            <picture className="absolute inset-0 w-full h-full">
                                {slide.mobile_image && (
                                    <source
                                        media="(max-width:768px)"
                                        srcSet={getFileUrl(slide.mobile_image) || slide.mobile_image}
                                    />
                                )}
                                <img
                                    src={getFileUrl(slide.image) || slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover scale-110 transition-transform duration-[8000ms] ease-out group-hover:scale-105"
                                />
                            </picture>

                            {/* Advanced Multi-layer Overlay with Glass Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                            <div className="absolute inset-0 backdrop-blur-sm opacity-5"></div>

                            {/* Animated Mesh Background Elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-3xl opacity-0 animate-fade-in-out" style={{ animationDelay: '0s', animation: 'fadeInOut 6s ease-in-out infinite' }}></div>
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl opacity-0 animate-fade-in-out" style={{ animationDelay: '2s', animation: 'fadeInOut 6s ease-in-out 2s infinite' }}></div>

                            {/* Content with Advanced Animations */}
                            <div className="absolute inset-0 flex items-center justify-start">
                                <PageContainer>
                                    <div className="max-w-3xl">
                                        {/* Badge with Animation */}
                                        <div className="mb-6 opacity-0 inline-block" style={{ animation: 'slideInLeft 0.8s ease-out 0.1s forwards' }}>
                                            <span className="inline-block px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-[3px]">
                                                ✨ {slide.subtitle || "Premium Collection"}
                                            </span>
                                        </div>

                                        {/* Animated Main Title with Word-by-word Effect */}
                                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-tight mb-6 md:mb-8 drop-shadow-2xl opacity-0" style={{ animation: 'slideInLeft 0.8s ease-out 0.3s forwards' }}>
                                            {slide.title}
                                        </h1>

                                        {/* Animated Description with Better Styling */}
                                        {slide.description && (
                                            <p className="hidden md:block text-gray-100 text-lg lg:text-xl leading-8 max-w-2xl mb-12 opacity-0 font-medium" style={{ animation: 'slideInLeft 0.8s ease-out 0.5s forwards' }}>
                                                {slide.description}
                                            </p>
                                        )}

                                        {/* Enhanced CTA Button with Multiple States */}
                                        <div className="flex flex-wrap gap-4 opacity-0" style={{ animation: 'slideInLeft 0.8s ease-out 0.7s forwards' }}>
                                            <Link
                                                to={slide.link || "/shop"}
                                                className="inline-flex items-center justify-center px-8 sm:px-12 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-green-600 via-green-600 to-green-700 hover:from-green-700 hover:via-green-700 hover:to-green-800 text-white font-bold text-base sm:text-lg tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl relative overflow-hidden group/btn backdrop-blur-sm border border-green-500/30"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 101.414 1.414L9 5.414V17a1 1 0 102 0V5.414l6.293 6.293a1 1 0 101.414-1.414l-7-7z"/></svg>
                                                    Shop Now
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                                            </Link>

                                            {/* Secondary Button */}
                                            <Link
                                                to="/combo"
                                                className="inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 rounded-full border-2 border-white/30 hover:border-white/60 text-white font-bold text-base sm:text-lg tracking-wide transition-all duration-300 hover:bg-white/10 backdrop-blur-md hover:scale-105"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                                                    Explore Deals
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Stats Row with Animation */}
                                        <div className="mt-12 grid grid-cols-3 gap-6 opacity-0" style={{ animation: 'slideInUp 0.8s ease-out 0.9s forwards' }}>
                                            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 sm:p-4">
                                                <p className="text-2xl sm:text-3xl font-black text-green-400">2M+</p>
                                                <p className="text-xs sm:text-sm text-gray-200 mt-1">Products</p>
                                            </div>
                                            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 sm:p-4">
                                                <p className="text-2xl sm:text-3xl font-black text-amber-300">24/7</p>
                                                <p className="text-xs sm:text-sm text-gray-200 mt-1">Delivery</p>
                                            </div>
                                            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 sm:p-4">
                                                <p className="text-2xl sm:text-3xl font-black text-green-400">₹499</p>
                                                <p className="text-xs sm:text-sm text-gray-200 mt-1">Free Above</p>
                                            </div>
                                        </div>
                                    </div>
                                </PageContainer>
                            </div>

                            {/* Corner Decorations */}
                            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-green-500/30 opacity-0" style={{ animation: 'fadeIn 0.8s ease-out 1s forwards' }}></div>
                            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-green-500/30 opacity-0" style={{ animation: 'fadeIn 0.8s ease-out 1.1s forwards' }}></div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style>{`
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes fadeInOut {
                    0%, 100% {
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                }
            `}</style>
        </section>
    );
}
