import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL } from "../config/api";

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

const SKU_PATTERN = /^RLJ-[A-Z]+-\d{3,6}$/;
const VALID_METAL_TYPES = new Set(["GOLD", "SILVER", "DIAMOND"]);
const VALID_GOLD_PURITIES = new Set(["GOLD_18K", "GOLD_22K", "GOLD_24K"]);
const VALID_MAKING_CHARGE_TYPES = new Set(["FIXED", "PER_GRAM"]);

function inferProductCategory(category, fallback = "GOLD_JEWELLERY") {
  const source = `${category?.name || category?.categoryName || ""} ${category?.slug || ""}`
    .toLowerCase();

  if (source.includes("mangalsutra")) return "MANGALSUTRA";
  if (source.includes("earring")) return "EARRINGS";
  if (source.includes("necklace")) return "NECKLACES";
  if (source.includes("bangle")) return "BANGLES";
  if (source.includes("bracelet")) return "BRACELETS";
  if (source.includes("ring")) return "RINGS";
  if (source.includes("pendant")) return "PENDANTS";
  if (source.includes("chain")) return "CHAINS";
  if (source.includes("anklet")) return "ANKLETS";
  if (source.includes("diamond")) return "DIAMOND_JEWELLERY";
  if (source.includes("bridal")) return "BRIDAL_COLLECTION";
  if (source.includes("temple")) return "TEMPLE_JEWELLERY";
  if (source.includes("antique")) return "ANTIQUE_JEWELLERY";
  if (source.includes("silver")) return "SILVER_COLLECTION";
  return fallback;
}

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

    fetchCategories();
  }, [navigate, token]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    if (name === "categoryId") {
      const selectedCategory = categories.find(
        (category) => String(category.id) === value,
      );
      setForm((previous) => ({
        ...previous,
        categoryId: value,
        productCategory: inferProductCategory(
          selectedCategory,
          previous.productCategory,
        ),
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function generateSku() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    let categoryCode;

    if (form.metalType === "SILVER" || form.productCategory === "SILVER_COLLECTION") {
      categoryCode = "SILVER";
    } else if (
      form.metalType === "DIAMOND" ||
      form.productCategory === "DIAMOND_JEWELLERY"
    ) {
      categoryCode = "DIAMOND";
    } else {
      categoryCode = "GOLD";
    }

    const sku = `RLJ-${categoryCode}-${randomNumber}`;

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
      const invalidFields = [];
      const productName = form.name.trim();
      const normalizedSku = form.sku.trim().toUpperCase();
      const categoryId = Number(form.categoryId);
      const weightValue = Number(form.weightGrams);
      const makingValue = Number(form.makingCharges);
      const stoneValue = Number(form.stoneCharges);
      const gstValue = Number(form.gstPercentage);
      const stockValue = Number(form.stockQuantity);
      const lowStockValue = Number(form.lowStockThreshold);

      if (productName.length < 3 || productName.length > 200) {
        invalidFields.push("Product Name must be 3 to 200 characters");
      }
      if (!SKU_PATTERN.test(normalizedSku)) {
        invalidFields.push("SKU must look like RLJ-GOLD-1234 (use Generate)");
      }
      if (!form.description.trim()) invalidFields.push("Description is required");
      if (!Number.isInteger(categoryId) || categoryId < 1) {
        invalidFields.push("Category is required");
      }
      if (!VALID_METAL_TYPES.has(form.metalType)) {
        invalidFields.push("Metal Type must be Gold, Silver, or Diamond");
      }
      if (!VALID_GOLD_PURITIES.has(form.goldPurity)) {
        invalidFields.push("Gold Purity must be 18K, 22K, or 24K");
      }
      if (!Number.isFinite(weightValue) || weightValue < 0.01 || weightValue > 9999.99) {
        invalidFields.push("Weight must be between 0.01 and 9999.99 grams");
      }
      if (!Number.isFinite(makingValue) || makingValue < 0) {
        invalidFields.push("Making Charges must be zero or more");
      }
      if (!VALID_MAKING_CHARGE_TYPES.has(form.makingChargesType)) {
        invalidFields.push("Making Charge Type must be Fixed or Per Gram");
      }
      if (!Number.isFinite(stoneValue) || stoneValue < 0) {
        invalidFields.push("Stone Charges must be zero or more");
      }
      if (!Number.isFinite(gstValue) || gstValue < 0 || gstValue > 28) {
        invalidFields.push("GST Percentage must be between 0 and 28");
      }
      if (!Number.isInteger(stockValue) || stockValue < 0) {
        invalidFields.push("Stock Quantity must be a whole number of zero or more");
      }
      if (!Number.isInteger(lowStockValue) || lowStockValue < 1) {
        invalidFields.push("Low Stock Threshold must be a whole number of one or more");
      }

      if (invalidFields.length > 0) {
        throw new Error("Please correct: " + invalidFields.join("; "));
      }

      const requestBody = {
        name: productName,
        sku: normalizedSku,
        description: form.description.trim(),
        categoryId: Number(form.categoryId),

        productCategory: form.productCategory,
        metalType: form.metalType,
        goldPurity: form.goldPurity,

        weightGrams: weightValue,
        weightInGrams: weightValue,

        makingCharges: makingValue,
        makingChargeType: form.makingChargesType,
        makingChargesType: form.makingChargesType,

        stoneCharges: stoneValue,
        gstPercentage: gstValue,

        bisHallmarkNumber: form.bisHallmarkNumber.trim() || null,
        occasion: form.occasion.trim() || "Daily Wear",
        gender: form.gender,
        dimensions: form.dimensions.trim() || null,
        finish: form.finish.trim() || null,

        metaTitle: form.metaTitle.trim() || form.name.trim(),
        metaDescription: form.metaDescription.trim() || form.description.trim(),

        stockQuantity: stockValue,
        lowStockThreshold: lowStockValue,

        bisHallmarked: form.bisHallmarked,
        isBisHallmarked: form.bisHallmarked,

        newArrival: form.newArrival,
        isNewArrival: form.newArrival,

        bestSeller: form.bestSeller,
        isBestSeller: form.bestSeller,

        featured: form.featured,
        isFeatured: form.featured,

        active: true,
        isActive: true,
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
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("rajlaxmi_admin_token");
          navigate("/adminlogin");
          throw new Error("Admin session expired. Please login again.");
        }

        const validationDetails =
          data?.data && typeof data.data === "object" && !Array.isArray(data.data)
            ? Object.entries(data.data)
                .map(([field, detail]) => `${field}: ${detail}`)
                .join("; ")
            : "";
        const backendError =
          validationDetails ||
          data?.message ||
          data?.error ||
          data?.details ||
          (data?.errors ? JSON.stringify(data.errors) : "") ||
          text ||
          `Unable to create product. Status: ${response.status}`;

        throw new Error(backendError);
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
      console.error("Create product error:", err);
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

        <form className="productAdminForm" onSubmit={createProduct} noValidate>
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
                  minLength={3}
                  maxLength={200}
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
                    pattern="RLJ-[A-Z]+-[0-9]{3,6}"
                    title="Use format RLJ-GOLD-1234 or click Generate"
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
                Product Category (matched automatically)
                <select
                  name="productCategory"
                  value={form.productCategory}
                  onChange={handleChange}
                >
                  <option value="GOLD_JEWELLERY">Gold Jewellery</option>
                  <option value="SILVER_COLLECTION">Silver Collection</option>
                  <option value="DIAMOND_JEWELLERY">Diamond Jewellery</option>
                  <option value="BRIDAL_COLLECTION">Bridal Collection</option>
                  <option value="TEMPLE_JEWELLERY">Temple Jewellery</option>
                  <option value="ANTIQUE_JEWELLERY">Antique Jewellery</option>
                  <option value="MANGALSUTRA">Mangalsutra</option>
                  <option value="EARRINGS">Earrings</option>
                  <option value="NECKLACES">Necklaces</option>
                  <option value="BANGLES">Bangles</option>
                  <option value="RINGS">Rings</option>
                  <option value="PENDANTS">Pendants</option>
                  <option value="CHAINS">Chains</option>
                  <option value="BRACELETS">Bracelets</option>
                  <option value="ANKLETS">Anklets</option>
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
                  min="0.01"
                  max="9999.99"
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
                  min="0"
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
                </select>
              </label>

              <label>
                Stone Charges
                <input
                  type="number"
                  step="0.01"
                  min="0"
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
                  min="0"
                  max="28"
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
                  min="0"
                  step="1"
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
                  min="1"
                  step="1"
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
