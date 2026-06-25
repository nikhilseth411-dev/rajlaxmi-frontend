import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

function CustomerRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!form.fullName.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!form.email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (!form.phone.trim()) {
        throw new Error("Please enter your phone number.");
      }

      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        throw new Error("Please enter a valid 10 digit Indian mobile number.");
      }

      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-]).{8,}$/.test(form.password)
      ) {
        throw new Error(
          "Password must have uppercase, lowercase, number, special character and minimum 8 characters."
        );
      }

      if (form.password !== form.confirmPassword) {
        throw new Error("Password and confirm password do not match.");
      }

      const nameParts = form.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "Customer";

      const payload = {
        firstName,
        lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      console.log("Register status:", response.status);
      console.log("Register response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Registration failed.");
      }

      setSuccess("Account created successfully. Please verify OTP sent to your email.");

      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      }, 1000);
      
    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customerAuthPage">
      <div className="customerAuthCard">
        <img
          src="/images/logo/shop-logo.jpeg"
          alt="Raj Laxmi Jewellers"
          className="customerAuthLogo"
        />

        <h1>Create Account</h1>
        <p>Register to shop, place orders, and track your jewellery orders.</p>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="successBox">{success}</div>}

        <form onSubmit={handleRegister} className="customerAuthForm">
          <label>
            Full Name
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              maxLength="10"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create password"
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="authSwitchText">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerRegister;