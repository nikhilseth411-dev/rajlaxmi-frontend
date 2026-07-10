import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/customer.css";

import { API_BASE_URL as API_BASE, BACKEND_BASE_URL as BACKEND_BASE } from "../config/api";

const FALLBACK_CATEGORIES = [
  ["Bangles", "BANGLES"],
  ["Mangalsutra", "MANGALSUTRA"],
  ["Earrings", "EARRINGS"],
  ["Necklaces", "NECKLACES"],
  ["Rings", "RINGS"],
  ["Pendants", "PENDANTS"],
  ["Chains", "CHAINS"],
  ["Bracelets", "BRACELETS"],
  ["Mangtika", "MANGTIKA"],
  ["Dholna", "DHOLNA"],
  ["Nathiya", "NATHIYA"],
  ["Jhumka", "JHUMKA"],
  ["Tops", "TOPS"],
  ["Lockets", "LOCKETS"],
  ["Gold Jewellery", "GOLD_JEWELLERY"],
  ["Diamond Jewellery", "DIAMOND_JEWELLERY"],
  ["Silver Collection", "SILVER_COLLECTION"],
  ["Bridal Collection", "BRIDAL_COLLECTION"],
  ["Temple Jewellery", "TEMPLE_JEWELLERY"],
].map(([name, productCategory]) => ({ name, productCategory }));

const PRICE_RANGES = [
  { value: "under-5000", label: "Under ₹5,000", min: 0, max: 5000 },
  { value: "5000-10000", label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { value: "10000-20000", label: "₹10,000 - ₹20,000", min: 10000, max: 20000 },
  { value: "20000-25000", label: "₹20,000 - ₹25,000", min: 20000, max: 25000 },
  { value: "25000-30000", label: "₹25,000 - ₹30,000", min: 25000, max: 30000 },
  { value: "30000-40000", label: "₹30,000 - ₹40,000", min: 30000, max: 40000 },
  { value: "40000-50000", label: "₹40,000 - ₹50,000", min: 40000, max: 50000 },
  { value: "50000-60000", label: "₹50,000 - ₹60,000", min: 50000, max: 60000 },
  { value: "60000-80000", label: "₹60,000 - ₹80,000", min: 60000, max: 80000 },
  { value: "80000-100000", label: "₹80,000 - ₹1,00,000", min: 80000, max: 100000 },
  { value: "above-100000", label: "Above ₹1,00,000", min: 100000, max: null },
];

const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

const categoryMatchesQuery = (category, query) => {
  const normalizedQuery = normalizeCategory(query);
  const normalizedName = normalizeCategory(category.name);
  const normalizedSlug = normalizeCategory(category.slug);
  return [normalizedName, normalizedSlug, normalizedSlug.replace(/^gold-/, "")]
    .filter(Boolean)
    .includes(normalizedQuery);
};

const buildCategoryOptions = (categories) => {
  const apiOptions = categories.map((category) => ({
    ...category,
    value: `id:${category.id}`,
  }));
  const existingNames = new Set(apiOptions.map((option) => normalizeCategory(option.name)));
  const fallbacks = FALLBACK_CATEGORIES
    .filter((option) => !existingNames.has(normalizeCategory(option.name)))
    .map((option) => ({ ...option, value: `enum:${option.productCategory}` }));
  return [...apiOptions, ...fallbacks];
};

const resolveCategoryFilter = (requestedCategory, options) => {
  if (!requestedCategory) return "";
  return options.find((option) => categoryMatchesQuery(option, requestedCategory))?.value || "";
};

const formatCategoryName = (value) =>
  String(value || "Jewellery")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatPurity = (value) => String(value || "Pure").replace("GOLD_", "");

const getWeight = (product) =>
  product?.weightGrams ?? product?.weightInGrams ?? product?.weight ?? null;

const formatWeight = (product) => {
  const weight = Number(getWeight(product));
  return Number.isFinite(weight) ? `${weight.toFixed(3)} gm` : "Not available";
};

const formatMakingCharge = (product) => {
  const type = String(product.makingChargesType || "").toUpperCase();
  if (type === "PERCENTAGE" || type === "PERCENT") {
    return `Making Charges: ${Number(product.makingChargesValue || 0)}%`;
  }
  if (type === "PER_GRAM") return "Making Charges: Per gram";
  if (type === "FIXED") return "Making Charges: Fixed";
  return null;
};

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Price unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = (searchParams.get("category") || "").trim();
  const requestedSearch = (searchParams.get("search") || "").trim();
  const fallbackOptions = buildCategoryOptions([]);
  const initialCategoryFilter = resolveCategoryFilter(requestedCategory, fallbackOptions);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState(
    requestedSearch || (requestedCategory && !initialCategoryFilter ? requestedCategory : ""),
  );
  const [metalType, setMetalType] = useState("");
  const [selectedPurities, setSelectedPurities] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [priceFilter, setPriceFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = buildCategoryOptions(categories);
  const selectedCategoryName =
    categoryOptions.find((option) => option.value === categoryFilter)?.name ||
    requestedCategory;
  const selectedPriceRange = PRICE_RANGES.find((range) => range.value === priceFilter);
  const visibleProducts = products
    .filter((product) => {
      if (selectedPurities.length === 0) return true;
      return String(product.goldPurity || "").toUpperCase()
        && selectedPurities.includes(String(product.goldPurity || "").toUpperCase());
    })
    .filter((product) => {
      if (!selectedPriceRange) return true;
        const price = Number(product.finalPrice);
        if (!Number.isFinite(price)) return false;
        if (selectedPriceRange.max === null) return price > selectedPriceRange.min;
        return price >= selectedPriceRange.min && price <= selectedPriceRange.max;
    });

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/placeholders/jewellery-display.webp";
    if (imageUrl.startsWith("http")) return encodeURI(imageUrl);

    const cleanPath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
    if (cleanPath.startsWith("api/v1/")) return encodeURI(`${BACKEND_BASE}/${cleanPath}`);
    return encodeURI(`${API_BASE}/${cleanPath}`);
  };

  const extractProducts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const extractCategories = (data) => {
    const list = data?.data?.content || data?.data || data?.content || data || [];
    return Array.isArray(list) ? list : [];
  };

  const fetchProducts = async (overrides = {}) => {
    const activeKeyword = overrides.keyword ?? keyword;
    const activeMetalType = overrides.metalType ?? metalType;
    const activeSelectedPurities = overrides.selectedPurities ?? selectedPurities;
    const activeGoldPurity = activeSelectedPurities.length === 1 ? activeSelectedPurities[0] : "";
    const activeCategoryFilter = overrides.categoryFilter ?? categoryFilter;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (activeKeyword.trim()) params.append("keyword", activeKeyword.trim());
      if (activeMetalType) params.append("metalType", activeMetalType);
      if (activeGoldPurity) params.append("goldPurity", activeGoldPurity);
      if (activeCategoryFilter.startsWith("id:")) {
        params.append("categoryId", activeCategoryFilter.slice(3));
      } else if (activeCategoryFilter.startsWith("enum:")) {
        params.append("productCategory", activeCategoryFilter.slice(5));
      }

      params.append("page", "0");
      params.append("size", "100");
      params.append("sortBy", "createdAt");
      params.append("sortDir", "desc");

      const response = await fetch(`${API_BASE}/products?${params.toString()}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load products right now.");
      }
      setProducts(extractProducts(data));
    } catch (err) {
      console.error("Customer products error:", err);
      setError("Unable to connect. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function initializeProducts() {
      let categoryList = [];
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (response.ok) categoryList = extractCategories(await response.json());
      } catch (err) {
        console.error("Category fetch error:", err);
      }

      const options = buildCategoryOptions(categoryList);
      const resolvedFilter = resolveCategoryFilter(requestedCategory, options);
      const resolvedKeyword =
        requestedSearch || (requestedCategory && !resolvedFilter ? requestedCategory : "");

      if (!active) return;
      setCategories(categoryList);
      setCategoryFilter(resolvedFilter);
      setKeyword(resolvedKeyword);
      await fetchProducts({
        keyword: resolvedKeyword,
        metalType: "",
        goldPurity: "",
        categoryFilter: resolvedFilter,
        selectedPurities: [],
      });
    }

    initializeProducts();
    return () => {
      active = false;
    };
    // Initial filters are passed explicitly; state-based fetches happen from form actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedCategory, requestedSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchProducts();
  };

  const toggleGoldPurity = (purity) => {
    setSelectedPurities((current) => {
      const normalized = purity.toUpperCase();
      if (current.includes(normalized)) {
        return current.filter((item) => item !== normalized);
      }
      if (metalType && metalType !== "GOLD") setMetalType("GOLD");
      return [...current, normalized];
    });
  };

  const resetFilters = () => {
    setKeyword("");
    setMetalType("");
    setSelectedPurities([]);
    setCategoryFilter("");
    setPriceFilter("");
    setSearchParams({});
    fetchProducts({ keyword: "", metalType: "", selectedPurities: [], categoryFilter: "" });
  };

  return (
    <main className="productsPage">
      <section className="productsHero">
        <p>Raj Laxmi Jewellers</p>
        <h1>{selectedCategoryName || "Our Jewellery Collection"}</h1>
        <span>Explore BIS hallmarked designs with transparent weight and live pricing.</span>
      </section>

      <section className="productsContainer">
        <form className="productsFilterBar" onSubmit={handleSearch}>
          <div className="filterField filterCategoryField">
            <label htmlFor="product-category">1. Choose jewellery</label>
            <select
              id="product-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All Jewellery</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.name}</option>
              ))}
            </select>
          </div>

          <div className="filterField filterPriceField">
            <label htmlFor="product-price">2. Choose your budget</label>
            <select
              id="product-price"
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value)}
            >
              <option value="">All Prices</option>
              {PRICE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          <div className="filterField filterSearchField">
            <label htmlFor="product-search">Search</label>
            <input
              id="product-search"
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Name or SKU"
            />
          </div>

          <div className="filterField filterMetalField">
            <label htmlFor="product-metal">Metal</label>
            <select id="product-metal" value={metalType} onChange={(event) => setMetalType(event.target.value)}>
              <option value="">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="DIAMOND">Diamond</option>
            </select>
          </div>

          <div className="filterField filterPurityField">
            <label>Gold purity</label>
            <div className="purityCheckboxGroup">
              {[
                ["GOLD_18K", "18K"],
                ["GOLD_22K", "22K"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={selectedPurities.includes(value)}
                    onChange={() => toggleGoldPurity(value)}
                    disabled={metalType === "SILVER"}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Applying..." : "Apply filters"}
          </button>
          <button type="button" className="outlineBtn" onClick={resetFilters}>Reset</button>
        </form>

        {!loading && !error && products.length > 0 && (
          <div className="productResultsSummary" aria-live="polite">
            <strong>{visibleProducts.length}</strong>
            {visibleProducts.length === 1 ? " design" : " designs"}
            {selectedPriceRange ? ` in ${selectedPriceRange.label}` : " available"}
          </div>
        )}

        {error && <div className="customerError">{error}</div>}
        {loading && <div className="customerLoading">Loading jewellery...</div>}

        {!loading && !error && visibleProducts.length === 0 && (
          <div className="customerEmptyBox">
            <h2>No products found{selectedCategoryName ? ` in ${selectedCategoryName}` : ""}.</h2>
            <p>
              {selectedPriceRange
                ? `There are no designs in ${selectedPriceRange.label} right now. Try another budget.`
                : "Explore the full collection or ask the store about new arrivals."}
            </p>
            <div className="customerEmptyActions">
              <button type="button" onClick={resetFilters}>Explore all products</button>
              <a
                href="https://wa.me/919102316789?text=Hello%20Raj%20Laxmi%20Jewellers%2C%20I%20want%20to%20ask%20about%20your%20jewellery%20collection."
                target="_blank"
                rel="noreferrer"
              >
                Contact on WhatsApp
              </a>
            </div>
          </div>
        )}

        {!loading && visibleProducts.length > 0 && (
          <div className="productGrid">
            {visibleProducts.map((product) => (
              <Link className="productCard" key={product.id} to={`/products/${product.id}`}>
                <div className="productImageBox">
                  <img
                    src={getImageUrl(product.primaryImageUrl)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = "/images/placeholders/jewellery-display.webp";
                    }}
                  />
                  {product.featured && <span className="productBadge">Featured</span>}
                </div>

                <div className="productInfo">
                  <p className="productCategoryLabel">
                    {product.categoryName || formatCategoryName(product.productCategory)}
                  </p>
                  <h3>{product.name}</h3>
                  <p className="productMeta">
                    {formatCategoryName(product.metalType)} | {formatPurity(product.goldPurity)}
                  </p>
                  <p className="productWeight">Weight: <strong>{formatWeight(product)}</strong></p>
                  <p className="productPrice">{formatPrice(product.finalPrice)}</p>
                  <p className="productPriceContext">Final price for {formatWeight(product)}</p>

                  <div className="productChargeLabels">
                    {formatMakingCharge(product) && <span>{formatMakingCharge(product)}</span>}
                    <span>GST: {Number(product.gstPercentage || 0)}%</span>
                  </div>

                  <div className="productSmallBadges">
                    {product.bisHallmarked && <span>BIS Hallmarked</span>}
                    {product.newArrival && <span>New Arrival</span>}
                    {product.bestSeller && <span>Best Seller</span>}
                  </div>

                  <p className={product.inStock || product.stockQuantity > 0 ? "stockText inStock" : "stockText outStock"}>
                    {product.inStock || product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                  <span className="productViewButton">View Details</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
