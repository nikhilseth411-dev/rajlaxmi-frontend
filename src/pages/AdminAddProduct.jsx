import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";

const API_BASE_URL = "http://localhost:8080/api/v1";

const initialForm = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  productCategory: "GOLD_JEWELLERY",
  metalType: "GOLD",
  goldPurity: "GOLD_22K",
  weightGrams: "",
  makingCharges: "",
  makingChargesType: "FIXED",
  stoneCharges: "0",
  gstPercentage: "3",
  bisHallmarkNumber: "",
  occasion: "",
  gender: "UNISEX",
  dimensions: "",
  finish: "",
  metaTitle: "",
  metaDescription: "",
  stockQuantity: "",
  lowStockThreshold: "1",
  bisHallmarked: true,
  newArrival: true,
  bestSeller: false,
  featured: true,
};

function AdminAddProduct() {
  const navigate = useNavigate();
  const token = localStorage.getItem("rajlaxmi_admin_token");

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    fetchCategories();
  }, []);

  async function fetchCategories() {
    setFetchingCategories(true);

    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();

      const list =
        data.data?.content ||
        data.data ||
        data.content ||
        data ||
        [];

      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log("Category fetch failed:", err);
      setCategories([]);
    } finally {
      setFetchingCategories(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function generateSku() {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const cleanName = form.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 18);

    const sku = `RLJ-${cleanName || "JEWEL"}-${randomNumber}`;

    setForm((previous) => ({
      ...previous,
      sku,
    }));
  }

  async function createProduct(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!form.name.trim()) {
        throw new Error("Product name is required");
      }

      if (!form.sku.trim()) {
        throw new Error("SKU is required. Click Generate SKU.");
      }

      if (!form.categoryId) {
        throw new Error("Please select category");
      }

      const requestBody = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        productCategory: form.productCategory,
        metalType: form.metalType,
        goldPurity: form.goldPurity,
        weightGrams: Number(form.weightGrams),
        makingCharges: Number(form.makingCharges),
        makingChargesType: form.makingChargesType,
        stoneCharges: Number(form.stoneCharges),
        gstPercentage: Number(form.gstPercentage),
        bisHallmarkNumber: form.bisHallmarkNumber.trim(),
        occasion: form.occasion.trim(),
        gender: form.gender,
        dimensions: form.dimensions.trim(),
        finish: form.finish.trim(),
        metaTitle: form.metaTitle.trim() || form.name.trim(),
        metaDescription: form.metaDescription.trim() || form.description.trim(),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        bisHallmarked: form.bisHallmarked,
        newArrival: form.newArrival,
        bestSeller: form.bestSeller,
        featured: form.featured,
      };

      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("rajlaxmi_admin_token");
          navigate("/adminlogin");
          throw new Error("Session expired. Please login again.");
        }

        throw new Error(
          data?.message ||
          text ||
          `Unable to create product. Status: ${response.status}`
        );
      }

      const product = data?.data || data;
      const productId = product?.id;

      setMessage(
        productId
          ? `Product created successfully! Product ID: ${productId}`
          : "Product created successfully!"
      );

      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Unable to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminPage">
      <aside className="adminSidebar">
        <div className="adminLogoBox">
          <img src="/images/logo/shop-logo.jpeg" alt="RajLaxmi Jewellers" />
          <h2>RajLaxmi Admin</h2>
          <p>Bhagwan Das & Sons</p>
        </div>

        <nav className="adminMenu">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/gold-rates">Gold Rates</Link>
          <Link to="/admin/products/new">Add Product</Link>
          <Link to="/admin/products">Manage Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/payments">Payments</Link>
        </nav>
      </aside>

      <section className="adminMain">
        <div className="adminTopbar">
          <div>
            <p>Product Management</p>
            <h1>Add New Product</h1>
          </div>
          <Link to="/admin" className="adminBackLink">
            Back to Dashboard
          </Link>
        </div>

        <form className="productAdminForm" onSubmit={createProduct}>
          <section className="adminFormSection">
            <h2>Basic Product Details</h2>

            <div className="adminFormGrid">
              <label>
                Product Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: 22K Gold Ring"
                  required
                />
              </label>

              <label>
                SKU
                <div className="skuRow">
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Click Generate SKU"
                    required
                  />
                  <button type="button" onClick={generateSku}>
                    Generate
                  </button>
                </div>
              </label>

              <label className="fullWidth">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write product description"
                  required
                />
              </label>
            </div>
          </section>

          <section className="adminFormSection">
            <h2>Category & Jewellery Type</h2>

            <div className="adminFormGrid">
              <label>
                Category
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {fetchingCategories ? "Loading categories..." : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name || category.categoryName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Product Category
                <select
                  name="productCategory"
                  value={form.productCategory}
                  onChange={handleChange}
                >
                  <option value="GOLD_JEWELLERY">Gold Jewellery</option>
                  <option value="SILVER_JEWELLERY">Silver Jewellery</option>
                  <option value="DIAMOND_JEWELLERY">Diamond Jewellery</option>
                </select>
              </label>

              <label>
                Metal Type
                <select
                  name="metalType"
                  value={form.metalType}
                  onChange={handleChange}
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="DIAMOND">Diamond</option>
                  <option value="PLATINUM">Platinum</option>
                </select>
              </label>

              <label>
                Gold Purity
                <select
                  name="goldPurity"
                  value={form.goldPurity}
                  onChange={handleChange}
                >
                  <option value="GOLD_24K">24K</option>
                  <option value="GOLD_22K">22K</option>
                  <option value="GOLD_18K">18K</option>
                  <option value="GOLD_14K">14K</option>
                </select>
              </label>
            </div>
          </section>

          <section className="adminFormSection">
            <h2>Price Calculation Details</h2>

            <div className="adminFormGrid">
              <label>
                Weight in Grams
                <input
                  type="number"
                  step="0.01"
                  name="weightGrams"
                  value={form.weightGrams}
                  onChange={handleChange}
                  placeholder="Example: 4.25"
                  required
                />
              </label>

              <label>
                Making Charges
                <input
                  type="number"
                  step="0.01"
                  name="makingCharges"
                  value={form.makingCharges}
                  onChange={handleChange}
                  placeholder="Example: 700"
                  required
                />
              </label>

              <label>
                Making Charge Type
                <select
                  name="makingChargesType"
                  value={form.makingChargesType}
                  onChange={handleChange}
                >
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PER_GRAM">Per Gram</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </label>

              <label>
                Stone Charges
                <input
                  type="number"
                  step="0.01"
                  name="stoneCharges"
                  value={form.stoneCharges}
                  onChange={handleChange}
                  placeholder="Example: 0"
                />
              </label>

              <label>
                GST / Tax Percentage
                <input
                  type="number"
                  step="0.01"
                  name="gstPercentage"
                  value={form.gstPercentage}
                  onChange={handleChange}
                  placeholder="Example: 3"
                  required
                />
              </label>
            </div>
          </section>

          <section className="adminFormSection">
            <h2>Stock & Display</h2>

            <div className="adminFormGrid">
              <label>
                Stock Quantity
                <input
                  type="number"
                  name="stockQuantity"
                  value={form.stockQuantity}
                  onChange={handleChange}
                  placeholder="Example: 10"
                  required
                />
              </label>

              <label>
                Low Stock Threshold
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={form.lowStockThreshold}
                  onChange={handleChange}
                  placeholder="Example: 1"
                  required
                />
              </label>

              <label>
                BIS Hallmark Number
                <input
                  name="bisHallmarkNumber"
                  value={form.bisHallmarkNumber}
                  onChange={handleChange}
                  placeholder="Example: BIS123456"
                />
              </label>

              <label>
                Occasion
                <input
                  name="occasion"
                  value={form.occasion}
                  onChange={handleChange}
                  placeholder="Wedding / Daily wear"
                />
              </label>

              <label>
                Gender
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="WOMEN">Women</option>
                  <option value="MEN">Men</option>
                  <option value="UNISEX">Unisex</option>
                  <option value="KIDS">Kids</option>
                </select>
              </label>

              <label>
                Finish
                <input
                  name="finish"
                  value={form.finish}
                  onChange={handleChange}
                  placeholder="Glossy / Matte / Antique"
                />
              </label>

              <label>
                Dimensions
                <input
                  name="dimensions"
                  value={form.dimensions}
                  onChange={handleChange}
                  placeholder="Example: Adjustable"
                />
              </label>
            </div>

            <div className="checkboxGrid">
              <label>
                <input
                  type="checkbox"
                  name="bisHallmarked"
                  checked={form.bisHallmarked}
                  onChange={handleChange}
                />
                BIS Hallmarked
              </label>

              <label>
                <input
                  type="checkbox"
                  name="newArrival"
                  checked={form.newArrival}
                  onChange={handleChange}
                />
                New Arrival
              </label>

              <label>
                <input
                  type="checkbox"
                  name="bestSeller"
                  checked={form.bestSeller}
                  onChange={handleChange}
                />
                Best Seller
              </label>

              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Featured
              </label>
            </div>
          </section>

          <section className="adminFormSection">
            <h2>SEO Details</h2>

            <div className="adminFormGrid">
              <label>
                Meta Title
                <input
                  name="metaTitle"
                  value={form.metaTitle}
                  onChange={handleChange}
                  placeholder="SEO title"
                />
              </label>

              <label>
                Meta Description
                <input
                  name="metaDescription"
                  value={form.metaDescription}
                  onChange={handleChange}
                  placeholder="SEO description"
                />
              </label>
            </div>
          </section>

          {message && <p className="adminSuccess">{message}</p>}
          {error && <p className="adminError">{error}</p>}

          <button className="adminSubmitBtn" type="submit" disabled={loading}>
            {loading ? "Creating Product..." : "Create Product"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminAddProduct;