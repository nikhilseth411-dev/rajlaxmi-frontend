import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/customer.css";

const API_BASE = "http://localhost:8080/api/v1";

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [metalType, setMetalType] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "/images/logo/shop-logo.jpeg";
    }

    if (imageUrl.startsWith("http")) {
      return encodeURI(imageUrl);
    }

    const cleanPath = imageUrl.startsWith("/")
      ? imageUrl.substring(1)
      : imageUrl;

    if (cleanPath.startsWith("api/v1/")) {
      return encodeURI(`http://localhost:8080/${cleanPath}`);
    }

    if (cleanPath.startsWith("uploads/")) {
      return encodeURI(`http://localhost:8080/api/v1/${cleanPath}`);
    }

    return encodeURI(`http://localhost:8080/api/v1/${cleanPath}`);
  };

  const extractProducts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.append("keyword", keyword.trim());
      }

      if (metalType) {
        params.append("metalType", metalType);
      }

      if (productCategory) {
        params.append("productCategory", productCategory);
      }

      params.append("page", "0");
      params.append("size", "30");
      params.append("sortBy", "createdAt");
      params.append("sortDir", "desc");

      const response = await fetch(`${API_BASE}/products?${params.toString()}`);

      const text = await response.text();

      console.log("Customer products status:", response.status);
      console.log("Customer products response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load products.");
      }

      setProducts(extractProducts(data));
    } catch (err) {
      console.error("Customer products error:", err);
      setError(err.message || "Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const resetFilters = () => {
    setKeyword("");
    setMetalType("");
    setProductCategory("");

    setTimeout(() => {
      fetchProducts();
    }, 100);
  };

  return (
    <main className="productsPage">
      <section className="productsHero">
        <p>Raj Laxmi Jewellers</p>
        <h1>Our Jewellery Collection</h1>
        <span>
          Explore gold rings, pendants, jewellery pieces and handpicked designs.
        </span>
      </section>

      <section className="productsContainer">
        <form className="productsFilterBar" onSubmit={handleSearch}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search jewellery by name or SKU"
          />

          <select
            value={metalType}
            onChange={(e) => setMetalType(e.target.value)}
          >
            <option value="">All Metals</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>

          <select
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="GOLD_JEWELLERY">Gold Jewellery</option>
            <option value="RINGS">Rings</option>
            <option value="PENDANTS">Pendants</option>
            <option value="EARRINGS">Earrings</option>
            <option value="MANGALSUTRA">Mangalsutra</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>

          <button type="button" className="outlineBtn" onClick={resetFilters}>
            Reset
          </button>
        </form>

        {error && <div className="customerError">{error}</div>}

        {loading && <div className="customerLoading">Loading products...</div>}

        {!loading && products.length === 0 && (
          <div className="customerEmptyBox">
            No products found. Please try another search.
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
                    onError={(e) => {
                      e.currentTarget.src = "/images/logo/shop-logo.jpeg";
                    }}
                  />

                  {product.featured && (
                    <span className="productBadge">Featured</span>
                  )}
                </div>

                <div className="productInfo">
                  <h3>{product.name}</h3>

                  <p className="productMeta">
                    {product.metalType || "Jewellery"} |{" "}
                    {product.goldPurity || "Pure"}
                  </p>

                  <p className="productWeight">
                    Weight: <strong>{product.weightGrams || 0} g</strong>
                  </p>

                  <p className="productPrice">
                    ₹{Number(product.finalPrice || 0).toLocaleString("en-IN")}
                  </p>

                  <div className="productSmallBadges">
                    {product.bisHallmarked && <span>BIS Hallmarked</span>}
                    {product.newArrival && <span>New Arrival</span>}
                    {product.bestSeller && <span>Best Seller</span>}
                  </div>

                  <p
                    className={
                      product.inStock || product.stockQuantity > 0
                        ? "stockText inStock"
                        : "stockText outStock"
                    }
                  >
                    {product.inStock || product.stockQuantity > 0
                      ? "In Stock"
                      : "Out of Stock"}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
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