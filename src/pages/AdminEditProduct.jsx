import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function AdminEditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
    stoneCharges: "",
    gstPercentage: "3",
    bisHallmarkNumber: "",
    occasion: "",
    gender: "",
    dimensions: "",
    finish: "",
    metaTitle: "",
    metaDescription: "",
    stockQuantity: "",
    lowStockThreshold: "1",
    bisHallmarked: true,
    newArrival: false,
    bestSeller: false,
    featured: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/products/${productId}`);
      const text = await response.text();

      console.log("Edit product fetch status:", response.status);
      console.log("Edit product fetch response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load product.");
      }

      const product = data?.data || data;

      setForm({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        productCategory: product.productCategory || "GOLD_JEWELLERY",
        metalType: product.metalType || "GOLD",
        goldPurity: product.goldPurity || "GOLD_22K",
        weightGrams: product.weightGrams || "",
        makingCharges: product.makingCharges || "",
        makingChargesType: product.makingChargesType || "FIXED",
        stoneCharges: product.stoneCharges || 0,
        gstPercentage: product.gstPercentage || 3,
        bisHallmarkNumber: product.bisHallmarkNumber || "",
        occasion: product.occasion || "",
        gender: product.gender || "",
        dimensions: product.dimensions || "",
        finish: product.finish || "",
        metaTitle: product.metaTitle || product.name || "",
        metaDescription: product.metaDescription || "",
        stockQuantity: product.inventory?.quantity ?? product.stockQuantity ?? "",
        lowStockThreshold: product.inventory?.lowStockThreshold ?? product.lowStockThreshold ?? 1,
        bisHallmarked: Boolean(product.bisHallmarked),
        newArrival: Boolean(product.newArrival),
        bestSeller: Boolean(product.bestSeller),
        featured: Boolean(product.featured),
      });
    } catch (err) {
      console.error("Fetch product error:", err);
      setError(err.message || "Unable to load product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("rajlaxmi_admin_token");

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description || "",
        categoryId: Number(form.categoryId),

        productCategory: form.productCategory,
        metalType: form.metalType,
        goldPurity: form.goldPurity,

        weightGrams: Number(form.weightGrams),
        makingCharges: Number(form.makingCharges),
        makingChargesType: form.makingChargesType,
        stoneCharges: Number(form.stoneCharges || 0),
        gstPercentage: Number(form.gstPercentage || 3),

        bisHallmarkNumber: form.bisHallmarkNumber || "",
        occasion: form.occasion || "",
        gender: form.gender || "",
        dimensions: form.dimensions || "",
        finish: form.finish || "",

        metaTitle: form.metaTitle || form.name,
        metaDescription: form.metaDescription || form.description || "",

        stockQuantity: Number(form.stockQuantity || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 1),

        bisHallmarked: Boolean(form.bisHallmarked),
        newArrival: Boolean(form.newArrival),
        bestSeller: Boolean(form.bestSeller),
        featured: Boolean(form.featured),
      };

      console.log("Update product payload:", payload);

      const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      console.log("Update product status:", response.status);
      console.log("Update product response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || `Update failed. Status: ${response.status}`);
      }

      // Separate inventory update because stock is stored in inventory table
      const inventoryPayload = {
        productId: Number(productId),
        quantity: Number(form.stockQuantity || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 1),
      };

      console.log("Update inventory payload:", inventoryPayload);

      const inventoryResponse = await fetch(`${API_BASE}/admin/inventory`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryPayload),
      });

      const inventoryText = await inventoryResponse.text();

      console.log("Update inventory status:", inventoryResponse.status);
      console.log("Update inventory response:", inventoryText);

      const inventoryData = inventoryText ? JSON.parse(inventoryText) : null;

      if (inventoryResponse.status === 401 || inventoryResponse.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!inventoryResponse.ok) {
        throw new Error(
          inventoryData?.message ||
          inventoryText ||
          `Inventory update failed. Status: ${inventoryResponse.status}`
        );
      }

      setSuccess("Product and stock updated successfully!");
    } catch (err) {
      console.error("Update product error:", err);
      setError(err.message || "Something went wrong while updating product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card admin-wide-card">
        <div className="admin-header-row">
          <div>
            <h1>Edit Product</h1>
            <p>Product ID: {productId}</p>
          </div>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => navigate("/admin/products")}
          >
            Back to Products
          </button>
        </div>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        <form className="admin-form admin-grid-form" onSubmit={handleSubmit}>
          <div>
            <label>Product Name</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div>
            <label>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
            />
          </div>

          <div className="admin-full-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div>
            <label>Category ID</label>
            <input
              type="number"
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
            />
          </div>

          <div>
            <label>Product Category</label>
            <select
              value={form.productCategory}
              onChange={(e) => updateField("productCategory", e.target.value)}
            >
              <option value="GOLD_JEWELLERY">GOLD_JEWELLERY</option>
              <option value="DIAMOND_JEWELLERY">DIAMOND_JEWELLERY</option>
              <option value="SILVER_COLLECTION">SILVER_COLLECTION</option>
              <option value="BRIDAL_COLLECTION">BRIDAL_COLLECTION</option>
              <option value="TEMPLE_JEWELLERY">TEMPLE_JEWELLERY</option>
              <option value="ANTIQUE_JEWELLERY">ANTIQUE_JEWELLERY</option>
              <option value="PENDANTS">PENDANTS</option>
              <option value="RINGS">RINGS</option>
              <option value="EARRINGS">EARRINGS</option>
              <option value="MANGALSUTRA">MANGALSUTRA</option>
              <option value="NECKLACES">NECKLACES</option>
              <option value="BANGLES">BANGLES</option>
              <option value="CHAINS">CHAINS</option>
              <option value="BRACELETS">BRACELETS</option>
              <option value="ANKLETS">ANKLETS</option>
            </select>
          </div>

          <div>
            <label>Metal Type</label>
            <select
              value={form.metalType}
              onChange={(e) => updateField("metalType", e.target.value)}
            >
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
            </select>
          </div>

          <div>
            <label>Gold Purity</label>
            <select
              value={form.goldPurity}
              onChange={(e) => updateField("goldPurity", e.target.value)}
            >
              <option value="GOLD_24K">GOLD_24K</option>
              <option value="GOLD_22K">GOLD_22K</option>
              <option value="GOLD_18K">GOLD_18K</option>
            </select>
          </div>

          <div>
            <label>Weight in Grams</label>
            <input
              type="number"
              step="0.01"
              value={form.weightGrams}
              onChange={(e) => updateField("weightGrams", e.target.value)}
            />
          </div>

          <div>
            <label>Making Charges</label>
            <input
              type="number"
              step="0.01"
              value={form.makingCharges}
              onChange={(e) => updateField("makingCharges", e.target.value)}
            />
          </div>

          <div>
            <label>Making Charge Type</label>
            <select
              value={form.makingChargesType}
              onChange={(e) => updateField("makingChargesType", e.target.value)}
            >
              <option value="FIXED">FIXED</option>
              <option value="PERCENTAGE">PERCENTAGE</option>
            </select>
          </div>

          <div>
            <label>Stone Charges</label>
            <input
              type="number"
              step="0.01"
              value={form.stoneCharges}
              onChange={(e) => updateField("stoneCharges", e.target.value)}
            />
          </div>

          <div>
            <label>GST Percentage</label>
            <input
              type="number"
              step="0.01"
              value={form.gstPercentage}
              onChange={(e) => updateField("gstPercentage", e.target.value)}
            />
          </div>

          <div>
            <label>Stock Quantity</label>
            <input
              type="number"
              value={form.stockQuantity}
              onChange={(e) => updateField("stockQuantity", e.target.value)}
            />
          </div>

          <div>
            <label>Low Stock Threshold</label>
            <input
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) => updateField("lowStockThreshold", e.target.value)}
            />
          </div>

          <div>
            <label>Occasion</label>
            <input
              value={form.occasion}
              onChange={(e) => updateField("occasion", e.target.value)}
            />
          </div>

          <div>
            <label>Gender</label>
            <input
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
            />
          </div>

          <div>
            <label>Finish</label>
            <input
              value={form.finish}
              onChange={(e) => updateField("finish", e.target.value)}
            />
          </div>

          <div>
            <label>Dimensions</label>
            <input
              value={form.dimensions}
              onChange={(e) => updateField("dimensions", e.target.value)}
            />
          </div>

          <div className="admin-checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.bisHallmarked}
                onChange={(e) => updateField("bisHallmarked", e.target.checked)}
              />
              BIS Hallmarked
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.newArrival}
                onChange={(e) => updateField("newArrival", e.target.checked)}
              />
              New Arrival
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.bestSeller}
                onChange={(e) => updateField("bestSeller", e.target.checked)}
              />
              Best Seller
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
              />
              Featured
            </label>
          </div>

          <div className="admin-full-field">
            <button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminEditProduct;
