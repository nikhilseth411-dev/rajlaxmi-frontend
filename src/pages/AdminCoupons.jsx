import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

const emptyForm = {
  code: "",
  description: "",
  discountType: "FLAT",
  discountValue: "",
  maxDiscountAmount: "",
  minimumOrderAmount: "0",
  usageLimit: "100",
  validFrom: "",
  validUntil: "",
};

function getCouponStatus(coupon, now = new Date()) {
  if (!coupon.active) {
    return { label: "Inactive", className: "customerStatusDanger" };
  }

  const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
  const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;

  if (validFrom && now < validFrom) {
    return { label: "Not started yet", className: "customerStatusPending" };
  }
  if (validUntil && now > validUntil) {
    return { label: "Expired", className: "customerStatusDanger" };
  }
  return { label: "Valid now", className: "customerStatusSuccess" };
}

function formatCouponDateTime(value) {
  if (!value) return "No limit";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function AdminCoupons() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("rajlaxmi_admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    fetchCoupons();
  }, []);

  function goTo(path) {
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("rajlaxmi_admin_token");
    navigate("/adminlogin");
  }

  async function fetchCoupons() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/coupons/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Coupons status:", response.status);
      console.log("Coupons response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to fetch coupons.");
      }

      setCoupons(data?.data || []);
    } catch (err) {
      console.error("Coupons error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : value,
    }));
  }

  function toLocalDateTime(value) {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  }

  function buildPayload() {
    if (!form.code.trim()) throw new Error("Coupon code is required.");
    if (form.code.trim().length < 3) throw new Error("Coupon code must be at least 3 characters.");
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      throw new Error("Discount value must be greater than 0.");
    }

    if (form.discountType === "PERCENT" && Number(form.discountValue) > 100) {
      throw new Error("Percent discount cannot be more than 100.");
    }

    return {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      minimumOrderAmount:
        form.minimumOrderAmount === "" ? 0 : Number(form.minimumOrderAmount),
      usageLimit: form.usageLimit === "" ? 100 : Number(form.usageLimit),
      validFrom: toLocalDateTime(form.validFrom),
      validUntil: toLocalDateTime(form.validUntil),
    };
  }

  async function saveCoupon(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = buildPayload();

      const url = editingId
        ? `${API_BASE}/coupons/admin/${editingId}`
        : `${API_BASE}/coupons/admin`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      console.log("Save coupon status:", response.status);
      console.log("Save coupon response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to save coupon.");
      }

      setSuccess(editingId ? "Coupon updated successfully." : "Coupon created successfully.");
      setForm(emptyForm);
      setEditingId(null);
      fetchCoupons();
    } catch (err) {
      console.error("Save coupon error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function formatDateForInput(value) {
    if (!value) return "";
    return value.slice(0, 16);
  }

  function startEdit(coupon) {
    setEditingId(coupon.id);

    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "FLAT",
      discountValue: coupon.discountValue ?? "",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      minimumOrderAmount: coupon.minimumOrderAmount ?? "0",
      usageLimit: coupon.usageLimit ?? "100",
      validFrom: formatDateForInput(coupon.validFrom),
      validUntil: formatDateForInput(coupon.validUntil),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function deactivateCoupon(id) {
    const confirmDelete = window.confirm("Deactivate this coupon?");
    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/coupons/admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to deactivate coupon.");
      }

      setSuccess("Coupon deactivated successfully.");
      fetchCoupons();
    } catch (err) {
      console.error("Delete coupon error:", err);
      setError(err.message || "Something went wrong.");
    }
  }

  return (
    <main className="adminDashboardPage">
      <aside className="adminSidebar">
        <div className="adminSidebarBrand">
          <img src="/images/logo/shop-logo.jpeg" alt="RajLaxmi Jewellers" />
          <h2>RajLaxmi Admin</h2>
          <p>Bhagwan Das & Sons</p>
        </div>

        <nav className="adminSidebarNav">
          <button type="button" onClick={() => goTo("/admin")}>Dashboard</button>
          <button type="button" onClick={() => goTo("/admin/gold-rates")}>Gold Rates</button>
          <button type="button" onClick={() => goTo("/admin/products/new")}>Add Product</button>
          <button type="button" onClick={() => goTo("/admin/products")}>Manage Products</button>
          <button type="button" onClick={() => goTo("/admin/orders")}>Orders</button>
          <button type="button" onClick={() => goTo("/admin/payments")}>Payments</button>
          <button type="button" onClick={() => goTo("/admin/customers")}>Customers</button>
          <button type="button" onClick={() => goTo("/admin/coupons")}>Coupons</button>
        </nav>

        <button type="button" className="adminLogoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="adminMainContent">
        <div className="adminWelcomeCard">
          <p>Offer Management</p>
          <h1>Coupons</h1>
          <span>Create and manage discount coupons</span>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <div className="admin-card admin-wide-card">
          <h2>{editingId ? "Edit Coupon" : "Create Coupon"}</h2>

          <form className="adminCouponForm" onSubmit={saveCoupon}>
            <div className="adminCouponGrid">
              <label>
                Coupon Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="WELCOME500"
                  disabled={editingId}
                  maxLength="20"
                />
              </label>

              <label>
                Discount Type
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                >
                  <option value="FLAT">FLAT</option>
                  <option value="PERCENT">PERCENT</option>
                </select>
              </label>

              <label>
                Discount Value
                <input
                  type="number"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  placeholder="500"
                />
              </label>

              <label>
                Max Discount
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={form.maxDiscountAmount}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </label>

              <label>
                Minimum Order Amount
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={form.minimumOrderAmount}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                Usage Limit
                <input
                  type="number"
                  name="usageLimit"
                  value={form.usageLimit}
                  onChange={handleChange}
                  placeholder="100"
                />
              </label>

              <label>
                Valid From
                <input
                  type="datetime-local"
                  name="validFrom"
                  value={form.validFrom}
                  onChange={handleChange}
                />
              </label>

              <label>
                Valid Until
                <input
                  type="datetime-local"
                  name="validUntil"
                  value={form.validUntil}
                  onChange={handleChange}
                />
              </label>

              <label className="adminCouponWide">
                Description
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Festival discount coupon"
                />
              </label>
            </div>

            <div className="adminCouponActions">
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
              </button>

              {editingId && (
                <button type="button" className="admin-secondary-btn" onClick={cancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {loading && <div className="admin-card">Loading coupons...</div>}

        {!loading && (
          <div className="admin-card admin-wide-card">
            <h2>All Coupons</h2>

            {coupons.length === 0 ? (
              <div className="admin-empty-box">No coupons found.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Min Order</th>
                      <th>Usage</th>
                      <th>Status</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {coupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                      <tr key={coupon.id}>
                        <td><strong>{coupon.code}</strong></td>
                        <td>{coupon.discountType}</td>
                        <td>
                          {coupon.discountType === "PERCENT"
                            ? `${coupon.discountValue}%`
                            : `₹${Number(coupon.discountValue).toLocaleString("en-IN")}`}
                        </td>
                        <td>₹{Number(coupon.minimumOrderAmount || 0).toLocaleString("en-IN")}</td>
                        <td>{coupon.usedCount} / {coupon.usageLimit}</td>
                        <td>
                          <span className={`customerStatus ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>{formatCouponDateTime(coupon.validFrom)}</td>
                        <td>{formatCouponDateTime(coupon.validUntil)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-secondary-btn"
                            onClick={() => startEdit(coupon)}
                          >
                            Edit
                          </button>

                          {coupon.active && (
                            <button
                              type="button"
                              className="admin-danger-btn"
                              onClick={() => deactivateCoupon(coupon.id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminCoupons;
