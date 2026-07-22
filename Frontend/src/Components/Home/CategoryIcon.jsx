import React, { useEffect, useState } from "react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import { Link } from "react-router-dom";
import Heading from "../Heading";
import { useContext } from "react";
import { StoreContext } from "../../PrivateRouter/StoreContext";

const CategoryIcon = () => {
  const { categoriesCache, setCategoriesCache } = useContext(StoreContext);
  const [categories, setCategories] = useState(categoriesCache || []);
  const [loading, setLoading] = useState(!categoriesCache || categoriesCache.length === 0);

  const fetchCategories = async () => {
    try {
      if (categoriesCache && categoriesCache.length > 0) {
        setCategories(categoriesCache);
        setLoading(false);
        return;
      }

      const res = await api.get("/categories");
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data);
      setCategoriesCache(data);
    } catch (error) {
      console.error(error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [categoriesCache, setCategoriesCache]);

  return (
    <section className="py-12 bg-white overflow-hidden">
      <PageContainer>
        {/* Section Heading */}

        <Heading title="Shop By Category" align="left" />
        {/* Categories container */}
        {loading ? (
          <div className="flex flex-wrap justify-start gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-between p-3 w-28 h-32 md:w-32 md:h-40 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg mt-2" />
                <div className="w-16 h-3 bg-gray-200 rounded-full mb-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-start gap-4 md:gap-6">
            {Array.isArray(categories) &&
              categories.map((cat) => {
                const name = String(cat?.name || "Category").trim();
                const slug = name ? name.toLowerCase().replace(/\s+/g, "-") : String(cat?.id || "category");
                return (
                  <Link
                    key={cat?.id || slug}
                    to={`/category/${slug}`}
                    className="group flex flex-col items-center justify-between p-3 w-28 h-32 md:w-34 md:h-44 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-full flex-1 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={
                          cat?.images?.[0] ||
                          "https://images.unsplash.com/photo-1610030469983-98e550d6193c"
                        }
                        alt={name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-in-out"
                      />
                    </div>

                    <div className="w-full text-center mt-2">
                      <p className="text-xs md:text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {name}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </PageContainer>
    </section>
  );
};

export default CategoryIcon;
