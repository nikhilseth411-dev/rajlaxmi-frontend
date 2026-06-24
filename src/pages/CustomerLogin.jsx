import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/customer.css";

const API_BASE = "http://localhost:8080/api/v1";

function CustomerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirect = searchParams.get("redirect") || "/products";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const text = await response.text();

      console.log("Customer login status:", response.status);
      console.log("Customer login response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Login failed.");
      }

      const token =
        data?.data?.accessToken ||
        data?.accessToken ||
        data?.token;

      if (!token) {
        throw new Error("Login successful but token not found.");
      }

      localStorage.setItem("rajlaxmi_customer_token", token);

      navigate(redirect);
    } catch (err) {
      console.error("Customer login error:", err);
      setError(err.message || "Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customerLoginPage">
      <section className="customerLoginCard">
        <img src="/images/logo/shop-logo.jpeg" alt="Raj Laxmi Jewellers" />

        <p>Raj Laxmi Jewellers</p>
        <h1>Customer Login</h1>
        <span>Login to add products to cart and place your order.</span>

        {error && <div className="customerError">{error}</div>}

        <form onSubmit={handleSubmit} className="customerLoginForm">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="authSwitchText">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className="authSwitchText">
          New customer? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
}

export default CustomerLogin;