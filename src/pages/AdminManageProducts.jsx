import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const API_BASE = "http://localhost:8080/api/v1";
const BACKEND_BASE = "http://localhost:8080";

function AdminManageProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
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
    if (Array.isArray(data?.data?.products)) return data.data.products;

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

      params.append("page", "0");
      params.append("size", "30");
      params.append("sortBy", "createdAt");
      params.append("sortDir", "desc");

      const response = await fetch(`${API_BASE}/products?${params.toString()}`);

      const text = await response.text();

      console.log("Manage products status:", response.status);
      console.log("Manage products response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load products.");
      }

      setProducts(extractProducts(data));
    } catch (err) {
      console.error("Manage products error:", err);
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

  return (
    <div className="admin-page">
      <div className="admin-card admin-wide-card">
        <div className="admin-header-row">
          <div>
            <h1>Manage Products</h1>
            <p>View products, image, price, stock, and upload images.</p>
          </div>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => navigate("/admin/products/new")}
          >
            + Add Product
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form className="admin-search-row" onSubmit={handleSearch}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by product name or SKU"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => {
              setKeyword("");
              setTimeout(fetchProducts, 100);
            }}
          >
            Reset
          </button>
        </form>

        {loading && <p>Loading products...</p>}

        {!loading && products.length === 0 && (
          <div className="admin-empty-box">
            No products found. Add your first product.
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="admin-product-grid">
            {products.map((product) => (
              <div className="admin-product-card" key={product.id}>
                <img
                  src={getImageUrl(product.primaryImageUrl)}
                  alt={product.name}
                  className="admin-product-image"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo/shop-logo.jpeg";
                  }}
                />

                <div className="admin-product-info">
                  <h3>{product.name}</h3>

                  <p>
                    <strong>ID:</strong> {product.id}
                  </p>

                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>

                  <p>
                    <strong>Category:</strong>{" "}
                    {product.categoryName || product.productCategory || "N/A"}
                  </p>

                  <p>
                    <strong>Metal:</strong> {product.metalType || "N/A"} |{" "}
                    {product.goldPurity || "N/A"}
                  </p>

                  <p>
                    <strong>Weight:</strong> {product.weightGrams || 0} g
                  </p>

                  <p>
                    <strong>Stock:</strong> {product.stockQuantity ?? 0}
                  </p>

                  <p>
                    <strong>Price:</strong>{" "}
                    ₹{Number(product.finalPrice || 0).toLocaleString("en-IN")}
                  </p>

                  <div className="admin-product-badges">
                    {product.featured && <span>Featured</span>}
                    {product.newArrival && <span>New Arrival</span>}
                    {product.bestSeller && <span>Best Seller</span>}
                    {product.bisHallmarked && <span>BIS</span>}
                  </div>

                  <div className="admin-product-actions">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/products/${product.id}/images`)
                      }
                    >
                      Upload Image
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManageProducts;