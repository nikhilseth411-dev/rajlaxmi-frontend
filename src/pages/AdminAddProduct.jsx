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
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    let categoryCode = "GOLD";

    if (form.metalType === "SILVER" || form.productCategory === "SILVER_JEWELLERY") {
      categoryCode = "SILVER";
    } else if (
      form.metalType === "DIAMOND" ||
      form.productCategory === "DIAMOND_JEWELLERY"
    ) {
      categoryCode = "DIAMOND";
    } else if (form.metalType === "PLATINUM") {
      categoryCode = "PLATINUM";
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
      const missing = [];

      if (!form.name.trim()) missing.push("Product Name");
      if (!form.sku.trim()) missing.push("SKU");
      if (!form.description.trim()) missing.push("Description");
      if (!form.categoryId) missing.push("Category");

      if (!form.weightGrams || Number(form.weightGrams) <= 0) {
        missing.push("Weight in Grams");
      }

      if (!form.makingCharges || Number(form.makingCharges) < 0) {
        missing.push("Making Charges");
      }

      if (form.stoneCharges === "" || Number(form.stoneCharges) < 0) {
        missing.push("Stone Charges");
      }

      if (!form.gstPercentage || Number(form.gstPercentage) < 0) {
        missing.push("GST Percentage");
      }

      if (form.stockQuantity === "" || Number(form.stockQuantity) < 0) {
        missing.push("Stock Quantity");
      }

      if (form.lowStockThreshold === "" || Number(form.lowStockThreshold) < 0) {
        missing.push("Low Stock Threshold");
      }

      if (missing.length > 0) {
        throw new Error("Please fill/correct these fields: " + missing.join(", "));
      }

      const weightValue = Number(form.weightGrams);
      const makingValue = Number(form.makingCharges);
      const stoneValue = Number(form.stoneCharges || 0);
      const gstValue = Number(form.gstPercentage || 3);
      const stockValue = Number(form.stockQuantity);
      const lowStockValue = Number(form.lowStockThreshold || 1);

      const requestBody = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
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

      console.log("Create product payload:", requestBody);

      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      console.log("Create product status:", response.status);
      console.log("Create product response:", text);

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

        const backendError =
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