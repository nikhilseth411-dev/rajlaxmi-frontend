import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import "../styles/admin.css";

const EMPTY_FORM = {
  newEmail: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function AdminAccountSettings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("rajlaxmi_admin_token");
  const [currentEmail, setCurrentEmail] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load admin account");
      }

      const profile = data?.data || data;
      setCurrentEmail(profile?.email || "");
      setForm((previous) => ({
        ...previous,
        newEmail: profile?.email || "",
      }));
    } catch (requestError) {
      setError(requestError.message || "Unable to load admin account");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/account/credentials`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update admin credentials");
      }

      setForm(EMPTY_FORM);
      localStorage.removeItem("rajlaxmi_admin_token");
      navigate("/adminlogin", {
        replace: true,
        state: { message: "Credentials updated. Login with the new email and password." },
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to update admin credentials");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("rajlaxmi_admin_token");
    navigate("/adminlogin");
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
          <button type="button" onClick={() => navigate("/admin")}>Dashboard</button>
          <button type="button" className="active" onClick={() => navigate("/admin/account")}>Account Security</button>
        </nav>

        <button type="button" className="adminLogoutBtn" onClick={handleLogout}>Logout</button>
      </aside>

      <section className="adminMainContent">
        <div className="adminWelcomeCard">
          <p>Owner account</p>
          <h1>Account Security</h1>
          <span>{currentEmail || "Admin"}</span>
        </div>

        <section className="adminCredentialsCard">
          {loading ? (
            <p>Loading account...</p>
          ) : (
            <form className="adminCredentialsForm" onSubmit={handleSubmit}>
              <label>
                New admin email
                <input
                  type="email"
                  name="newEmail"
                  value={form.newEmail}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Current password
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label>
                New password
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </label>

              <label>
                Confirm new password
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </label>

              {error && <p className="adminError">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Updating..." : "Update Credentials"}
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminAccountSettings;
