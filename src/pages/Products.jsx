import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ["Gold Jewellery", "GOLD_JEWELLERY"],
  ["Diamond Jewellery", "DIAMOND_JEWELLERY"],
  ["Silver Collection", "SILVER_COLLECTION"],
  ["Bridal Collection", "BRIDAL_COLLECTION"],
  ["Temple Jewellery", "TEMPLE_JEWELLERY"],
].map(([name, productCategory]) => ({ name, productCategory }));

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
  return Number.isFinite(weight) ? `${weight.toFixed(2)} gm` : "Not available";
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
  const navigate = useNavigate();
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
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = buildCategoryOptions(categories);
  const selectedCategoryName =
    categoryOptions.find((option) => option.value === categoryFilter)?.name ||
    requestedCategory;

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/logo/shop-logo.jpeg";
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
    const activeCategoryFilter = overrides.categoryFilter ?? categoryFilter;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (activeKeyword.trim()) params.append("keyword", activeKeyword.trim());
      if (activeMetalType) params.append("metalType", activeMetalType);
      if (activeCategoryFilter.startsWith("id:")) {
        params.append("categoryId", activeCategoryFilter.slice(3));
      } else if (activeCategoryFilter.startsWith("enum:")) {
        params.append("productCategory", activeCategoryFilter.slice(5));
      }

      params.append("page", "0");
      params.append("size", "30");
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
        categoryFilter: resolvedFilter,
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

  const resetFilters = () => {
    setKeyword("");
    setMetalType("");
    setCategoryFilter("");
    setSearchParams({});
    fetchProducts({ keyword: "", metalType: "", categoryFilter: "" });
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
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search jewellery by name or SKU"
          />

          <select value={metalType} onChange={(event) => setMetalType(event.target.value)}>
            <option value="">All Metals</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
            <option value="DIAMOND">Diamond</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.name}</option>
            ))}
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
          <button type="button" className="outlineBtn" onClick={resetFilters}>Reset</button>
        </form>

        {error && <div className="customerError">{error}</div>}
        {loading && <div className="customerLoading">Loading jewellery...</div>}

        {!loading && !error && products.length === 0 && (
          <div className="customerEmptyBox">
            <h2>No products found{selectedCategoryName ? ` in ${selectedCategoryName}` : ""}.</h2>
            <p>Explore the full collection or ask the store about new arrivals.</p>
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

        {!loading && products.length > 0 && (
          <div className="productGrid">
            {products.map((product) => (
              <article className="productCard" key={product.id}>
                <div className="productImageBox">
                  <img
                    src={getImageUrl(product.primaryImageUrl)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo/shop-logo.jpeg";
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

                  <div className="productSmallBadges">
                    {product.bisHallmarked && <span>BIS Hallmarked</span>}
                    {product.newArrival && <span>New Arrival</span>}
                    {product.bestSeller && <span>Best Seller</span>}
                  </div>

                  <p className={product.inStock || product.stockQuantity > 0 ? "stockText inStock" : "stockText outStock"}>
                    {product.inStock || product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                  <button type="button" onClick={() => navigate(`/products/${product.id}`)}>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
