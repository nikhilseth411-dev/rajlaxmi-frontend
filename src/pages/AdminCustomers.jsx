import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("rajlaxmi_admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    fetchCustomers();
  }, []);

  function goTo(path) {
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("rajlaxmi_admin_token");
    navigate("/adminlogin");
  }

  async function fetchCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/user/admin/customers?page=0&size=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      console.log("Admin customers status:", response.status);
      console.log("Admin customers response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to fetch customers.");
      }

      setCustomers(data?.data || []);
    } catch (err) {
      console.error("Admin customers error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
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
        </nav>

        <button type="button" className="adminLogoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="adminMainContent">
        <div className="adminWelcomeCard">
          <p>Customer Management</p>
          <h1>Customers</h1>
          <span>View registered customer accounts</span>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading && <div className="admin-card">Loading customers...</div>}

        {!loading && (
          <>
            <div className="adminStatsGrid">
              <div className="adminStatCard">
                <p>Total Customers</p>
                <h2>{customers.length}</h2>
              </div>

              <div className="adminStatCard">
                <p>Verified Customers</p>
                <h2>{customers.filter((c) => c.emailVerified).length}</h2>
              </div>

              <div className="adminStatCard">
                <p>Active Customers</p>
                <h2>{customers.filter((c) => c.active).length}</h2>
              </div>
            </div>

            <div className="adminQuickGrid">
              <button type="button" onClick={fetchCustomers}>
                Refresh Customers
              </button>

              <button type="button" onClick={() => goTo("/admin/orders")}>
                View Orders
              </button>

              <button type="button" onClick={() => goTo("/admin")}>
                Back to Dashboard
              </button>
            </div>

            <div className="admin-card admin-wide-card">
              <h2>Registered Customers</h2>

              {customers.length === 0 ? (
                <div className="admin-empty-box">No customers found.</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Verified</th>
                        <th>Active</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.id}</td>

                          <td>
                            {customer.firstName} {customer.lastName}
                          </td>

                          <td>{customer.email}</td>

                          <td>{customer.phone || "N/A"}</td>

                          <td>
                            <span
                              className={
                                customer.emailVerified
                                  ? "customerStatus customerStatusSuccess"
                                  : "customerStatus customerStatusPending"
                              }
                            >
                              {customer.emailVerified ? "Verified" : "Not Verified"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                customer.active
                                  ? "customerStatus customerStatusSuccess"
                                  : "customerStatus customerStatusDanger"
                              }
                            >
                              {customer.active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            {customer.createdAt
                              ? new Date(customer.createdAt).toLocaleString("en-IN")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminCustomers;