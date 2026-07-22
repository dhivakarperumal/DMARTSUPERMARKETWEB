import React, { useContext, useEffect, useState } from "react";
import api from "../../api";
import ProductCard from "../Products/ProductsCard";
import PageHeader from "../CommenComponents/PageHeader";
import { FiFilter, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BsGrid3X3Gap, BsGridFill, BsGrid1X2, BsGrid3X2 } from "react-icons/bs";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { normalizeApiData } from "../../utils/normalizeApiData";

const Shop = ({ defaultCategory = "" }) => {
  const { productsCache, setProductsCache, lastFetchTime, setLastFetchTime } =
    useContext(StoreContext);
  const [products, setProducts] = useState(
    Array.isArray(productsCache) ? productsCache : [],
  );
  const [filteredProducts, setFilteredProducts] = useState(
    Array.isArray(productsCache) ? productsCache : [],
  );

  const [loading, setLoading] = useState(
    !productsCache || productsCache.length === 0,
  );

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(
    defaultCategory ? true : false,
  );

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState(10000);
  const [rating, setRating] = useState(0);
  const [offerFilter, setOfferFilter] = useState(0);
  const [sortOption, setSortOption] = useState("");

  const [gridView, setGridView] = useState(5);

  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const data = normalizeApiData(res.data);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */

  useEffect(() => {
    let updated = [...products];

    if (search) {
      updated = updated.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (selectedCategory) {
      updated = updated.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    if (selectedSubCategory) {
      updated = updated.filter((p) => p.subcategory === selectedSubCategory);
    }

    if (selectedColor) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.colorName === selectedColor),
      );
    }

    if (selectedSize) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.selectedSizes?.includes(selectedSize)),
      );
    }

    updated = updated.filter((p) => p.offer_price <= priceRange);

    if (rating) {
      updated = updated.filter((p) => p.rating >= rating);
    }

    if (offerFilter) {
      updated = updated.filter((p) => p.offer >= offerFilter);
    }

    /* -------- SORTING -------- */

    if (sortOption === "az") {
      updated.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortOption === "za") {
      updated.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (sortOption === "priceLowHigh") {
      updated.sort((a, b) => a.offer_price - b.offer_price);
    }

    if (sortOption === "priceHighLow") {
      updated.sort((a, b) => b.offer_price - a.offer_price);
    }

    if (sortOption === "offerHighLow") {
      updated.sort((a, b) => b.offer - a.offer);
    }

    if (sortOption === "offerLowHigh") {
      updated.sort((a, b) => a.offer - b.offer);
    }

    setFilteredProducts([...updated]);
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubCategory,
    selectedColor,
    selectedSize,
    priceRange,
    rating,
    offerFilter,
    sortOption,
    products,
  ]);

  useEffect(() => {
    if (defaultCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [defaultCategory]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setGridView(4); // reset to default desktop grid
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* -------- UNIQUE FILTER DATA -------- */

  const categories = [...new Set(products.map((p) => p.category))].filter(Boolean);

  const subCategories = [
    ...new Set(
      products
        .filter((p) => p.category === selectedCategory)
        .map((p) => p.subcategory),
    ),
  ].filter(Boolean);

  const colors = selectedCategory
    ? [
      ...new Set(
        products
          .filter((p) => p.category === selectedCategory)
          .flatMap((p) => p.variants?.map((v) => v.colorName)),
      ),
    ].filter(Boolean)
    : [];

  const sizes = selectedCategory
    ? [
      ...new Set(
        products
          .filter((p) => p.category === selectedCategory)
          .flatMap((p) => p.variants?.flatMap((v) => v.selectedSizes || [])),
      ),
    ].filter(Boolean)
    : [];


  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedColor("");
    setSelectedSize("");
    setPriceRange(10000);
    setRating(0);
    setOfferFilter(0);
  };

  const productsPerPage =
    gridView === 5
      ? 15
      : gridView === 4
        ? 12
        : gridView === 3
          ? 9
          : gridView === 2
            ? 6
            : 3;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;

  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <>
        <PageHeader title={defaultCategory ? defaultCategory : "Shop"} />

        {/* PRODUCT SKELETON GRID */}
        <div className="px-4 md:px-10 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 animate-pulse rounded-xl h-[300px]"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Shop" />

      {/* SHOP HERO */}
      <div className="px-4 md:px-10 mt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 via-green-700 to-green-600 text-white shadow-xl">

          {/* Background Decoration */}
          <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/10 rounded-full"></div>
          <div className="absolute right-32 bottom-0 w-36 h-36 bg-yellow-400/10 rounded-full"></div>

        </div>
      </div>

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-10 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 cursor-pointer"
        >
          {showFilters ? (
            <>
              <FiX size={18} />
              Hide Filters
            </>
          ) : (
            <>
              <FiFilter size={18} />
              Show Filters
            </>
          )}
        </button>

        <p className="text-sm text-gray-600">
          {filteredProducts.length} Products
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start items-center mt-6 w-full mb-6">
        {/* FILTER SIDEBAR */}

        {showFilters && (
          <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-8 lg:ml-10 lg:sticky lg:top-24 h-fit">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800">Filters</h3>

              <button
                onClick={clearFilters}
                className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-2xl cursor-pointer font-medium"
              >
                Clear
              </button>
            </div>

            {/* PRICE */}

            <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                Price
              </h4>

              <input
                type="range"
                min="0"
                max="10000"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full"
              />

              <p className="text-sm mt-1">Up to ₹{priceRange}</p>
            </div>

            {/* CATEGORY */}

            <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                Category
              </h4>

              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 mb-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    className="accent-primary"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                  />

                  <span className="text-sm text-gray-700">{cat}</span>
                </label>
              ))}
            </div>

            {/* SUBCATEGORY */}

            {selectedCategory && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                  SubCategory
                </h4>

                {subCategories.map((sub) => (
                  <label
                    key={sub}
                    className="flex items-center gap-3 mb-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="subcategory"
                      className="accent-primary"
                      checked={selectedSubCategory === sub}
                      onChange={() => setSelectedSubCategory(sub)}
                    />

                    <span className="text-sm text-gray-700">{sub}</span>
                  </label>
                ))}
              </div>
            )}

            {/* COLORS */}

            {selectedCategory && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                  Colors
                </h4>

                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 text-xs font-medium border rounded-full transition ${selectedColor === color
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-primary"
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZES */}

            {selectedCategory && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                  Sizes
                </h4>

                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 text-sm font-semibold border rounded-lg transition ${selectedSize === size
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-primary"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RATING */}

            {/* <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                Rating
              </h4>

              {[4, 3, 2, 1].map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 mb-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rating"
                    className="accent-primary"
                    checked={rating === r}
                    onChange={() => setRating(r)}
                  />

                  <span className="text-sm text-gray-700">{r}+ Stars</span>
                </label>
              ))}
            </div> */}

            {/* OFFERS */}

            <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">
                Offers
              </h4>

              {[10, 20, 30, 40, 50].map((offer) => (
                <label
                  key={offer}
                  className="flex items-center gap-3 mb-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="offer"
                    className="accent-primary"
                    checked={offerFilter === offer}
                    onChange={() => setOfferFilter(offer)}
                  />

                  <span className="text-sm text-gray-700">
                    {offer}% and above
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS GRID */}

        <div className="flex-1">
          <div
            className={`px-4 md:px-10 py-6 grid gap-6 
  ${gridView === 5
                ? showFilters
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-5"
                : gridView === 4
                  ? "lg:grid-cols-4"
                  : gridView === 3
                    ? "lg:grid-cols-3"
                    : gridView === 2
                      ? "grid-cols-2"
                      : "grid-cols-1"
              }`}
          >
            {currentProducts.length > 0 ? (
              currentProducts.map((product, index) => (
                <ProductCard key={product._id ?? product.id ?? index} product={product} />
              ))
            ) : (
              <p>No products found</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <FiChevronLeft size={18} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg border transition cursor-pointer ${currentPage === page
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white hover:bg-gray-100"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Shop;
