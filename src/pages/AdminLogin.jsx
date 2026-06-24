import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const API_BASE_URL = "http://localhost:8080/api/v1";

function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@rajlaxmi.local",
    password: "Admin@12345",
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
        console.log("Login response:", data);
        throw new Error("Token not found in login response");
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
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter admin email"
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