import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("rajlaxmi_admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Dashboard status:", response.status);
      console.log("Dashboard response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load dashboard.");
      }

      setDashboard(data?.data || data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Something went wrong while loading dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("rajlaxmi_admin_token");
    navigate("/adminlogin");
  }

  function goTo(path) {
    navigate(path);
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
          <button type="button" onClick={() => goTo("/admin")}>
            Dashboard
          </button>

          <button type="button" onClick={() => goTo("/admin/gold-rates")}>
            Gold Rates
          </button>

          <button type="button" onClick={() => goTo("/admin/products/new")}>
            Add Product
          </button>

          <button type="button" onClick={() => goTo("/admin/products")}>
            Manage Products
          </button>

          <button type="button" onClick={() => goTo("/admin/orders")}>
            Orders
          </button>

          <button type="button" onClick={() => goTo("/admin/payments")}>
            Payments
          </button>

          <button type="button" onClick={() => goTo("/admin/customers")}>
            Customers
          </button>

          <button type="button" onClick={() => goTo("/admin/coupons")}>
            Coupons
          </button>
        </nav>

        <button type="button" className="adminLogoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="adminMainContent">
        <div className="adminWelcomeCard">
          <p>Welcome back</p>
          <h1>Admin Dashboard</h1>
          <span>Live Management Panel</span>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading && <div className="admin-card">Loading dashboard...</div>}

        {!loading && (
          <>
            <div className="adminStatsGrid">
              <div className="adminStatCard">
                <p>Total Products</p>
                <h2>{dashboard?.totalProducts ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Active Products</p>
                <h2>{dashboard?.activeProducts ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Low Stock</p>
                <h2>{dashboard?.lowStockProducts ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Out of Stock</p>
                <h2>{dashboard?.outOfStockProducts ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Total Users</p>
                <h2>{dashboard?.totalUsers ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Total Categories</p>
                <h2>{dashboard?.totalCategories ?? 0}</h2>
              </div>

              <div className="adminStatCard">
                <p>Current 22K Gold Rate</p>
                <h2>
                  ₹
                  {Number(
                    dashboard?.currentGold22KRate || 0
                  ).toLocaleString("en-IN")}
                </h2>
              </div>

              <div className="adminStatCard">
                <p>New Users Today</p>
                <h2>{dashboard?.newUsersToday ?? 0}</h2>
              </div>
            </div>

            <div className="adminQuickGrid">
              <button type="button" onClick={() => goTo("/admin/products/new")}>
                + Add New Product
              </button>

              <button type="button" onClick={() => goTo("/admin/products")}>
                Manage Products
              </button>

              <button type="button" onClick={() => goTo("/admin/gold-rates")}>
                Update Gold Rate
              </button>

              <button type="button" onClick={() => goTo("/admin/orders")}>
                View Orders
              </button>

              <button type="button" onClick={() => goTo("/admin/payments")}>
                Verify Payments
              </button>

              <button type="button" onClick={() => goTo("/admin/customers")}>
                View Customers
              </button>

              <button type="button" onClick={() => goTo("/admin/coupons")}>
                Manage Coupons
              </button>
            </div>

            <div className="admin-card admin-wide-card">
              <h2>Low Stock Alerts</h2>

              {dashboard?.lowStockAlerts?.length > 0 ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.lowStockAlerts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.sku}</td>
                          <td>{product.stockQuantity ?? 0}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-secondary-btn"
                              onClick={() =>
                                goTo(`/admin/products/${product.id}/edit`)
                              }
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-box">
                  No low stock alerts right now.
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;