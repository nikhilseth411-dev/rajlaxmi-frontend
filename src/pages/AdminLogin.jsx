import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL } from "../config/api";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const token =
        data.token ||
        data.accessToken ||
        data.jwtToken ||
        data.data?.token ||
        data.data?.accessToken;

      if (!token) {
        throw new Error("Token not found in login response");
      }

      const role = data?.data?.user?.role || data?.user?.role;
      if (role !== "ADMIN") {
        throw new Error("Admin access is required");
      }

      localStorage.setItem("rajlaxmi_admin_token", token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <div className="adminLoginBrand">
          <img src="/images/logo/shop-logo.jpeg" alt="RajLaxmi Jewellers" />
          <p>RajLaxmi Jewellers</p>
          <h1>Admin Login</h1>
          <span>Owner dashboard for jewellery management</span>
        </div>

        <form onSubmit={handleSubmit} className="adminLoginForm">
          {location.state?.message && (
            <p className="adminSuccess">{location.state.message}</p>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="adminError">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login to Dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;
